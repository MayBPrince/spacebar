use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_store::StoreExt;
use serde_json::json;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState, Shortcut};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app: &AppHandle, _shortcut: &Shortcut, event: tauri_plugin_global_shortcut::ShortcutEvent| {
                    if event.state == ShortcutState::Pressed {
                         if let Some(window) = app.get_webview_window("main") {
                             toggle_drawer_logic(app, &window);
                         }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .invoke_handler(tauri::generate_handler![
            toggle_drawer,
            hide_drawer,
            show_drawer,
            get_settings,
            save_settings,
            get_shortcuts,
            save_shortcuts,
            get_layouts,
            save_layout,
            delete_layout,
            get_conversations,
            save_conversations,
            get_research_notes,
            save_research_notes,
            get_tasks,
            save_tasks,
            get_notes,
            save_notes,
            sync_to_notion,
            test_notion_connection,
            update_notion_page
        ])
        .setup(|app| {
            let _handle = app.handle();
            
            // Initialize stores
            let settings_store = app.store("settings.json")?;
            
            #[cfg(desktop)]
            {
                let settings = settings_store.get("settings").unwrap_or(json!({}));
                let hotkey = settings.get("hotkey")
                   .and_then(|v| v.as_str())
                   .unwrap_or("CommandOrControl+Space");
                
                app.global_shortcut().register(hotkey)?;
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn toggle_drawer_logic(app: &AppHandle, window: &WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        let _ = window.emit("drawer-visibility", false);
    } else {
        position_window(app, window);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("drawer-visibility", true);
    }
}

#[tauri::command]
async fn toggle_drawer(app: AppHandle, window: WebviewWindow) {
    toggle_drawer_logic(&app, &window);
}

// ... existing commands ...

#[tauri::command]
async fn hide_drawer(window: WebviewWindow) {
    let _ = window.hide();
    let _ = window.emit("drawer-visibility", false);
}

#[tauri::command]
async fn show_drawer(app: AppHandle, window: WebviewWindow) {
    position_window(&app, &window);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.emit("drawer-visibility", true);
}

#[tauri::command]
async fn get_settings(app: AppHandle) -> serde_json::Value {
    let store = app.store("settings.json").unwrap();
    store.get("settings").unwrap_or(json!({
        "theme": "dark",
        "drawerSide": "right",
        "hotkey": "CommandOrControl+Space"
    }))
}

#[tauri::command]
async fn save_settings(app: AppHandle, window: WebviewWindow, settings: serde_json::Value) {
    let store = app.store("settings.json").unwrap();
    store.set("settings", settings.clone());
    let _ = store.save();
    
    // Update window position
    if let Some(side) = settings.get("drawerSide").and_then(|v| v.as_str()) {
        if let Some(monitor) = window.current_monitor().unwrap_or(None) {
            let screen_size = monitor.size();
            let window_size = window.outer_size().unwrap_or(tauri::PhysicalSize::new(450, 800));
            
            let x = if side == "right" {
                screen_size.width as i32 - window_size.width as i32 - 20
            } else {
                20
            };
            
            let y = (screen_size.height as i32 - window_size.height as i32) / 2;
            
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
        }
    }
}

fn position_window(app: &AppHandle, window: &WebviewWindow) {
    let store = app.store("settings.json").unwrap();
    let settings = store.get("settings").unwrap_or(json!({ "drawerSide": "right" }));
    let side = settings.get("drawerSide").and_then(|v| v.as_str()).unwrap_or("right");

    if let Some(monitor) = window.current_monitor().unwrap_or(None) {
        let screen_size = monitor.size();
        let window_size = window.outer_size().unwrap_or(tauri::PhysicalSize::new(450, 800));
        
        let x = if side == "right" {
            screen_size.width as i32 - window_size.width as i32 - 20
        } else {
            20
        };
        
        let y = (screen_size.height as i32 - window_size.height as i32) / 2;
        
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
    }
}

#[tauri::command]
async fn get_shortcuts(app: AppHandle) -> Vec<serde_json::Value> {
    let store = app.store("shortcuts.json").unwrap();
    serde_json::from_value(store.get("shortcuts").unwrap_or(json!([]))).unwrap_or(vec![])
}

#[tauri::command]
async fn save_shortcuts(app: AppHandle, shortcuts: Vec<serde_json::Value>) {
    let store = app.store("shortcuts.json").unwrap();
    store.set("shortcuts", json!(shortcuts));
    let _ = store.save();
}

#[tauri::command]
async fn get_layouts(app: AppHandle) -> Vec<serde_json::Value> {
    let store = app.store("layouts.json").unwrap();
    serde_json::from_value(store.get("windowLayouts").unwrap_or(json!([]))).unwrap_or(vec![])
}

#[tauri::command]
async fn save_layout(app: AppHandle, layout: serde_json::Value) -> Vec<serde_json::Value> {
    let store = app.store("layouts.json").unwrap();
    let mut layouts: Vec<serde_json::Value> = serde_json::from_value(store.get("windowLayouts").unwrap_or(json!([]))).unwrap_or(vec![]);
    layouts.push(layout);
    store.set("windowLayouts", json!(layouts));
    let _ = store.save();
    layouts
}

#[tauri::command]
async fn delete_layout(app: AppHandle, id: String) -> Vec<serde_json::Value> {
    let store = app.store("layouts.json").unwrap();
    let mut layouts: Vec<serde_json::Value> = serde_json::from_value(store.get("windowLayouts").unwrap_or(json!([]))).unwrap_or(vec![]);
    layouts.retain(|l| l.get("id").and_then(|v| v.as_str()) != Some(&id));
    store.set("windowLayouts", json!(layouts));
    let _ = store.save();
    layouts
}

#[tauri::command]
async fn get_conversations(app: AppHandle) -> Vec<serde_json::Value> {
    let store = app.store("conversations.json").unwrap();
    serde_json::from_value(store.get("conversations").unwrap_or(json!([]))).unwrap_or(vec![])
}

#[tauri::command]
async fn save_conversations(app: AppHandle, conversations: Vec<serde_json::Value>) {
    let store = app.store("conversations.json").unwrap();
    store.set("conversations", json!(conversations));
    let _ = store.save();
}

#[tauri::command]
async fn get_research_notes(app: AppHandle) -> Vec<serde_json::Value> {
    let store = app.store("research.json").unwrap();
    serde_json::from_value(store.get("researchNotes").unwrap_or(json!([]))).unwrap_or(vec![])
}

#[tauri::command]
async fn save_research_notes(app: AppHandle, notes: Vec<serde_json::Value>) {
    let store = app.store("research.json").unwrap();
    store.set("researchNotes", json!(notes));
    let _ = store.save();
}
#[tauri::command]
async fn get_tasks(app: AppHandle) -> Vec<serde_json::Value> {
    let store = app.store("tasks.json").unwrap();
    serde_json::from_value(store.get("tasks").unwrap_or(json!([]))).unwrap_or(vec![])
}

#[tauri::command]
async fn save_tasks(app: AppHandle, tasks: Vec<serde_json::Value>) {
    let store = app.store("tasks.json").unwrap();
    store.set("tasks", json!(tasks));
    let _ = store.save();
}

#[tauri::command]
async fn get_notes(app: AppHandle) -> Vec<serde_json::Value> {
    let store = app.store("notes.json").unwrap();
    serde_json::from_value(store.get("notes").unwrap_or(json!([]))).unwrap_or(vec![])
}

#[tauri::command]
async fn save_notes(app: AppHandle, notes: Vec<serde_json::Value>) {
    let store = app.store("notes.json").unwrap();
    store.set("notes", json!(notes));
    let _ = store.save();
}

#[tauri::command]
async fn sync_to_notion(
    notion_key: String,
    database_id: String,
    payload: serde_json::Value,
) -> Result<String, String> {
    println!("Rust: Syncing to Notion database: {}", database_id);
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.notion.com/v1/pages")
        .header("Authorization", format!("Bearer {}", notion_key))
        .header("Notion-Version", "2022-06-28")
        .json(&payload)
        .send()
        .await
        .map_err(|e| {
            println!("Rust: Request Error: {}", e);
            e.to_string()
        })?;

    println!("Rust: Status: {}", response.status());
    if response.status().is_success() {
        let response_json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        let page_id = response_json.get("id").and_then(|v| v.as_str()).unwrap_or("Unknown ID");
        Ok(page_id.to_string())
    } else {
        let error_json: serde_json::Value = response.json().await.unwrap_or_else(|_| serde_json::json!({ "message": "Unknown Notion error" }));
        let message = error_json.get("message").and_then(|v| v.as_str()).unwrap_or("Unknown Notion error");
        println!("Rust: Notion Error: {}", message);
        Err(message.to_string())
    }
}

#[tauri::command]
async fn test_notion_connection(
    notion_key: String,
    database_id: String,
) -> Result<String, String> {
    println!("Rust: Testing connection to Notion database: {}", database_id);
    let client = reqwest::Client::new();
    let response = client
        .get(format!("https://api.notion.com/v1/databases/{}", database_id))
        .header("Authorization", format!("Bearer {}", notion_key))
        .header("Notion-Version", "2022-06-28")
        .send()
        .await
        .map_err(|e| {
            println!("Rust: Request Error: {}", e);
            e.to_string()
        })?;

    println!("Rust: Status: {}", response.status());
    if response.status().is_success() {
        Ok("Success".to_string())
    } else {
        let error_json: serde_json::Value = response.json().await.unwrap_or_else(|_| serde_json::json!({ "message": "Unknown Notion error" }));
        let message = error_json.get("message").and_then(|v| v.as_str()).unwrap_or("Unknown Notion error");
        println!("Rust: Notion Error: {}", message);
        Err(message.to_string())
    }
}

#[tauri::command]
async fn update_notion_page(
    notion_key: String,
    page_id: String,
    payload: serde_json::Value,
) -> Result<String, String> {
    println!("Rust: Updating Notion page: {}", page_id);
    let client = reqwest::Client::new();
    let response = client
        .patch(format!("https://api.notion.com/v1/pages/{}", page_id))
        .header("Authorization", format!("Bearer {}", notion_key))
        .header("Notion-Version", "2022-06-28")
        .json(&payload)
        .send()
        .await
        .map_err(|e| {
            println!("Rust: Request Error: {}", e);
            e.to_string()
        })?;

    println!("Rust: Status: {}", response.status());
    if response.status().is_success() {
        Ok("Success".to_string())
    } else {
        let error_json: serde_json::Value = response.json().await.unwrap_or_else(|_| serde_json::json!({ "message": "Unknown Notion error" }));
        let message = error_json.get("message").and_then(|v| v.as_str()).unwrap_or("Unknown Notion error");
        println!("Rust: Notion Error: {}", message);
        Err(message.to_string())
    }
}
