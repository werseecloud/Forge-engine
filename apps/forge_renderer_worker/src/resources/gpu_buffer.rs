use crate::resources::resource_handle::ResourceHandle;

#[derive(Debug, Clone)]
pub struct GpuBuffer {
    pub handle: ResourceHandle,
    pub size_bytes: u64,
    pub usage: String,
}
