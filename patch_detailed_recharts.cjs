const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/DetailedStatsTab.tsx', 'utf8');

code = code.replace(/minWidth=\{0\} minHeight=\{0\}/g, `minWidth={1} minHeight={1}`);

fs.writeFileSync('src/components/tabs/DetailedStatsTab.tsx', code);
