/**
 * LemonNote assets (images, files) helper.
 *
 * Assets are files stored in the _files IndexedDB store and referenced in
 * markdown as ./assets/<uuid>.<ext> (e.g., ![alt](./assets/abc123.png)).
 * This module provides utilities to resolve these paths to object URLs.
 */

import { getFile, createFileObjectUrl, db } from "@/api/localDb";

/** In-memory cache of object URLs for asset paths. */
const assetUrlCache = new Map();

/**
 * Extract the file ID from an asset path like ./assets/abc123.png
 * @param {string} path - The asset path
 * @returns {string | null} - The file ID or null if not an asset path
 */
export function extractAssetId(path) {
  if (!path || typeof path !== "string") return null;
  // Match ./assets/<id>.<ext> or assets/<id>.<ext>
  const match = path.match(/(?:\.\/)?assets\/([a-f0-9]{24})\.[a-zA-Z0-9]+/);
  return match ? match[1] : null;
}

/**
 * Check if a path is an asset reference.
 * @param {string} path - The path to check
 * @returns {boolean}
 */
export function isAssetPath(path) {
  return extractAssetId(path) !== null;
}

/**
 * Resolve an asset path to an object URL.
 * @param {string} path - The asset path (e.g., ./assets/abc123.png)
 * @returns {Promise<string>} - Object URL for the asset
 */
export async function resolveAssetPath(path) {
  const id = extractAssetId(path);
  if (!id) throw new Error("Not an asset path");

  // Return cached URL if available
  if (assetUrlCache.has(id)) {
    return assetUrlCache.get(id);
  }

  const url = await createFileObjectUrl(id);
  assetUrlCache.set(id, url);
  return url;
}

/**
 * Revoke the cached object URL for an asset.
 * @param {string} path - The asset path
 */
export function revokeAssetUrl(path) {
  const id = extractAssetId(path);
  if (id && assetUrlCache.has(id)) {
    URL.revokeObjectURL(assetUrlCache.get(id));
    assetUrlCache.delete(id);
  }
}

/**
 * Revoke all cached asset URLs. Call on page unload.
 */
export function revokeAllAssetUrls() {
  for (const url of assetUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  assetUrlCache.clear();
}

/**
 * Find a file in the _files store by its original filename.
 * Used when importing markdown that references assets by name.
 * @param {string} filename - The original filename
 * @returns {Promise<{ id: string, name: string, type: string, size: number } | null>}
 */
export async function findAssetByFilename(filename) {
  const files = await db.entities.Files.filter({ name: filename }, { limit: 1 });
  return files.items[0] || null;
}

/**
 * Get the asset path for a file ID and original filename.
 * @param {string} fileId - The file ID from the database
 * @param {string} filename - The original filename with extension
 * @returns {string} - The asset path (e.g., ./assets/abc123.png)
 */
export function getAssetPath(fileId, filename) {
  return `./assets/${fileId}${filename.slice(filename.lastIndexOf("."))}`;
}

// Clean up on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", revokeAllAssetUrls);
}