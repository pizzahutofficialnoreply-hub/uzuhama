import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  isSunday,
  isSaturday
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlaySquare, Smartphone, Video, Calendar as CalendarIcon } from 'lucide-react';
import { AppData, BroadcastLog } from '../../types';
import { cn, formatDuration, formatTo12Hour, parseTimeTo24, fuzzyKoreanMatch, fuzzyDateMatch } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';

const ShortsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.77 10.32l-1.2-.5L18 9.06a3.74 3.74 0 00-3.5-6.62L6 6.94a3.74 3.74 0 00.23 6.74l1.2.49L6 14.93a3.75 3.75 0 003.5 6.63l8.5-4.5a3.74 3.74 0 00-.23-6.74zM10 14.65v-5.3L15 12l-5 2.65z" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
  </svg>
);



interface CalendarTabProps {
  data: AppData;
  fetchLogs?: (startDate: string, endDate: string) => Promise<void>;
}

export function CalendarTab({ data, fetchLogs }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fetchedMonths, setFetchedMonths] = useState<Set<string>>(new Set());
  
  // Date Range for Table
  const [inputStartDate, setInputStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [inputEndDate, setInputEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [appliedStartDate, setAppliedStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [appliedEndDate, setAppliedEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [hasCustomFilter, setHasCustomFilter] = useState(false);

  const monthKey = format(currentDate, 'yyyy-MM');

  useEffect(() => {
    if (!hasCustomFilter) {
      setInputStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setInputEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
      setAppliedStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setAppliedEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
    }
  }, [currentDate, hasCustomFilter]);

  useEffect(() => {
    if (fetchLogs && !fetchedMonths.has(monthKey)) {
      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      fetchLogs(monthStart, monthEnd).then(() => {
        setFetchedMonths(prev => new Set(prev).add(monthKey));
      });
    }
  }, [monthKey, fetchedMonths, fetchLogs, currentDate]);

  const handleTableFilter = () => {
    setAppliedStartDate(inputStartDate);
    setAppliedEndDate(inputEndDate);
    setHasCustomFilter(true);
    if (fetchLogs) {
      fetchLogs(inputStartDate, inputEndDate);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const logsArray = Object.values(data.logs);

  const getLogForDate = (date: Date) => {
    const formattedStr = format(date, 'yyyy-MM-dd');
    return logsArray.find(log => log.date === formattedStr);
  };

  const formatTimeRange = (time: string, endTime?: string, durationHours?: number) => {
    if (!time) return '';
    const startStr = formatTo12Hour(time);
    let endStr = '';

    if (endTime) {
      endStr = formatTo12Hour(endTime);
    } else if (durationHours) {
      const { hour, minute } = parseTimeTo24(time);
      const totalMins = (hour * 60) + minute + Math.round(durationHours * 60);
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      
      const period = (endH >= 0 && endH < 12) ? '오전' : '오후';
      const h12 = endH % 12 || 12;
      endStr = `${period} ${h12}:${endM.toString().padStart(2, '0')}`;
    }

    return `${startStr}${endStr ? ` ~ ${endStr}` : ''}`;
  };

  const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
      const mStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      setInputStartDate(mStart);
      setInputEndDate(mEnd);
      setAppliedStartDate(mStart);
      setAppliedEndDate(mEnd);
    } else {
      setSelectedDate(date);
      const formatted = format(date, 'yyyy-MM-dd');
      setInputStartDate(formatted);
      setInputEndDate(formatted);
      setAppliedStartDate(formatted);
      setAppliedEndDate(formatted);
      setTimeout(() => {
        const panel = document.getElementById('calendar-detail-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  };

  const selectedLog = selectedDate ? getLogForDate(selectedDate) : null;

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const log = getLogForDate(cloneDay);
      const formattedDate = format(cloneDay, 'd');

      days.push(
        !isSameMonth(cloneDay, monthStart) ? (
          <div key={cloneDay.toString()} className="h-20 sm:h-28 border-r border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 pointer-events-none" />
        ) : (
          <div
            key={cloneDay.toString()}
            onClick={() => handleDayClick(cloneDay)}
            className="h-24 sm:h-32 p-1 border-r border-b border-zinc-100 dark:border-zinc-800/60 relative cursor-pointer bg-white dark:bg-zinc-900 transition-colors"
            title={log ? `${formatTimeRange(log.time, log.endTime, log.durationHours)} - ${log.game}` : '방송 기록 없음'}
          >
            <div className={cn(
              "w-full h-full rounded-2xl p-1 sm:p-2 transition-all duration-200 flex flex-col relative",
              selectedDate && isSameDay(cloneDay, selectedDate) ? "bg-purple-100/80 dark:bg-purple-900/40 shadow-inner ring-1 ring-purple-400 dark:ring-purple-500" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            )}>
              <span className={cn(
                "text-[11px] sm:text-sm font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-0.5 sm:mb-1",
                isSameDay(cloneDay, new Date()) ? "bg-purple-600 text-white" : "",
                !isSameDay(cloneDay, new Date()) && isSunday(cloneDay) ? "text-red-500" : "",
                !isSameDay(cloneDay, new Date()) && isSaturday(cloneDay) ? "text-blue-500" : ""
              )}>
                {formattedDate}
              </span>
              
              {log && (
                <div className="h-full w-full overflow-y-auto overflow-x-hidden flex flex-col justify-start custom-scrollbar">
                  
                  <div className="hidden sm:block text-[11px] sm:text-sm font-normal text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 leading-tight break-words w-full shadow-sm">
                    {log.games && log.games.length > 0 ? (
                      <ul className="pl-1">
                        {log.games.map((g, idx) => (
                          <li key={idx} className="break-words mb-0.5 whitespace-pre-wrap">
                            <span className="text-purple-400 font-bold">•</span> {g.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="break-words">{log.game}</span>
                    )}
                  </div>
                  <div className="flex sm:hidden justify-center items-center h-full w-full">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm"></div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  // Filter logs for table based on selected range
  const tableLogs = useMemo(() => {
    if (searchTerm.trim() !== '') {
      return logsArray.filter(log => {
        if (fuzzyDateMatch(searchTerm, log.date)) return true;
        if (log.game && fuzzyKoreanMatch(searchTerm, log.game)) return true;
        if (log.category && fuzzyKoreanMatch(searchTerm, log.category)) return true;
        if (log.games?.some(g => fuzzyKoreanMatch(searchTerm, g.name) || fuzzyKoreanMatch(searchTerm, g.category))) return true;
        if (log.vods?.some(v => fuzzyKoreanMatch(searchTerm, v.title))) return true;
        if (log.shorts?.some(s => fuzzyKoreanMatch(searchTerm, s.title))) return true;
        if (log.edited?.some(e => fuzzyKoreanMatch(searchTerm, e.title))) return true;
        return false;
      });
    }

    return logsArray.filter(log => {
      return log.date >= appliedStartDate && log.date <= appliedEndDate;
    });
  }, [logsArray, appliedStartDate, appliedEndDate, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col xl:flex-row gap-6 items-start relative">
        {/* Calendar Column */}
        <motion.div className="w-full xl:flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm relative z-10">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">방송 기록 달력</h3>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-600 dark:text-zinc-300">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 w-32 text-center">
                {format(currentDate, 'yyyy년 M월', { locale: ko })}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-600 dark:text-zinc-300">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} className={cn(
                "py-3 text-center text-sm font-semibold border-r border-zinc-200 dark:border-zinc-800 last:border-r-0",
                d === '일' ? "text-red-500" : d === '토' ? "text-blue-500" : "text-zinc-500 dark:text-zinc-400"
              )}>
                {d}
              </div>
            ))}
          </div>
          <div className="border-l border-t border-zinc-200 dark:border-zinc-800 flex flex-col">
            {rows}
          </div>
        </motion.div>

        {/* Selected Log Panel */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              id="calendar-detail-panel" className="w-full xl:w-96 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl xl:absolute xl:right-4 xl:top-4 xl:bottom-4 z-20 xl:overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="w-full min-w-[280px]">
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {selectedLog ? (
                  <div className="flex flex-col gap-4 sm:gap-6 mt-2">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                        {format(selectedDate, 'M월 d일')} <span className="text-base sm:text-lg font-medium text-zinc-500 dark:text-zinc-400">{format(selectedDate, 'EEEE', { locale: ko })}</span>
                      </h3>
                      <div className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-2 text-sm sm:text-base">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        {formatTimeRange(selectedLog.time, selectedLog.endTime, selectedLog.durationHours)} ({formatDuration(selectedLog.durationHours)})
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">진행한 게임</h4>
                        {selectedLog.games && selectedLog.games.length > 0 ? (
                          selectedLog.games.map((g, idx) => (
                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-start gap-1">
                              <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
                                {g.category || selectedLog.category || '종합'}
                              </span>
                              <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                                {g.link ? (
                                  <a href={g.link} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                    {g.name}
                                  </a>
                                ) : g.name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 sm:p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-start gap-1">
                            <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
                              {selectedLog.category}
                            </span>
                            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">{selectedLog.game}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {(selectedLog.vods?.length > 0 || selectedLog.edited?.length > 0 || selectedLog.shorts?.length > 0) && (
                      <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">업로드된 영상</h4>
                        
                        {selectedLog.vods?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {selectedLog.vods.map((v, i) => (
                          <a key={i} href={v.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 transition-colors border border-purple-100 dark:border-purple-800/30">
                            <PlaySquare className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm truncate">{v.title}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {selectedLog.edited?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {selectedLog.edited.map((v, i) => (
                          <a key={i} href={v.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 transition-colors border border-blue-100 dark:border-blue-800/30">
                            <VideoIcon className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm truncate">{v.title}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {selectedLog.shorts?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {selectedLog.shorts.map((v, i) => (
                          <a key={i} href={v.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 transition-colors border border-red-100 dark:border-red-800/30">
                            <ShortsIcon className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm truncate">{v.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-8 sm:py-12 mt-2 sm:mt-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold">{format(selectedDate, 'd')}</span>
                </div>
                <p className="text-zinc-500 font-medium text-center text-sm sm:text-base">{format(selectedDate, 'M월 d일')} 방송 기록이 없습니다.</p>
              </div>
            )}
          </div>
        </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* 전체 방송 기록 표 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">전체 방송 기록</h3>
          
          <div className="flex flex-col sm:flex-row w-full xl:w-auto items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-sm">
              <input 
                type="date" 
                value={inputStartDate} 
                onChange={(e) => setInputStartDate(e.target.value)}
                className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-zinc-400 hidden sm:inline">~</span>
              <input 
                type="date" 
                value={inputEndDate} 
                onChange={(e) => setInputEndDate(e.target.value)}
                className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button onClick={handleTableFilter} className="w-full sm:w-auto px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
              조회
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50 dark:bg-black/40 text-zinc-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4">방송 날짜 / 시간</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">카테고리 / 게임 이름</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">다시보기</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">편집본</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">쇼츠</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tableLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="font-medium text-zinc-900 dark:text-zinc-200">{log.date}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">{formatTimeRange(log.time, log.endTime, log.durationHours)} ({formatDuration(log.durationHours)})</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    {log.games && log.games.length > 0 ? (
                      <div className="flex flex-col gap-2 mt-1">
                        {log.games.map((g, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5">
                            <span className="self-start px-2 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {g.category || log.category || '종합'}
                            </span>
                            {g.link ? (
                              <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1">
                                {g.name}
                              </a>
                            ) : (
                              <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">{g.name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {log.category}
                          </span>
                        </div>
                        <div className="text-purple-600 dark:text-purple-400 font-medium">{log.game}</div>
                      </>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-2">
                      {log.vods?.length > 0 ? log.vods.map((v, i) => (
                        <a key={i} href={v.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                          <PlaySquare className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="hidden sm:inline text-sm break-keep break-words leading-relaxed">{v.title}</span>
                        </a>
                      )) : <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-2">
                      {log.edited?.length > 0 ? log.edited.map((v, i) => (
                        <a key={i} href={v.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-blue-500 transition-colors">
                          <VideoIcon className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="hidden sm:inline text-sm break-keep break-words leading-relaxed">{v.title}</span>
                        </a>
                      )) : <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-2">
                      {log.shorts?.length > 0 ? log.shorts.map((v, i) => (
                        <a key={i} href={v.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-red-500 transition-colors">
                          <ShortsIcon className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="hidden sm:inline text-sm break-keep break-words leading-relaxed">{v.title}</span>
                        </a>
                      )) : <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {tableLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    해당 기간에 방송 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
