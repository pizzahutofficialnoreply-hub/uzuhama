const fs = require('fs');

let code = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

code = code.replace(
  `import { cn, formatDuration, formatTo12Hour, parseTimeTo24 } from '../../utils';`,
  `import { cn, formatDuration, formatTo12Hour, parseTimeTo24, fuzzyKoreanMatch, fuzzyDateMatch } from '../../utils';`
);

code = code.replace(
  /const \[tableStartDate, setTableStartDate\] = useState\(format\(startOfMonth\(new Date\(\)\), 'yyyy-MM-dd'\)\);\n  const \[tableEndDate, setTableEndDate\] = useState\(format\(endOfMonth\(new Date\(\)\), 'yyyy-MM-dd'\)\);/,
  `const [inputStartDate, setInputStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [inputEndDate, setInputEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [appliedStartDate, setAppliedStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [appliedEndDate, setAppliedEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));`
);

code = code.replace(
  `setTableStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setTableEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));`,
  `setInputStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setInputEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
      setAppliedStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setAppliedEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));`
);

code = code.replace(
  /const handleTableFilter = \(\) => \{\n    setHasCustomFilter\(true\);\n    if \(fetchLogs\) \{\n      fetchLogs\(tableStartDate, tableEndDate\);\n    \}\n  \};/,
  `const handleTableFilter = () => {
    setAppliedStartDate(inputStartDate);
    setAppliedEndDate(inputEndDate);
    setHasCustomFilter(true);
    if (fetchLogs) {
      fetchLogs(inputStartDate, inputEndDate);
    }
  };`
);

const oldTableLogs = /const tableLogs = useMemo\(\(\) => \{\n    return Object.values\(data.logs\).filter\(log => \{\n      if \(log.date < tableStartDate \|\| log.date > tableEndDate\) return false;\n      if \(searchTerm\.trim\(\) !== ''\) \{\n        const term = searchTerm\.toLowerCase\(\);\n        if \(\!log.game\?.toLowerCase\(\)\.includes\(term\) && \!log.category\?.toLowerCase\(\)\.includes\(term\)\) return false;\n      \}\n      return true;\n    \}\);\n  \}, \[data.logs, tableStartDate, tableEndDate, searchTerm\]\);/;

const newTableLogs = `const tableLogs = useMemo(() => {
    let filtered = Object.values(data.logs).filter(log => {
      if (log.date < appliedStartDate || log.date > appliedEndDate) return false;
      return true;
    });
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(log => {
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
    return filtered;
  }, [data.logs, appliedStartDate, appliedEndDate, searchTerm]);`;

code = code.replace(oldTableLogs, newTableLogs);

const oldMonthH2 = /<h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">\s*\{format\(currentDate, 'yyyy년 M월'\)\}\s*<\/h2>/;
const newMonthH2 = `<div className="relative group flex items-center justify-center min-w-[120px]">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 transition-colors">
                {format(currentDate, 'yyyy년 M월')}
              </h2>
              <input 
                type="month"
                value={format(currentDate, 'yyyy-MM')}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(new Date(e.target.value + '-01T00:00:00'));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>`;
code = code.replace(oldMonthH2, newMonthH2);

code = code.replace(
  /<input\s+type="date"\s+value=\{tableStartDate\}\s+onChange=\{\(e\) => setTableStartDate\(e\.target\.value\)\}/,
  `<input 
                type="date" 
                value={inputStartDate} 
                onChange={(e) => setInputStartDate(e.target.value)}`
);

code = code.replace(
  /<input\s+type="date"\s+value=\{tableEndDate\}\s+onChange=\{\(e\) => setTableEndDate\(e\.target\.value\)\}/,
  `<input 
                type="date" 
                value={inputEndDate} 
                onChange={(e) => setInputEndDate(e.target.value)}`
);

code = code.replace(
  /onKeyDown=\{\(e\) => e\.key === 'Enter' && handleTableFilter\(\)\}/,
  ``
);

fs.writeFileSync('src/components/tabs/CalendarTab.tsx', code);
