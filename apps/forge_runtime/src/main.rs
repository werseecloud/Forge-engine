use clap::Parser;
use forge_logs::{append_log, LogFile};
use serde::Serialize;
use std::path::PathBuf;
use std::time::Instant;

const VERSION: &str = "1.0.0";

#[derive(Debug, Parser)]
#[command(name = "forge_runtime", version = VERSION)]
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
    start_play_mode: bool,
}

#[derive(Debug, Serialize)]
struct Health {
    status: String,
    component: String,
    version: String,
    ready: bool,
    runtime_state: String,
    error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeStats {
    state: String,
    frame_time_ms: f64,
    fps: f64,
}

fn main() {
    let cli = Cli::parse();
    if cli.health_check {
        let health = run_health();
        println!("{}", serde_json::to_string_pretty(&health).expect("health serializes"));
        std::process::exit(if health.ready { 0 } else { 1 });
    }
    if cli.start_play_mode {
        match start_play(cli.project) {
            Ok(stats) => println!("{}", serde_json::to_string_pretty(&stats).expect("stats serializes")),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
        return;
    }
    println!("forge_runtime {VERSION}: Idle. Start with --project and --start-play-mode for runtime play.");
}

fn run_health() -> Health {
    let _ = append_log(LogFile::Runtime, "health-check started");
    match forge_settings::ensure_user_paths() {
        Ok(_) => Health {
            status: "ok".to_string(),
            component: "forge_runtime".to_string(),
            version: VERSION.to_string(),
            ready: true,
            runtime_state: "Idle".to_string(),
            error: None,
        },
        Err(error) => Health {
            status: "error".to_string(),
            component: "forge_runtime".to_string(),
            version: VERSION.to_string(),
            ready: false,
            runtime_state: "NotConfigured".to_string(),
            error: Some(error.to_string()),
        },
    }
}

fn start_play(project: Option<PathBuf>) -> anyhow::Result<RuntimeStats> {
    let project = project.ok_or_else(|| anyhow::anyhow!("MissingProject: --project is required"))?;
    forge_project::validate_project(&project)?;
    let start = Instant::now();
    append_log(LogFile::Runtime, &format!("PlayStarted {}", project.display())).ok();
    let elapsed = start.elapsed().as_secs_f64();
    Ok(RuntimeStats {
        state: "Playing".to_string(),
        frame_time_ms: elapsed * 1000.0,
        fps: if elapsed > 0.0 { 1.0 / elapsed } else { 0.0 },
    })
}
