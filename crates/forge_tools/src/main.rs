use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "forge_tools", version, about = "Forge renderer tooling")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Capabilities,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Command::Capabilities => {
            let info = forge_rhi::DeviceFactory::detect_default_blocking()?;
            println!("{}", serde_json::to_string_pretty(&info.capabilities)?);
        }
    }
    Ok(())
}
