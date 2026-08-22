const fs = require('fs');

// --- 1. PATCH App.tsx ---
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes('useRef')) {
    appCode = appCode.replace("import { useState, useEffect }", "import { useState, useEffect, useRef }");
}
if (!appCode.includes('import { motion, AnimatePresence }')) {
    appCode = appCode.replace("import { cn } from './utils';", "import { cn } from './utils';\nimport { motion, AnimatePresence } from 'motion/react';");
}

appCode = appCode.replace(
  /useEffect\(\(\) => \{\n    const observer = new IntersectionObserver\([\s\S]*?\}, \[\]\);/,
  `const probContainerRef = useRef<HTMLDivElement>(null);
  
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
  }, [loading]);`
);

appCode = appCode.replace(
  `<div id="main-prob-container" className="mb-12">`,
  `<div ref={probContainerRef} id="main-prob-container" className="mb-12">`
);

appCode = appCode.replace(
  `const closeNotice = (neverShowAgain: boolean) => {`,
  `const handleTabChange = (tab: Tab) => {
    handleTabChangeCore(tab);
  };
  
  const handleTabChangeCore = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };\n\n  const closeNotice = (neverShowAgain: boolean) => {`
);
appCode = appCode.replace(/setActiveTab\(/g, `handleTabChangeCore(`);

const oldHeader = `<div className={cn("transition-opacity duration-300 flex items-center gap-2 text-sm font-bold", !isProbVisible && currentProb !== null ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <span className="hidden sm:inline text-zinc-500">현재 확률:</span>
            <span className={cn("px-2.5 py-1 rounded-full", currentProb !== null && currentProb > 15 ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}>
              {currentProb?.toFixed(1)}%
            </span>
          </div>`;
          
const newHeader = `<div className="flex items-center gap-2 text-sm font-bold h-8">
            <AnimatePresence>
              {!isProbVisible && currentProb !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.4, y: 15, x: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 1.4, y: 15, x: -10 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                  className="flex items-center gap-2 origin-right"
                >
                  <span className="hidden sm:inline text-zinc-500">현재 확률:</span>
                  <span className={cn("px-2.5 py-1 rounded-full", currentProb > 15 ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}>
                    {currentProb?.toFixed(1)}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>`;
appCode = appCode.replace(oldHeader, newHeader);

const oldTabs = /\{\/\* Tab Content \*\/\}[\s\S]*?<\/div>\n      <\/main>/;
const newTabs = `{/* Tab Content */}
        <div className="pb-24 sm:pb-0">
          <div className={activeTab === 'summary' ? 'block' : 'hidden'}><SummaryTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'calendar' ? 'block' : 'hidden'}><CalendarTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'detailed' ? 'block' : 'hidden'}><DetailedStatsTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'recommend' ? 'block' : 'hidden'}><RecommendTab /></div>
        </div>
      </main>`;
appCode = appCode.replace(oldTabs, newTabs);

fs.writeFileSync('src/App.tsx', appCode);

// --- 2. PATCH DetailedStatsTab.tsx ---
let detailCode = fs.readFileSync('src/components/tabs/DetailedStatsTab.tsx', 'utf8');

if (detailCode.includes("useState('general')")) {
    detailCode = detailCode.replace("useState('general')", "useState('trend')");
}
if (detailCode.includes("useState<'general'")) {
    detailCode = detailCode.replace("useState<'general'", "useState<'trend'");
}

detailCode = detailCode.replace(/<ResponsiveContainer width="100%" height="100%">/g, `<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>`);

fs.writeFileSync('src/components/tabs/DetailedStatsTab.tsx', detailCode);
