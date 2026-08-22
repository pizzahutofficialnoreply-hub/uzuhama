const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Revert display:none tabs to conditional rendering
code = code.replace(
  /<div className="pb-24 sm:pb-0">[\s\S]*?<\/div>/,
  `<div className="pb-24 sm:pb-0">
          {activeTab === 'summary' && <SummaryTab data={data} fetchLogs={fetchLogsByDateRange} />}
          {activeTab === 'calendar' && <CalendarTab data={data} fetchLogs={fetchLogsByDateRange} />}
          {activeTab === 'detailed' && <DetailedStatsTab data={data} fetchLogs={fetchLogsByDateRange} />}
          {activeTab === 'recommend' && <RecommendTab />}
        </div>`
);

// 2. Enhance blur in header and nav
code = code.replace(
  `bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky`,
  `bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl sticky`
);
code = code.replace(
  `bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t`,
  `bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-t`
);

// 3. Add footer text
code = code.replace(
  `<p className="mt-1 text-xs">데이터는 최신화 시점에 따라 실시간으로 업데이트 및 반영됩니다.</p>`,
  `<p className="mt-1 text-xs">데이터는 최신화 시점에 따라 실시간으로 업데이트 및 반영됩니다.</p>\n        <p className="mt-2 text-[10px] text-zinc-400">※ 본 사이트는 사용자 설정 유지를 위해 브라우저의 로컬 저장소를 일부 사용합니다.</p>`
);

fs.writeFileSync('src/App.tsx', code);
