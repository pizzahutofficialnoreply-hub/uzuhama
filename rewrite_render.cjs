const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/DetailedStatsTab.tmp.tsx', 'utf8');

// I will extract everything from return ( to the end of the file, and replace it.
const match = code.match(/return \([\s\S]*?\);\n}/);

const customTooltipCode = `
const TrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 text-sm">
        <p className="font-bold text-zinc-900 dark:text-white mb-1">{label} 주간</p>
        <p className="text-purple-600 dark:text-purple-400 font-medium">방송 횟수: {payload[0].value}회</p>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">방송일: {payload[0].payload.datesDesc}</p>
      </div>
    );
  }
  return null;
};
`;

const newRender = `return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">상세 분석</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-sm w-full sm:w-auto">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-zinc-400 hidden sm:inline">~</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button onClick={handleFilter} className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors mt-2 sm:mt-0">
            조회
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar">
        <button
          onClick={() => setActiveSubTab('trend')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
            activeSubTab === 'trend' ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          )}
        >
          방송 추이 및 시간대
        </button>
        <button
          onClick={() => setActiveSubTab('day')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
            activeSubTab === 'day' ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          )}
        >
          요일별 분석
        </button>
      </div>

      {activeSubTab === 'trend' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold mb-4">주간 방송 횟수 추이</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="week" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} animationDuration={1200} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <h4 className="font-bold mb-4">시작 시간대별 그래프</h4>
              <div className="h-[250px] w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.timeStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                    <XAxis dataKey="label" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => \`\${val}%\`} />
                    <Tooltip cursor={{ fill: '#a1a1aa', opacity: 0.1 }} content={<CustomTooltip formatter={(value: number) => [\`\${value.toFixed(1)}%\`, '비율']} />} />
                    <Bar dataKey="probability" radius={[4, 4, 0, 0]} fill="#3b82f6" animationDuration={1200} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 font-semibold border-y border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">순위</th>
                      <th className="px-4 py-3">시간대</th>
                      <th className="px-4 py-3 text-right">방송 횟수</th>
                      <th className="px-4 py-3 text-right">확률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {[...stats.timeStatsArray].sort((a, b) => b.probability - a.probability).slice(0, 5).map((stat, i) => (
                      <tr key={stat.time} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{stat.label}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.count}회</td>
                        <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                          {stat.probability.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <h4 className="font-bold mb-4">1회당 방송 진행 시간(길이) 비율</h4>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50 dark:bg-black/40 text-zinc-500 dark:text-zinc-400 font-semibold border-y border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">방송 진행 시간</th>
                      <th className="px-4 py-3 text-right">횟수</th>
                      <th className="px-4 py-3 text-right">비율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {stats.durationStatsArray.map((stat) => (
                      <tr key={stat.label} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{stat.label}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.count}회</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{stat.probability.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h4 className="font-bold mb-4">요일별 방송 빈도 그래프</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="day" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(val) => \`\${val}%\`} />
                  <Tooltip cursor={{ fill: '#a1a1aa', opacity: 0.1 }} content={<CustomTooltip formatter={(value: number) => [\`\${value.toFixed(1)}%\`, '비율']} />} />
                  <ReferenceLine y={stats.avgDaily} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: \`평균(\${stats.avgDaily.toFixed(1)}%)\`, fill: '#f43f5e', fontSize: 10 }} />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out">
                    {stats.dailyStatsArray.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.probability > stats.avgDaily * 1.2 ? '#a855f7' : entry.probability < stats.avgDaily * 0.8 ? '#ef4444' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h4 className="font-bold mb-4">요일별 방송 확률 표</h4>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 font-semibold border-y border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">요일</th>
                    <th className="px-4 py-3 text-right">방송 횟수</th>
                    <th className="px-4 py-3 text-right">확률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.dailyStatsArray.map((stat) => (
                    <tr key={stat.day} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{stat.day}요일</td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.count}회</td>
                      <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                        {stat.probability.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

code = code.replace(/return \([\s\S]*?\);\n}/, newRender);

const finalCode = customTooltipCode + '\n' + code;

fs.writeFileSync('src/components/tabs/DetailedStatsTab.tsx', finalCode);
