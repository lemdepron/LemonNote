const fs = require('fs');

function fixJson(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Fix line 284 (index 283): remove the premature "ribbon" close
  // Line 283 (index 282): "    }" - closes "insert"
  // Line 284 (index 283): "  }," - PREMATURELY closes "ribbon" - REMOVE THIS
  // Line 285 (index 284): "    \"ink\": {" - should be at 4 spaces (child of "ribbon")
  
  // Remove line 284 (the premature close)
  if (lines[283].trim() === '},' && lines[283].startsWith('  ')) {
    lines.splice(283, 1);
    console.log('Removed premature close at line 284');
  }
  
  // Fix the closing of "ink" before "ribbon"
  // Find the line that closes "ribbon" before "fileMenu"
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '},' && lines[i].startsWith('  ') && lines[i+1]?.trim().startsWith('"fileMenu"')) {
      // This line closes "ribbon" but should close "ink" first
      // Change it to close "ink" (4 spaces)
      lines[i] = '    },';
      // Add a new line to close "ribbon"
      lines.splice(i + 1, 0, '  },');
      console.log('Fixed ribbon/ink close at line', i + 1);
      break;
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed:', filePath);
}

fixJson('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\en.json');
fixJson('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\ar.json');

console.log('Done!');