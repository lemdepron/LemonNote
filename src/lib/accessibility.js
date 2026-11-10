/**
 * Accessibility checks for notes.
 * Pure functions - no React, no DOM dependencies.
 * Can be run in Node.js for testing.
 */

/**
 * Check for images without alt text.
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of issues with line numbers
 */
export function checkImagesWithoutAlt(markdown) {
  const issues = [];
  const lines = markdown.split('\n');
  
  // Match ![alt](url) or ![](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  lines.forEach((line, lineIndex) => {
    let match;
    const lineRegex = new RegExp(imageRegex.source, 'g');
    while ((match = lineRegex.exec(line)) !== null) {
      const alt = match[1].trim();
      if (!alt) {
        issues.push({
          type: 'missing-alt',
          severity: 'error',
          message: 'Image is missing alt text',
          line: lineIndex + 1,
          column: match.index + 1,
          snippet: line.trim().slice(0, 80)
        });
      }
    }
  });
  
  return issues;
}

/**
 * Check for skipped heading levels (e.g., h1 -> h3).
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of issues with line numbers
 */
export function checkSkippedHeadings(markdown) {
  const issues = [];
  const lines = markdown.split('\n');
  let lastLevel = 0;
  
  lines.forEach((line, lineIndex) => {
    const headingMatch = line.match(/^(#{1,6})\s+/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push({
          type: 'skipped-heading',
          severity: 'warning',
          message: `Heading level skipped: h${lastLevel} to h${level}`,
          line: lineIndex + 1,
          column: 1,
          snippet: line.trim().slice(0, 80)
        });
      }
      lastLevel = level;
    }
  });
  
  return issues;
}

/**
 * Check for weak link text (click here, bare URLs, etc.).
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of issues with line numbers
 */
export function checkWeakLinks(markdown) {
  const issues = [];
  const lines = markdown.split('\n');
  
  // Weak link text patterns
  const weakPatterns = [
    { pattern: /click here/i, message: 'Link text "click here" is not descriptive' },
    { pattern: /read more/i, message: 'Link text "read more" is not descriptive' },
    { pattern: /here/i, message: 'Link text "here" is not descriptive' },
    { pattern: /^https?:\/\//i, message: 'Bare URL used as link text' },
    { pattern: /^www\./i, message: 'Bare URL used as link text' },
  ];
  
  // Match [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  lines.forEach((line, lineIndex) => {
    let match;
    const lineRegex = new RegExp(linkRegex.source, 'g');
    while ((match = lineRegex.exec(line)) !== null) {
      const text = match[1].trim();
      const url = match[2].trim();
      
      // Check if link text is a bare URL
      if (/^https?:\/\//.test(text) || /^www\./.test(text)) {
        issues.push({
          type: 'weak-link',
          severity: 'warning',
          message: 'Bare URL used as link text',
          line: lineIndex + 1,
          column: match.index + 1,
          snippet: line.trim().slice(0, 80)
        });
      } else {
        // Check for weak phrases
        for (const { pattern, message } of weakPatterns) {
          if (pattern.test(text)) {
            issues.push({
              type: 'weak-link',
              severity: 'warning',
              message,
              line: lineIndex + 1,
              column: match.index + 1,
              snippet: line.trim().slice(0, 80)
            });
            break;
          }
        }
      }
    }
  });
  
  return issues;
}

/**
 * Check for low color contrast in colored text.
 * Uses relative luminance calculation per WCAG.
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of issues with line numbers
 */
export function checkColorContrast(markdown) {
  const issues = [];
  const lines = markdown.split('\n');
  
  // Match <span data-c="color">text</span> or <mark data-h="color">text</mark>
  const colorSpanRegex = /<span[^>]*data-c=["']([^"']+)["'][^>]*>([^<]+)<\/span>/gi;
  const markRegex = /<mark[^>]*data-h=["']([^"']+)["'][^>]*>([^<]+)<\/mark>/gi;
  const colorSpanRegexStr = colorSpanRegex.source;
  const markRegexStr = markRegex.source;
  
  // Color luminance values (approximate for our color palette)
  const colorLuminance = {
    'red': 0.2126,
    'orange': 0.4,
    'amber': 0.55,
    'yellow': 0.93,
    'lime': 0.65,
    'green': 0.35,
    'teal': 0.3,
    'cyan': 0.55,
    'blue': 0.15,
    'indigo': 0.1,
    'violet': 0.2,
    'pink': 0.35,
    'rose': 0.25,
    'gray': 0.5,
    'black': 0,
    'white': 1,
  };
  
  // Check contrast ratio (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
  function getContrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  // Background luminance (approximate - light mode = ~1, dark mode = ~0.1)
  // We'll check against both and flag if either fails
  const lightBg = 1;
  const darkBg = 0.1;
  
  lines.forEach((line, lineIndex) => {
    let match;
    
    // Check span colors
    const spanRegex = new RegExp(colorSpanRegexStr, 'gi');
    while ((match = spanRegex.exec(line)) !== null) {
      const colorId = match[1].toLowerCase();
      const text = match[2];
      const lum = colorLuminance[colorId];
      
      if (lum !== undefined && text.trim()) {
        const contrastLight = getContrastRatio(lum, lightBg);
        const contrastDark = getContrastRatio(lum, darkBg);
        
        // Flag if fails on EITHER light or dark background (users can switch themes)
        if (contrastLight < 4.5 || contrastDark < 4.5) {
          issues.push({
            type: 'low-contrast',
            severity: 'warning',
            message: `Low contrast: "${colorId}" text on both light and dark backgrounds (ratio ${Math.min(contrastLight, contrastDark).toFixed(2)}:1)`,
            line: lineIndex + 1,
            column: match.index + 1,
            snippet: line.trim().slice(0, 80)
          });
        }
      }
    }
    
    // Check mark (highlight) colors
    const markRegexLocal = new RegExp(markRegexStr, 'gi');
    while ((match = markRegexLocal.exec(line)) !== null) {
      const colorId = match[1].toLowerCase();
      const text = match[2];
      const lum = colorLuminance[colorId];
      
      if (lum !== undefined && text.trim()) {
        const contrastLight = getContrastRatio(lum, lightBg);
        const contrastDark = getContrastRatio(lum, darkBg);
        
        // Flag if fails on EITHER light or dark background
        if (contrastLight < 4.5 || contrastDark < 4.5) {
          issues.push({
            type: 'low-contrast',
            severity: 'warning',
            message: `Low contrast: highlighted "${colorId}" text (ratio ${Math.min(contrastLight, contrastDark).toFixed(2)}:1)`,
            line: lineIndex + 1,
            column: match.index + 1,
            snippet: line.trim().slice(0, 80)
          });
        }
      }
    }
  });
  
  return issues;
}

/**
 * Run all accessibility checks on markdown content.
 * @param {string} markdown - The markdown content
 * @returns {Array} All issues sorted by line number
 */
export function runAccessibilityChecks(markdown) {
  const allIssues = [
    ...checkImagesWithoutAlt(markdown),
    ...checkSkippedHeadings(markdown),
    ...checkWeakLinks(markdown),
    ...checkColorContrast(markdown),
  ];
  
  // Sort by line number, then column
  return allIssues.sort((a, b) => a.line - b.line || a.column - b.column);
}