use clap::Parser;
use forge_renderer_worker::{app, config::RendererWorkerConfig, diagnostics};

#[derive(Debug, Parser)]
#[command(name = "forge_renderer_worker", version = RendererWorkerConfig::VERSION)]
struct Cli {
    #[arg(long)]
    health_check: bool,
    #[arg(long)]
    version: bool,
    #[arg(long)]
    standalone: bool,
    #[arg(long)]
    ipc_port: Option<u16>,
    #[arg(long)]
    project: Option<std::path::PathBuf>,
    #[arg(long)]
    log_dir: Option<std::path::PathBuf>,
}

fn main() {
    let cli = Cli::parse();
    if cli.version {
        println!("forge_renderer_worker {}", RendererWorkerConfig::VERSION);
        return;
    }

    let mut config = RendererWorkerConfig::default();
    config.ipc_port = cli.ipc_port;
    config.project_path = cli.project;
    config.log_dir = cli.log_dir;

    if cli.health_check {
        let result = pollster::block_on(diagnostics::health_check::run_health_check());
        println!("{}", serde_json::to_string_pretty(&result).unwrap_or_else(|error| {
            format!(r#"{{"status":"error","component":"forge_renderer_worker","version":"{}","gpu_available":false,"error":"{}"}}"#, RendererWorkerConfig::VERSION, error)
        }));
        std::process::exit(if result.status == "ok" { 0 } else { 1 });
    }

    if let Err(error) = diagnostics::logs::init_logging(config.log_dir.clone()) {
        eprintln!("failed to initialize renderer logs: {error}");
    }

    if cli.standalone {
        if let Err(error) = app::RendererWorkerApp::run_standalone(config) {
            tracing::error!("{error:?}");
            eprintln!("{error:?}");
            std::process::exit(1);
        }
        return;
    }

    if let Err(error) = app::RendererWorkerApp::run(config) {
        tracing::error!("{error:?}");
        eprintln!("{error:?}");
        std::process::exit(1);
    }
}
