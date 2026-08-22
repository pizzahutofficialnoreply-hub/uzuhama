const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

// Filter with search term
const filterReplace = `
  const handleTableFilter = () => {
    let filtered = Object.values(data.logs).filter(log => {
      if (log.date < tableStartDate || log.date > tableEndDate) return false;
      return true;
    });
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => {
        if (log.game?.toLowerCase().includes(term)) return true;
        if (log.date.includes(term)) return true;
        if (log.games?.some(g => g.name.toLowerCase().includes(term))) return true;
        if (log.vods?.some(v => v.title.toLowerCase().includes(term))) return true;
        if (log.shorts?.some(s => s.title.toLowerCase().includes(term))) return true;
        return false;
      });
    }
    setTableLogs(filtered);
  };
`;
code = code.replace(/const handleTableFilter = \(\) => {[\s\S]*?setTableLogs\(filtered\);\n  };/, filterReplace);

// Search UI
const searchUI = `
          <div className="flex flex-col sm:flex-row w-full xl:w-auto items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTableFilter()}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
`;
code = code.replace(/<div className="flex flex-col sm:flex-row w-full xl:w-auto items-stretch sm:items-center gap-3">/, searchUI);

// Table Styles for Mobile Optimization
code = code.replace(/<table className="w-full text-left text-sm">/, `<table className="w-full text-left text-xs sm:text-sm">`);
code = code.replace(/<th className="px-6 py-4">/g, `<th className="px-3 sm:px-6 py-3 sm:py-4">`);
code = code.replace(/<td className="px-6 py-4/g, `<td className="px-3 sm:px-6 py-3 sm:py-4`);
// Replace VOD/Short icons
code = code.replace(/<Video className="w-4 h-4/g, `<VideoIcon className="w-4 h-4`);
code = code.replace(/<Smartphone className="w-4 h-4/g, `<ShortsIcon className="w-4 h-4`);

// Hide text on mobile for VOD/Shorts
code = code.replace(/<span className="text-sm break-words whitespace-normal leading-relaxed">{v.title}<\/span>/g, `<span className="hidden sm:inline text-sm break-words whitespace-normal leading-relaxed">{v.title}</span>`);

fs.writeFileSync('src/components/tabs/CalendarTab.tsx', code);
