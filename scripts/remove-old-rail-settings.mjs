import { readFileSync, writeFileSync } from "node:fs";

const locales = ['ar','de','es','fa','fr','hi','ja','ru','ur','zh', 'en'];
for (const lang of locales) {
  const p = `src/lib/locales/${lang}.json`;
  const data = JSON.parse(readFileSync(p, 'utf8'));
  if (data.rail && data.rail.settings) {
    delete data.rail.settings;
    writeFileSync(p, JSON.stringify(data, null, 2));
    console.log(`Removed rail.settings from ${lang}.json`);
  } else {
    console.log(`No rail.settings in ${lang}.json`);
  }
}
console.log('Done');