const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldTabs = /<div className=\{activeTab === 'detailed' \? 'block' : 'hidden'\}><DetailedStatsTab data=\{data\} fetchLogs=\{fetchLogsByDateRange\} \/><\/div>/;
const newTabs = `<div className={activeTab === 'detailed' ? 'block' : 'hidden'}><DetailedStatsTab data={data} fetchLogs={fetchLogsByDateRange} isActive={activeTab === 'detailed'} /></div>`;

code = code.replace(oldTabs, newTabs);

fs.writeFileSync('src/App.tsx', code);
