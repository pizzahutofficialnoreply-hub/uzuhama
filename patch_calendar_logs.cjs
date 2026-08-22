const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

const oldLogs = /const tableLogs = useMemo\(\(\) => \{[\s\S]*?return filtered;\n  \}, \[logsArray, appliedStartDate, appliedEndDate, searchTerm\]\);/;

const newLogs = `const tableLogs = useMemo(() => {
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
  }, [logsArray, appliedStartDate, appliedEndDate, searchTerm]);`;

code = code.replace(oldLogs, newLogs);

fs.writeFileSync('src/components/tabs/CalendarTab.tsx', code);
