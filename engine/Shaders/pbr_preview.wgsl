struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) normal: vec3<f32>,
};

@vertex
fn vs_main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOutput {
  var out: VertexOutput;
  out.clip_position = vec4<f32>(position, 1.0);
  out.normal = normal;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let light = max(dot(normalize(in.normal), normalize(vec3<f32>(0.4, 0.9, 0.2))), 0.08);
  return vec4<f32>(0.08 + light * 0.65, 0.13 + light * 0.58, 0.18 + light * 0.52, 1.0);
}

