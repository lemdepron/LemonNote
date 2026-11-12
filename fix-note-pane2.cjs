const fs = require('fs');
const content = fs.readFileSync('src/components/notes/NotePane.jsx', 'utf8');
const lines = content.split('\n');

// The structure should be:
// Line 1567:                           </div>  (closes preview pane div)
// Line 1568:                     </div>      (closes flex gap-10 div)
// Line 1569:                   ) : (          (end of mode === "split" ternary)

if (lines[1567].trim() === '</div>' && lines[1568].trim() === ') : (') {
    console.log('Missing </div> before ) : (, inserting it');
    lines.splice(1568, 0, '                      </div>');
    fs.writeFileSync('src/components/notes/NotePane.jsx', lines.join('\n'));
    console.log('Fixed!');
} else {
    console.log('Line 1567:', JSON.stringify(lines[1567]));
    console.log('Line 1568:', JSON.stringify(lines[1568]));
    console.log('Line 1569:', JSON.stringify(lines[1569]));
}