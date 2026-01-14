use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
async fn create_project(
    name: String,
    template: String,
    directory: String,
    init_git: bool,
    install_deps: bool,
) -> Result<String, String> {
    let target_path = PathBuf::from(&directory).join(&name);
    
    // Check if directory already exists
    if target_path.exists() {
        return Err(format!("Directory {} already exists", target_path.display()));
    }

    // Create the directory
    std::fs::create_dir_all(&target_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    // Download template using giget via bunx
    let giget_source = format!("github:AdamAugustinsky/a3-stack/templates/{}", template);
    
    let status = Command::new("bunx")
        .args(["giget", &giget_source, target_path.to_str().unwrap(), "--force"])
        .status()
        .map_err(|e| format!("Failed to run giget: {}", e))?;

    if !status.success() {
        return Err("Failed to download template".to_string());
    }

    // Update package.json with project name
    let pkg_path = target_path.join("package.json");
    if pkg_path.exists() {
        let content = std::fs::read_to_string(&pkg_path)
            .map_err(|e| format!("Failed to read package.json: {}", e))?;
        let updated = content.replace("{{projectName}}", &name);
        std::fs::write(&pkg_path, updated)
            .map_err(|e| format!("Failed to write package.json: {}", e))?;
    }

    // Remove template.json if it exists
    let template_json = target_path.join("template.json");
    if template_json.exists() {
        let _ = std::fs::remove_file(template_json);
    }

    // Remove AI-specific files
    for file in &["CLAUDE.md", "AGENTS.md", "SVELTE5-BOUNDARY-REFACTOR-GUIDE.md"] {
        let file_path = target_path.join(file);
        if file_path.exists() {
            let _ = std::fs::remove_file(file_path);
        }
    }

    // Remove .claude directory
    let claude_dir = target_path.join(".claude");
    if claude_dir.exists() {
        let _ = std::fs::remove_dir_all(claude_dir);
    }

    // Initialize git
    if init_git {
        let _ = Command::new("git")
            .arg("init")
            .current_dir(&target_path)
            .status();
        
        let _ = Command::new("git")
            .args(["add", "-A"])
            .current_dir(&target_path)
            .status();
        
        let _ = Command::new("git")
            .args(["commit", "-m", "Initial commit from A3 Studio"])
            .current_dir(&target_path)
            .status();
    }

    // Install dependencies
    if install_deps {
        let status = Command::new("bun")
            .arg("install")
            .current_dir(&target_path)
            .status()
            .map_err(|e| format!("Failed to install dependencies: {}", e))?;

        if !status.success() {
            return Err("Failed to install dependencies".to_string());
        }
    }

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, create_project])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
