#[derive(Debug, Clone)]
pub enum ViewportTarget {
    Headless,
    Surface { width: u32, height: u32 },
}
