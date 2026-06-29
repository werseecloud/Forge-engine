use anyhow::Result;
use std::fs;
use std::path::Path;
use std::process::Command;

use crate::models::installer::InstallConfig;

pub fn create_desktop_shortcut(config: &InstallConfig) -> Result<String> {
    let desktop = dirs::desktop_dir().ok_or_else(|| anyhow::anyhow!("Desktop folder was not found"))?;
    let target = Path::new(&config.install_path).join("ForgeEngine.exe");
    let shortcut = desktop.join("Forge Engine.lnk");
    create_shortcut(&shortcut, &target)?;
    Ok(shortcut.to_string_lossy().to_string())
}

pub fn create_start_menu_shortcuts(config: &InstallConfig) -> Result<Vec<String>> {
    let start = dirs::data_dir()
        .ok_or_else(|| anyhow::anyhow!("AppData Roaming folder was not found"))?
        .join("Microsoft\\Windows\\Start Menu\\Programs\\Forge Engine");
    fs::create_dir_all(&start)?;
    let engine = start.join("Forge Engine.lnk");
    let uninstall = start.join("Uninstall Forge Engine.lnk");
    create_shortcut(&engine, &Path::new(&config.install_path).join("ForgeEngine.exe"))?;
    create_shortcut(&uninstall, &Path::new(&config.install_path).join("uninstall.exe"))?;
    Ok(vec![engine.to_string_lossy().to_string(), uninstall.to_string_lossy().to_string()])
}

fn create_shortcut(shortcut: &Path, target: &Path) -> Result<()> {
    let script = format!(
        "$s=(New-Object -COM WScript.Shell).CreateShortcut('{}');$s.TargetPath='{}';$s.WorkingDirectory='{}';$s.Save()",
        shortcut.to_string_lossy().replace('\'', "''"),
        target.to_string_lossy().replace('\'', "''"),
        target.parent().unwrap_or_else(|| Path::new("")).to_string_lossy().replace('\'', "''")
    );
    let output = Command::new("powershell").args(["-NoProfile", "-Command", &script]).output()?;
    if output.status.success() { Ok(()) } else { Err(anyhow::anyhow!(String::from_utf8_lossy(&output.stderr).to_string())) }
}

