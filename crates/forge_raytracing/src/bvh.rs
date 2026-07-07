use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Aabb {
    pub min: Vec3,
    pub max: Vec3,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BvhPrimitive {
    pub id: u64,
    pub bounds: Aabb,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BvhNode {
    pub bounds: Aabb,
    pub left: Option<u32>,
    pub right: Option<u32>,
    pub primitive: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BvhBuildStats {
    pub primitive_count: u64,
    pub node_count: u64,
    pub build_time_ms: f32,
    pub backend: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BvhBuildResult {
    pub nodes: Vec<BvhNode>,
    pub stats: BvhBuildStats,
}

#[derive(Debug, Default)]
pub struct ComputeBvhBuilder;

impl ComputeBvhBuilder {
    pub fn describe_fallback() -> &'static str {
        "Forge can build a CPU BVH fallback today and upload it to compute shaders once the path tracing pass is wired. Native DXR/Vulkan/Metal RT is gated behind backend-specific RHI support."
    }

    pub fn build_cpu_fallback(primitives: &[BvhPrimitive]) -> BvhBuildResult {
        let start = std::time::Instant::now();
        let mut sorted = primitives.to_vec();
        sorted.sort_by(|a, b| {
            let axis_a = longest_axis(a.bounds);
            let center_a = center_on_axis(a.bounds, axis_a);
            let center_b = center_on_axis(b.bounds, axis_a);
            center_a
                .partial_cmp(&center_b)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        let mut nodes = Vec::new();
        if !sorted.is_empty() {
            build_node(&sorted, &mut nodes);
        }
        BvhBuildResult {
            stats: BvhBuildStats {
                primitive_count: primitives.len() as u64,
                node_count: nodes.len() as u64,
                build_time_ms: start.elapsed().as_secs_f32() * 1000.0,
                backend: "cpu_bvh_fallback".to_string(),
            },
            nodes,
        }
    }
}

fn build_node(primitives: &[BvhPrimitive], nodes: &mut Vec<BvhNode>) -> u32 {
    let bounds = primitives
        .iter()
        .map(|primitive| primitive.bounds)
        .reduce(union)
        .unwrap_or(Aabb {
            min: Vec3 {
                x: 0.0,
                y: 0.0,
                z: 0.0,
            },
            max: Vec3 {
                x: 0.0,
                y: 0.0,
                z: 0.0,
            },
        });
    let index = nodes.len() as u32;
    nodes.push(BvhNode {
        bounds,
        left: None,
        right: None,
        primitive: None,
    });
    if primitives.len() == 1 {
        nodes[index as usize].primitive = Some(primitives[0].id);
        return index;
    }
    let axis = longest_axis(bounds);
    let mut sorted = primitives.to_vec();
    sorted.sort_by(|a, b| {
        center_on_axis(a.bounds, axis)
            .partial_cmp(&center_on_axis(b.bounds, axis))
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    let midpoint = sorted.len() / 2;
    let left = build_node(&sorted[..midpoint], nodes);
    let right = build_node(&sorted[midpoint..], nodes);
    nodes[index as usize].left = Some(left);
    nodes[index as usize].right = Some(right);
    index
}

fn union(a: Aabb, b: Aabb) -> Aabb {
    Aabb {
        min: Vec3 {
            x: a.min.x.min(b.min.x),
            y: a.min.y.min(b.min.y),
            z: a.min.z.min(b.min.z),
        },
        max: Vec3 {
            x: a.max.x.max(b.max.x),
            y: a.max.y.max(b.max.y),
            z: a.max.z.max(b.max.z),
        },
    }
}

fn longest_axis(bounds: Aabb) -> usize {
    let x = bounds.max.x - bounds.min.x;
    let y = bounds.max.y - bounds.min.y;
    let z = bounds.max.z - bounds.min.z;
    if x >= y && x >= z {
        0
    } else if y >= z {
        1
    } else {
        2
    }
}

fn center_on_axis(bounds: Aabb, axis: usize) -> f32 {
    match axis {
        0 => (bounds.min.x + bounds.max.x) * 0.5,
        1 => (bounds.min.y + bounds.max.y) * 0.5,
        _ => (bounds.min.z + bounds.max.z) * 0.5,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cpu_fallback_builds_binary_bvh() {
        let primitives = vec![primitive(1, 0.0), primitive(2, 3.0), primitive(3, -4.0)];
        let result = ComputeBvhBuilder::build_cpu_fallback(&primitives);
        assert_eq!(result.stats.primitive_count, 3);
        assert_eq!(result.stats.node_count, 5);
        assert_eq!(result.nodes[0].bounds.min.x, -4.0);
        assert_eq!(result.nodes[0].bounds.max.x, 4.0);
    }

    fn primitive(id: u64, x: f32) -> BvhPrimitive {
        BvhPrimitive {
            id,
            bounds: Aabb {
                min: Vec3 {
                    x,
                    y: -1.0,
                    z: -1.0,
                },
                max: Vec3 {
                    x: x + 1.0,
                    y: 1.0,
                    z: 1.0,
                },
            },
        }
    }
}
