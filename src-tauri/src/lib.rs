use std::fs;
use std::path::PathBuf;
use tauri::{command, AppHandle, Manager, Runtime};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      write_text_file,
      mkdir,
      read_text_file,
      read_dir,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      #[cfg(desktop)]
      app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

/// Validate that a path stays within the allowed base directory.
/// Returns the canonicalized path if valid, or an error string.
fn validate_path(base: &str, target: &str) -> Result<PathBuf, String> {
  let base_path = PathBuf::from(base).canonicalize().map_err(|e| format!("Invalid base path: {}", e))?;
  let target_path = PathBuf::from(target);

  // Reject paths with ".." components before canonicalization
  if target_path.components().any(|c| c.as_os_str() == "..") {
    return Err("Path contains '..' components".to_string());
  }

  let target_canonical = target_path.canonicalize().map_err(|e| format!("Invalid target path: {}", e))?;

  // Ensure target is within base
  if !target_canonical.starts_with(&base_path) {
    return Err("Path is outside the allowed directory".to_string());
  }

  Ok(target_canonical)
}

#[command]
async fn write_text_file<R: Runtime>(
  app: AppHandle<R>,
  path: String,
  contents: String,
  base: Option<String>,
) -> Result<(), String> {
  let base_dir = base.unwrap_or_else(|| {
    app.path()
      .app_data_dir()
      .map(|p| p.to_string_lossy().to_string())
      .unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().to_string())
  });

  let validated_path = validate_path(&base_dir, &path)?;
  fs::write(&validated_path, contents).map_err(|e| format!("Failed to write file: {}", e))
}

#[command]
async fn mkdir<R: Runtime>(
  app: AppHandle<R>,
  path: String,
  recursive: Option<bool>,
  base: Option<String>,
) -> Result<(), String> {
  let base_dir = base.unwrap_or_else(|| {
    app.path()
      .app_data_dir()
      .map(|p| p.to_string_lossy().to_string())
      .unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().to_string())
  });

  let validated_path = validate_path(&base_dir, &path)?;

  if recursive.unwrap_or(false) {
    fs::create_dir_all(&validated_path).map_err(|e| format!("Failed to create directory: {}", e))
  } else {
    fs::create_dir(&validated_path).map_err(|e| format!("Failed to create directory: {}", e))
  }
}

#[command]
async fn read_text_file<R: Runtime>(
  app: AppHandle<R>,
  path: String,
  base: Option<String>,
) -> Result<String, String> {
  let base_dir = base.unwrap_or_else(|| {
    app.path()
      .app_data_dir()
      .map(|p| p.to_string_lossy().to_string())
      .unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().to_string())
  });

  let validated_path = validate_path(&base_dir, &path)?;
  fs::read_to_string(&validated_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[command]
async fn read_dir<R: Runtime>(
  app: AppHandle<R>,
  path: String,
  base: Option<String>,
) -> Result<Vec<DirEntryInfo>, String> {
  let base_dir = base.unwrap_or_else(|| {
    app.path()
      .app_data_dir()
      .map(|p| p.to_string_lossy().to_string())
      .unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().to_string())
  });

  let validated_path = validate_path(&base_dir, &path)?;

  let entries = fs::read_dir(&validated_path).map_err(|e| format!("Failed to read directory: {}", e))?;

  let mut result = Vec::new();
  for entry in entries {
    let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
    let path = entry.path();
    let name = entry.file_name().to_string_lossy().to_string();
    let is_dir = path.is_dir();
    let is_file = path.is_file();

    result.push(DirEntryInfo {
      name,
      path: path.to_string_lossy().to_string(),
      is_dir,
      is_file,
    });
  }

  Ok(result)
}

#[derive(serde::Serialize)]
struct DirEntryInfo {
  name: String,
  path: String,
  is_dir: bool,
  is_file: bool,
}