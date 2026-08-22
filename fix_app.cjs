const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Tab Content \*\/\}[\s\S]*?<\/main>/;

const newBlock = `{/* Tab Content */}
        <div className="pb-24 sm:pb-0">
          {activeTab === 'summary' && <SummaryTab data={data} fetchLogs={fetchLogsByDateRange} />}
          {activeTab === 'calendar' && <CalendarTab data={data} fetchLogs={fetchLogsByDateRange} />}
          {activeTab === 'detailed' && <DetailedStatsTab data={data} fetchLogs={fetchLogsByDateRange} />}
          {activeTab === 'recommend' && <RecommendTab />}
        </div>
      </main>`;

code = code.replace(regex, newBlock);
fs.writeFileSync('src/App.tsx', code);
