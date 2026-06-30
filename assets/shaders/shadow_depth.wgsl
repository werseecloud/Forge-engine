struct LightUniform {
  light_view_proj: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> light: LightUniform;

struct VertexIn {
  @location(0) position: vec3<f32>,
};

@vertex
fn vs_main(input: VertexIn) -> @builtin(position) vec4<f32> {
  return light.light_view_proj * vec4<f32>(input.position, 1.0);
}
