const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update Header Animation and Probability Display
const oldHeader = /<motion\.div\s+initial=\{\{\s*opacity:\s*0,\s*scale:\s*1\.4,\s*y:\s*15,\s*x:\s*-10\s*\}\}\s+animate=\{\{\s*opacity:\s*1,\s*scale:\s*1,\s*y:\s*0,\s*x:\s*0\s*\}\}\s+exit=\{\{\s*opacity:\s*0,\s*scale:\s*1\.4,\s*y:\s*15,\s*x:\s*-10\s*\}\}\s+transition=\{\{\s*duration:\s*0\.4,\s*type:\s*"spring",\s*bounce:\s*0\.3\s*\}\}\s+className="flex items-center gap-2 origin-right"\s*>\s*<span className="hidden sm:inline text-zinc-500">현재 확률:<\/span>\s*<span className=\{cn\("px-2\.5 py-1 rounded-full", currentProb > 15 \? "bg-purple-100 text-purple-600 dark:bg-purple-900\/30 dark:text-purple-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"\)\}>\s*\{currentProb\?\.toFixed\(1\)\}%\s*<\/span>\s*<\/motion\.div>/;

const newHeader = `<motion.div
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
                </motion.div>`;

code = code.replace(oldHeader, newHeader);

// 2. Add tabContentRef and modify handleTabChange
if (!code.includes('const tabContentRef = useRef<HTMLDivElement>(null);')) {
  code = code.replace(
    /const probContainerRef = useRef<HTMLDivElement>\(null\);/,
    `const probContainerRef = useRef<HTMLDivElement>(null);\n  const tabContentRef = useRef<HTMLDivElement>(null);`
  );
  
  code = code.replace(
    /const handleTabChange = \(tab: Tab\) => \{\n    setActiveTab\(tab\);\n    window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\n  \};/,
    `const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tabContentRef.current) {
      const y = tabContentRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };`
  );
  
  code = code.replace(
    /<div className="pb-24 sm:pb-0">/,
    `<div ref={tabContentRef} className="pb-24 sm:pb-0">`
  );
}

fs.writeFileSync('src/App.tsx', code);
