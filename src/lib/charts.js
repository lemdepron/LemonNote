/**
 * Pure SVG chart renderer for bar, line, and pie charts.
 * No external dependencies - uses CSS variables for theming.
 */

const CHART_WIDTH = 480;
const CHART_HEIGHT = 300;
const MARGIN = { top: 30, right: 20, bottom: 50, left: 60 };
const INNER_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

/** Escape HTML for safe attribute values */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

/** Parse table data (array of arrays) into chart data */
function parseTableData(tableData, config) {
  if (!tableData || !tableData.length) return null;

  const headers = tableData[0];
  const rows = tableData.slice(1);

  // Determine which columns to use
  // Default: first column = labels, second column = values
  const labelCol = config.labelColumn ?? 0;
  const valueCol = config.valueColumn ?? 1;

  const labels = [];
  const values = [];

  for (const row of rows) {
    const label = row[labelCol];
    const value = parseFloat(row[valueCol]);
    if (label !== undefined && !isNaN(value)) {
      labels.push(String(label));
      values.push(value);
    }
  }

  if (!labels.length) return null;

  return { labels, values };
}

/** Render a bar chart */
function renderBarChart(config, tableData) {
  const parsed = parseTableData(tableData, config);
  if (!parsed) return '<div class="chart-error">No valid data for bar chart</div>';

  const { labels, values } = parsed;
  const maxValue = Math.max(...values);
  const barWidth = Math.max(20, INNER_WIDTH / labels.length - 10);
  const gap = (INNER_WIDTH - barWidth * labels.length) / (labels.length + 1);

  const bars = labels.map((label, i) => {
    const value = values[i];
    const height = (value / maxValue) * INNER_HEIGHT;
    const x = MARGIN.left + gap + i * (barWidth + gap);
    const y = CHART_HEIGHT - MARGIN.bottom - height;

    return `
      <g class="chart-bar" data-label="${escapeHtml(label)}" data-value="${value}">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${height}"
              fill="var(--chart-bar, hsl(var(--primary)))" rx="3" />
        <text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle"
              font-size="11" fill="var(--chart-text, hsl(var(--foreground)))"
              font-family="var(--font-mono)">${escapeHtml(String(value))}</text>
        <text x="${x + barWidth / 2}" y="${CHART_HEIGHT - MARGIN.bottom + 18}" text-anchor="middle"
              font-size="10" fill="var(--chart-axis, hsl(var(--muted-foreground)))"
              font-family="var(--font-body)">${escapeHtml(label)}</text>
      </g>
    `;
  }).join('');

  const yAxisLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const y = CHART_HEIGHT - MARGIN.bottom - frac * INNER_HEIGHT;
    const val = (maxValue * frac).toFixed(frac === 0 ? 0 : 1);
    return `
      <line x1="${MARGIN.left}" y1="${y}" x2="${CHART_WIDTH - MARGIN.right}" y2="${y}"
            stroke="var(--chart-grid, hsl(var(--border) / 0.3))" stroke-width="0.5" stroke-dasharray="4,4" />
      <text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end"
            font-size="10" fill="var(--chart-axis, hsl(var(--muted-foreground)))"
            font-family="var(--font-mono)">${val}</text>
    `;
  }).join('');

  const title = config.title ? `<text x="${CHART_WIDTH / 2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="var(--chart-title, hsl(var(--foreground)))" font-family="var(--font-heading)">${escapeHtml(config.title)}</text>` : '';

  return `
    <svg width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}"
         class="chart-svg" role="img" aria-label="${escapeHtml(config.title || 'Bar chart')}">
      <style>
        .chart-svg { font-family: var(--font-body, system-ui); }
        .chart-bar:hover rect { opacity: 0.8; filter: brightness(1.1); }
      </style>
      ${title}
      ${yAxisLines}
      ${bars}
      <line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${CHART_HEIGHT - MARGIN.bottom}"
            stroke="var(--chart-axis, hsl(var(--muted-foreground)))" stroke-width="1" />
      <line x1="${MARGIN.left}" y1="${CHART_HEIGHT - MARGIN.bottom}" x2="${CHART_WIDTH - MARGIN.right}" y2="${CHART_HEIGHT - MARGIN.bottom}"
            stroke="var(--chart-axis, hsl(var(--muted-foreground)))" stroke-width="1" />
    </svg>
  `;
}

/** Render a line chart */
function renderLineChart(config, tableData) {
  const parsed = parseTableData(tableData, config);
  if (!parsed) return '<div class="chart-error">No valid data for line chart</div>';

  const { labels, values } = parsed;
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = values.map((value, i) => {
    const x = MARGIN.left + (i / (values.length - 1 || 1)) * INNER_WIDTH;
    const y = CHART_HEIGHT - MARGIN.bottom - ((value - minValue) / range) * INNER_HEIGHT;
    return { x, y, value, label: labels[i] };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const dots = points.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="4"
            fill="var(--chart-line, hsl(var(--primary)))" stroke="var(--chart-bg, hsl(var(--background)))" stroke-width="2"
            class="chart-dot" data-label="${escapeHtml(p.label)}" data-value="${p.value}" />
  `).join('');

  const yAxisLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const y = CHART_HEIGHT - MARGIN.bottom - frac * INNER_HEIGHT;
    const val = (minValue + range * frac).toFixed(frac === 0 || frac === 1 ? 0 : 1);
    return `
      <line x1="${MARGIN.left}" y1="${y}" x2="${CHART_WIDTH - MARGIN.right}" y2="${y}"
            stroke="var(--chart-grid, hsl(var(--border) / 0.3))" stroke-width="0.5" stroke-dasharray="4,4" />
      <text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end"
            font-size="10" fill="var(--chart-axis, hsl(var(--muted-foreground)))"
            font-family="var(--font-mono)">${val}</text>
    `;
  }).join('');

  const xLabels = points.map(p => `
    <text x="${p.x}" y="${CHART_HEIGHT - MARGIN.bottom + 18}" text-anchor="middle"
          font-size="10" fill="var(--chart-axis, hsl(var(--muted-foreground)))"
          font-family="var(--font-body)">${escapeHtml(p.label)}</text>
  `).join('');

  const title = config.title ? `<text x="${CHART_WIDTH / 2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="var(--chart-title, hsl(var(--foreground)))" font-family="var(--font-heading)">${escapeHtml(config.title)}</text>` : '';

  return `
    <svg width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}"
         class="chart-svg" role="img" aria-label="${escapeHtml(config.title || 'Line chart')}">
      <style>
        .chart-svg { font-family: var(--font-body, system-ui); }
        .chart-dot:hover { r: 6; filter: brightness(1.1); }
      </style>
      ${title}
      ${yAxisLines}
      ${xLabels}
      <path d="${pathData}" fill="none" stroke="var(--chart-line, hsl(var(--primary)))" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      <line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${CHART_HEIGHT - MARGIN.bottom}"
            stroke="var(--chart-axis, hsl(var(--muted-foreground)))" stroke-width="1" />
      <line x1="${MARGIN.left}" y1="${CHART_HEIGHT - MARGIN.bottom}" x2="${CHART_WIDTH - MARGIN.right}" y2="${CHART_HEIGHT - MARGIN.bottom}"
            stroke="var(--chart-axis, hsl(var(--muted-foreground)))" stroke-width="1" />
    </svg>
  `;
}

/** Render a pie chart */
function renderPieChart(config, tableData) {
  const parsed = parseTableData(tableData, config);
  if (!parsed) return '<div class="chart-error">No valid data for pie chart</div>';

  const { labels, values } = parsed;
  const total = values.reduce((a, b) => a + b, 0);
  const radius = Math.min(INNER_WIDTH, INNER_HEIGHT) / 2 - 10;
  const centerX = CHART_WIDTH / 2;
  const centerY = (MARGIN.top + CHART_HEIGHT - MARGIN.bottom) / 2;

  const colors = [
    'var(--chart-1, hsl(var(--chart-1)))',
    'var(--chart-2, hsl(var(--chart-2)))',
    'var(--chart-3, hsl(var(--chart-3)))',
    'var(--chart-4, hsl(var(--chart-4)))',
    'var(--chart-5, hsl(var(--chart-5)))',
    'var(--chart-6, hsl(24 70% 38%))',
    'var(--chart-7, hsl(188 70% 26%))',
    'var(--chart-8, hsl(276 42% 44%))',
  ];

  let currentAngle = -90; // Start at top
  const slices = values.map((value, i) => {
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const labelAngle = startAngle + angle / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelX = centerX + (radius * 0.7) * Math.cos(labelRad);
    const labelY = centerY + (radius * 0.7) * Math.sin(labelRad);

    const percent = ((value / total) * 100).toFixed(1);

    const slice = `
      <g class="chart-slice" data-label="${escapeHtml(labels[i])}" data-value="${value}" data-percent="${percent}">
        <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
              fill="${colors[i % colors.length]}" stroke="var(--chart-bg, hsl(var(--background)))" stroke-width="2" />
        <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle"
              font-size="11" font-weight="600" fill="white" font-family="var(--font-mono)"
              pointer-events="none">${percent}%</text>
      </g>
    `;
    return slice;
  }).join('');

  // Legend
  const legendItems = labels.map((label, i) => `
    <g class="chart-legend-item" transform="translate(0, ${i * 20})" style="cursor: pointer;">
      <rect x="${CHART_WIDTH - MARGIN.right - 120}" y="${centerY - radius - 10 + i * 20}" width="12" height="12"
            fill="${colors[i % colors.length]}" rx="2" />
      <text x="${CHART_WIDTH - MARGIN.right - 128}" y="${centerY - radius - 10 + i * 20 + 9}"
            text-anchor="end" font-size="11" fill="var(--chart-text, hsl(var(--foreground)))" font-family="var(--font-body)">
        ${escapeHtml(label)} (${((values[i] / total) * 100).toFixed(1)}%)
      </text>
    </g>
  `).join('');

  const title = config.title ? `<text x="${CHART_WIDTH / 2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="var(--chart-title, hsl(var(--foreground)))" font-family="var(--font-heading)">${escapeHtml(config.title)}</text>` : '';

  return `
    <svg width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}"
         class="chart-svg" role="img" aria-label="${escapeHtml(config.title || 'Pie chart')}">
      <style>
        .chart-svg { font-family: var(--font-body, system-ui); }
        .chart-slice:hover path { filter: brightness(1.1); }
      </style>
      ${title}
      <g transform="translate(0, 0)">
        ${slices}
      </g>
      ${legendItems}
    </svg>
  `;
}

/**
 * Main chart renderer.
 * @param {Object} config - Chart config { type: 'bar'|'line'|'pie', table: number, title?: string, labelColumn?: number, valueColumn?: number }
 * @param {Array} tables - Array of table data (each table is array of arrays)
 * @returns {string} HTML string with SVG chart
 */
export function renderChart(config, tables) {
  if (!config || !config.type) {
    return '<div class="chart-error">Invalid chart config: missing type</div>';
  }

  const tableIndex = config.table ?? 0;
  const tableData = tables?.[tableIndex];

  if (!tableData) {
    return `<div class="chart-error">Table index ${tableIndex} not found (note has ${tables?.length || 0} tables)</div>`;
  }

  switch (config.type) {
    case 'bar':
      return renderBarChart(config, tableData);
    case 'line':
      return renderLineChart(config, tableData);
    case 'pie':
      return renderPieChart(config, tableData);
    default:
      return `<div class="chart-error">Unknown chart type: ${escapeHtml(config.type)}</div>`;
  }
}