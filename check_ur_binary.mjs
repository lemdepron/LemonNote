import fs from 'fs';
const buffer = fs.readFileSync('src/lib/locales/ur.json');
let invalid = false;
for (let i = 0; i < buffer.length; i++) {
  const byte = buffer[i];
  if (byte > 127) {
    if (byte >= 0x80 && byte <= 0xBF) {
      if (i === 0 || buffer[i-1] < 0xC0 || buffer[i-1] > 0xF7) {
        console.log(`Invalid UTF-8 at position ${i}: ${byte.toString(16)}`);
        invalid = true;
      }
    } else if (byte >= 0xC0 && byte <= 0xF7) {
      const expectedContinuation = byte >= 0xF0 ? 3 : (byte >= 0xE0 ? 2 : 1);
      if (i + expectedContinuation >= buffer.length) {
        console.log(`Incomplete UTF-8 sequence at position ${i}`);
        invalid = true;
      } else {
        for (let j = 1; j <= expectedContinuation; j++) {
          if (buffer[i + j] < 0x80 || buffer[i + j] > 0xBF) {
            console.log(`Invalid continuation byte at position ${i + j}: ${buffer[i + j].toString(16)}`);
            invalid = true;
          }
        }
      }
    }
  }
  if (!invalid) {
    console.log('No invalid UTF-8 found');
  }
}