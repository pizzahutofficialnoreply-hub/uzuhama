const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

const oldHandle = /const handleDayClick = \(date: Date\) => \{[\s\S]*?\}\n  \};/;
const newHandle = `const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
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
  };`;

code = code.replace(oldHandle, newHandle);
fs.writeFileSync('src/components/tabs/CalendarTab.tsx', code);
