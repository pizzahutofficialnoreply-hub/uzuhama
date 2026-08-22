const fs = require('fs');

// 1. Fix utils.ts to return the correct types expected by the rest of the app
let utilsCode = fs.readFileSync('src/utils.ts', 'utf8');

// Fix parseTimeString to return number
utilsCode = utilsCode.replace(
  /export function parseTimeString\(timeStr: string\): string \{[\s\S]*?return Math\.floor\(hours\)\.toString\(\);\n\}/,
  `export function parseTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  
  const [time, period] = timeStr.split(' ');
  if (!time || !period) return 0;
  
  let [hours] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours;
}`
);

// Fix parseTimeTo24 to return {hour, minute}
utilsCode = utilsCode.replace(
  /export function parseTimeTo24\(timeStr: string\): number \{[\s\S]*?return hours \+ \(minutes \/ 60\);\n\}/,
  `export function parseTimeTo24(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 0, minute: 0 };
  
  const [time, period] = timeStr.split(' ');
  if (!time || !period) return { hour: 0, minute: 0 };
  
  let [hour, minute] = time.split(':').map(Number);
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return { hour, minute };
}`
);

// Fix formatTo12Hour to accept string
utilsCode = utilsCode.replace(
  /export function formatTo12Hour\(hours24: number\): string \{[\s\S]*?return \`\$\{period\} \$\{Math\.floor\(hour12\)\}시\`;\n\}/,
  `export function formatTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [time, period] = timeStr.split(' ');
  if (!time || !period) return '';
  
  let [hours, minutes] = time.split(':');
  
  const p = period === 'AM' ? '오전' : '오후';
  if (minutes === '00' || !minutes) {
    return \`\$\{p\} \$\{hours\}시\`;
  }
  return \`\$\{p\} \$\{hours\}:\$\{minutes\}\`;
}`
);

fs.writeFileSync('src/utils.ts', utilsCode);

// 2. Fix CalendarTab.tsx
let calCode = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

// The original was: const tableLogs = logsArray.filter(log => log.date >= tableStartDate && log.date <= tableEndDate);
calCode = calCode.replace(
  /const tableLogs = logsArray\.filter\(log => log\.date >= tableStartDate && log\.date <= tableEndDate\);/,
  `const tableLogs = useMemo(() => {
    let filtered = logsArray.filter(log => {
      if (log.date < appliedStartDate || log.date > appliedEndDate) return false;
      return true;
    });
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(log => {
        if (fuzzyDateMatch(searchTerm, log.date)) return true;
        if (log.game && fuzzyKoreanMatch(searchTerm, log.game)) return true;
        if (log.category && fuzzyKoreanMatch(searchTerm, log.category)) return true;
        if (log.games?.some(g => fuzzyKoreanMatch(searchTerm, g.name) || fuzzyKoreanMatch(searchTerm, g.category))) return true;
        if (log.vods?.some(v => fuzzyKoreanMatch(searchTerm, v.title))) return true;
        if (log.shorts?.some(s => fuzzyKoreanMatch(searchTerm, s.title))) return true;
        if (log.edited?.some(e => fuzzyKoreanMatch(searchTerm, e.title))) return true;
        return false;
      });
    }
    return filtered;
  }, [logsArray, appliedStartDate, appliedEndDate, searchTerm]);`
);

// Also need to import useMemo if it's not imported. Let's check imports.
if (!calCode.includes('useMemo')) {
  calCode = calCode.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, `import React, { useState, useEffect, useRef, useMemo } from 'react';`);
}

fs.writeFileSync('src/components/tabs/CalendarTab.tsx', calCode);

