struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) world: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOut {
    var positions = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(-1.0, 1.0)
    );
    var out: VertexOut;
    out.position = vec4<f32>(positions[vertex_index], 0.0, 1.0);
    out.world = positions[vertex_index] * 16.0;
    return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
    let grid = abs(fract(in.world) - vec2<f32>(0.5, 0.5));
    let line = 1.0 - smoothstep(0.46, 0.5, min(grid.x, grid.y));
    return vec4<f32>(0.02, 0.18 + line * 0.25, 0.38 + line * 0.45, 1.0);
}
