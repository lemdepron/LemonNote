/**
 * Unified canvas objects module.
 * Re-exports all object types and utilities from the ink engine,
 * plus additional canvas-specific types (card, connector, frame, etc.).
 */

export {
  OBJECT_TYPES,
  FRAME_TYPES,
  SHAPE_TYPES,
  STICKERS,
  DEFAULT_OBJECT_PROPS,
  createObject,
  getDefaultSize,
  hitTestObject,
  getHandleAt,
  transformObject,
  renderShape,
  renderSticker,
  renderTextBox,
  renderSticky,
  renderTextFrame,
  renderFrame,
  renderCard,
  renderConnector,
  renderImage,
  renderPdfPage,
  generateGroupId,
  getGroupedObjects,
  groupObjects,
  ungroupObjects,
  applyToGroup,
  getGroupBounds,
  transformGroup,
  deleteGroup,
} from "@/lib/canvas/ink/objects";