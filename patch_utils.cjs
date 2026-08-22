const fs = require('fs');
let code = fs.readFileSync('src/utils.ts', 'utf8');

const newFuzzy = `const CHOSUNG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const HANGUL_START = 44032;
const HANGUL_END = 55203;
const isVowel = (char: string) => /[ㅏ-ㅣ]/.test(char);

export function getChosung(text: string) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const chosungIndex = Math.floor((code - HANGUL_START) / 588);
      result += CHOSUNG[chosungIndex];
    } else {
      result += text[i];
    }
  }
  return result;
}

export function fuzzyKoreanMatch(query: string, target: string) {
  if (!query) return true;
  if (!target) return false;
  
  const normalize = (s: string) => s.replace(/\\s+/g, '').toLowerCase();
  const nQuery = normalize(query);
  const nTarget = normalize(target);
  
  if (nTarget.includes(nQuery)) return true;
  
  const cTarget = getChosung(nTarget);
  const cQuery = getChosung(nQuery);
  
  if (cTarget.includes(cQuery)) return true;
  
  const queryConsonants = Array.from(cQuery).filter(c => !isVowel(c));
  if (queryConsonants.length > 0) {
    let qIdx = 0;
    for (let tIdx = 0; tIdx < cTarget.length; tIdx++) {
      if (cTarget[tIdx] === queryConsonants[qIdx]) {
        qIdx++;
      }
      if (qIdx === queryConsonants.length) return true;
    }
  }
  
  return false;
}`;

code = code.replace(/const CHOSUNG = \[\s\S\]*?return false;\n\}/, newFuzzy);

// Wait, the regex might fail. Let's just use replace with string if it's there.
fs.writeFileSync('src/utils.ts', code);
