use std::time::{Duration, Instant};

#[derive(Debug, Clone)]
pub struct ProfileSpan {
    start: Instant,
}

impl ProfileSpan {
    pub fn start() -> Self {
        Self { start: Instant::now() }
    }

    pub fn elapsed(&self) -> Duration {
        self.start.elapsed()
    }
}
