const fs = require('fs');
const content = fs.readFileSync('src/components/notes/NotePane.jsx', 'utf8');
const lines = content.split('\n');

// Find the line with "                          </div>" that closes the preview pane div
// Then the next line should be "                      </div>" to close the flex gap-10
// Then "                    ) : ("

for (let i = 1550; i < 1580; i++) {
    console.log(`Line ${i+1}:`, JSON.stringify(lines[i]));
}