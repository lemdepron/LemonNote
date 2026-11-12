const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

let currentPath = [];

const ru = JSON.parse(content, (key, value) => {
  if (key === 'vault') {
    currentPath = ['vault'];
  } else if (key === 'code' && currentPath[0] === 'vault') {
    currentPath = ['vault', 'code'];
  } else if (key === 'queries' && currentPath[0] === 'vault') {
    currentPath = ['vault', 'queries'];
  } else if (currentPath[0] === 'vault' && currentPath[1] === 'code') {
    currentPath = ['vault', 'code'];
  } else if (currentPath[0] === 'vault' && currentPath[1] === 'queries') {
    currentPath = ['vault', 'queries'];
  } else if (currentPath[0] === 'vault') {
    // Stay in vault
  } else {
    currentPath = [];
  }
  
  if (key === 'newFile') {
    console.log('Found newFile at path:', [...currentPath, key]);
  }
  
  return value;
});

console.log('vault.code.newFile:', ru.vault?.code?.newFile);