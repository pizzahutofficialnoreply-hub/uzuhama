const fs = require('fs');
let code = fs.readFileSync('src/utils.ts', 'utf8');

const parseTimeTo24_old = /export function parseTimeTo24\([\s\S]*?return hours \+ \(minutes \/ 60\);\n\}/;
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

code = code.replace(parseTimeTo24_old, parseTimeTo24_new);

const parseTimeString_old = /export function parseTimeString\([\s\S]*?return Math\.floor\(hours\)\.toString\(\);\n\}/;
const parseTimeString_new = `export function parseTimeString(timeStr: string): number {
  return parseTimeTo24(timeStr).hour;
}`;

code = code.replace(parseTimeString_old, parseTimeString_new);

const formatTimeRange_old = /export function formatTimeRange\([\s\S]*?return \`\$\{startStr\}\$\{endStr \? \` ~ \$\{endStr\}\` : ''\}\`;\n\}/;
const formatTimeRange_new = `export function formatTimeRange(startTime: string, endTime?: string, durationHours?: number): string {
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
}`;
code = code.replace(formatTimeRange_old, formatTimeRange_new);

const fuzzyKoreanMatch_old = /export function fuzzyKoreanMatch\([\s\S]*?return false;\n\}/;
const fuzzyKoreanMatch_new = `export function fuzzyKoreanMatch(query: string, target: string) {
  if (!query) return true;
  if (!target) return false;
  
  const normQ = query.replace(/\\s+/g, '').toLowerCase();
  const normT = target.replace(/\\s+/g, '').toLowerCase();
  
  const replaceNumber = (s: string) => s.replace(/1/g, '한').replace(/2/g, '두').replace(/3/g, '세').replace(/4/g, '네');
  const normQNum = replaceNumber(normQ);
  const normTNum = replaceNumber(normT);
  
  const check = (q: string, t: string) => {
    if (t.includes(q)) return true;
    const cT = getChosung(t);
    const cQ = getChosung(q);
    if (cT.includes(cQ)) return true;
    const queryConsonants = Array.from(cQ).filter(c => !isVowel(c));
    if (queryConsonants.length > 0) {
      let qIdx = 0;
      for (let tIdx = 0; tIdx < cT.length; tIdx++) {
        if (cT[tIdx] === queryConsonants[qIdx]) {
          qIdx++;
        }
        if (qIdx === queryConsonants.length) return true;
      }
    }
    return false;
  };
  
  return check(normQ, normT) || check(normQNum, normTNum);
}`;
code = code.replace(fuzzyKoreanMatch_old, fuzzyKoreanMatch_new);

const fuzzyDateMatch_old = /export function fuzzyDateMatch\([\s\S]*?m_d\.includes\(nQuery\);\n\}/;
const fuzzyDateMatch_new = `export function fuzzyDateMatch(query: string, dateStr: string) {
  if (/[a-zA-Z가-힣]/.test(query.replace(/[월일\\s\\/\\.-]/g, ''))) return false;
  
  const normalize = (s: string) => s.replace(/[^0-9]/g, '');
  const nQuery = normalize(query);
  if (!nQuery || nQuery.length > 4) return false;
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const month = parts[1];
  const day = parts[2];
  
  const mmdd = month + day;
  const m_d = parseInt(month, 10).toString() + parseInt(day, 10).toString();
  
  return mmdd.includes(nQuery) || m_d.includes(nQuery);
}`;
code = code.replace(fuzzyDateMatch_old, fuzzyDateMatch_new);

fs.writeFileSync('src/utils.ts', code);
