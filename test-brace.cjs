const fs = require('fs');
const css = fs.readFileSync('src/components/Navbar.css', 'utf8');
let openCount = 0;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') openCount++;
  if (css[i] === '}') openCount--;
}
console.log('Navbar.css balance:', openCount);

const indexCss = fs.readFileSync('src/index.css', 'utf8');
let openCountIdx = 0;
for (let i = 0; i < indexCss.length; i++) {
  if (indexCss[i] === '{') openCountIdx++;
  if (indexCss[i] === '}') openCountIdx--;
}
console.log('index.css balance:', openCountIdx);
