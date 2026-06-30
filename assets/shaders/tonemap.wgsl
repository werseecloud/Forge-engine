@group(0) @binding(0) var hdr_color: texture_2d<f32>;
@group(0) @binding(1) var hdr_sampler: sampler;

struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@fragment
fn fs_main(input: VsOut) -> @location(0) vec4<f32> {
  let hdr = textureSample(hdr_color, hdr_sampler, input.uv).rgb;
  let mapped = hdr / (hdr + vec3<f32>(1.0));
  let srgb = pow(max(mapped, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.2));
  return vec4<f32>(srgb, 1.0);
}
