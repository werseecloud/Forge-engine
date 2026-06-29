#[derive(Debug, Clone)]
pub struct ClearPass {
    pub color: [f64; 4],
}

impl Default for ClearPass {
    fn default() -> Self {
        Self {
            color: [0.02, 0.03, 0.05, 1.0],
        }
    }
}
