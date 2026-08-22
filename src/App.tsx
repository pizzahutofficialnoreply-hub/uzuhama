/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Tv, BarChart2, Calendar as CalendarIcon, FileText, Lock, X, PlaySquare } from 'lucide-react';
import { useFirebaseData } from './hooks/useFirebaseData';
import { SummaryTab } from './components/tabs/SummaryTab';
import { CalendarTab } from './components/tabs/CalendarTab';
import { DetailedStatsTab } from './components/tabs/DetailedStatsTab';
import { RecommendTab } from './components/tabs/RecommendTab';
import { AdminRoute } from './components/AdminRoute';
import { CurrentProbability } from './components/CurrentProbability';
import { cn } from './utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'summary' | 'calendar' | 'detailed' | 'recommend';

function MainApp() {
  const { data, loading, fetchLogsByDateRange } = useFirebaseData();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [showNotice, setShowNotice] = useState(false);
  const [currentProb, setCurrentProb] = useState<number | null>(null);
  const [isProbVisible, setIsProbVisible] = useState(true);

  
  const probContainerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!probContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsProbVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(probContainerRef.current);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const noticeSeen = localStorage.getItem('notice_seen_v1');
    if (!noticeSeen) {
      setShowNotice(true);
    }
  }, []);

  
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tabContentRef.current) {
      const y = tabContentRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const closeNotice = (neverShowAgain: boolean) => {
    if (neverShowAgain) {
      localStorage.setItem('notice_seen_v1', 'true');
    }
    setShowNotice(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-500/30">
      
      {/* Notice Modal */}
      {showNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => closeNotice(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">알림</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed text-sm">
              본 사이트의 데이터는 생방송 패턴을 바탕으로 분석된 예측치이며, 
              실제 일정과 다를 수 있습니다. 이 점 참고하여 이용해 주시기 바랍니다. (2026년 이후 데이터만 수집/분석됩니다)
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => closeNotice(true)} 
                className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                다시 보지 않기
              </button>
              <button 
                onClick={() => closeNotice(false)} 
                className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">우주하마 방송 예측</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold h-8">
            <AnimatePresence>
              {!isProbVisible && currentProb !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.2, y: 30, x: -30 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 1.2, y: 30, x: -30 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                  className="flex items-center gap-2 origin-right"
                >
                  <span className="hidden sm:inline text-zinc-500">현재 확률:</span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    {currentProb?.toFixed(1)}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Main Realtime Indicator (Always visible on top) */}
        <div ref={probContainerRef} id="main-prob-container" className="mb-12">
          <CurrentProbability logs={Object.values(data.logs)} onProbChange={setCurrentProb} />
        </div>

        {/* Desktop Tabs Navigation */}
        <div className="hidden sm:flex items-center gap-6 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 mb-8">
          <button
            onClick={() => handleTabChange('summary')}
            className={cn(
              "flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
              activeTab === 'summary' 
                ? "border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <FileText className="w-4 h-4" />
            요약
          </button>
          
          <button
            onClick={() => handleTabChange('calendar')}
            className={cn(
              "flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
              activeTab === 'calendar' 
                ? "border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            방송 기록
          </button>
          
          <button
            onClick={() => handleTabChange('detailed')}
            className={cn(
              "flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
              activeTab === 'detailed' 
                ? "border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <BarChart2 className="w-4 h-4" />
            상세 분석
          </button>
          
          <button
            onClick={() => handleTabChange('recommend')}
            className={cn(
              "flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
              activeTab === 'recommend' 
                ? "border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <PlaySquare className="w-4 h-4" />
            추천 영상
          </button>
        </div>

        {/* Tab Content */}
        <div ref={tabContentRef} className="pb-24 sm:pb-0">
          <div className={activeTab === 'summary' ? 'block' : 'hidden'}><SummaryTab data={data} fetchLogs={fetchLogsByDateRange} isActive={activeTab === 'summary'} /></div>
          <div className={activeTab === 'calendar' ? 'block' : 'hidden'}><CalendarTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'detailed' ? 'block' : 'hidden'}><DetailedStatsTab data={data} fetchLogs={fetchLogsByDateRange} isActive={activeTab === 'detailed'} /></div>
          <div className={activeTab === 'recommend' ? 'block' : 'hidden'}><RecommendTab /></div>
        </div>
      </main>
      
      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => handleTabChange('summary')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              activeTab === 'summary' 
                ? "text-purple-600 dark:text-purple-400" 
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">요약</span>
          </button>
          
          <button
            onClick={() => handleTabChange('calendar')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              activeTab === 'calendar' 
                ? "text-purple-600 dark:text-purple-400" 
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">기록</span>
          </button>
          
          <button
            onClick={() => handleTabChange('detailed')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              activeTab === 'detailed' 
                ? "text-purple-600 dark:text-purple-400" 
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-medium">분석</span>
          </button>

          <button
            onClick={() => handleTabChange('recommend')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              activeTab === 'recommend' 
                ? "text-purple-600 dark:text-purple-400" 
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <PlaySquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">추천</span>
          </button>
        </div>
      </nav>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-zinc-500 dark:text-zinc-500 text-sm mb-16 sm:mb-0">
        <p>※ 본 데이터는 2026년 이후 데이터만 포함하며, 생방송 패턴을 바탕으로 분석된 예측치이므로 실제 일정과 다를 수 있습니다.</p>
        <p className="mt-1 text-xs">데이터는 최신화 시점에 따라 실시간으로 업데이트 및 반영됩니다.</p>
        <p className="mt-2 text-[10px] text-zinc-400">※ 본 사이트는 사용자 설정 유지를 위해 브라우저의 로컬 저장소를 일부 사용합니다.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/admin" element={<AdminRoute />} />
    </Routes>
  );
}
