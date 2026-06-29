use forge_renderer_worker::shaders::library::ShaderLibrary;

#[test]
fn required_shader_files_are_present_and_readable() {
    let shaders = ShaderLibrary::default().scan_default_library().unwrap();
    let names: Vec<String> = shaders
        .iter()
        .filter_map(|shader| shader.path.file_name().and_then(|name| name.to_str()).map(str::to_string))
        .collect();

    for required in [
        "fullscreen_triangle.wgsl",
        "grid.wgsl",
        "gizmo.wgsl",
        "mesh_pbr.wgsl",
        "depth_prepass.wgsl",
        "sky.wgsl",
        "debug_lines.wgsl",
        "post_process.wgsl",
    ] {
        assert!(names.iter().any(|name| name == required), "{required} missing");
    }
}
