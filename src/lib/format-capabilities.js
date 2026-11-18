/**
 * Capability table for each note format.
 * A control whose capability is false is greyed (not hidden) with a tooltip.
 * A whole tab is greyed only when every control in it is unavailable.
 */

export const FORMAT_CAPABILITIES = {
  markdown: {
    editText: true,
    richFormat: true,
    codeBlocks: true,
    math: true,
    images: true,
    tables: true,
    links: true,
    ink: false,
    shapes: false,
    insert: true,
    design: true,
    layout: true,
    exportPdf: true,
  },
  plain: {
    editText: true,
    richFormat: false,
    codeBlocks: false,
    math: false,
    images: false,
    tables: false,
    links: true,
    ink: false,
    shapes: false,
    insert: false,
    design: false,
    layout: false,
    exportPdf: false,
  },
  html: {
    editText: true,
    richFormat: true,
    codeBlocks: true,
    math: true,
    images: true,
    tables: true,
    links: true,
    ink: false,
    shapes: false,
    insert: true,
    design: false,
    layout: false,
    exportPdf: true,
  },
  pdf: {
    editText: false,
    richFormat: false,
    codeBlocks: false,
    math: false,
    images: false,
    tables: false,
    links: false,
    ink: true,
    shapes: true,
    insert: false,
    design: false,
    layout: false,
    exportPdf: true,
  },
  canvas: {
    editText: true,
    richFormat: true,
    codeBlocks: true,
    math: true,
    images: true,
    tables: true,
    links: true,
    ink: true,
    shapes: true,
    insert: true,
    design: true,
    layout: true,
    exportPdf: true,
  },
};

/**
 * Check if a format supports a capability.
 * @param {string} format - The format id (markdown, plain, html, pdf, canvas)
 * @param {string} capability - The capability id
 * @returns {boolean}
 */
export function can(format, capability) {
  const caps = FORMAT_CAPABILITIES[format];
  if (!caps) return false;
  return Boolean(caps[capability]);
}

/**
 * Get the translation key for the tooltip explaining why a capability is unavailable.
 * @param {string} format - The format id
 * @param {string} capability - The capability id
 * @returns {string} - The i18n key for the tooltip
 */
export function reasonKey(format, capability) {
  const formatLabel = format.charAt(0).toUpperCase() + format.slice(1);
  const capabilityLabels = {
    editText: "editText",
    richFormat: "richFormat",
    codeBlocks: "codeBlocks",
    math: "math",
    images: "images",
    tables: "tables",
    links: "links",
    ink: "ink",
    shapes: "shapes",
    insert: "insert",
    design: "design",
    layout: "layout",
    exportPdf: "exportPdf",
  };
  const capLabel = capabilityLabels[capability] || capability;
  return `format.capability.${format}.${capLabel}`;
}

/**
 * Get all capabilities for a format.
 * @param {string} format - The format id
 * @returns {object|null}
 */
export function getCapabilities(format) {
  return FORMAT_CAPABILITIES[format] || null;
}

/**
 * Get the list of all capability ids.
 * @returns {string[]}
 */
export function getAllCapabilities() {
  return Object.keys(FORMAT_CAPABILITIES.markdown);
}