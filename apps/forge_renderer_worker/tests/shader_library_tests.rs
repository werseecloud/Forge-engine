use forge_renderer_worker::shaders::library::ShaderLibrary;

#[test]
fn default_shader_library_contains_valid_wgsl_entry_points() {
    let shaders = ShaderLibrary::default().scan_default_library().unwrap();
    assert!(!shaders.is_empty());

    for shader in shaders {
        assert!(shader.source.contains("@vertex"), "{} missing vertex entry", shader.path.display());
        assert!(shader.source.contains("@fragment"), "{} missing fragment entry", shader.path.display());
    }
}
