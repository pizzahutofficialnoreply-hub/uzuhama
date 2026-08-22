import { useMemo, useEffect, useState } from 'react';
import { PatternAnalysis } from '../PatternAnalysis';
import { AppData } from '../../types';
import { format, startOfMonth, endOfMonth, parseISO, startOfWeek, isSameDay, addDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { parseTimeString } from '../../utils';

interface SummaryTabProps {
  data: AppData;
  fetchLogs?: (startDate: string, endDate: string) => Promise<void>;
  isActive?: boolean;
}

export function SummaryTab({ data, fetchLogs, isActive = true }: SummaryTabProps) {
  const [startDate] = useState('2026-01-01'); // Fetch all logs essentially
  const [endDate] = useState('2099-12-31');

  useEffect(() => {
    if (fetchLogs) {
      fetchLogs(startDate, endDate);
    }
  }, [startDate, endDate, fetchLogs]);

  const logsArray = useMemo(() => {
    return Object.values(data.logs).filter(log => log.date >= startDate && log.date <= endDate);
  }, [data.logs, startDate, endDate]);

  const stats = useMemo(() => {
    const dailyMap: Record<string, number> = { '일': 0, '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0 };
    const timeMap: Record<string, number> = {};
    const trendMap: Record<string, number> = {};

    logsArray.forEach(log => {
      const dateObj = parseISO(log.date);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      dailyMap[dayNames[dateObj.getDay()]]++;

      const hour = parseTimeString(log.time);
      const timeLabel = `${hour >= 12 ? '오후' : '오전'} ${hour % 12 || 12}시`;
      timeMap[timeLabel] = (timeMap[timeLabel] || 0) + 1;

      const weekStart = format(startOfWeek(dateObj), 'MM/dd');
      trendMap[weekStart] = (trendMap[weekStart] || 0) + 1;
    });

    const topDay = Object.keys(dailyMap).reduce((a, b) => dailyMap[a] > dailyMap[b] ? a : b, '목');
    const bottomDay = Object.keys(dailyMap).reduce((a, b) => dailyMap[a] < dailyMap[b] ? a : b, '금');
    const topTime = Object.keys(timeMap).reduce((a, b) => timeMap[a] > timeMap[b] ? a : b, '오후 8시');

    const trendStatsArray = Object.keys(trendMap).sort().map(week => ({
      week, count: trendMap[week]
    }));

    const dailyStatsArray = Object.keys(dailyMap).map(day => ({
      day, count: dailyMap[day]
    }));
    
    // Calculate dynamic probabilities
    let streamAfterStream = 0;
    let restAfterStream = 0;
    let streamAfterTwoStreams = 0;
    let restAfterTwoStreams = 0;
    let streamAfterLongStream = 0;
    let restAfterLongStream = 0;

    const dateSet = new Set(logsArray.map(l => l.date));
    
    logsArray.forEach(log => {
      const current = new Date(log.date);
      const nextDay = format(addDays(current, 1), 'yyyy-MM-dd');
      const prevDay = format(addDays(current, -1), 'yyyy-MM-dd');
      
      const streamedNextDay = dateSet.has(nextDay);
      
      // 1. One day stream
      if (streamedNextDay) streamAfterStream++;
      else restAfterStream++;
      
      // 2. Two consecutive days
      if (dateSet.has(prevDay)) {
        if (streamedNextDay) streamAfterTwoStreams++;
        else restAfterTwoStreams++;
      }
      
      // 3. Long stream (> 3 hours)
      if (log.durationHours && log.durationHours > 3) {
        if (streamedNextDay) streamAfterLongStream++;
        else restAfterLongStream++;
      }
    });

    const probRestAfter1 = streamAfterStream + restAfterStream > 0 ? (restAfterStream / (streamAfterStream + restAfterStream) * 100).toFixed(0) : 50;
    const probRestAfter2 = streamAfterTwoStreams + restAfterTwoStreams > 0 ? (restAfterTwoStreams / (streamAfterTwoStreams + restAfterTwoStreams) * 100).toFixed(0) : 100;
    const probRestAfterLong = streamAfterLongStream + restAfterLongStream > 0 ? (restAfterLongStream / (streamAfterLongStream + restAfterLongStream) * 100).toFixed(0) : 80;

    return { 
      topDay, 
      bottomDay, 
      topTime, 
      trendStatsArray, 
      dailyStatsArray,
      probRestAfter1,
      probRestAfter2,
      probRestAfterLong
    };
  }, [logsArray]);

  // Dynamically generate guides based on actual data
  const dynamicGuides = [
    {
      id: 'guide-1',
      title: '가장 확실한 방송 요일과 시간',
      content: `시청자 입장에서 가장 방송을 기다려볼 만한 확실한 타이밍은 **${stats.topDay}요일**과 **${stats.topTime}**대 입니다. 특히 해당 요일에 방송 빈도가 압도적으로 높습니다. 반대로 **${stats.bottomDay}요일**은 가장 쉬는 날일 확률이 높으므로 마음 편히 쉬셔도 좋습니다.`
    },
    {
      id: 'guide-2',
      title: '최근 방송 트렌드',
      content: `최근 3개월 간의 데이터를 분석한 결과, 주간 평균 **${stats.trendStatsArray.length > 0 ? (stats.trendStatsArray.reduce((acc, curr) => acc + curr.count, 0) / stats.trendStatsArray.length).toFixed(1) : 0}회**의 방송 빈도를 보이고 있습니다. 꺾은선 그래프에서 볼 수 있듯 꾸준한 패턴을 유지하고 있습니다.`
    },
    {
      id: 'guide-3',
      title: '연속 방송과 휴방 예측 공식',
      content: `분석된 데이터에 기반한 실시간 휴방 확률입니다.\n\n- **오늘 방송을 봤다면:** 내일은 쉴 확률이 **${stats.probRestAfter1}%** 입니다.\n- **이틀 연속 방송을 봤다면:** 내일 쉴 확률이 **${stats.probRestAfter2}%** 로 변합니다.\n- **오늘 3시간 이상 방송했다면:** 체력 소모로 인해 다음 날 휴방 확률은 **${stats.probRestAfterLong}%** 입니다.`
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">최근 주간 방송 횟수</h4>
          <div className="h-[200px] w-full">
            {isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={stats.trendStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="week" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip formatter={(value: number) => [`${value}회`, '방송 횟수']} />} cursor={{ stroke: '#a1a1aa', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} animationDuration={1200} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>)}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">최근 요일별 집중도</h4>
          <div className="h-[200px] w-full">
            {isActive && (<ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={stats.dailyStatsArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: '#a1a1aa', opacity: 0.1 }} content={<CustomTooltip formatter={(value: number) => [`${value}회`, '방송 횟수']} />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3b82f6" animationDuration={1200} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>)}
          </div>
        </div>
      </div>

      <PatternAnalysis guides={dynamicGuides} />
    </div>
  );
}

// Helper to get past months safely
function subMonths(date: Date, amount: number) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() - amount);
  return newDate;
}
