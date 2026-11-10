/**
 * Node.js tests for accessibility checks.
 * Run with: node src/lib/accessibility.test.js
 */

import {
  checkImagesWithoutAlt,
  checkSkippedHeadings,
  checkWeakLinks,
  checkColorContrast,
  runAccessibilityChecks,
} from './accessibility.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected, null, 2)}\nActual: ${JSON.stringify(actual, null, 2)}`);
  }
}

// Test checkImagesWithoutAlt
function testImagesWithoutAlt() {
  const md = `![Alt text](image.png)
![](missing-alt.png)
![Another](image2.jpg)`;
  
  const issues = checkImagesWithoutAlt(md);
  assertEqual(issues.length, 1);
  assertEqual(issues[0].type, 'missing-alt');
  assertEqual(issues[0].line, 2);
  assertEqual(issues[0].severity, 'error');
  console.log('✓ checkImagesWithoutAlt');
}

function testImagesWithoutAltEmpty() {
  const md = `![Alt](img.png)
![Another](img2.jpg)`;
  
  const issues = checkImagesWithoutAlt(md);
  assertEqual(issues.length, 0);
  console.log('✓ checkImagesWithoutAlt (no issues)');
}

// Test checkSkippedHeadings
function testSkippedHeadings() {
  const md = `# Heading 1
## Heading 2
#### Heading 4
### Heading 3`;
  
  const issues = checkSkippedHeadings(md);
  assertEqual(issues.length, 1);
  assertEqual(issues[0].type, 'skipped-heading');
  assertEqual(issues[0].line, 3);
  assertEqual(issues[0].message, 'Heading level skipped: h2 to h4');
  console.log('✓ checkSkippedHeadings');
}

function testSkippedHeadingsOk() {
  const md = `# H1
## H2
### H3
## H2 again`;
  
  const issues = checkSkippedHeadings(md);
  assertEqual(issues.length, 0);
  console.log('✓ checkSkippedHeadings (no issues)');
}

// Test checkWeakLinks
function testWeakLinks() {
  const md = `[click here](https://example.com)
[read more](https://example.com)
[good link](https://example.com)
[https://bare-url.com](https://bare-url.com)
[www.example.com](https://example.com)`;
  
  const issues = checkWeakLinks(md);
  assertEqual(issues.length, 4);
  // Line 1: click here
  assertEqual(issues[0].type, 'weak-link');
  assertEqual(issues[0].line, 1);
  // Line 2: read more
  assertEqual(issues[1].line, 2);
  // Line 4: bare URL
  assertEqual(issues[2].line, 4);
  // Line 5: www URL
  assertEqual(issues[3].line, 5);
  console.log('✓ checkWeakLinks');
}

function testWeakLinksOk() {
  const md = `[Good descriptive link](https://example.com)
[Another good one](https://example.com/page)`;
  
  const issues = checkWeakLinks(md);
  assertEqual(issues.length, 0);
  console.log('✓ checkWeakLinks (no issues)');
}

// Test checkColorContrast
function testColorContrast() {
  // Yellow on white/dark backgrounds fails
  const md = `<span data-c="yellow">Yellow text</span>
<span data-c="blue">Blue text</span>
<mark data-h="yellow">Highlighted yellow</mark>`;
  
  console.log('Test input:', md);
  const issues = checkColorContrast(md);
  console.log('Issues found:', issues);
  assertEqual(issues.length, 3); // yellow, blue, and highlighted yellow all fail on at least one theme
  assertEqual(issues[0].type, 'low-contrast');
  assertEqual(issues[0].line, 1);
  assertEqual(issues[1].line, 2);
  assertEqual(issues[2].line, 3);
  console.log('✓ checkColorContrast');
}

function testColorContrastOk() {
  // Colors that pass on BOTH light and dark: black on light, white on dark
  const md = `<span data-c="black">Black text</span>
<span data-c="white">White text</span>`;
  
  const issues = checkColorContrast(md);
  // Black on light: 1:1 (passes), Black on dark: 1.05:1 (fails)
  // White on light: 1.05:1 (fails), White on dark: 1:1 (passes)
  // So both will have issues
  assertEqual(issues.length, 2);
  console.log('✓ checkColorContrast (expected issues for single-theme colors)');
}

// Test runAccessibilityChecks
function testRunAll() {
  const md = `# Title
## Subtitle
### Deep

![](img.png)

[click here](https://example.com)

<span data-c="yellow">Bad contrast</span>`;
  
  const issues = runAccessibilityChecks(md);
  console.log('All issues:', issues.map(i => `${i.line}: ${i.type} - ${i.message}`));
  assertEqual(issues.length, 3); // missing-alt, weak-link, low-contrast (h1->h2->h3 is not a skip)
  console.log('✓ runAccessibilityChecks');
}

// Run all tests
try {
  testImagesWithoutAlt();
  testImagesWithoutAltEmpty();
  testSkippedHeadings();
  testSkippedHeadingsOk();
  testWeakLinks();
  testWeakLinksOk();
  testColorContrast();
  testColorContrastOk();
  testRunAll();
  
  console.log('\n✅ All tests passed!');
} catch (err) {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
}