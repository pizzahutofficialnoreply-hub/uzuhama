const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add currentProb state and ref
code = code.replace(
  "const [showNotice, setShowNotice] = useState(false);",
  "const [showNotice, setShowNotice] = useState(false);\n  const [currentProb, setCurrentProb] = useState<number | null>(null);\n  const [isProbVisible, setIsProbVisible] = useState(true);"
);

// 2. Add intersection observer useEffect
const ioEffect = `
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsProbVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    const element = document.getElementById('main-prob-container');
    if (element) {
      observer.observe(element);
    }
    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);
`;
code = code.replace("useEffect(() => {\n    const noticeSeen = localStorage.getItem('notice_seen_v1');", ioEffect + "\n  useEffect(() => {\n    const noticeSeen = localStorage.getItem('notice_seen_v1');");

// 3. Update header
const headerReplace = `<header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">우주하마 방송 예측</h1>
          </div>
          <div className={cn("transition-opacity duration-300 flex items-center gap-2 text-sm font-bold", !isProbVisible && currentProb !== null ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <span className="hidden sm:inline text-zinc-500">현재 확률:</span>
            <span className={cn("px-2.5 py-1 rounded-full", currentProb && currentProb > 15 ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}>
              {currentProb?.toFixed(1)}%
            </span>
          </div>
        </div>
      </header>`;
code = code.replace(/<header[\s\S]*?<\/header>/, headerReplace);

// 4. Update CurrentProbability mount
code = code.replace(
  `<div className="mb-12">
          <CurrentProbability logs={Object.values(data.logs)} />
        </div>`,
  `<div id="main-prob-container" className="mb-12">
          <CurrentProbability logs={Object.values(data.logs)} onProbChange={setCurrentProb} />
        </div>`
);

// 5. Update Tab Content to use hidden
const tabsContent = `<div className="pb-24 sm:pb-0">
          <div className={activeTab === 'summary' ? 'block' : 'hidden'}><SummaryTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'calendar' ? 'block' : 'hidden'}><CalendarTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'detailed' ? 'block' : 'hidden'}><DetailedStatsTab data={data} fetchLogs={fetchLogsByDateRange} /></div>
          <div className={activeTab === 'recommend' ? 'block' : 'hidden'}><RecommendTab /></div>
        </div>`;
code = code.replace(/<div className="pb-24 sm:pb-0">[\s\S]*?<\/div>/, tabsContent);

fs.writeFileSync('src/App.tsx', code);
