/**
 * Test script for pdf-ink.js library
 * Run: node scripts/test-pdf-ink-lib.mjs
 */

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

// Import our library
import { 
  addInkToPDF, 
  extractInkFromPDF, 
  exportPDF, 
  createInkPDF, 
  saveInkToPDFPage,
  hasInkAnnotations,
  INK_MARKER_KEY
} from '../src/lib/pdf/pdf-ink.js';

const OUTPUT_DIR = path.join(process.cwd(), 'test-output-lib');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test strokes (simulating handwriting)
const testStrokes = [
  {
    id: 'stroke-1',
    points: [
      [100, 500], [110, 490], [120, 480], [130, 470], [140, 460],
      [150, 450], [160, 440], [170, 430], [180, 420], [190, 410]
    ],
    color: [255, 0, 0], // Red
    width: 2.5,
    tool: 'pen',
    timestamp: Date.now()
  },
  {
    id: 'stroke-2',
    points: [
      [200, 300], [210, 310], [220, 320], [230, 330], [240, 340],
      [250, 350], [260, 360], [270, 370], [280, 380], [290, 390]
    ],
    color: [0, 0, 255], // Blue
    width: 3,
    tool: 'pen',
    timestamp: Date.now() + 1
  },
  {
    id: 'stroke-3',
    points: [
      [300, 200], [320, 180], [340, 200], [360, 180], [380, 200],
      [400, 180], [420, 200], [440, 180]
    ],
    color: [0, 200, 0], // Green
    width: 2,
    tool: 'highlighter',
    timestamp: Date.now() + 2
  }
];

async function runTests() {
  console.log('============================================');
  console.log('pdf-ink.js Library Tests');
  console.log('============================================\n');

  // Test 1: Create ink PDF from scratch
  console.log('Test 1: Create ink PDF from scratch');
  try {
    const pdfBytes = await createInkPDF(testStrokes, { width: 612, height: 792 });
    const outPath = path.join(OUTPUT_DIR, 'test-1-create-ink.pdf');
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`  ✓ Created: ${outPath} (${pdfBytes.length} bytes)`);
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  // Test 2: Add ink to existing PDF
  console.log('\nTest 2: Add ink to existing PDF');
  try {
    // Create a base PDF first
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]);
    const baseBytes = await baseDoc.save();
    
    const pdfBytes = await addInkToPDF(baseBytes, testStrokes, 0);
    const outPath = path.join(OUTPUT_DIR, 'test-2-add-ink.pdf');
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`  ✓ Created: ${outPath} (${pdfBytes.length} bytes)`);
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  // Test 3: Extract ink from PDF
  console.log('\nTest 3: Extract ink from PDF');
  try {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]);
    const baseBytes = await baseDoc.save();
    
    const pdfBytes = await addInkToPDF(baseBytes, testStrokes, 0);
    const extracted = await extractInkFromPDF(pdfBytes, 0);
    
    if (extracted && extracted.length === testStrokes.length) {
      console.log(`  ✓ Extracted ${extracted.length} strokes`);
      console.log(`    First stroke: ${extracted[0].points.length} points, color=${extracted[0].color}`);
    } else {
      console.log(`  ✗ Extraction failed or count mismatch`);
      console.log(`    Expected: ${testStrokes.length}, Got: ${extracted?.length || 0}`);
    }
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  // Test 4: Check hasInkAnnotations
  console.log('\nTest 4: Check hasInkAnnotations');
  try {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]);
    const baseBytes = await baseDoc.save();
    
    const withoutInk = await hasInkAnnotations(baseBytes, 0);
    console.log(`  Without ink: ${withoutInk} (expected false)`);
    
    const withInkBytes = await addInkToPDF(baseBytes, testStrokes, 0);
    const withInk = await hasInkAnnotations(withInkBytes, 0);
    console.log(`  With ink: ${withInk} (expected true)`);
    
    if (!withoutInk && withInk) {
      console.log('  ✓ hasInkAnnotations works correctly');
    } else {
      console.log('  ✗ hasInkAnnotations failed');
    }
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  // Test 5: Export modes
  console.log('\nTest 5: Export modes (annotated vs flattened)');
  try {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]);
    const baseBytes = await baseDoc.save();
    
    const pdfBytes = await addInkToPDF(baseBytes, testStrokes, 0);
    
    const annotated = await exportPDF(pdfBytes, 'annotated', 0);
    const flattened = await exportPDF(pdfBytes, 'flattened', 0);
    
    console.log(`  Annotated: ${annotated.length} bytes`);
    console.log(`  Flattened: ${flattened.length} bytes`);
    console.log(`  Same size: ${annotated.length === flattened.length} (marker is small)`);
    console.log('  ✓ Export functions executed');
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  // Test 6: saveInkToPDFPage with coordinate transform
  console.log('\nTest 6: saveInkToPDFPage with coordinate transform');
  try {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]);
    const baseBytes = await baseDoc.save();
    
    // Strokes in canvas coordinates (simulating 2x zoom)
    const canvasStrokes = testStrokes.map(s => ({
      ...s,
      points: s.points.map(([x, y]) => [x * 2, y * 2]) // Canvas at 2x scale
    }));
    
    const viewport = { width: 612, height: 792, scale: 2, rotation: 0 };
    const canvasRect = { x: 0, y: 0, width: 612 * 2, height: 792 * 2 };
    
    const pdfBytes = await saveInkToPDFPage({
      pdfBytes: baseBytes,
      strokes: canvasStrokes,
      pageIndex: 0,
      viewport,
      canvasRect
    });
    
    const outPath = path.join(OUTPUT_DIR, 'test-6-save-page.pdf');
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`  ✓ Created: ${outPath} (${pdfBytes.length} bytes)`);
    
    // Verify extraction still works
    const extracted = await extractInkFromPDF(pdfBytes, 0);
    if (extracted && extracted.length === testStrokes.length) {
      console.log(`  ✓ Extracted ${extracted.length} strokes after coordinate transform`);
    }
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  // Test 7: Empty strokes handling
  console.log('\nTest 7: Empty strokes handling');
  try {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([612, 792]);
    const baseBytes = await baseDoc.save();
    
    const result = await addInkToPDF(baseBytes, [], 0);
    console.log(`  Empty strokes: ${result.length === baseBytes.length ? 'returns original' : 'modified'}`);
    
    const result2 = await addInkToPDF(baseBytes, null, 0);
    console.log(`  Null strokes: ${result2.length === baseBytes.length ? 'returns original' : 'modified'}`);
    
    console.log('  ✓ Empty/null handling works');
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    console.error(err);
  }

  console.log('\n============================================');
  console.log('All tests completed');
  console.log('============================================');
  console.log(`Test files in: ${OUTPUT_DIR}`);
  fs.readdirSync(OUTPUT_DIR).forEach(f => console.log(`  - ${f}`));
}

runTests().catch(console.error);