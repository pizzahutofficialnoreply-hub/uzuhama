const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/SummaryTab.tsx', 'utf8');

if (!code.includes('isActive?: boolean')) {
  code = code.replace(
    /interface SummaryTabProps \{\n  data: AppData;\n  fetchLogs\?: \(startDate: string, endDate: string\) => Promise<void>;\n\}/,
    `interface SummaryTabProps {
  data: AppData;
  fetchLogs?: (startDate: string, endDate: string) => Promise<void>;
  isActive?: boolean;
}`
  );
  code = code.replace(
    /export function SummaryTab\(\{ data \}: SummaryTabProps\) \{/,
    `export function SummaryTab({ data, isActive = true }: SummaryTabProps) {`
  );
  code = code.replace(
    /export function SummaryTab\(\{ data, fetchLogs \}: SummaryTabProps\) \{/,
    `export function SummaryTab({ data, fetchLogs, isActive = true }: SummaryTabProps) {`
  );
}

code = code.replace(
  /<ResponsiveContainer width="100%" height="100%">/g,
  `{isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>`
);
code = code.replace(
  /<\/ResponsiveContainer>/g,
  `</ResponsiveContainer>)}`
);

fs.writeFileSync('src/components/tabs/SummaryTab.tsx', code);
