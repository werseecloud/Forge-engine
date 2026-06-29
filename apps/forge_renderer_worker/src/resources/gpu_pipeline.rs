use crate::resources::resource_handle::ResourceHandle;

#[derive(Debug, Clone)]
pub struct GpuPipeline {
    pub handle: ResourceHandle,
    pub shader_key: String,
}
