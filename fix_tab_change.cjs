const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove lines 50 to 66 completely.
let lines = code.split('\n');
// delete duplicates
lines.splice(49, 18);

code = lines.join('\n');

code = code.replace(/onClick=\{\(\) => handleTabChangeCore\(/g, `onClick={() => handleTabChange(`);

const handlerCode = `
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
`;
// Insert before closeNotice
code = code.replace(/const closeNotice = /g, handlerCode + '\n  const closeNotice = ');

// In case closeNotice was duplicated, let's fix it by regex:
// We just need one closeNotice, one handleTabChange
fs.writeFileSync('src/App.tsx', code);
