use crate::resources::resource_handle::ResourceHandle;

#[derive(Debug, Clone)]
pub struct GpuTexture {
    pub handle: ResourceHandle,
    pub width: u32,
    pub height: u32,
    pub format: String,
}
