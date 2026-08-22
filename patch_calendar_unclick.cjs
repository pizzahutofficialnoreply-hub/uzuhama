const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

const oldHandle = /const handleDayClick = \(date: Date\) => \{[\s\S]*?setSelectedDate\(null\);\n    \} else \{/;
const newHandle = `const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
      const mStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      setInputStartDate(mStart);
      setInputEndDate(mEnd);
      setAppliedStartDate(mStart);
      setAppliedEndDate(mEnd);
    } else {`;

code = code.replace(oldHandle, newHandle);
fs.writeFileSync('src/components/tabs/CalendarTab.tsx', code);
