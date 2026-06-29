use clap::Parser;
use forge_logs::{append_log, LogFile};
use serde::Serialize;
use std::path::{Path, PathBuf};

const VERSION: &str = "1.0.0";

#[derive(Debug, Parser)]
#[command(name = "forge_asset_worker", version = VERSION)]
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
    scan_assets: bool,
}

#[derive(Debug, Serialize)]
struct Health {
    status: String,
    component: String,
    version: String,
    ready: bool,
    project_status: String,
    cache_writable: bool,
    error: Option<String>,
}

fn main() {
    let cli = Cli::parse();
    if cli.health_check {
        let health = run_health(cli.project.as_deref());
        println!("{}", serde_json::to_string_pretty(&health).expect("health serializes"));
        std::process::exit(if health.ready { 0 } else { 1 });
    }
    if cli.scan_assets {
        if let Err(error) = scan_project(cli.project.as_deref()) {
            eprintln!("{error}");
            std::process::exit(1);
        }
        return;
    }
    println!("forge_asset_worker {VERSION}: NotConfigured. Start with --project and --ipc-port for editor IPC.");
}

fn run_health(project: Option<&Path>) -> Health {
    let _ = append_log(LogFile::AssetWorker, "health-check started");
    match forge_settings::ensure_user_paths() {
        Ok(paths) => {
            let cache_writable = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(paths.asset_cache_dir.join(".write_test"))
                .is_ok();
            let project_status = match project {
                Some(path) => forge_project::validate_project(path).map(|_| "ok".to_string()).unwrap_or_else(|error| format!("MissingProject: {error}")),
                None => "NotConfigured".to_string(),
            };
            Health {
                status: if cache_writable { "ok" } else { "error" }.to_string(),
                component: "forge_asset_worker".to_string(),
                version: VERSION.to_string(),
                ready: cache_writable,
                project_status,
                cache_writable,
                error: if cache_writable { None } else { Some("Asset cache directory is not writable".to_string()) },
            }
        }
        Err(error) => Health {
            status: "error".to_string(),
            component: "forge_asset_worker".to_string(),
            version: VERSION.to_string(),
            ready: false,
            project_status: "NotConfigured".to_string(),
            cache_writable: false,
            error: Some(error.to_string()),
        },
    }
}

fn scan_project(project: Option<&Path>) -> anyhow::Result<()> {
    let project = project.ok_or_else(|| anyhow::anyhow!("MissingProject: --project is required"))?;
    let index = forge_project::scan_content(project)?;
    let path = forge_project::write_asset_index(project, &index)?;
    append_log(LogFile::AssetWorker, &format!("scanned {} assets into {}", index.assets.len(), path.display())).ok();
    println!("{}", serde_json::to_string_pretty(&index)?);
    Ok(())
}
