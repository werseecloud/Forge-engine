struct PathTraceSettings {
  frame_index: u32,
  samples_per_pixel: u32,
  max_bounces: u32,
  _pad: u32,
};

@group(0) @binding(0) var<uniform> settings: PathTraceSettings;
@group(0) @binding(1) var output_image: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) {
  let size = textureDimensions(output_image);
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }
  let uv = vec2<f32>(id.xy) / vec2<f32>(size);
  let sky = mix(vec3<f32>(0.02, 0.025, 0.03), vec3<f32>(0.28, 0.42, 0.68), uv.y);
  textureStore(output_image, vec2<i32>(id.xy), vec4<f32>(sky, 1.0));
}
