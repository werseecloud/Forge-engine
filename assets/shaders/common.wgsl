struct CameraUniform {
  view_proj: mat4x4<f32>,
  camera_position: vec4<f32>,
};

struct PbrMaterial {
  base_color: vec4<f32>,
  emissive: vec4<f32>,
  metallic_roughness: vec4<f32>,
};

fn saturate(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn srgb_to_linear(color: vec3<f32>) -> vec3<f32> {
  return pow(color, vec3<f32>(2.2));
}

fn linear_to_srgb(color: vec3<f32>) -> vec3<f32> {
  return pow(max(color, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.2));
}
