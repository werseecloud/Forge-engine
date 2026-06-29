use std::time::{Duration, Instant};

#[derive(Debug, Clone)]
pub struct RenderLoopClock {
    last_tick: Instant,
}

impl Default for RenderLoopClock {
    fn default() -> Self {
        Self {
            last_tick: Instant::now(),
        }
    }
}

impl RenderLoopClock {
    pub fn tick(&mut self) -> Duration {
        let elapsed = self.last_tick.elapsed();
        self.last_tick = Instant::now();
        elapsed
    }
}
