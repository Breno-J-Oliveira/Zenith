// ─── Zenith Desktop (Tauri) ─────────────────────────────────────────────
// Entry point do aplicativo desktop.
//
// O frontend (Next.js) é servido como HTML estático (output: 'export').
// O Tauri carrega esse HTML em um webview e comunica-se com o backend
// via HTTP (localhost:3002) e com o NexusAuth (localhost:3000).
//
// Para desenvolvimento:  npx tauri dev
// Para build:            npx tauri build
// ────────────────────────────────────────────────────────────────────────

#![cfg_attr(not(debug_assertions), closed_main)]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
