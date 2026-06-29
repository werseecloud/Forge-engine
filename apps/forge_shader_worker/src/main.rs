use clap::Parser;
use forge_logs::{append_log, LogFile};
use serde::Serialize;
use std::path::{Path, PathBuf};

const VERSION: &str = "1.0.0";

#[derive(Debug, Parser)]
#[command(name = "forge_shader_worker", version = VERSION)]
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
    validate_shader: Option<PathBuf>,
}

#[derive(Debug, Serialize)]
struct Health {
    status: String,
    component: String,
    version: String,
    ready: bool,
    shader_cache_writable: bool,
    compiler_status: String,
    error: Option<String>,
}

fn main() {
    let cli = Cli::parse();
    if cli.health_check {
        let health = run_health();
        println!("{}", serde_json::to_string_pretty(&health).expect("health serializes"));
        std::process::exit(if health.ready { 0 } else { 1 });
    }
    if let Some(shader) = cli.validate_shader {
        match validate_shader(&shader) {
            Ok(()) => println!(r#"{{"status":"ok","shader_path":"{}"}}"#, shader.display()),
            Err(error) => {
                eprintln!(r#"{{"status":"error","shader_path":"{}","message":"{}"}}"#, shader.display(), error);
                std::process::exit(1);
            }
        }
        return;
    }
    println!("forge_shader_worker {VERSION}: NotConfigured. Start with --project and --ipc-port for editor IPC.");
}

fn run_health() -> Health {
    let _ = append_log(LogFile::ShaderWorker, "health-check started");
    match forge_settings::ensure_user_paths() {
        Ok(paths) => {
            let shader_cache_writable = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(paths.shader_cache_dir.join(".write_test"))
                .is_ok();
            Health {
                status: if shader_cache_writable { "ok" } else { "error" }.to_string(),
                component: "forge_shader_worker".to_string(),
                version: VERSION.to_string(),
                ready: shader_cache_writable,
                shader_cache_writable,
                compiler_status: "wgsl_file_validation_available".to_string(),
                error: if shader_cache_writable { None } else { Some("Shader cache directory is not writable".to_string()) },
            }
        }
        Err(error) => Health {
            status: "error".to_string(),
            component: "forge_shader_worker".to_string(),
            version: VERSION.to_string(),
            ready: false,
            shader_cache_writable: false,
            compiler_status: "NotConfigured".to_string(),
            error: Some(error.to_string()),
        },
    }
}

fn validate_shader(path: &Path) -> anyhow::Result<()> {
    let source = std::fs::read_to_string(path)?;
    if !source.contains("@vertex") && !source.contains("@fragment") && !source.contains("@compute") {
        anyhow::bail!("Shader file has no WGSL entry point");
    }
    append_log(LogFile::ShaderWorker, &format!("validated shader {}", path.display())).ok();
    Ok(())
}
