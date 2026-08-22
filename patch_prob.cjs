const fs = require('fs');
let code = fs.readFileSync('src/components/CurrentProbability.tsx', 'utf8');

const targetStr = "let probabilityLevel = 'low';";
const insertStr = `
  useEffect(() => {
    if (onProbChange) {
      onProbChange(finalProb);
    }
  }, [finalProb, onProbChange]);
  
  let probabilityLevel = 'low';`;

code = code.replace(targetStr, insertStr);
fs.writeFileSync('src/components/CurrentProbability.tsx', code);
