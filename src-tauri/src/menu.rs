use tauri::menu::{Menu, MenuBuilder, MenuItem, PredefinedMenuItem, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Manager, Wry};

pub fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let new_file = MenuItem::with_id(app, "menu.file.new", "New", true, Some("CmdOrCtrl+N"))?;
    let open_file = MenuItem::with_id(
        app,
        "menu.file.open",
        "Open\u{2026}",
        true,
        Some("CmdOrCtrl+O"),
    )?;
    let save_file = MenuItem::with_id(app, "menu.file.save", "Save", true, Some("CmdOrCtrl+S"))?;
    let save_as = MenuItem::with_id(
        app,
        "menu.file.save_as",
        "Save As\u{2026}",
        true,
        Some("CmdOrCtrl+Shift+S"),
    )?;
    let close_window = PredefinedMenuItem::close_window(app, None)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_file)
        .item(&open_file)
        .separator()
        .item(&save_file)
        .item(&save_as)
        .separator()
        .item(&close_window)
        .build()?;

    let app_menu = SubmenuBuilder::new(app, "KNOT")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let toggle_theme = MenuItem::with_id(
        app,
        "menu.view.toggle_theme",
        "Toggle Light/Dark",
        true,
        Some("CmdOrCtrl+Shift+L"),
    )?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&toggle_theme)
        .separator()
        .fullscreen()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu])
        .build()?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, id: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("menu", id);
    }
}
