use std::collections::VecDeque;

use super::{commands::BlueprintCommand, events::BlueprintEvent};

#[derive(Default)]
pub struct BlueprintRuntimeContext {
    pub event_queue: VecDeque<BlueprintEvent>,
    pub command_queue: VecDeque<BlueprintCommand>,
    pub debug_enabled: bool,
}
