fn main() {
    forge_component("forge_build_worker");
}

fn forge_component(component: &str) {
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--health-check") {
        println!(r#"{{"status":"ok","component":"{}","version":"1.0.0"}}"#, component);
    } else if args.iter().any(|arg| arg == "--version") {
        println!("{} 1.0.0", component);
    } else {
        println!("{} is installed.", component);
    }
}
