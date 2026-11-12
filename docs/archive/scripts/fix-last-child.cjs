const fs = require('fs');

function fixLastChildComma(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find the eraserModes closing (should be last child of ink, no comma)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '},' && lines[i].startsWith('    ')) {
      // Check if next line is the ink close
      if (lines[i+1]?.trim() === '},' && lines[i+1].startsWith('    ')) {
        // This is eraserModes close, should not have comma
        lines[i] = '    }';
        console.log('Fixed eraserModes close at line', i+1);
        break;
      }
    }
  }
  
  // Also fix ribbon close - should have comma since fileMenu follows
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '},' && lines[i].startsWith('  ')) {
      if (lines[i+1]?.trim().startsWith('"fileMenu"')) {
        // This is ribbon close, should have comma (already correct)
        console.log('Ribbon close at line', i+1, 'is correct');
        break;
      }
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed last child commas in:', filePath);
}

fixLastChildComma('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\en.json');
fixLastChildComma('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\ar.json');
console.log('Done!');