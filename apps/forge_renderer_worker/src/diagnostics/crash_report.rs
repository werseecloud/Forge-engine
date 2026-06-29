use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrashReport {
    pub component: String,
    pub version: String,
    pub panic_message: Option<String>,
    pub backtrace_available: bool,
}
