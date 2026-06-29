use anyhow::Result;
use std::path::Path;
use std::process::Command;

use crate::models::installer::InstallConfig;

const EXTENSIONS: &[&str] = &[".forge_project", ".forge_scene", ".forge_level", ".forge_blueprint", ".forge_material", ".forge_prefab"];

pub fn register_file_associations(config: &InstallConfig) -> Result<Vec<String>> {
    let exe = Path::new(&config.install_path).join("ForgeEngine.exe");
    let mut registered = Vec::new();
    for ext in EXTENSIONS {
        run_reg(&["add", &format!("HKCU\\Software\\Classes\\{}", ext), "/ve", "/d", "ForgeEngine.File", "/f"])?;
        run_reg(&["add", "HKCU\\Software\\Classes\\ForgeEngine.File\\shell\\open\\command", "/ve", "/d", &format!("\"{}\" \"%1\"", exe.display()), "/f"])?;
        registered.push((*ext).to_string());
    }
    Ok(registered)
}

pub fn unregister_file_associations() -> Result<()> {
    for ext in EXTENSIONS {
        let _ = run_reg(&["delete", &format!("HKCU\\Software\\Classes\\{}", ext), "/f"]);
    }
    let _ = run_reg(&["delete", "HKCU\\Software\\Classes\\ForgeEngine.File", "/f"]);
    Ok(())
}

fn run_reg(args: &[&str]) -> Result<()> {
    let output = Command::new("reg").args(args).output()?;
    if output.status.success() { Ok(()) } else { Err(anyhow::anyhow!(String::from_utf8_lossy(&output.stderr).to_string())) }
}

