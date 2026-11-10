const fs = require('fs');

function fixInkComma(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Line 454 (index 453) should be `    }` not `    },`
  if (lines[453].trim() === '},' && lines[453].startsWith('    ')) {
    lines[453] = '    }';
    console.log('Fixed ink close at line 454');
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed:', filePath);
}

fixInkComma('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\en.json');
fixInkComma('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\ar.json');
console.log('Done!');