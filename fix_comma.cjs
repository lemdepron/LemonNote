const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

// Find the end of ai section (before backup)
const aiEnd = content.indexOf('"backup": {');
const aiSectionEnd = content.lastIndexOf('  },', aiEnd);

console.log('aiSectionEnd:', aiSectionEnd);
console.log('Context around ai end:', content.substring(aiSectionEnd - 50, aiEnd + 50));

// Check if there's a comma after ai section
const afterAiEnd = content.substring(aiSectionEnd, aiSectionEnd + 10);
console.log('After ai end:', afterAiEnd);