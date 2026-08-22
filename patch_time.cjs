const fs = require('fs');
let code = fs.readFileSync('src/utils.ts', 'utf8');

// 1. Rewrite parseTimeTo24
const parseTimeTo24_regex = /export function parseTimeTo24[\s\S]*?return \{ hour, minute \};\n\}/;
const parseTimeTo24_new = `export function parseTimeTo24(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 0, minute: 0 };
  
  const parts = timeStr.trim().split(' ');
  const time = parts[0];
  const period = parts.length > 1 ? parts[1].toUpperCase() : null;
  
  let [hour, minute] = time.split(':').map(Number);
  if (isNaN(hour)) hour = 0;
  if (isNaN(minute)) minute = 0;
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return { hour, minute };
}`;
code = code.replace(parseTimeTo24_regex, parseTimeTo24_new);

// 2. Rewrite parseTimeString
const parseTimeString_regex = /export function parseTimeString[\s\S]*?return hours;\n\}/;
const parseTimeString_new = `export function parseTimeString(timeStr: string): number {
  return parseTimeTo24(timeStr).hour;
}`;
code = code.replace(parseTimeString_regex, parseTimeString_new);

fs.writeFileSync('src/utils.ts', code);
