const fs = require('fs');
const content = fs.readFileSync('src/components/notes/NotePane.jsx', 'utf8');
const lines = content.split('\n');

// Insert the missing </div> before line 1568 (index 1567)
if (lines[1567].trim() === ') : (') {
    console.log('Inserting missing </div> before ) : (');
    lines.splice(1567, 0, '                      </div>');
    fs.writeFileSync('src/components/notes/NotePane.jsx', lines.join('\n'));
    console.log('Fixed!');
} else {
    console.log('Line 1567:', JSON.stringify(lines[1567]));
}