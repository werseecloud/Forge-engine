use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlueprintEvent {
    BeginPlay,
    Tick { delta_time: f32 },
    Destroyed { entity: String },
    KeyPressed { key: String },
    KeyReleased { key: String },
    MouseClicked { button: String },
    CollisionEnter { self_entity: String, other: String },
    CollisionExit { self_entity: String, other: String },
    TriggerEnter { self_entity: String, other: String },
    TriggerExit { self_entity: String, other: String },
    DamageTaken { entity: String, amount: f32 },
    HealthChanged { entity: String, health: f32 },
    Death { entity: String },
    SceneLoaded { scene: String },
    UiButtonClicked { widget: String },
    NetworkMessage { channel: String, payload: Value },
    CustomEvent { name: String, payload: Value },
}
