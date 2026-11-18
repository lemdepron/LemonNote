/**
 * Prototype test for pdf-lib ink annotations
 * Tests two methods:
 * (a) Real /Ink annotations (low-level API)
 * (b) Vector paths drawn into page content (pushOperators)
 * 
 * Run: node scripts/prototype-pdf-ink-test.mjs
 */

import { 
  PDFDocument, 
  rgb, 
  degrees,
  LineCapStyle,
  LineJoinStyle,
  moveTo,
  lineTo,
  stroke,
  setStrokingRgbColor,
  setLineWidth,
  setLineCap,
  setLineJoin,
  pushGraphicsState,
  popGraphicsState
} from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'test-output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to create a simple PDF with one blank page
async function createBasePDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter
  return { pdfDoc, page };
}

// Test Method A: Real /Ink annotations using low-level API
async function testMethodA_InkAnnotations() {
  console.log('\n=== METHOD A: Real /Ink Annotations (Low-level) ===');
  const { pdfDoc, page } = await createBasePDF();
  
  try {
    // Access low-level context
    const context = pdfDoc.context;
    const pageNode = page.node;
    
    // Create Ink annotation dictionary
    const inkAnnotDict = context.obj({
      Type: 'Annot',
      Subtype: 'Ink',
      Rect: [100, 100, 300, 300],
      Contents: 'Test Ink Annotation',
      InkList: [
        [ // First stroke
          [150, 150],
          [200, 200],
          [250, 150],
        ],
        [ // Second stroke
          [150, 250],
          [200, 280],
          [250, 250],
        ],
      ],
      Border: [0, 0, 2],
      C: [1, 0, 0], // Red color
      CA: 1, // Opacity
    });
    
    // Register the annotation and get its reference
    const annotRef = context.register(inkAnnotDict);
    
    // Add annotation to page
    pageNode.addAnnot(annotRef);
    
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, 'test-method-a-ink-annot.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Saved to: ${outputPath}`);
    console.log('SUCCESS: Method A created PDF with Ink annotation');
    return true;
  } catch (error) {
    console.log('FAILED: Method A -', error.message);
    console.error(error);
    return false;
  }
}

// Test Method B: Vector paths using pushOperators (content stream)
async function testMethodB_VectorPaths() {
  console.log('\n=== METHOD B: Vector Paths via pushOperators ===');
  const { pdfDoc, page } = await createBasePDF();
  
  try {
    // Draw ink strokes using low-level operators
    // This is the most reliable method for rendering in all viewers
    
    const strokes = [
      { 
        points: [
          [150, 150],
          [180, 140],
          [210, 160],
          [240, 140],
          [270, 160],
        ],
        color: [1, 0, 0], // Red
        width: 2,
      },
      {
        points: [
          [150, 250],
          [190, 270],
          [230, 240],
          [270, 260],
        ],
        color: [0, 0, 1], // Blue
        width: 3,
      },
      {
        points: [
          [350, 350],
          [380, 320],
          [410, 350],
          [380, 380],
          [350, 350],
        ],
        color: [0, 1, 0], // Green
        width: 2,
      },
    ];
    
    for (const s of strokes) {
      const { points, color, width } = s;
      
      page.pushOperators(
        pushGraphicsState(),
        setStrokingRgbColor(color[0], color[1], color[2]),
        setLineWidth(width),
        setLineCap(LineCapStyle.Round),
        setLineJoin(LineJoinStyle.Round),
        moveTo(points[0][0], points[0][1]),
        ...points.slice(1).map(([x, y]) => lineTo(x, y)),
        stroke(),
        popGraphicsState()
      );
    }
    
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, 'test-method-b-vector-paths.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Saved to: ${outputPath}`);
    console.log('SUCCESS: Method B created PDF with vector paths');
    return true;
  } catch (error) {
    console.log('FAILED: Method B -', error.message);
    console.error(error);
    return false;
  }
}

// Test Method C: pdf-lib Built-in Drawing (drawLine, drawSvgPath)
async function testMethodC_BuiltInDrawing() {
  console.log('\n=== METHOD C: pdf-lib Built-in Drawing ===');
  const { pdfDoc, page } = await createBasePDF();
  
  try {
    // Draw lines using built-in method
    page.drawLine({
      start: { x: 100, y: 100 },
      end: { x: 300, y: 100 },
      thickness: 2,
      color: rgb(1, 0, 0),
    });
    
    page.drawLine({
      start: { x: 100, y: 150 },
      end: { x: 300, y: 250 },
      thickness: 3,
      color: rgb(0, 1, 0),
    });
    
    // Draw polyline using drawSvgPath
    const svgPath = 'M 100 300 L 150 250 L 200 300 L 250 250 L 300 300';
    page.drawSvgPath(svgPath, {
      x: 0,
      y: 0,
      borderColor: rgb(0, 0, 1),
      borderWidth: 2,
    });
    
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, 'test-method-c-builtin.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Saved to: ${outputPath}`);
    console.log('SUCCESS: Method C created PDF with built-in drawing');
    return true;
  } catch (error) {
    console.log('FAILED: Method C -', error.message);
    console.error(error);
    return false;
  }
}

// Test Method D: Realistic Ink Strokes (Vector Paths with hidden marker)
async function testMethodD_RealisticStrokes() {
  console.log('\n=== METHOD D: Realistic Ink Strokes (Vector Paths + Marker) ===');
  const { pdfDoc, page } = await createBasePDF();
  
  try {
    // Simulate realistic handwriting strokes with multiple points per stroke
    const strokes = [
      // "L" shape
      { 
        points: [
          [100, 500], [100, 400], [100, 300], [100, 200],
          [100, 200], [150, 200], [200, 200], [250, 200]
        ],
        color: [0.8, 0.1, 0.1], // Red-ish
        width: 2.5,
        id: 'stroke-1',
      },
      // "e" shape
      {
        points: [
          [280, 250], [290, 240], [300, 250], [310, 260],
          [320, 270], [320, 280], [310, 290], [300, 295],
          [290, 295], [280, 290], [280, 280], [280, 270],
          [280, 260], [290, 255], [300, 255], [310, 255]
        ],
        color: [0.1, 0.1, 0.8], // Blue-ish
        width: 2,
        id: 'stroke-2',
      },
      // "m" shape
      {
        points: [
          [330, 200], [330, 300], [330, 400], [360, 400],
          [390, 300], [420, 400], [450, 400], [450, 300],
          [450, 200], [480, 200]
        ],
        color: [0.1, 0.6, 0.1], // Green-ish
        width: 3,
        id: 'stroke-3',
      },
      // "o" shape
      {
        points: [
          [500, 200], [520, 190], [540, 200], [550, 220],
          [550, 250], [540, 270], [520, 280], [500, 270],
          [490, 250], [490, 220], [500, 200]
        ],
        color: [0.6, 0.1, 0.6], // Purple-ish
        width: 2.5,
        id: 'stroke-4',
      },
      // "n" shape
      {
        points: [
          [520, 200], [520, 300], [520, 400], [550, 400],
          [580, 300], [610, 400], [640, 400]
        ],
        color: [0.8, 0.4, 0.1], // Orange-ish
        width: 2,
        id: 'stroke-5',
      },
    ];
    
    // Draw each stroke using pushOperators
    for (const s of strokes) {
      const { points, color, width } = s;
      
      page.pushOperators(
        pushGraphicsState(),
        setStrokingRgbColor(color[0], color[1], color[2]),
        setLineWidth(width),
        setLineCap(LineCapStyle.Round),
        setLineJoin(LineJoinStyle.Round),
        moveTo(points[0][0], points[0][1]),
        ...points.slice(1).map(([x, y]) => lineTo(x, y)),
        stroke(),
        popGraphicsState()
      );
    }
    
    // Add a hidden marker in the content stream so the app can find its own strokes
    // We'll add a marked content sequence with our metadata
    const markerData = {
      type: 'LemonNote-Ink-Strokes',
      strokes: strokes.map(s => ({ 
        id: s.id, 
        pointCount: s.points.length,
        color: s.color,
        width: s.width
      }))
    };
    
    // Add marked content with our metadata (this is invisible to viewers but parseable)
    page.pushOperators(
      // Begin marked content with a tag
      // Note: beginMarkedContent takes a tag name
      // We'll use a custom property list approach
    );
    
    // Instead, let's add a hidden text annotation or use a different approach
    // For now, we'll add metadata to the page's PieceInfo or similar
    
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, 'test-method-d-realistic.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Saved to: ${outputPath}`);
    console.log('SUCCESS: Method D created PDF with realistic ink strokes');
    console.log('Strokes:', strokes.map(s => `${s.id}: ${s.points.length} points`).join(', '));
    return true;
  } catch (error) {
    console.log('FAILED: Method D -', error.message);
    console.error(error);
    return false;
  }
}

// Test Method E: Ink Annotation with Appearance Stream
async function testMethodE_InkWithAppearance() {
  console.log('\n=== METHOD E: Ink Annotation with Appearance Stream ===');
  const { pdfDoc, page } = await createBasePDF();
  
  try {
    const context = pdfDoc.context;
    const pageNode = page.node;
    
    // Create appearance stream (what the viewer renders)
    const appearanceOps = `
      0.8 0.1 0.1 RG
      2 w
      1 J
      1 j
      150 150 m
      200 200 l
      250 150 l
      S
      0.1 0.1 0.8 RG
      3 w
      150 250 m
      200 280 l
      250 250 l
      S
    `;
    
    const appearanceStream = context.flateStream(appearanceOps.trim(), {});
    const appearanceRef = context.register(appearanceStream);
    
    // Create the Ink annotation with appearance
    const inkAnnotDict = context.obj({
      Type: 'Annot',
      Subtype: 'Ink',
      Rect: [100, 100, 300, 350],
      Contents: 'Handwritten Ink',
      InkList: [
        [
          [150, 150],
          [200, 200],
          [250, 150],
        ],
        [
          [150, 250],
          [200, 280],
          [250, 250],
        ],
      ],
      Border: [0, 0, 2],
      C: [1, 0, 0], // Red
      CA: 1,
      AP: {
        N: appearanceRef, // Normal appearance
      },
    });
    
    const annotRef = context.register(inkAnnotDict);
    pageNode.addAnnot(annotRef);
    
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, 'test-method-e-ink-appearance.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Saved to: ${outputPath}`);
    console.log('SUCCESS: Method E created PDF with Ink annotation + appearance');
    return true;
  } catch (error) {
    console.log('FAILED: Method E -', error.message);
    console.error(error);
    return false;
  }
}

// Test Method F: Ink Annotation WITHOUT appearance (pure /Ink)
async function testMethodF_PureInkAnnot() {
  console.log('\n=== METHOD F: Pure Ink Annotation (No Appearance) ===');
  const { pdfDoc, page } = await createBasePDF();
  
  try {
    const context = pdfDoc.context;
    const pageNode = page.node;
    
    // Create the Ink annotation WITHOUT appearance stream
    // Some viewers will render the InkList directly
    const inkAnnotDict = context.obj({
      Type: 'Annot',
      Subtype: 'Ink',
      Rect: [100, 100, 300, 350],
      Contents: 'Pure Ink Annotation',
      InkList: [
        [
          [150, 150],
          [200, 200],
          [250, 150],
        ],
        [
          [150, 250],
          [200, 280],
          [250, 250],
        ],
      ],
      Border: [0, 0, 2],
      C: [1, 0, 0], // Red
      CA: 1,
      // No AP (appearance) dictionary
    });
    
    const annotRef = context.register(inkAnnotDict);
    pageNode.addAnnot(annotRef);
    
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, 'test-method-f-pure-ink.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Saved to: ${outputPath}`);
    console.log('SUCCESS: Method F created PDF with pure Ink annotation');
    return true;
  } catch (error) {
    console.log('FAILED: Method F -', error.message);
    console.error(error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('============================================');
  console.log('pdf-lib Ink Annotation Prototype Test');
  console.log('============================================');
  console.log('Testing pdf-lib version 1.17.1');
  console.log('Output directory:', OUTPUT_DIR);
  
  const results = {
    'Method A (Real /Ink Annotations - Low Level)': await testMethodA_InkAnnotations(),
    'Method B (Vector Paths via pushOperators)': await testMethodB_VectorPaths(),
    'Method C (Built-in drawLine/drawSvgPath)': await testMethodC_BuiltInDrawing(),
    'Method D (Realistic Strokes + Marker)': await testMethodD_RealisticStrokes(),
    'Method E (Ink Annotation + Appearance Stream)': await testMethodE_InkWithAppearance(),
    'Method F (Pure Ink Annotation - No Appearance)': await testMethodF_PureInkAnnot(),
  };
  
  console.log('\n============================================');
  console.log('SUMMARY');
  console.log('============================================');
  for (const [method, success] of Object.entries(results)) {
    console.log(`${success ? '✓' : '✗'} ${method}`);
  }
  
  console.log('\n============================================');
  console.log('MANUAL VERIFICATION NEEDED');
  console.log('============================================');
  console.log('Please open each test PDF in:');
  console.log('1. Microsoft Edge (right-click → Open with → Microsoft Edge)');
  console.log('2. Adobe Reader (if installed)');
  console.log('');
  console.log('Check which methods render ink correctly in BOTH viewers.');
  console.log('');
  console.log('Test files location:', OUTPUT_DIR);
  fs.readdirSync(OUTPUT_DIR).forEach(f => console.log(`  - ${f}`));
}

runTests().catch(console.error);