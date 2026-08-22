const fs = require('fs');
let code = fs.readFileSync('src/utils.ts', 'utf8');

code = code.replace(
  /export function formatTimeRange\([\s\S]*?return \`\$\{startStr\}\$\{endStr \? \` ~ \$\{endStr\}\` : ''\}\`;\n\}/,
  `export function formatTimeRange(startTime: string, endTime?: string, durationHours?: number): string {
  if (!startTime) return '';
  const format12 = (h: number, m: number) => {
    const period = h >= 12 && h < 24 ? '오후' : '오전';
    const hour12 = h % 12 || 12;
    return m > 0 ? \`\$\{period\} \$\{Math.floor(hour12)\}:\$\{m.toString().padStart(2, '0')\}\` : \`\$\{period\} \$\{Math.floor(hour12)\}시\`;
  };
  
  const startObj = parseTimeTo24(startTime);
  const startStr = format12(startObj.hour, startObj.minute);
  
  let endStr = '';
  if (endTime) {
    const endObj = parseTimeTo24(endTime);
    endStr = format12(endObj.hour, endObj.minute);
  } else if (durationHours) {
    const totalMins = startObj.hour * 60 + startObj.minute + Math.round(durationHours * 60);
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    endStr = format12(endH, endM);
  }
  
  return \`\$\{startStr\}\$\{endStr ? \` ~ \$\{endStr\}\` : ''\}\`;
}`
);

fs.writeFileSync('src/utils.ts', code);
