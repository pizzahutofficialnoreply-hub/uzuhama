const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/CalendarTab.tsx', 'utf8');

// 1. Detail Panel Icons
code = code.replace(
  /<Video className="w-5 h-5 shrink-0" \/>/g,
  `<VideoIcon className="w-5 h-5 shrink-0" />`
);
code = code.replace(
  /<Smartphone className="w-5 h-5 shrink-0" \/>/g,
  `<ShortsIcon className="w-5 h-5 shrink-0" />`
);

// 2. Calendar Game Name Background & Bullet
// The original cell HTML for game item is:
// <li key={idx} className="break-words mb-0.5 whitespace-pre-wrap">
//   • {g.name}
// </li>
// And the container is:
// <div className="hidden sm:block text-[11px] sm:text-sm font-normal text-white bg-zinc-800 dark:bg-zinc-700/80 rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 leading-tight break-words w-full shadow-sm">

code = code.replace(
  /bg-zinc-800 dark:bg-zinc-700\/80/g,
  `bg-zinc-900 dark:bg-zinc-800`
);

code = code.replace(
  /• \{g\.name\}/g,
  `<span className="text-purple-400 font-bold">•</span> {g.name}`
);

fs.writeFileSync('src/components/tabs/CalendarTab.tsx', code);
