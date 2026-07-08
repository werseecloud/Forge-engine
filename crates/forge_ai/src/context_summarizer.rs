pub fn truncate_context(value: &str, max_chars: usize) -> String {
    if value.len() <= max_chars {
        value.to_string()
    } else {
        format!("{}...", &value[..max_chars])
    }
}
