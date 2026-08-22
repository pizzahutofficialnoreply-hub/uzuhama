const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/DetailedStatsTab.tsx', 'utf8');

const oldTimeStats = /const timeStatsArray = Object\.keys\(timeMap\)\.map\(time => \{[\s\S]*?\}\)\.sort\(\(a, b\) => parseInt\(a\.time\) - parseInt\(b\.time\)\);/;
const newTimeStats = `const timeStatsArray = Object.keys(timeMap).map(time => {
      const h = parseInt(time);
      return {
        time,
        label: \`\$\{h >= 12 ? '오후' : '오전'\} \$\{h % 12 || 12\}시대\`,
        count: timeMap[time],
        probability: total > 0 ? (timeMap[time] / total) * 100 : 0,
        hour: h
      };
    }).filter(stat => stat.hour >= 12 || stat.count > 0)
      .sort((a, b) => a.hour - b.hour);`;

code = code.replace(oldTimeStats, newTimeStats);
fs.writeFileSync('src/components/tabs/DetailedStatsTab.tsx', code);
