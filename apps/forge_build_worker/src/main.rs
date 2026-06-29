use clap::Parser;
use forge_logs::{append_log, LogFile};
use serde::Serialize;
use std::path::{Path, PathBuf};

const VERSION: &str = "1.0.0";

#[derive(Debug, Parser)]
#[command(name = "forge_build_worker", version = VERSION)]
struct Cli {
    #[arg(long)]
    health_check: bool,
    #[arg(long)]
    project: Option<PathBuf>,
    #[arg(long)]
    log_dir: Option<PathBuf>,
    #[arg(long)]
    ipc_port: Option<u16>,
    #[arg(long)]
    pipe: Option<String>,
    #[arg(long)]
    create_build_plan: bool,
}

#[derive(Debug, Serialize)]
struct Health {
    status: String,
    component: String,
    version: String,
    ready: bool,
    build_cache_writable: bool,
    runtime_status: String,
    error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BuildPlan {
    project_name: String,
    engine_version: String,
    target: String,
    created_at: String,
    runtime: String,
    included_assets: Vec<String>,
    included_scenes: Vec<String>,
}

fn main() {
    let cli = Cli::parse();
    if cli.health_check {
        let health = run_health();
        println!("{}", serde_json::to_string_pretty(&health).expect("health serializes"));
        std::process::exit(if health.ready { 0 } else { 1 });
    }
    if cli.create_build_plan {
        match create_build_plan(cli.project.as_deref()) {
            Ok(plan) => println!("{}", serde_json::to_string_pretty(&plan).expect("plan serializes")),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
        return;
    }
    println!("forge_build_worker {VERSION}: NotConfigured. Start with --project and --ipc-port for editor IPC.");
}

fn run_health() -> Health {
    let _ = append_log(LogFile::BuildWorker, "health-check started");
    match forge_settings::ensure_user_paths() {
        Ok(paths) => {
            let build_cache_writable = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(paths.build_cache_dir.join(".write_test"))
                .is_ok();
            let runtime_status = find_runtime().map(|p| p.display().to_string()).unwrap_or_else(|| "forge_runtime.exe was not found.".to_string());
            Health {
                status: if build_cache_writable { "ok" } else { "error" }.to_string(),
                component: "forge_build_worker".to_string(),
                version: VERSION.to_string(),
                ready: build_cache_writable,
                build_cache_writable,
                runtime_status,
                error: if build_cache_writable { None } else { Some("Build cache directory is not writable".to_string()) },
            }
        }
        Err(error) => Health {
            status: "error".to_string(),
            component: "forge_build_worker".to_string(),
            version: VERSION.to_string(),
            ready: false,
            build_cache_writable: false,
            runtime_status: "NotConfigured".to_string(),
            error: Some(error.to_string()),
        },
    }
}

fn create_build_plan(project: Option<&Path>) -> anyhow::Result<BuildPlan> {
    let project = project.ok_or_else(|| anyhow::anyhow!("MissingProject: --project is required"))?;
    forge_project::validate_project(project)?;
    let runtime = find_runtime().ok_or_else(|| anyhow::anyhow!("forge_runtime.exe was not found."))?;
    let index = forge_project::scan_content(project)?;
    append_log(LogFile::BuildWorker, &format!("created build plan for {}", project.display())).ok();
    Ok(BuildPlan {
        project_name: project.file_name().unwrap_or_default().to_string_lossy().to_string(),
        engine_version: VERSION.to_string(),
        target: "windows".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        runtime: runtime.to_string_lossy().to_string(),
        included_assets: index.assets.iter().map(|asset| asset.relative_path.clone()).collect(),
        included_scenes: index.assets.iter().filter(|asset| asset.asset_type == "scene").map(|asset| asset.relative_path.clone()).collect(),
    })
}

fn find_runtime() -> Option<PathBuf> {
    let cwd = std::env::current_dir().ok()?;
    [cwd.join("target/release/forge_runtime.exe"), cwd.join("bin/forge_runtime.exe"), cwd.join("forge_runtime.exe")]
        .into_iter()
        .find(|path| path.exists())
}
