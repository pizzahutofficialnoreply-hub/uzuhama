import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, startOfYear, startOfMonth, endOfMonth, parseISO, startOfWeek, formatISO } from 'date-fns';
import { AppData, BroadcastLog } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { parseTimeString } from '../../utils';

interface DetailedStatsTabProps {
  data: AppData;
  fetchLogs?: (startDate: string, endDate: string) => Promise<void>;
}

export function DetailedStatsTab({ data, fetchLogs }: DetailedStatsTabProps) {
  const [startDate, setStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeSubTab, setActiveSubTab] = useState<'probability' | 'trend' | 'time'>('probability');

  useEffect(() => {
    if (fetchLogs) {
      fetchLogs(startDate, endDate);
    }
  }, [startDate, endDate, fetchLogs]);

  const handleFilter = () => {
    if (fetchLogs) {
      fetchLogs(startDate, endDate);
    }
  };

  const logsArray = useMemo(() => {
    return Object.values(data.logs).filter(log => log.date >= startDate && log.date <= endDate);
  }, [data.logs, startDate, endDate]);

  const stats = useMemo(() => {
    const dailyMap: Record<string, number> = { '일': 0, '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0 };
    const timeMap: Record<string, number> = {};
    const durationMap: Record<string, number> = {
      '1시간 대': 0,
      '2시간 대': 0,
      '3시간 대': 0,
      '4시간 이상': 0,
    };
    const trendMap: Record<string, { count: number, dates: Set<string> }> = {};

    let total = logsArray.length;

    logsArray.forEach(log => {
      const dateObj = parseISO(log.date);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      dailyMap[dayNames[dateObj.getDay()]]++;

      const hour = parseTimeString(log.time);
      const timeLabel = `${hour}:00`;
      timeMap[timeLabel] = (timeMap[timeLabel] || 0) + 1;

      if (log.durationHours < 2) durationMap['1시간 대']++;
      else if (log.durationHours < 3) durationMap['2시간 대']++;
      else if (log.durationHours < 4) durationMap['3시간 대']++;
      else durationMap['4시간 이상']++;

      const weekStart = format(startOfWeek(dateObj), 'yyyy-MM-dd');
      if (!trendMap[weekStart]) trendMap[weekStart] = { count: 0, dates: new Set() };
      trendMap[weekStart].count++;
      trendMap[weekStart].dates.add(format(dateObj, 'M/d'));
    });

    const dailyStatsArray = Object.keys(dailyMap).map(day => ({
      day,
      count: dailyMap[day],
      probability: total > 0 ? (dailyMap[day] / total) * 100 : 0
    }));

    const timeStatsArray = Object.keys(timeMap).map(time => {
      const h = parseInt(time);
      return {
        time,
        label: `${h >= 12 ? '오후' : '오전'} ${h % 12 || 12}시대`,
        count: timeMap[time],
        probability: total > 0 ? (timeMap[time] / total) * 100 : 0
      };
    }).sort((a, b) => parseInt(a.time) - parseInt(b.time));

    const durationStatsArray = Object.keys(durationMap).map(label => ({
      label,
      count: durationMap[label],
      probability: total > 0 ? (durationMap[label] / total) * 100 : 0
    }));

    const trendStatsArray = Object.keys(trendMap).sort().map(week => ({
      week: format(parseISO(week), 'MM/dd'),
      count: trendMap[week].count,
      datesDesc: Array.from(trendMap[week].dates).sort().join(', ')
    }));

    const avgDaily = total > 0 ? 100 / 7 : 0;

    return { dailyStatsArray, timeStatsArray, durationStatsArray, trendStatsArray, avgDaily, total };
  }, [logsArray]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">상세 분석</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white"
            />
            <span className="text-zinc-400">~</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white"
            />
          </div>
          <button onClick={handleFilter} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
            조회
          </button>
        </div>
      </div>

      {/* Sub-tabs for Charts */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button onClick={() => setActiveSubTab('probability')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeSubTab === 'probability' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>요일 및 시간 확률</button>
        <button onClick={() => setActiveSubTab('trend')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeSubTab === 'trend' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>주간 방송 횟수 추이</button>
        <button onClick={() => setActiveSubTab('time')} className={`px-4 py-2 text-sm font-medium rounded-lg ${activeSubTab === 'time' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>방송 길이 분석</button>
      </div>

      {activeSubTab === 'probability' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <h4 className="font-bold mb-4">요일별 방송 확률</h4>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 font-semibold border-y border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">순위</th>
                      <th className="px-4 py-3">요일</th>
                      <th className="px-4 py-3 text-right">방송 횟수</th>
                      <th className="px-4 py-3 text-right">확률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {[...stats.dailyStatsArray].sort((a, b) => b.probability - a.probability).map((stat, i) => (
                      <tr key={stat.day} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
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
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <h4 className="font-bold mb-4">시간대별 방송 확률</h4>
              <div className="overflow-x-auto flex-1">
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
                    {[...stats.timeStatsArray].sort((a, b) => b.probability - a.probability).slice(0, 10).map((stat, i) => (
                      <tr key={stat.time} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{stat.label}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{stat.count}회</td>
                        <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                          {stat.probability.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {stats.timeStatsArray.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold mb-4">요일별 방송 빈도 그래프</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="day" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip cursor={{ fill: '#a1a1aa', opacity: 0.1 }} content={<CustomTooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '비율']} />} />
                  <ReferenceLine y={stats.avgDaily} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: `평균(${stats.avgDaily.toFixed(1)}%)`, fill: '#f43f5e', fontSize: 10 }} />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out">
                    {stats.dailyStatsArray.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.probability > stats.avgDaily * 1.2 ? '#a855f7' : entry.probability < stats.avgDaily * 0.8 ? '#ef4444' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold mb-4">시작 시간대별 그래프</h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.timeStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="label" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip cursor={{ fill: '#a1a1aa', opacity: 0.1 }} content={<CustomTooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '비율']} />} />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]} fill="#3b82f6" animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'trend' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold mb-4">주간 방송 횟수 추이</h4>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="week" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip formatter={(value: number) => [`${value}회`, '방송 횟수']} />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} animationDuration={1200} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeSubTab === 'time' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold mb-4">1회당 방송 진행 시간(길이) 비율</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-black/40 text-zinc-500 dark:text-zinc-400 font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">방송 진행 시간</th>
                  <th className="px-4 py-3">횟수</th>
                  <th className="px-4 py-3 rounded-tr-lg">비율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.durationStatsArray.map((stat) => (
                  <tr key={stat.label} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-200">{stat.label}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{stat.count}회</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{stat.probability.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
