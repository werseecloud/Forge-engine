use forge_renderer_worker::config::RendererWorkerConfig;
use forge_renderer_worker::renderer::renderer_state::RendererState;

#[test]
fn renderer_state_starts_with_explicit_empty_probe_state() {
    let state = RendererState::default();
    assert_eq!(state.viewport.width, 1280);
    assert_eq!(state.viewport.height, 720);
    assert_eq!(state.scene.version, 1);
    assert_eq!(state.stats.backend_name, "wgpu");
}

#[test]
fn cli_config_accepts_project_and_ipc_settings() {
    let config = RendererWorkerConfig {
        ipc_port: Some(39120),
        project_path: Some("C:/Forge/TestProject".into()),
        ..RendererWorkerConfig::default()
    };

    assert_eq!(config.ipc_port, Some(39120));
    assert!(config.project_path.is_some());
}
