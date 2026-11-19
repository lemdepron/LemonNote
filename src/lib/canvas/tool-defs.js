/**
 * Canvas tool definitions.
 * Single source of truth for all toolbar tools.
 * Each tool: id, icon (lucide-react component name), labelKey, hintKey, group, requiresSelection, shortcut, type
 * type: 'mode' | 'action' | 'toggle' | 'menu'
 */

export const CANVAS_TOOL_GROUPS = [
  'navigation',
  'drawing',
  'insert',
  'arrange',
  'history',
];

export const CANVAS_TOOLS = [
  // Navigation group
  {
    id: 'select',
    icon: 'MousePointer2',
    labelKey: 'vault.canvas.home.select.select',
    hintKey: 'vault.canvas.home.select.selectHint',
    group: 'navigation',
    type: 'mode',
    shortcut: 'V',
    requiresSelection: false,
  },
  {
    id: 'pan',
    icon: 'Hand',
    labelKey: 'vault.canvas.home.select.pan',
    hintKey: 'vault.canvas.home.select.panHint',
    group: 'navigation',
    type: 'mode',
    shortcut: 'H',
    requiresSelection: false,
  },

  // Drawing tools group
  {
    id: 'draw',
    icon: 'PenTool',
    labelKey: 'vault.canvas.draw.tools.pen',
    hintKey: 'vault.canvas.draw.tools.penHint',
    group: 'drawing',
    type: 'mode',
    shortcut: 'P',
    requiresSelection: false,
  },
  {
    id: 'highlighter',
    icon: 'Highlighter',
    labelKey: 'vault.canvas.draw.tools.highlighter',
    hintKey: 'vault.canvas.draw.tools.highlighterHint',
    group: 'drawing',
    type: 'mode',
    shortcut: '',
    requiresSelection: false,
  },
  {
    id: 'erase',
    icon: 'Eraser',
    labelKey: 'vault.canvas.draw.tools.eraser',
    hintKey: 'vault.canvas.draw.tools.eraserHint',
    group: 'drawing',
    type: 'mode',
    shortcut: 'E',
    requiresSelection: false,
  },
  {
    id: 'lasso',
    icon: 'LassoSelect',
    labelKey: 'vault.canvas.draw.tools.lasso',
    hintKey: 'vault.canvas.draw.tools.lassoHint',
    group: 'drawing',
    type: 'mode',
    shortcut: 'L',
    requiresSelection: false,
  },
  {
    id: 'shape',
    icon: 'Shapes',
    labelKey: 'vault.canvas.draw.tools.shape',
    hintKey: 'vault.canvas.draw.tools.shapeHint',
    group: 'drawing',
    type: 'mode',
    shortcut: 'S',
    requiresSelection: false,
  },
  {
    id: 'shapeRecognition',
    icon: 'Wand2',
    labelKey: 'vault.canvas.draw.tools.shapeRecognition',
    hintKey: 'vault.canvas.draw.tools.shapeRecognitionHint',
    group: 'drawing',
    type: 'toggle',
    shortcut: '',
    requiresSelection: false,
  },

  // Insert objects group
  {
    id: 'addCard',
    icon: 'SquareStack',
    labelKey: 'vault.canvas.insert.cards.addCard',
    hintKey: 'vault.canvas.insert.cards.addCardHint',
    group: 'insert',
    type: 'action',
    shortcut: '',
    requiresSelection: false,
  },
  {
    id: 'addConnector',
    icon: 'Cable',
    labelKey: 'vault.canvas.insert.cards.connect',
    hintKey: 'vault.canvas.insert.cards.connectHint',
    group: 'insert',
    type: 'mode',
    shortcut: '',
    requiresSelection: true, // needs at least one object selected or pending connection
  },
  {
    id: 'addTextBox',
    icon: 'Type',
    labelKey: 'vault.canvas.insert.textNotes.textBox',
    hintKey: 'vault.canvas.insert.textNotes.textBoxHint',
    group: 'insert',
    type: 'action',
    shortcut: 'T',
    requiresSelection: false,
  },
  {
    id: 'addSticky',
    icon: 'StickyNote',
    labelKey: 'vault.canvas.insert.textNotes.stickyNote',
    hintKey: 'vault.canvas.insert.textNotes.stickyNoteHint',
    group: 'insert',
    type: 'action',
    shortcut: '',
    requiresSelection: false,
  },
  {
    id: 'addShapeMenu',
    icon: 'Square',
    labelKey: 'vault.canvas.insert.objects.shapes',
    hintKey: 'vault.canvas.insert.objects.shapesHint',
    group: 'insert',
    type: 'menu',
    shortcut: '',
    requiresSelection: false,
    menuItems: [
      { id: 'rect', shapeType: 'rect', labelKey: 'vault.canvas.insert.objects.rectangle', icon: 'Square' },
      { id: 'ellipse', shapeType: 'ellipse', labelKey: 'vault.canvas.insert.objects.ellipse', icon: 'Circle' },
      { id: 'line', shapeType: 'line', labelKey: 'vault.canvas.insert.objects.line', icon: 'Minus' },
      { id: 'arrow', shapeType: 'arrow', labelKey: 'vault.canvas.insert.objects.arrow', icon: 'ArrowRight' },
      { id: 'triangle', shapeType: 'triangle', labelKey: 'vault.canvas.insert.objects.triangle', icon: 'Triangle' },
      { id: 'polygon', shapeType: 'polygon', labelKey: 'vault.canvas.insert.objects.polygon', icon: 'Hexagon' },
    ],
  },
  {
    id: 'addSticker',
    icon: 'Sticker',
    labelKey: 'vault.canvas.insert.media.sticker',
    hintKey: 'vault.canvas.insert.media.stickerHint',
    group: 'insert',
    type: 'action',
    shortcut: '',
    requiresSelection: false,
  },
  {
    id: 'addImage',
    icon: 'ImagePlus',
    labelKey: 'vault.canvas.insert.media.image',
    hintKey: 'vault.canvas.insert.media.imageHint',
    group: 'insert',
    type: 'action',
    shortcut: '',
    requiresSelection: false,
  },

  // Page/Frame group
  {
    id: 'addFrameMenu',
    icon: 'Frame',
    labelKey: 'vault.canvas.page.frames.addFrame',
    hintKey: 'vault.canvas.page.frames.addFrameHint',
    group: 'insert',
    type: 'menu',
    shortcut: '',
    requiresSelection: false,
    // FRAME_TYPES from objects.js
  },
  {
    id: 'paperMenu',
    icon: 'Grid3x3',
    labelKey: 'vault.canvas.page.paper.label',
    hintKey: 'vault.canvas.page.paper.label',
    group: 'insert',
    type: 'menu',
    shortcut: '',
    requiresSelection: false,
  },

  // Arrange group
  {
    id: 'bringForward',
    icon: 'ArrowRight',
    labelKey: 'vault.canvas.home.arrange.bringForward',
    hintKey: 'vault.canvas.home.arrange.bringForwardHint',
    group: 'arrange',
    type: 'action',
    shortcut: 'Ctrl+]',
    requiresSelection: true,
  },
  {
    id: 'sendBackward',
    icon: 'ArrowLeft',
    labelKey: 'vault.canvas.home.arrange.sendBackward',
    hintKey: 'vault.canvas.home.arrange.sendBackwardHint',
    group: 'arrange',
    type: 'action',
    shortcut: 'Ctrl+[',
    requiresSelection: true,
  },
  {
    id: 'duplicate',
    icon: 'CopyPlus',
    labelKey: 'vault.canvas.home.clipboard.duplicate',
    hintKey: 'vault.canvas.home.clipboard.duplicateHint',
    group: 'arrange',
    type: 'action',
    shortcut: 'Ctrl+D',
    requiresSelection: true,
  },
  {
    id: 'copy',
    icon: 'CopyPlus',
    labelKey: 'vault.canvas.home.clipboard.copy',
    hintKey: 'vault.canvas.home.clipboard.copyHint',
    group: 'arrange',
    type: 'action',
    shortcut: 'Ctrl+C',
    requiresSelection: true,
  },
  {
    id: 'paste',
    icon: 'Paste',
    labelKey: 'vault.canvas.home.clipboard.paste',
    hintKey: 'vault.canvas.home.clipboard.pasteHint',
    group: 'arrange',
    type: 'action',
    shortcut: 'Ctrl+V',
    requiresSelection: false,
  },
  {
    id: 'delete',
    icon: 'Trash2',
    labelKey: 'vault.canvas.home.clipboard.delete',
    hintKey: 'vault.canvas.home.clipboard.deleteHint',
    group: 'arrange',
    type: 'action',
    shortcut: 'Delete',
    requiresSelection: true,
  },

  // History group (Undo/Redo)
  {
    id: 'undo',
    icon: 'Undo2',
    labelKey: 'vault.canvas.ribbon.home.undo',
    hintKey: 'vault.canvas.ribbon.home.undoHint',
    group: 'history',
    type: 'action',
    shortcut: 'Ctrl+Z',
    requiresSelection: false,
  },
  {
    id: 'redo',
    icon: 'Redo2',
    labelKey: 'vault.canvas.ribbon.home.redo',
    hintKey: 'vault.canvas.ribbon.home.redoHint',
    group: 'history',
    type: 'action',
    shortcut: 'Ctrl+Y',
    requiresSelection: false,
  },
];

/** Get tools filtered by group */
export function getToolsByGroup(group) {
  return CANVAS_TOOLS.filter((tool) => tool.group === group);
}

/** Get a single tool by id */
export function getToolById(id) {
  return CANVAS_TOOLS.find((tool) => tool.id === id);
}

/** Get all tools */
export function getAllTools() {
  return CANVAS_TOOLS;
}