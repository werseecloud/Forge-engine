use super::{commands::BlueprintCommand, compiler::CompiledBlueprint, runtime_context::BlueprintRuntimeContext};

pub struct BlueprintVm;

impl BlueprintVm {
    pub fn execute(compiled: &CompiledBlueprint, context: &mut BlueprintRuntimeContext) -> Vec<BlueprintCommand> {
        let _ = compiled;
        context.command_queue.drain(..).collect()
    }
}
