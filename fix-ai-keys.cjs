const fs = require('fs');
const path = require('path');

const localesDir = 'C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales';
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const fullPath = path.join(localesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const data = JSON.parse(content);
  
  // Check if ribbon.home.ai has flat keys
  if (data.ribbon && data.ribbon.home && data.ribbon.home.ai && typeof data.ribbon.home.ai === 'object' && !data.ribbon.home.ai.translate) {
    console.log(`${file}: already nested`);
    continue;
  }
  
  if (data.ribbon && data.ribbon.home && data.ribbon.home.ai) {
    const ai = data.ribbon.home.ai;
    const newAi = {};
    let hasFlatKeys = false;
    
    for (const [key, value] of Object.entries(ai)) {
      if (key.startsWith('ai.')) {
        hasFlatKeys = true;
        const subKey = key.slice(3); // remove 'ai.'
        newAi[subKey] = value;
      }
    }
    
    if (hasFlatKeys) {
      // Also copy any non-ai.* keys (like the "ai": "AI" label)
      for (const [key, value] of Object.entries(ai)) {
        if (!key.startsWith('ai.')) {
          newAi[key] = value;
        }
      }
      data.ribbon.home.ai = newAi;
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
      console.log(`${file}: FIXED - converted flat ai.* keys to nested object`);
    } else {
      console.log(`${file}: no flat keys found`);
    }
  } else {
    console.log(`${file}: no ribbon.home.ai found`);
  }
}

console.log('Done!');