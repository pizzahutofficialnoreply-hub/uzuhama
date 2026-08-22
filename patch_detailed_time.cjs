const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/DetailedStatsTab.tsx', 'utf8');

const oldTimeMap = /const timeMap: Record<string, number> = \{\};/;
const newTimeMap = `const timeMap: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      timeMap[\`\$\{i\}:00\`] = 0;
    }`;

code = code.replace(oldTimeMap, newTimeMap);

fs.writeFileSync('src/components/tabs/DetailedStatsTab.tsx', code);
