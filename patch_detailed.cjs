const fs = require('fs');

let code = fs.readFileSync('src/components/tabs/DetailedStatsTab.tsx', 'utf8');

if (!code.includes('export function DetailedStatsTab({ data, fetchLogs, isActive }: DetailedStatsTabProps)')) {
  code = code.replace(
    /interface DetailedStatsTabProps \{\n  data: AppData;\n  fetchLogs\?: \(startDate: string, endDate: string\) => Promise<void>;\n\}/,
    `interface DetailedStatsTabProps {
  data: AppData;
  fetchLogs?: (startDate: string, endDate: string) => Promise<void>;
  isActive?: boolean;
}`
  );
  
  code = code.replace(
    /export function DetailedStatsTab\(\{ data, fetchLogs \}: DetailedStatsTabProps\) \{/,
    `export function DetailedStatsTab({ data, fetchLogs, isActive = true }: DetailedStatsTabProps) {`
  );
}

// Ensure responsive container conditionally renders based on isActive
code = code.replace(
  /<ResponsiveContainer width="100%" height="100%" minWidth=\{0\} minHeight=\{0\}>/g,
  `{isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>`
);
code = code.replace(
  /<\/ResponsiveContainer>/g,
  `</ResponsiveContainer>)}`
);

fs.writeFileSync('src/components/tabs/DetailedStatsTab.tsx', code);
