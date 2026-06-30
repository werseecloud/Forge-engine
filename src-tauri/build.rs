use std::fs;
use std::path::PathBuf;

fn main() {
    generate_embedded_workers();
    tauri_build::build();
}

fn generate_embedded_workers() {
    let manifest_dir =
        PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let workspace = manifest_dir.parent().expect("workspace root");
    let out_dir = PathBuf::from(std::env::var("OUT_DIR").expect("OUT_DIR"));
    let output = out_dir.join("embedded_workers.rs");
    let workers = [
        "forge_renderer_worker.exe",
        "forge_runtime.exe",
        "forge_shader_worker.exe",
        "forge_asset_worker.exe",
        "forge_build_worker.exe",
    ];

    let mut source = String::from("pub const EMBEDDED_WORKERS: &[EmbeddedWorker] = &[\n");
    for worker in workers {
        let path = workspace.join("target").join("release").join(worker);
        println!("cargo:rerun-if-changed={}", path.display());
        if path.exists() {
            source.push_str(&format!(
                "    EmbeddedWorker {{ file_name: {:?}, bytes: include_bytes!(r#\"{}\"#) }},\n",
                worker,
                path.display()
            ));
        }
    }
    source.push_str("];\n");
    fs::write(output, source).expect("write embedded worker module");
}
