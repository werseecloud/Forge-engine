use crate::ai_errors::{AiError, AiResult};

pub fn ensure_cloud_allowed(local_only: bool, cloud_enabled: bool) -> AiResult<()> {
    if local_only || !cloud_enabled {
        return Err(AiError::OfflineBlocksCloud);
    }
    Ok(())
}
