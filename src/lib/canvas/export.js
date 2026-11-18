/**
 * Export/Import utilities for .lemoncanvas files
 * Plain JSON format, versioned for future compatibility
 */

export const CANVAS_EXPORT_VERSION = 2;
export const CANVAS_EXPORT_EXTENSION = ".lemoncanvas";
export const CANVAS_EXPORT_MIME = "application/json";

/**
 * Validates a canvas document for export
 * @param {Object} doc - The canvas document
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateCanvasDoc(doc) {
  const errors = [];
  
  if (!doc) {
    errors.push("Document is null or undefined");
    return { valid: false, errors };
  }
  
  if (!doc.id) errors.push("Missing required field: id");
  if (!doc.kind) errors.push("Missing required field: kind");
  if (!doc.name) errors.push("Missing required field: name");
  if (doc.version === undefined) errors.push("Missing required field: version");
  if (!doc.paper) errors.push("Missing required field: paper");
  if (!Array.isArray(doc.objects)) errors.push("objects must be an array");
  if (!Array.isArray(doc.strokes)) errors.push("strokes must be an array");
  if (!doc.camera) errors.push("Missing required field: camera");
  if (!doc.created_date) errors.push("Missing required field: created_date");
  if (!doc.updated_date) errors.push("Missing required field: updated_date");
  
  // Validate kind
  if (doc.kind && !["canvas", "ink", "design"].includes(doc.kind)) {
    errors.push(`Invalid kind: ${doc.kind}. Must be "canvas", "ink", or "design"`);
  }
  
  // Validate paper
  if (doc.paper) {
    if (!doc.paper.template) errors.push("paper.template is required");
    if (!doc.paper.size) errors.push("paper.size is required");
    if (!doc.paper.tone) errors.push("paper.tone is required");
  }
  
  // Validate camera
  if (doc.camera) {
    if (typeof doc.camera.x !== "number") errors.push("camera.x must be a number");
    if (typeof doc.camera.y !== "number") errors.push("camera.y must be a number");
    if (typeof doc.camera.scale !== "number") errors.push("camera.scale must be a number");
  }
  
  // Validate objects
  if (Array.isArray(doc.objects)) {
    doc.objects.forEach((obj, index) => {
      if (!obj.id) errors.push(`Object ${index}: missing id`);
      if (!obj.type) errors.push(`Object ${index}: missing type`);
      if (typeof obj.x !== "number") errors.push(`Object ${index} (${obj.id}): x must be a number`);
      if (typeof obj.y !== "number") errors.push(`Object ${index} (${obj.id}): y must be a number`);
      if (typeof obj.width !== "number") errors.push(`Object ${index} (${obj.id}): width must be a number`);
      if (typeof obj.height !== "number") errors.push(`Object ${index} (${obj.id}): height must be a number`);
      
      // Type-specific validation
      if (obj.type === "connector") {
        if (!obj.from) errors.push(`Connector ${obj.id}: missing 'from'`);
        if (!obj.to) errors.push(`Connector ${obj.id}: missing 'to'`);
      }
      if (obj.type === "card") {
        if (!obj.title) errors.push(`Card ${obj.id}: missing title`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Creates an exportable canvas document
 * @param {Object} doc - The canvas document from database
 * @returns {Object} - Export-ready document with metadata
 */
export function createExportDocument(doc) {
  const validation = validateCanvasDoc(doc);
  if (!validation.valid) {
    throw new Error(`Invalid canvas document: ${validation.errors.join(", ")}`);
  }
  
  return {
    // Export metadata
    exportedAt: new Date().toISOString(),
    exportedBy: "lemonnote",
    exportVersion: CANVAS_EXPORT_VERSION,
    
    // Document data
    id: doc.id,
    kind: doc.kind,
    name: doc.name,
    version: doc.version,
    paper: doc.paper,
    strokes: doc.strokes || [],
    objects: doc.objects || [],
    camera: doc.camera || { x: 0, y: 0, scale: 1 },
    created_date: doc.created_date,
    updated_date: doc.updated_date,
  };
}

/**
 * Exports a canvas document as a .lemoncanvas file download
 * @param {Object} doc - The canvas document
 * @param {string} [filename] - Optional custom filename
 */
export function exportCanvasDoc(doc, filename) {
  const exportDoc = createExportDocument(doc);
  const json = JSON.stringify(exportDoc, null, 2);
  const blob = new Blob([json], { type: CANVAS_EXPORT_MIME });
  const url = URL.createObjectURL(blob);
  
  const defaultName = `${doc.name || "canvas"}-${new Date().toISOString().split("T")[0]}${CANVAS_EXPORT_EXTENSION}`;
  const finalFilename = filename || defaultName;
  
  const a = document.createElement("a");
  a.href = url;
  a.download = finalFilename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a canvas document from a .lemoncanvas file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} - The imported canvas document (without export metadata)
 */
export function importCanvasDoc(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }
    
    if (!file.name.endsWith(CANVAS_EXPORT_EXTENSION)) {
      reject(new Error(`Invalid file type. Expected ${CANVAS_EXPORT_EXTENSION} file`));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target.result;
        const exportDoc = JSON.parse(json);
        
        // Validate export version
        if (exportDoc.exportVersion !== CANVAS_EXPORT_VERSION) {
          reject(new Error(`Unsupported export version: ${exportDoc.exportVersion}. Expected ${CANVAS_EXPORT_VERSION}`));
          return;
        }
        
        // Validate required fields
        const validation = validateCanvasDoc(exportDoc);
        if (!validation.valid) {
          reject(new Error(`Invalid canvas document: ${validation.errors.join(", ")}`));
          return;
        }
        
        // Strip export metadata, return clean document
        const { exportedAt, exportedBy, exportVersion, ...doc } = exportDoc;
        
        // Generate new ID to avoid conflicts
        const newId = `imported-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        
        resolve({
          ...doc,
          id: newId,
          created_date: now,
          updated_date: now,
        });
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Creates a file input element for importing .lemoncanvas files
 * @param {Function} onImport - Callback with imported document
 * @param {Function} onError - Callback with error
 * @returns {HTMLInputElement} - The file input element
 */
export function createImportInput(onImport, onError) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = CANVAS_EXPORT_EXTENSION;
  input.style.display = "none";
  
  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const doc = await importCanvasDoc(file);
      onImport(doc);
    } catch (error) {
      onError(error);
    } finally {
      // Reset input to allow re-importing same file
      input.value = "";
    }
  });
  
  return input;
}

/**
 * Triggers a file picker for importing .lemoncanvas files
 * @param {Function} onImport - Callback with imported document
 * @param {Function} onError - Callback with error
 */
export function triggerImport(onImport, onError) {
  const input = createImportInput(onImport, onError);
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Re-export PDF and PNG export functions
export {
  exportCanvasToPdf,
  exportCanvasToPng,
  getFrameDimensionsMm,
  getFrameDimensionsPx,
} from "./exportPdf.js";