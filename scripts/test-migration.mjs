/**
 * Test migration from Canvas (v6) to CanvasDoc (v7) and InkPage (v7 to v8)
 * Run with: node scripts/test-migration.mjs
 * Tests the migration logic directly (not through onupgradeneeded)
 */

// Test the migration transformation logic
function migrateCanvasToCanvasDoc(canvas) {
  const nodes = canvas.nodes ?? [];
  const edges = canvas.edges ?? [];
  const objects = [];

  // Convert nodes to card objects
  nodes.forEach((node) => {
    objects.push({
      id: node.id,
      type: "card",
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: 240,
      height: 154,
      rotation: 0,
      zOrder: Date.now() + Math.random(),
      title: node.title ?? "New card",
      body: node.body ?? "",
      visible: true,
      locked: false,
      groupId: null,
    });
  });

  // Convert edges to connector objects
  edges.forEach((edge) => {
    objects.push({
      id: edge.id,
      type: "connector",
      from: edge.from,
      to: edge.to,
      style: "straight",
      points: [],
      visible: true,
      locked: false,
      groupId: null,
    });
  });

  const canvasDoc = {
    id: canvas.id,
    kind: "canvas",
    name: canvas.name ?? "Untitled canvas",
    version: 2,
    paper: { template: "grid", size: "free", width: 9000, height: 6500, tone: "dark" },
    strokes: [],
    objects,
    camera: { x: 0, y: 0, scale: 1 },
    created_date: canvas.created_date ?? new Date().toISOString(),
    updated_date: canvas.updated_date ?? new Date().toISOString(),
  };

  return canvasDoc;
}

// Test data
const testCanvases = [
  {
    id: "canvas-1",
    name: "Project Ideas",
    nodes: [
      { id: "node-1", x: 100, y: 100, title: "Capture", body: "Drop any thought here" },
      { id: "node-2", x: 400, y: 100, title: "Connect", body: "Link cards together" },
    ],
    edges: [
      { id: "edge-1", from: "node-1", to: "node-2" },
    ],
    created_date: "2024-01-15T10:00:00.000Z",
    updated_date: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "canvas-2",
    name: "Empty Canvas",
    nodes: [],
    edges: [],
    created_date: "2024-01-16T08:00:00.000Z",
    updated_date: "2024-01-16T08:00:00.000Z",
  },
  {
    id: "canvas-3",
    name: "Complex Canvas",
    nodes: [
      { id: "n1", x: 50, y: 50, title: "A", body: "Body A" },
      { id: "n2", x: 300, y: 50, title: "B", body: "Body B" },
      { id: "n3", x: 550, y: 50, title: "C", body: "Body C" },
      { id: "n4", x: 50, y: 300, title: "D", body: "Body D" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n1", to: "n4" },
    ],
    created_date: "2024-01-10T12:00:00.000Z",
    updated_date: "2024-01-20T15:00:00.000Z",
  },
  // Edge cases
  {
    id: "canvas-4",
    name: "No optional fields",
    nodes: [{ id: "n1" }], // missing x, y, title, body
    edges: [{ id: "e1", from: "n1", to: "n2" }], // missing from/to would be undefined
    created_date: "2024-01-01T00:00:00.000Z",
    updated_date: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "canvas-5",
    name: "Only edges",
    nodes: [],
    edges: [{ id: "e1", from: "a", to: "b" }],
    created_date: "2024-01-01T00:00:00.000Z",
    updated_date: "2024-01-01T00:00:00.000Z",
  },
];

console.log("=== Testing Canvas → CanvasDoc migration logic ===\n");

let allPassed = true;

for (const canvas of testCanvases) {
  console.log(`Testing: ${canvas.id} (${canvas.name})`);
  const doc = migrateCanvasToCanvasDoc(canvas);

  // Basic structure checks
  const checks = [
    { cond: doc.id === canvas.id, msg: "id preserved" },
    { cond: doc.kind === "canvas", msg: "kind === 'canvas'" },
    { cond: doc.name === canvas.name, msg: "name preserved" },
    { cond: doc.version === 2, msg: "version === 2" },
    { cond: doc.paper.template === "grid", msg: "paper.template === 'grid'" },
    { cond: doc.paper.size === "free", msg: "paper.size === 'free'" },
    { cond: doc.paper.width === 9000, msg: "paper.width === 9000" },
    { cond: doc.paper.height === 6500, msg: "paper.height === 6500" },
    { cond: doc.paper.tone === "dark", msg: "paper.tone === 'dark'" },
    { cond: Array.isArray(doc.objects), msg: "objects is array" },
    { cond: Array.isArray(doc.strokes), msg: "strokes is array" },
    { cond: doc.strokes.length === 0, msg: "strokes empty" },
    { cond: doc.camera.x === 0 && doc.camera.y === 0 && doc.camera.scale === 1, msg: "camera defaults" },
    { cond: doc.created_date === canvas.created_date, msg: "created_date preserved" },
    { cond: doc.updated_date === canvas.updated_date, msg: "updated_date preserved" },
  ];

  for (const check of checks) {
    if (check.cond) {
      console.log(`  ✓ ${check.msg}`);
    } else {
      console.log(`  ✗ ${check.msg}`);
      allPassed = false;
    }
  }

  // Count objects
  const cards = doc.objects.filter((o) => o.type === "card");
  const connectors = doc.objects.filter((o) => o.type === "connector");
  console.log(`  cards: ${cards.length}, connectors: ${connectors.length}`);

  // Validate cards
  cards.forEach((card, idx) => {
    const originalNode = canvas.nodes[idx];
    const cardChecks = [
      { cond: card.type === "card", msg: `card ${card.id}: type === 'card'` },
      { cond: typeof card.title === "string" && card.title.length > 0, msg: `card ${card.id}: has title` },
      { cond: typeof card.body === "string", msg: `card ${card.id}: has body` },
      { cond: typeof card.x === "number", msg: `card ${card.id}: has x` },
      { cond: typeof card.y === "number", msg: `card ${card.id}: has y` },
      { cond: card.width === 240, msg: `card ${card.id}: width === 240` },
      { cond: card.height === 154, msg: `card ${card.id}: height === 154` },
      { cond: card.rotation === 0, msg: `card ${card.id}: rotation === 0` },
      { cond: card.visible === true, msg: `card ${card.id}: visible === true` },
      { cond: card.locked === false, msg: `card ${card.id}: locked === false` },
      { cond: card.groupId === null, msg: `card ${card.id}: groupId === null` },
      { cond: originalNode ? card.x === (originalNode.x ?? 0) : true, msg: `card ${card.id}: x matches original` },
      { cond: originalNode ? card.y === (originalNode.y ?? 0) : true, msg: `card ${card.id}: y matches original` },
      { cond: originalNode ? card.title === (originalNode.title ?? "New card") : true, msg: `card ${card.id}: title matches original` },
      { cond: originalNode ? card.body === (originalNode.body ?? "") : true, msg: `card ${card.id}: body matches original` },
    ];

    for (const cc of cardChecks) {
      if (!cc.cond) {
        console.log(`    ✗ ${cc.msg}`);
        allPassed = false;
      }
    }
  });

  // Validate connectors
  connectors.forEach((conn, idx) => {
    const originalEdge = canvas.edges[idx];
    const connChecks = [
      { cond: conn.type === "connector", msg: `connector ${conn.id}: type === 'connector'` },
      { cond: typeof conn.from === "string", msg: `connector ${conn.id}: has from` },
      { cond: typeof conn.to === "string", msg: `connector ${conn.id}: has to` },
      { cond: conn.style === "straight", msg: `connector ${conn.id}: style === 'straight'` },
      { cond: Array.isArray(conn.points) && conn.points.length === 0, msg: `connector ${conn.id}: points empty array` },
      { cond: conn.visible === true, msg: `connector ${conn.id}: visible === true` },
      { cond: conn.locked === false, msg: `connector ${conn.id}: locked === false` },
      { cond: conn.groupId === null, msg: `connector ${conn.id}: groupId === null` },
      { cond: originalEdge ? conn.from === originalEdge.from : true, msg: `connector ${conn.id}: from matches original` },
      { cond: originalEdge ? conn.to === originalEdge.to : true, msg: `connector ${conn.id}: to matches original` },
    ];

    for (const cc of connChecks) {
      if (!cc.cond) {
        console.log(`    ✗ ${cc.msg}`);
        allPassed = false;
      }
    }
  });

  // Check object count matches
  const expectedObjects = (canvas.nodes?.length ?? 0) + (canvas.edges?.length ?? 0);
  if (doc.objects.length === expectedObjects) {
    console.log(`  ✓ object count matches (${expectedObjects})`);
  } else {
    console.log(`  ✗ object count mismatch: expected ${expectedObjects}, got ${doc.objects.length}`);
    allPassed = false;
  }

  console.log("");
}

// Test default values for missing fields
console.log("Testing defaults for missing optional fields...");
const minimalCanvas = { id: "minimal", nodes: [{}], edges: [{}] };
const minimalDoc = migrateCanvasToCanvasDoc(minimalCanvas);
const minimalCard = minimalDoc.objects.find(o => o.type === "card");
const minimalConn = minimalDoc.objects.find(o => o.type === "connector");

const defaultChecks = [
  { cond: minimalCard.x === 0, msg: "card x defaults to 0" },
  { cond: minimalCard.y === 0, msg: "card y defaults to 0" },
  { cond: minimalCard.title === "New card", msg: "card title defaults to 'New card'" },
  { cond: minimalCard.body === "", msg: "card body defaults to ''" },
  { cond: minimalConn.from === undefined, msg: "connector from is undefined (edge had no from)" },
  { cond: minimalConn.to === undefined, msg: "connector to is undefined (edge had no to)" },
];

for (const cc of defaultChecks) {
  if (cc.cond) {
    console.log(`  ✓ ${cc.msg}`);
  } else {
    console.log(`  ✗ ${cc.msg}`);
    allPassed = false;
  }
}

console.log("\n=== SUMMARY ===");
if (allPassed) {
  console.log("✓ ALL TESTS PASSED");
  console.log("\nMigration logic verified:");
  console.log("- Canvas records migrate to CanvasDoc with kind='canvas'");
  console.log("- Nodes convert to card objects (width=240, height=154)");
  console.log("- Edges convert to connector objects (style='straight')");
  console.log("- Paper set to free 9000x6500 with grid template");
  console.log("- Version set to 2");
  console.log("- Default values handled for missing optional fields");
  console.log("- Original timestamps preserved");
} else {
  console.log("✗ SOME TESTS FAILED");
  process.exit(1);
}

// ============================================================================
// InkPage v7 → v8 migration tests
// ============================================================================

console.log("\n\n=== Testing InkPage v7 → v8 migration logic ===\n");

// Test the migration transformation logic
function migrateInkPageToV8(inkPage) {
  // Only migrate if version is not already set (v1 pages)
  if (inkPage.version === undefined) {
    return {
      ...inkPage,
      version: 2,
      kind: "ink",
      // Ensure paper has all required fields
      paper: {
        template: "grid",
        size: "infinite",
        tone: "dark",
        ...(inkPage.paper || {}),
      },
      // Ensure camera exists
      camera: inkPage.camera || { x: 0, y: 0, scale: 1 },
      // Ensure objects array exists
      objects: inkPage.objects || [],
      // Ensure strokes array exists (may be empty if chunked)
      strokes: Array.isArray(inkPage.strokes) ? inkPage.strokes : [],
    };
  }
  return inkPage;
}

// Test data
const testInkPages = [
  {
    id: "ink-1",
    name: "My Ink Page",
    paper: { template: "grid", size: "a4", tone: "dark" },
    camera: { x: 100, y: 50, scale: 1.5 },
    objects: [
      { id: "obj-1", type: "shape", shapeType: "rect", x: 10, y: 10, width: 100, height: 80 },
      { id: "obj-2", type: "sticker", stickerId: "star-1", x: 200, y: 200, width: 64, height: 64 },
    ],
    strokes: [
      { id: "stroke-1", kind: "stroke", tool: "pen", color: "#e9e2d0", points: [[0,0], [10,10]] },
    ],
    audio: { file_uri: "local:abc123", duration: 30, startedAt: "2024-01-15T10:00:00.000Z" },
    ocrText: "Some recognized text",
    created_date: "2024-01-15T10:00:00.000Z",
    updated_date: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "ink-2",
    name: "Minimal Ink Page",
    // Missing many optional fields
  },
  {
    id: "ink-3",
    name: "Ink Page with only strokes",
    strokes: [
      { id: "s1", kind: "stroke", tool: "pen", color: "#000", points: [[0,0], [5,5]] },
      { id: "s2", kind: "stroke", tool: "pen", color: "#000", points: [[10,10], [15,15]] },
    ],
    created_date: "2024-01-10T12:00:00.000Z",
    updated_date: "2024-01-20T15:00:00.000Z",
  },
  // Already migrated page (should not be changed)
  {
    id: "ink-4",
    name: "Already Migrated",
    version: 2,
    kind: "ink",
    paper: { template: "ruled", size: "letter", tone: "light" },
    camera: { x: 0, y: 0, scale: 1 },
    objects: [],
    strokes: [],
    created_date: "2024-01-01T00:00:00.000Z",
    updated_date: "2024-01-01T00:00:00.000Z",
  },
];

let inkAllPassed = true;

for (const page of testInkPages) {
  console.log(`Testing: ${page.id} (${page.name})`);
  const migrated = migrateInkPageToV8(page);

  const checks = [
    { cond: migrated.id === page.id, msg: "id preserved" },
    { cond: migrated.version === 2, msg: "version === 2" },
    { cond: migrated.kind === "ink", msg: "kind === 'ink'" },
    { cond: migrated.name === page.name, msg: "name preserved" },
    { cond: migrated.paper.template === (page.paper?.template || "grid"), msg: "paper.template preserved/defaulted" },
    { cond: migrated.paper.size === (page.paper?.size || "infinite"), msg: "paper.size preserved/defaulted" },
    { cond: migrated.paper.tone === (page.paper?.tone || "dark"), msg: "paper.tone preserved/defaulted" },
    { cond: migrated.camera.x === (page.camera?.x || 0), msg: "camera.x preserved/defaulted" },
    { cond: migrated.camera.y === (page.camera?.y || 0), msg: "camera.y preserved/defaulted" },
    { cond: migrated.camera.scale === (page.camera?.scale || 1), msg: "camera.scale preserved/defaulted" },
    { cond: Array.isArray(migrated.objects), msg: "objects is array" },
    { cond: Array.isArray(migrated.strokes), msg: "strokes is array" },
    { cond: migrated.created_date === page.created_date, msg: "created_date preserved" },
    { cond: migrated.updated_date === page.updated_date, msg: "updated_date preserved" },
  ];

  for (const check of checks) {
    if (check.cond) {
      console.log(`  ✓ ${check.msg}`);
    } else {
      console.log(`  ✗ ${check.msg}`);
      inkAllPassed = false;
    }
  }

  // Check that already migrated page is not double-migrated
  if (page.id === "ink-4") {
    const notDoubleMigrated = migrated.paper.template === "ruled" && migrated.paper.size === "letter" && migrated.paper.tone === "light";
    if (notDoubleMigrated) {
      console.log(`  ✓ already migrated page not double-migrated`);
    } else {
      console.log(`  ✗ already migrated page was double-migrated`);
      inkAllPassed = false;
    }
  }

  console.log("");
}

console.log("=== InkPage Migration SUMMARY ===");
if (inkAllPassed) {
  console.log("✓ ALL INKPAGE TESTS PASSED");
  console.log("\nMigration logic verified:");
  console.log("- InkPage records get version: 2 and kind: 'ink'");
  console.log("- Paper settings preserved with defaults for missing fields");
  console.log("- Camera settings preserved with defaults");
  console.log("- Objects and strokes arrays ensured");
  console.log("- Already migrated pages (version=2) are not double-migrated");
  console.log("- Original timestamps preserved");
} else {
  console.log("✗ SOME INKPAGE TESTS FAILED");
  process.exit(1);
}

console.log("\n\n=== OVERALL SUMMARY ===");
if (allPassed && inkAllPassed) {
  console.log("✓ ALL MIGRATION TESTS PASSED");
  process.exit(0);
} else {
  console.log("✗ SOME TESTS FAILED");
  process.exit(1);
}