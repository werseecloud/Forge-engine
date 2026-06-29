use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tracing_subscriber::EnvFilter;

pub fn init_logging(log_dir: Option<PathBuf>) -> anyhow::Result<()> {
    if let Some(path) = log_dir {
        fs::create_dir_all(&path)?;
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path.join("renderer_worker.log"))?;
        writeln!(file, "forge_renderer_worker logging initialized")?;
    }

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .try_init();
    Ok(())
}
