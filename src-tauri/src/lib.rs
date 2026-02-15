#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{App, Manager, Wry};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_global_shortcut::{GlobalShortcut, Shortcut};
use tauri_plugin_notification::NotificationManager;
use tauri_plugin_shell::{ShellExt, ShellManager};

#[cfg(desktop)]
fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_autostart::init(
      MacosLauncher::LaunchAgent,
      Some(true),
    ))
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_notification::init())
    .invoke_handler(tauri::generate_handler![
      greet,
      save_window_state,
      load_window_state,
      add_to_startup,
      remove_from_startup,
      show_notification,
      open_url,
      create_notion_page,
      get_notion_database,
      update_notion_page
    ])
    .setup(|app| {
      let handle = app.handle();

      let shortcut = Shortcut::new(Some(tauri_plugin_global_shortcut::Modifiers::CONTROL), tauri_plugin_global_shortcut::Code::Space);
      handle.plugin(|manager: &tauri_plugin_global_shortcut::GlobalShortcutManager| {
        manager.register(shortcut.clone())?;
        Ok(())
      })?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(mobile)]
fn main() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_window_state(app: App<Wry>, state: String) {
  let _handle = app.handle();
  println!("Rust: Saving window state: {}", state);
}

#[tauri::command]
fn load_window_state(app: App<Wry>) -> String {
  let _handle = app.handle();
  println!("Rust: Loading window state");
  "{}".to_string()
}

#[tauri::command]
fn add_to_startup(app: App<Wry>) {
  let _handle = app.handle();
  println!("Rust: Adding app to startup");
}

#[tauri::command]
fn remove_from_startup(app: App<Wry>) {
  let _handle = app.handle();
  println!("Rust: Removing app from startup");
}

#[tauri::command]
fn show_notification(app: App<Wry>, title: String, body: String) {
  app
    .plugins(|manager| manager.get::<NotificationManager>())
    .unwrap()
    .builder()
    .title(title)
    .body(body)
    .show()
    .unwrap();
}

#[tauri::command]
fn open_url(app: App<Wry>, url: String) {
    app.plugins(|manager| manager.get::<ShellManager>())
        .unwrap()
        .open(url, None)
        .unwrap();
}

// Notion API Commands
use reqwest::Client;
use serde_json::json;
use std::collections::HashMap;

#[tauri::command]
async fn create_notion_page(
  notion_key: String,
  database_id: String,
  title: String,
  content: String,
) -> Result<String, String> {
  let client = Client::new();

  let mut properties = HashMap::new();
  properties.insert(
    "Name",
    json!({
        "title": [
            {
                "text": {
                    "content": title
                }
            }
        ]
    }),
  );

  let payload = json!({
      "parent": { "database_id": database_id },
      "properties": properties,
      "children": [
          {
              "object": "block",
              "type": "paragraph",
              "paragraph": {
                  "rich_text": [
                      {
                          "type": "text",
                          "text": {
                              "content": content
                          }
                      }
                  ]
              }
          }
      ]
  });

  let response_result = client
    .post("https://api.notion.com/v1/pages")
    .header("Authorization", format!("Bearer {}", notion_key))
    .header("Notion-Version", "2022-06-28")
    .json(&payload)
    .send()
    .await;

  match response_result {
    Ok(response) => {
      if response.status().is_success() {
        let response_json: serde_json::Value =
          response.json().await.map_err(|e| e.to_string())?;
        let page_id = response_json
          .get("id")
          .and_then(|v| v.as_str())
          .unwrap_or("Unknown ID");
        Ok(page_id.to_string())
      } else {
        let status = response.status();
        let error_json: serde_json::Value = response
          .json()
          .await
          .unwrap_or_else(|_| json!({ "message": "Unknown Notion error" }));
        let message = error_json
          .get("message")
          .and_then(|v| v.as_str())
          .unwrap_or("Unknown Notion error");
        Err(format!("Error: {} - {}", status, message))
      }
    }
    Err(e) => {
      println!("Rust: Request Error: {}", e);
      Err(e.to_string())
    }
  }
}

#[tauri::command]
async fn get_notion_database(
  notion_key: String,
  database_id: String,
) -> Result<serde_json::Value, String> {
  let client = Client::new();
  let response_result = client
    .get(format!(
      "https://api.notion.com/v1/databases/{}",
      database_id
    ))
    .header("Authorization", format!("Bearer {}", notion_key))
    .header("Notion-Version", "2022-06-28")
    .send()
    .await;

  match response_result {
    Ok(response) => {
      if response.status().is_success() {
        response.json().await.map_err(|e| e.to_string())
      } else {
        let status = response.status();
        let error_json: serde_json::Value = response
          .json()
          .await
          .unwrap_or_else(|_| json!({ "message": "Unknown Notion error" }));
        let message = error_json
          .get("message")
          .and_then(|v| v.as_str())
          .unwrap_or("Unknown Notion error");
        Err(format!("Error: {} - {}", status, message))
      }
    }
    Err(e) => {
      println!("Rust: Request Error: {}", e);
      Err(e.to_string())
    }
  }
}

#[tauri::command]
async fn update_notion_page(
  notion_key: String,
  page_id: String,
  status: String,
) -> Result<(), String> {
  let client = Client::new();

  let payload = json!({
      "properties": {
          "Status": {
              "status": {
                  "name": status
              }
          }
      }
  });

  let response_result = client
    .patch(format!("https://api.notion.com/v1/pages/{}", page_id))
    .header("Authorization", format!("Bearer {}", notion_key))
    .header("Notion-Version", "2022-06-28")
    .json(&payload)
    .send()
    .await;

  match response_result {
    Ok(response) => {
      if response.status().is_success() {
        Ok(())
      } else {
        let status = response.status();
        let error_json: serde_json::Value = response
          .json()
          .await
          .unwrap_or_else(|_| json!({ "message": "Unknown Notion error" }));
        let message = error_json
          .get("message")
          .and_then(|v| v.as_str())
          .unwrap_or("Unknown Notion error");
        Err(format!("Error: {} - {}", status, message))
      }
    }
    Err(e) => {
      println!("Rust: Request Error: {}", e);
      Err(e.to_string())
    }
  }
}
