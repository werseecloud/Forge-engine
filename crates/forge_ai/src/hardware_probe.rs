use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareProfile {
    pub os: String,
    pub architecture: String,
    pub cpu_model: String,
    pub cpu_cores: usize,
    pub ram_gb: u64,
    pub available_ram_gb: Option<u64>,
    pub gpu_name: Option<String>,
    pub vram_gb: Option<u64>,
    pub disk_available_gb: Option<u64>,
    pub battery_power: Option<bool>,
}

pub fn probe_hardware() -> HardwareProfile {
    HardwareProfile {
        os: std::env::consts::OS.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
        cpu_model: windows_query("wmic", &["cpu", "get", "name", "/value"])
            .and_then(|value| value.split('=').nth(1).map(|s| s.trim().to_string()))
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "Unknown CPU".to_string()),
        cpu_cores: std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(1),
        ram_gb: windows_query(
            "wmic",
            &["computersystem", "get", "totalphysicalmemory", "/value"],
        )
        .and_then(|value| {
            value
                .split('=')
                .nth(1)
                .and_then(|s| s.trim().parse::<u64>().ok())
        })
        .map(bytes_to_gb)
        .unwrap_or(0),
        available_ram_gb: windows_query("wmic", &["OS", "get", "FreePhysicalMemory", "/value"])
            .and_then(|value| {
                value
                    .split('=')
                    .nth(1)
                    .and_then(|s| s.trim().parse::<u64>().ok())
            })
            .map(|kb| ((kb * 1024) as f64 / 1_073_741_824.0).ceil() as u64),
        gpu_name: windows_query(
            "wmic",
            &["path", "win32_VideoController", "get", "name", "/value"],
        )
        .and_then(|value| {
            value.lines().find_map(|line| {
                line.strip_prefix("Name=")
                    .map(str::trim)
                    .map(str::to_string)
            })
        })
        .filter(|value| !value.is_empty()),
        vram_gb: windows_query(
            "wmic",
            &[
                "path",
                "win32_VideoController",
                "get",
                "AdapterRAM",
                "/value",
            ],
        )
        .and_then(|value| {
            value.lines().find_map(|line| {
                line.strip_prefix("AdapterRAM=")
                    .and_then(|s| s.trim().parse::<u64>().ok())
            })
        })
        .map(bytes_to_gb),
        disk_available_gb: None,
        battery_power: None,
    }
}

fn windows_query(command: &str, args: &[&str]) -> Option<String> {
    if cfg!(not(target_os = "windows")) {
        return None;
    }
    let output = Command::new(command).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout).ok()
}

fn bytes_to_gb(bytes: u64) -> u64 {
    ((bytes as f64) / 1_073_741_824.0).ceil() as u64
}
