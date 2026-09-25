const fs = require('fs');
let css = fs.readFileSync('apps/client/src/App.tsx', 'utf8');
css = css.replace(/transmissǜo/g, 'transmissão');
css = css.replace(/cǽmera/g, 'câmera');
fs.writeFileSync('apps/client/src/App.tsx', css);
