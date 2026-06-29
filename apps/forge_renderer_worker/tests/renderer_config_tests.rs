use forge_renderer_worker::config::RendererWorkerConfig;

#[test]
fn default_config_matches_installer_contract() {
    let config = RendererWorkerConfig::default();
    assert_eq!(config.version, "1.0.0");
    assert_eq!(config.backend, "wgpu");
    assert!(config.shader_hot_reload);
}
