use glam::{Quat, Vec3};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use uuid::Uuid;

pub type FrameIndex = u64;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntityId(pub Uuid);

impl EntityId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for EntityId {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transform {
    pub translation: Vec3,
    pub rotation: Quat,
    pub scale: Vec3,
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            translation: Vec3::ZERO,
            rotation: Quat::IDENTITY,
            scale: Vec3::ONE,
        }
    }
}

#[derive(Debug, Clone)]
pub struct FrameClock {
    started_at: Instant,
    previous_frame: Instant,
    frame_index: FrameIndex,
}

impl Default for FrameClock {
    fn default() -> Self {
        let now = Instant::now();
        Self {
            started_at: now,
            previous_frame: now,
            frame_index: 0,
        }
    }
}

impl FrameClock {
    pub fn tick(&mut self) -> FrameTiming {
        let now = Instant::now();
        let delta = now.saturating_duration_since(self.previous_frame);
        self.previous_frame = now;
        self.frame_index += 1;
        FrameTiming {
            frame_index: self.frame_index,
            delta_seconds: delta.as_secs_f32(),
            elapsed_seconds: now.saturating_duration_since(self.started_at).as_secs_f32(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrameTiming {
    pub frame_index: FrameIndex,
    pub delta_seconds: f32,
    pub elapsed_seconds: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileMarker {
    pub name: String,
    pub cpu_ms: f32,
    pub gpu_ms: Option<f32>,
}

pub fn duration_ms(duration: Duration) -> f32 {
    duration.as_secs_f32() * 1000.0
}
