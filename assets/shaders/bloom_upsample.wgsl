@group(0) @binding(0) var low_texture: texture_2d<f32>;
@group(0) @binding(1) var low_sampler: sampler;

struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@fragment
fn fs_main(input: VsOut) -> @location(0) vec4<f32> {
  return vec4<f32>(textureSample(low_texture, low_sampler, input.uv).rgb, 1.0);
}
