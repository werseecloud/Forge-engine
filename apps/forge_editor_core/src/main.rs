use clap::Parser;
use forge_logs::{append_log, LogFile};
use serde::Serialize;
use std::path::PathBuf;

const VERSION: &str = "1.0.0";

#[derive(Debug, Parser)]
#[command(name = "forge_editor_core", version = VERSION)]
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
}

#[derive(Debug, Serialize)]
struct Health {
    status: String,
    component: String,
    version: String,
    ready: bool,
    settings_status: String,
    error: Option<String>,
}

fn main() {
    let cli = Cli::parse();
    if cli.health_check {
        let health = run_health();
        println!("{}", serde_json::to_string_pretty(&health).expect("health serializes"));
        std::process::exit(if health.ready { 0 } else { 1 });
    }
    println!("forge_editor_core {VERSION}: CLI core is installed. The Tauri UI launcher is ForgeEngine.exe.");
}

fn run_health() -> Health {
    let _ = append_log(LogFile::EditorCore, "health-check started");
    match forge_settings::default_settings() {
        Ok(settings) => Health {
            status: "ok".to_string(),
            component: "forge_editor_core".to_string(),
            version: VERSION.to_string(),
            ready: true,
            settings_status: settings.default_projects_dir.display().to_string(),
            error: None,
        },
        Err(error) => Health {
            status: "error".to_string(),
            component: "forge_editor_core".to_string(),
            version: VERSION.to_string(),
            ready: false,
            settings_status: "NotConfigured".to_string(),
            error: Some(error.to_string()),
        },
    }
}
