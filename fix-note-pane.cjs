const fs = require('fs');
const content = fs.readFileSync('src/components/notes/NotePane.jsx', 'utf8');
const lines = content.split('\n');

// Find and remove the extra </div> at line 1568 (0-indexed: 1567)
// The pattern is: line 1567 (index 1566) has "                          </div>"
// Line 1568 (index 1567) has "                      </div>" (extra)
// Line 1569 (index 1568) has "                    ) : ("

if (lines[1567].trim() === '</div>' && lines[1566].trim() === '</div>') {
    console.log('Found extra </div> at line 1568, removing it');
    lines.splice(1567, 1);
    fs.writeFileSync('src/components/notes/NotePane.jsx', lines.join('\n'));
    console.log('Fixed!');
} else {
    console.log('Line 1566:', JSON.stringify(lines[1566]));
    console.log('Line 1567:', JSON.stringify(lines[1567]));
    console.log('Line 1568:', JSON.stringify(lines[1568]));
    console.log('Line 1569:', JSON.stringify(lines[1569]));
}