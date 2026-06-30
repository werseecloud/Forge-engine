struct CameraUniform {
  view_proj: mat4x4<f32>,
  camera_position: vec4<f32>,
};

struct DirectionalLight {
  direction: vec4<f32>,
  color_intensity: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: CameraUniform;
@group(1) @binding(0) var<uniform> sun: DirectionalLight;

struct VertexIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

struct VertexOut {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) world_position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

@vertex
fn vs_main(input: VertexIn) -> VertexOut {
  var out: VertexOut;
  out.world_position = input.position;
  out.normal = normalize(input.normal);
  out.uv = input.uv;
  out.clip_position = camera.view_proj * vec4<f32>(input.position, 1.0);
  return out;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
  let base_color = vec3<f32>(0.72, 0.76, 0.82);
  let n_dot_l = max(dot(normalize(input.normal), normalize(-sun.direction.xyz)), 0.0);
  let diffuse = base_color * sun.color_intensity.rgb * sun.color_intensity.a * n_dot_l;
  let ambient = base_color * 0.035;
  return vec4<f32>(diffuse + ambient, 1.0);
}
