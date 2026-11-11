import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./utils";
import { enable as autostartEnable, disable as autostartDisable, isEnabled as autostartIsEnabled } from "@tauri-apps/plugin-autostart";

export async function get_autostart_state() {
  if (!isTauri()) return false;
  try {
    return await autostartIsEnabled();
  } catch (e) {
    console.error("Failed to get autostart state:", e);
    return false;
  }
}

export async function set_autostart_state(enabled) {
  if (!isTauri()) return;
  try {
    if (enabled) {
      await autostartEnable();
    } else {
      await autostartDisable();
    }
  } catch (e) {
    console.error("Failed to set autostart state:", e);
    throw e;
  }
}

export async function get_tray_state() {
  if (!isTauri()) return false;
  try {
    return await invoke("get_tray_state");
  } catch (e) {
    console.error("Failed to get tray state:", e);
    return false;
  }
}

export async function set_tray_state(enabled) {
  if (!isTauri()) return;
  try {
    await invoke("set_tray_state", { enabled });
  } catch (e) {
    console.error("Failed to set tray state:", e);
    throw e;
  }
}

export async function get_minimize_to_tray_state() {
  if (!isTauri()) return false;
  try {
    return await invoke("get_minimize_to_tray_state");
  } catch (e) {
    console.error("Failed to get minimize to tray state:", e);
    return false;
  }
}

export async function set_minimize_to_tray_state(enabled) {
  if (!isTauri()) return;
  try {
    await invoke("set_minimize_to_tray_state", { enabled });
  } catch (e) {
    console.error("Failed to set minimize to tray state:", e);
    throw e;
  }
}

export async function get_start_minimized_state() {
  if (!isTauri()) return false;
  try {
    return await invoke("get_start_minimized_state");
  } catch (e) {
    console.error("Failed to get start minimized state:", e);
    return false;
  }
}

export async function set_start_minimized_state(enabled) {
  if (!isTauri()) return;
  try {
    await invoke("set_start_minimized_state", { enabled });
  } catch (e) {
    console.error("Failed to set start minimized state:", e);
    throw e;
  }
}