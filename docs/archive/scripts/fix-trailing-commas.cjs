const fs = require('fs');

function fixTrailingCommas(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find all objects in the ink section and remove trailing commas from last property
  // We'll do this by tracking object nesting level
  
  let inInk = false;
  let braceLevel = 0;
  let lastPropertyLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track when we enter/exit ink section
    if (trimmed === '"ink": {') {
      inInk = true;
      braceLevel = 1;
    } else if (inInk) {
      // Count braces
      for (const ch of line) {
        if (ch === '{') braceLevel++;
        else if (ch === '}') braceLevel--;
      }
      
      // Track last property line in each object
      if (trimmed.endsWith('",') || trimmed.endsWith("',")) {
        lastPropertyLine = i;
      }
      
      // When we close an object (braceLevel decreases), check if last property has trailing comma
      if (trimmed === '},' || trimmed === '}') {
        if (lastPropertyLine >= 0 && lastPropertyLine < i) {
          // Check if the last property line has a trailing comma
          const lastLine = lines[lastPropertyLine];
          if (lastLine.trim().endsWith(',')) {
            // Remove trailing comma
            lines[lastPropertyLine] = lastLine.trim().slice(0, -1) + (lastLine.endsWith(' ') ? ' ' : '');
            console.log(`Fixed trailing comma at line ${lastPropertyLine + 1} in ${filePath}`);
          }
        }
        lastPropertyLine = -1;
      }
      
      // Exit ink section when we close ribbon
      if (braceLevel === 0 && inInk) {
        inInk = false;
      }
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed trailing commas in:', filePath);
}

fixTrailingCommas('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\en.json');
fixTrailingCommas('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\ar.json');
console.log('Done!');