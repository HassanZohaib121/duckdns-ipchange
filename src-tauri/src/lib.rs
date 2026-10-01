mod update;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

use update::update_duckdns;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            update_duckdns
        ])
        .setup(|app| {
            let show_i =
                MenuItem::with_id(
                    app,
                    "show",
                    "Show",
                    true,
                    None::<&str>,
                )?;

            let quit_i =
                MenuItem::with_id(
                    app,
                    "quit",
                    "Quit",
                    true,
                    None::<&str>,
                )?;

            let menu = Menu::with_items(
                app,
                &[&show_i, &quit_i],
            )?;

            let _tray = TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .unwrap()
                        .clone(),
                )
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) =
                                app.get_webview_window("main")
                            {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }

                        "quit" => {
                            app.exit(0);
                        }

                        _ => {}
                    }
                })
                .build(app)?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}