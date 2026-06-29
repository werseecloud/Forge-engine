pub mod commands;
pub mod models;
pub mod services;
pub mod utils;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::fs_commands::ensure_app_directories,
            commands::fs_commands::choose_directory,
            commands::fs_commands::choose_files,
            commands::fs_commands::read_directory_tree,
            commands::fs_commands::reveal_in_explorer,
            commands::fs_commands::watch_project_directory,
            commands::project_commands::create_project,
            commands::project_commands::open_project,
            commands::project_commands::close_project,
            commands::project_commands::list_recent_projects,
            commands::project_commands::pin_project,
            commands::project_commands::unpin_project,
            commands::project_commands::reveal_project_in_explorer,
            commands::project_commands::validate_project_path,
            commands::project_commands::repair_project_path,
            commands::asset_commands::import_assets,
            commands::asset_commands::scan_assets,
            commands::asset_commands::rebuild_asset_index,
            commands::asset_commands::get_asset_metadata,
            commands::asset_commands::update_asset_metadata,
            commands::asset_commands::delete_asset,
            commands::asset_commands::rename_asset,
            commands::asset_commands::move_asset,
            commands::asset_commands::duplicate_asset,
            commands::scene_commands::create_level,
            commands::scene_commands::open_level,
            commands::scene_commands::save_level,
            commands::scene_commands::list_levels,
            commands::scene_commands::update_scene_object,
            commands::scene_commands::add_scene_object,
            commands::scene_commands::delete_scene_object,
            commands::scene_commands::select_scene_object,
            commands::settings_commands::get_settings,
            commands::settings_commands::update_settings,
            commands::settings_commands::reset_settings,
            commands::settings_commands::set_default_projects_dir,
            commands::log_commands::read_output_log,
            commands::log_commands::append_output_log,
            commands::log_commands::clear_output_log
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Forge Engine editor");
}

