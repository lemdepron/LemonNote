const fs = require('fs');
const path = require('path');

const localesDir = 'C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales';
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const fullPath = path.join(localesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const data = JSON.parse(content);
  
  if (!data.ribbon || !data.ribbon.home) {
    console.log(`${file}: no ribbon.home`);
    continue;
  }
  
  const home = data.ribbon.home;
  const newAi = {};
  let hasFlatKeys = false;
  
  // Check if ai is a string (the label) and there are flat ai.* keys
  if (typeof home.ai === 'string') {
    newAi.label = home.ai;
    delete home.ai;
    hasFlatKeys = true;
  }
  
  // Collect all ai.* flat keys
  const keysToDelete = [];
  for (const [key, value] of Object.entries(home)) {
    if (key.startsWith('ai.')) {
      hasFlatKeys = true;
      const subKey = key.slice(3); // remove 'ai.'
      newAi[subKey] = value;
      keysToDelete.push(key);
    }
  }
  
  // Delete the flat keys
  for (const key of keysToDelete) {
    delete home[key];
  }
  
  if (hasFlatKeys && Object.keys(newAi).length > 0) {
    home.ai = newAi;
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    console.log(`${file}: FIXED - converted flat ai.* keys to nested object with ${Object.keys(newAi).length} keys`);
  } else {
    console.log(`${file}: no flat keys found or already fixed`);
  }
}

console.log('Done!');