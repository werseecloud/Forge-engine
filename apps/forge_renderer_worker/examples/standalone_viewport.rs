use forge_renderer_worker::config::RendererWorkerConfig;
use forge_renderer_worker::renderer::renderer_app::RendererApp;

fn main() -> anyhow::Result<()> {
    let mut renderer = pollster::block_on(RendererApp::initialize(RendererWorkerConfig::default()))?;
    let stats = renderer.render_single_headless_frame()?;
    println!("{}", serde_json::to_string_pretty(&stats)?);
    Ok(())
}
