@group(0) @binding(0) var source_texture: texture_2d<f32>;
@group(0) @binding(1) var source_sampler: sampler;

struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@fragment
fn fs_main(input: VsOut) -> @location(0) vec4<f32> {
  let color = textureSample(source_texture, source_sampler, input.uv).rgb;
  let luma = dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
  return vec4<f32>(select(vec3<f32>(0.0), color, luma > 1.0), 1.0);
}
