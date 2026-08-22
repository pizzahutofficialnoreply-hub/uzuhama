import { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BroadcastLog } from '../types';
import { PlayCircle, AlertCircle, Clock, ChevronRight, Tv, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

export function CurrentProbability({ logs = [], onProbChange }: { logs?: BroadcastLog[], onProbChange?: (prob: number) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveData, setLiveData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 10);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'config', 'liveStatus'),
      (snap) => {
        if (snap.exists()) {
          setLiveData(snap.data());
        }
      },
      (e) => {
        // Ignore offline/unavailable errors since they are common
        if (e.code === 'unavailable' || (e.message && e.message.includes('offline'))) {
          console.warn('Firestore is currently offline or unavailable, using cached live status if available.');
        } else {
          console.error('Failed to listen to live status:', e);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (liveData?.status === 'OPEN') {
    return (
      <div className="bg-white dark:bg-zinc-900 border-2 border-red-500 dark:border-red-500/50 rounded-3xl p-8 shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-4 w-full">
          <div className="animate-pulse bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-1.5 rounded-full font-black tracking-widest text-sm flex items-center gap-2 border border-red-200 dark:border-red-800/50">
            <Radio className="w-4 h-4" />
            LIVE NOW
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400 leading-tight px-4 break-keep">
            우주하마 생방송!
          </h2>
          <p className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-200 mt-2 break-keep max-w-2xl">
            {liveData.liveTitle}
          </p>
          
          <div className="flex flex-col items-center gap-1">
            <div className="text-red-600 dark:text-red-400 font-bold text-lg bg-red-50 dark:bg-red-900/10 px-4 py-1 rounded-lg border border-red-100 dark:border-red-900/20">
              {liveData.liveCategoryValue}
            </div>
            {liveData.openDate && (
              <p className="mt-2 text-red-700 dark:text-red-300 text-sm font-medium">
                방송 시작: {format(new Date(liveData.openDate.replace(' ', 'T')), 'a h:mm', { locale: ko })}
              </p>
            )}
          </div>
          
          <a 
            href="https://chzzk.naver.com/live/c6e1c8cf1b128bd321cc2684c92b5a00" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 bg-zinc-900 dark:bg-black border border-emerald-600/50 hover:bg-emerald-900/30 text-emerald-400 font-bold text-lg py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Tv className="w-5 h-5" />
            치지직 방송 보러가기
          </a>
        </div>
      </div>
    );
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  const recentLog = sortedLogs[0];
  let recentInfo = null;
  if (recentLog) {
    const logTime = new Date(`${recentLog.date}T${recentLog.time}`);
    const endTime = recentLog.endTime ? new Date(`${recentLog.date}T${recentLog.endTime}`) : new Date(logTime.getTime() + (recentLog.durationHours * 60 * 60 * 1000));
    const hoursSinceEnd = (currentTime.getTime() - endTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEnd >= 0 && hoursSinceEnd <= 12) {
      recentInfo = `직전 방송: ${recentLog.vods[0]?.title || recentLog.game} (${Math.floor(hoursSinceEnd)}시간 전 종료)`;
    } else if (hoursSinceEnd < 0) {
       recentInfo = `직전 방송: ${recentLog.vods[0]?.title || recentLog.game} (진행 중이거나 방금 종료)`;
    }
  }

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const currentDayIndex = currentTime.getDay();
  const currentDayName = dayNames[currentDayIndex];
  
  const totalLogs = logs.length;
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const timeFreqByDay: Record<number, number[]> = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
  let lastLogDate: Date | null = null;
  let hasStreamedYesterday = false;
  let hasStreamedTwoDaysAgo = false;
  let hasStreamedToday = false;

  const todayStr = format(currentTime, 'yyyy-MM-dd');
  const yesterdayStr = format(new Date(currentTime.getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const twoDaysAgoStr = format(new Date(currentTime.getTime() - 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  logs.forEach(log => {
    try {
      if (!log.date) return;
      if (log.date === todayStr) hasStreamedToday = true;
      if (log.date === yesterdayStr) hasStreamedYesterday = true;
      if (log.date === twoDaysAgoStr) hasStreamedTwoDaysAgo = true;

      const d = parseISO(log.date);
      if (!lastLogDate || d > lastLogDate) lastLogDate = d;
      const dayIdx = d.getDay();
      if (isNaN(dayIdx)) return;
      dayCounts[dayIdx]++;
      
      if (!log.time) return;
      const [h, m] = log.time.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const timeInMins = h * 60 + m;
        timeFreqByDay[dayIdx].push(timeInMins);
      }
    } catch(e) {}
  });

  const maxDayCount = Math.max(...dayCounts) || 1;
  const normalizedTodayProb = totalLogs > 0 ? (dayCounts[currentDayIndex] / maxDayCount) * 90 : 0;

  const calculateDensity = (dayIdx: number, targetMinute: number) => {
    let density = 0;
    const points = timeFreqByDay[dayIdx];
    if (!points || points.length === 0) return 0;
    
    points.forEach(pt => {
      let dist = Math.abs(targetMinute - pt);
      if (dist > 720) dist = 1440 - dist;
      density += Math.exp(-(dist * dist) / (2 * 30 * 30));
    });
    return (density / points.length) * 100;
  };

  const currentMinuteOfDay = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  const findPeaks = (dayIdx: number) => {
    const peaks = [];
    const windowSize = 60;
    const densities = [];
    for (let m = 0; m < 1440; m += 5) {
       densities.push({ minute: m, density: calculateDensity(dayIdx, m) });
    }
    
    densities.sort((a, b) => b.density - a.density);
    
    for (const d of densities) {
      if (d.density < 2) continue;
      
      let tooClose = false;
      for (const p of peaks) {
         let dist = Math.abs(d.minute - p.minute);
         if (dist > 720) dist = 1440 - dist;
         if (dist < windowSize) {
           tooClose = true;
           break;
         }
      }
      if (!tooClose) {
         peaks.push(d);
         if (peaks.length >= 3) break;
      }
    }
    return peaks.sort((a, b) => a.minute - b.minute);
  };

  const todayPeaks = findPeaks(currentDayIndex);
  
  let nextPeak = null;
  let isToday = true;
  
  for (const p of todayPeaks) {
    if (p.minute > currentMinuteOfDay) {
       nextPeak = p;
       break;
    }
  }

  if (!nextPeak) {
    const tomorrowIdx = (currentDayIndex + 1) % 7;
    const tomorrowPeaks = findPeaks(tomorrowIdx);
    if (tomorrowPeaks.length > 0) {
      nextPeak = tomorrowPeaks[0];
      isToday = false;
    }
  }

  let timeProb = calculateDensity(currentDayIndex, currentMinuteOfDay);
  if (totalLogs === 0) timeProb = 0;
  
  // Pattern Multiplier
  let patternMultiplier = 1.0;
  let patternMessage = '';
  let daysSinceLastStream = 0;
  
  if (lastLogDate) {
    const d = new Date();
    d.setHours(0,0,0,0);
    const ld = new Date(lastLogDate);
    ld.setHours(0,0,0,0);
    daysSinceLastStream = differenceInDays(d, ld);
  }

  if (hasStreamedToday) {
    patternMultiplier = 0.1;
    patternMessage = '오늘 이미 방송을 진행했습니다.';
  } else if (hasStreamedYesterday && hasStreamedTwoDaysAgo) {
    patternMultiplier = 0.2;
    patternMessage = '이틀 연속 방송했으므로 오늘은 휴방일 가능성이 매우 높습니다.';
  } else if (hasStreamedYesterday) {
    patternMultiplier = 0.7;
    patternMessage = '어제 방송했으므로 오늘은 쉴 확률이 있습니다 (퐁당퐁당).';
  } else if (daysSinceLastStream >= 2) {
    patternMultiplier = 1.5;
    patternMessage = `${daysSinceLastStream}일째 휴방 중이므로 오늘은 올 확률이 매우 높습니다!`;
  } else if (daysSinceLastStream === 1) {
    patternMultiplier = 1.2;
    patternMessage = '어제 휴방했으므로 오늘 켜질 확률이 높습니다.';
  }
  
  const timeBonus = Math.min(100, timeProb * 3.5);
  let finalProb = Math.min(100, (normalizedTodayProb * 0.4 + timeBonus * 0.6) * patternMultiplier);
  if (totalLogs === 0) finalProb = 0;
  
  
  useEffect(() => {
    if (onProbChange) {
      onProbChange(finalProb);
    }
  }, [finalProb, onProbChange]);
  
  let probabilityLevel = 'low';
  let message = '지금은 방송 확률이 낮습니다.';
  if (finalProb > 15) {
    probabilityLevel = 'high';
    message = '지금 당장 방송이 켜질 확률이 매우 높습니다!';
  } else if (finalProb > 5) {
    probabilityLevel = 'medium';
    message = '방송이 켜질 가능성이 있는 시간대입니다.';
  } else if (totalLogs === 0) {
    message = '방송 기록이 없어 확률을 계산할 수 없습니다.';
  }

  let likelyTimeInfo = '';
  if (nextPeak) {
    const h = Math.floor(nextPeak.minute / 60);
    const m = nextPeak.minute % 60;
    const ampm = h >= 12 ? '오후' : '오전';
    const h12 = h % 12 || 12;
    const mm = m.toString().padStart(2, '0');
    likelyTimeInfo = `${isToday ? '오늘' : '내일'} 다음 유력 시간: ${ampm} ${h12}:${mm}`;
  } else {
     likelyTimeInfo = '데이터가 부족하여 유력 시간을 분석 중입니다.';
  }

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-400/10 border-purple-200 dark:border-purple-400/30';
      case 'medium': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/30';
      case 'low': return 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-400/10 border-zinc-200 dark:border-zinc-400/30';
      default: return 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-400/10 border-zinc-200 dark:border-zinc-400/30';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-2">
        <h2 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {format(currentTime, 'M월 d일 (E) a h:mm', { locale: ko })}
        </h2>
        
        <div className="mt-4 mb-2">
          <p className="text-zinc-500 dark:text-zinc-400 text-base font-medium mb-1">현재 방송 켜질 확률</p>
          <div className="text-7xl sm:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter">
            {finalProb.toFixed(1)}<span className="text-4xl sm:text-5xl ml-1">%</span>
          </div>
        </div>

        {likelyTimeInfo && (
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-medium mt-1 mb-2">
            <ChevronRight className="w-4 h-4 text-purple-500" />
            {likelyTimeInfo}
          </div>
        )}

        {patternMessage && (
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-100 dark:border-purple-800/30 mt-1 mb-2">
            {patternMessage}
          </p>
        )}

        <div className={cn("px-5 py-2 mt-2 rounded-full border flex items-center gap-2 font-bold text-sm sm:text-base", getStatusColor(probabilityLevel))}>
          {probabilityLevel === 'high' ? <PlayCircle className="w-5 h-5 animate-pulse" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message}</span>
        </div>

        {recentInfo && (
          <div className="mt-3 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
            {recentInfo}
          </div>
        )}
      </div>
      
      <div className="mt-4 w-full relative z-10 flex flex-col items-center">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          확률 계산 자세히 보기
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden w-full border-t border-zinc-100 dark:border-zinc-800/80"
            >
              <div className="pt-6 pb-2 flex flex-wrap justify-center gap-6 sm:gap-12 text-sm">
                <div className="flex flex-col items-center">
                  <span className="text-zinc-500 dark:text-zinc-500 mb-1">오늘({currentDayName}) 방송 비중</span>
                  <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{normalizedTodayProb.toFixed(1)}%</span>
                </div>
                <div className="text-zinc-300 dark:text-zinc-700 text-2xl font-light mt-2">×</div>
                <div className="flex flex-col items-center">
                  <span className="text-zinc-500 dark:text-zinc-500 mb-1">현재 시간 비중</span>
                  <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{timeProb.toFixed(1)}%</span>
                </div>
                <div className="text-zinc-300 dark:text-zinc-700 text-2xl font-light mt-2">×</div>
                <div className="flex flex-col items-center">
                  <span className="text-zinc-500 dark:text-zinc-500 mb-1">패턴 분석 가중치</span>
                  <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">x{patternMultiplier.toFixed(1)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
