use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Cursor, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use zip::ZipArchive;

include!(concat!(env!("OUT_DIR"), "/embedded_skyboxes.rs"));

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkyboxManifest {
    pub skyboxes: Vec<SkyboxAsset>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkyboxAsset {
    pub id: String,
    pub label: String,
    pub resolution: String,
    pub path: String,
    pub min_device_memory_gb: u32,
    pub max_texture_size: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackedSkyboxManifest {
    skyboxes: Vec<PackedSkyboxAsset>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackedSkyboxAsset {
    id: String,
    label: String,
    resolution: String,
    path: String,
    min_device_memory_gb: u32,
    max_texture_size: u32,
}

pub fn ensure_embedded_skyboxes_installed() -> Result<SkyboxManifest> {
    let skybox_dir = skybox_dir()?;
    fs::create_dir_all(&skybox_dir)?;

    let pack = load_skybox_pack()?;
    let fingerprint = fast_fingerprint(&pack);
    let fingerprint_path = skybox_dir.join(".skybox_pack.fingerprint");
    let manifest_path = skybox_dir.join("manifest.json");
    if fs::read_to_string(&fingerprint_path)
        .map(|value| value == fingerprint)
        .unwrap_or(false)
        && manifest_path.exists()
    {
        if let Ok(manifest) = read_installed_manifest(&skybox_dir, &manifest_path) {
            return Ok(manifest);
        }
    }
    let mut archive = ZipArchive::new(Cursor::new(pack))?;
    let mut packed_manifest = None;
    for index in 0..archive.len() {
        let mut file = archive.by_index(index)?;
        if !file.is_file() {
            continue;
        }
        let Some(file_name) = Path::new(file.name()).file_name().map(|name| name.to_owned()) else {
            continue;
        };
        let mut bytes = Vec::with_capacity(file.size() as usize);
        file.read_to_end(&mut bytes)?;
        if file_name == "manifest.json" {
            packed_manifest = Some(serde_json::from_slice::<PackedSkyboxManifest>(&bytes)?);
        }
        write_if_changed(&skybox_dir.join(file_name), &bytes)?;
    }

    let Some(manifest) = packed_manifest else {
        return Err(anyhow!("Embedded skybox pack does not contain manifest.json"));
    };
    let assets = manifest
        .skyboxes
        .into_iter()
        .map(|asset| {
            let file_name = Path::new(&asset.path)
                .file_name()
                .ok_or_else(|| anyhow!("Invalid packed skybox path: {}", asset.path))?;
            Ok(SkyboxAsset {
                id: asset.id,
                label: asset.label,
                resolution: asset.resolution,
                path: skybox_dir.join(file_name).to_string_lossy().to_string(),
                min_device_memory_gb: asset.min_device_memory_gb,
                max_texture_size: asset.max_texture_size,
            })
        })
        .collect::<Result<Vec<_>>>()?;

    if assets.is_empty() {
        return Err(anyhow!("No embedded skyboxes were included in the Forge Engine executable."));
    }

    fs::write(fingerprint_path, fingerprint)?;
    Ok(SkyboxManifest { skyboxes: assets })
}

fn read_installed_manifest(skybox_dir: &Path, manifest_path: &Path) -> Result<SkyboxManifest> {
    let manifest: PackedSkyboxManifest = serde_json::from_slice(&fs::read(manifest_path)?)?;
    let assets = manifest
        .skyboxes
        .into_iter()
        .map(|asset| {
            let file_name = Path::new(&asset.path)
                .file_name()
                .ok_or_else(|| anyhow!("Invalid installed skybox path: {}", asset.path))?;
            Ok(SkyboxAsset {
                id: asset.id,
                label: asset.label,
                resolution: asset.resolution,
                path: skybox_dir.join(file_name).to_string_lossy().to_string(),
                min_device_memory_gb: asset.min_device_memory_gb,
                max_texture_size: asset.max_texture_size,
            })
        })
        .collect::<Result<Vec<_>>>()?;
    if assets.is_empty() {
        return Err(anyhow!("Installed skybox manifest is empty"));
    }
    Ok(SkyboxManifest { skyboxes: assets })
}

fn load_skybox_pack() -> Result<Vec<u8>> {
    if let Ok(pack) = read_appended_pack_from_current_exe() {
        return Ok(pack);
    }

    if !EMBEDDED_SKYBOX_PACK.is_empty() {
        return Ok(EMBEDDED_SKYBOX_PACK.to_vec());
    }

    let dev_pack = std::env::current_dir()
        .ok()
        .map(|cwd| cwd.join("src-tauri").join("embedded-assets").join("skyboxes.zip"));
    if let Some(path) = dev_pack.filter(|path| path.exists()) {
        return Ok(fs::read(path)?);
    }

    Err(anyhow!("ForgeEngine.exe does not contain an embedded skybox pack. Rebuild with scripts/embed-skyboxes-into-exe.ps1."))
}

fn read_appended_pack_from_current_exe() -> Result<Vec<u8>> {
    const MAGIC: &[u8] = b"FORGE_SKYBOX_PACK_V1";
    let exe = std::env::current_exe()?;
    let mut file = fs::File::open(exe)?;
    let file_len = file.metadata()?.len();
    let footer_len = MAGIC.len() as u64 + 8;
    if file_len <= footer_len {
        return Err(anyhow!("Executable is too small to contain a skybox footer"));
    }

    file.seek(SeekFrom::End(-(footer_len as i64)))?;
    let mut len_bytes = [0u8; 8];
    file.read_exact(&mut len_bytes)?;
    let mut magic = vec![0u8; MAGIC.len()];
    file.read_exact(&mut magic)?;
    if magic != MAGIC {
        return Err(anyhow!("Skybox footer was not found in executable"));
    }

    let pack_len = u64::from_le_bytes(len_bytes);
    let pack_start = file_len
        .checked_sub(footer_len)
        .and_then(|offset| offset.checked_sub(pack_len))
        .ok_or_else(|| anyhow!("Invalid embedded skybox pack length"))?;
    file.seek(SeekFrom::Start(pack_start))?;
    let mut pack = vec![0u8; pack_len as usize];
    file.read_exact(&mut pack)?;
    Ok(pack)
}

fn skybox_dir() -> Result<PathBuf> {
    let local = dirs::data_local_dir().ok_or_else(|| anyhow!("LocalAppData was not found"))?;
    Ok(local.join("ForgeEngine").join("EmbeddedAssets").join("Skyboxes"))
}

fn write_if_changed(destination: &Path, bytes: &[u8]) -> Result<()> {
    let fingerprint = fast_fingerprint(bytes);
    let fingerprint_path = destination.with_extension(format!(
        "{}.fingerprint",
        destination
            .extension()
            .and_then(|extension| extension.to_str())
            .unwrap_or("asset")
    ));
    if destination.exists() {
        let same_len = destination
            .metadata()
            .map(|metadata| metadata.len() == bytes.len() as u64)
            .unwrap_or(false);
        let same_fingerprint = fs::read_to_string(&fingerprint_path)
            .map(|value| value == fingerprint)
            .unwrap_or(false);
        if same_len && same_fingerprint {
            return Ok(());
        }
    }
    fs::write(destination, bytes)?;
    fs::write(fingerprint_path, fingerprint)?;
    Ok(())
}

fn fast_fingerprint(bytes: &[u8]) -> String {
    let head_len = bytes.len().min(4096);
    let tail_len = bytes.len().saturating_sub(head_len).min(4096);
    let mut hash = 1469598103934665603u64;
    for byte in &bytes[..head_len] {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(1099511628211);
    }
    for byte in &bytes[bytes.len().saturating_sub(tail_len)..] {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(1099511628211);
    }
    format!("{}:{hash:016x}", bytes.len())
}
