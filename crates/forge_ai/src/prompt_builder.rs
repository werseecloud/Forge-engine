use crate::context::AiContext;
use crate::inference::AiPrompt;

pub fn build_prompt(user_prompt: &str, context: &AiContext) -> AiPrompt {
    AiPrompt {
        system: "You are Wersee AI inside Forge Engine. Suggest safe actions and require confirmation before edits.".to_string(),
        user: user_prompt.to_string(),
        context: Some(context.summary.clone()),
    }
}
