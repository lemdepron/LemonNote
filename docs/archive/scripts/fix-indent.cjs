const fs = require('fs');

function fixIndentation(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Fix line 452 (index 451) - missing indentation
  if (lines[451].trim() === '"precision": "Precision"') {
    lines[451] = '      "precision": "Precision"';
    console.log('Fixed indentation at line 452');
  }
  
  // Fix line 338 (index 337) - missing indentation for strokeOpacity
  if (lines[337].trim() === '"strokeOpacity": "opacity"') {
    lines[337] = '      "strokeOpacity": "opacity"';
    console.log('Fixed indentation at line 338');
  }
  
  // Fix line 354 (index 353) - color object last property
  if (lines[353].trim() === '"opacity": "opacity"') {
    lines[353] = '      "opacity": "opacity"';
    console.log('Fixed indentation at line 354');
  }
  
  // Fix line 376 (index 375) - select object last property
  if (lines[375].trim() === '"selectObjectFirst": "Select an object with the Select tool first"') {
    lines[375] = '      "selectObjectFirst": "Select an object with the Select tool first"';
    console.log('Fixed indentation at line 376');
  }
  
  // Fix line 391 (index 390) - paper object last property
  if (lines[390].trim() === '"clearPageHint": "Remove every mark on this page"') {
    lines[390] = '      "clearPageHint": "Remove every mark on this page"';
    console.log('Fixed indentation at line 391');
  }
  
  // Fix line 401 (index 400) - smart object last property
  if (lines[400].trim() === '"resultsSearchHint": "Recognised text, insert it on the page, search all handwriting"') {
    lines[400] = '      "resultsSearchHint": "Recognised text, insert it on the page, search all handwriting"';
    console.log('Fixed indentation at line 401');
  }
  
  // Fix line 420 (index 419) - audio object last property
  if (lines[419].trim() === '"recordFirst": "Record some audio first"') {
    lines[419] = '      "recordFirst": "Record some audio first"';
    console.log('Fixed indentation at line 420');
  }
  
  // Fix line 448 (index 447) - tab object last property
  if (lines[447].trim() === '"removeInkHint": "Delete all handwriting in this note"') {
    lines[447] = '      "removeInkHint": "Delete all handwriting in this note"';
    console.log('Fixed indentation at line 448');
  }
  
  // Fix line 452 (index 451) - eraserModes last property
  if (lines[451].trim() === '"precision": "Precision"') {
    lines[451] = '      "precision": "Precision"';
    console.log('Fixed indentation at line 452');
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed indentation in:', filePath);
}

fixIndentation('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\en.json');
fixIndentation('C:\\Users\\halaf\\projects\\LemonNote\\src\\lib\\locales\\ar.json');
console.log('Done!');