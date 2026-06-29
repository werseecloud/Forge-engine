pub fn create_command_encoder(device: &wgpu::Device, label: &'static str) -> wgpu::CommandEncoder {
    device.create_command_encoder(&wgpu::CommandEncoderDescriptor { label: Some(label) })
}
