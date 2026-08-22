
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

import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, startOfYear, startOfMonth, endOfMonth, parseISO, startOfWeek, formatISO } from 'date-fns';
import { AppData, BroadcastLog } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { parseTimeString, cn } from '../../utils';

interface DetailedStatsTabProps {
  data: AppData;
  fetchLogs?: (startDate: string, endDate: string) => Promise<void>;
  isActive?: boolean;
}

export function DetailedStatsTab({ data, fetchLogs, isActive = true }: DetailedStatsTabProps) {
  const [startDate, setStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeSubTab, setActiveSubTab] = useState<'trend' | 'day'>('trend');

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
    for (let i = 0; i < 24; i++) {
      timeMap[`${i}:00`] = 0;
    }
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
        probability: total > 0 ? (timeMap[time] / total) * 100 : 0,
        hour: h
      };
    }).filter(stat => stat.hour >= 12 || stat.count > 0)
      .sort((a, b) => a.hour - b.hour);

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
              {isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart data={stats.trendStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="week" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} animationDuration={1200} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <h4 className="font-bold mb-4">시작 시간대별 그래프</h4>
              <div className="h-[250px] w-full mb-4">
                {isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={stats.timeStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                    <XAxis dataKey="label" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                    <Tooltip cursor={{ fill: '#a1a1aa', opacity: 0.1 }} content={<CustomTooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '비율']} />} />
                    <Bar dataKey="probability" radius={[4, 4, 0, 0]} fill="#3b82f6" animationDuration={1200} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>)}
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
              {isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
              </ResponsiveContainer>)}
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

