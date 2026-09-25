const fs = require('fs');
const path = require('path');

let css = fs.readFileSync('C:\\Users\\Admin\\Downloads\\Projeto live tela discord\\Refrencias de layout\\reference_files\\share.css', 'utf8');

// Colors
css = css.replace(/--c-orange: #FF8D07/g, '--c-orange: #8A2BE2');
css = css.replace(/--c-orange-bright: #FFA033/g, '--c-orange-bright: #9B30FF');
css = css.replace(/rgba\(255, 141, 7, 0.16\)/g, 'rgba(138, 43, 226, 0.3)');
css = css.replace(/rgba\(255, 141, 7, 0.08\)/g, 'rgba(138, 43, 226, 0.12)');
css = css.replace(/rgba\(255, 141, 7, 0.22\)/g, 'rgba(138, 43, 226, 0.3)');
css = css.replace(/rgba\(255, 141, 7, 0.1\)/g, 'rgba(138, 43, 226, 0.15)');
css = css.replace(/rgba\(255, 141, 7, 0.32\)/g, 'rgba(138, 43, 226, 0.4)');
css = css.replace(/rgba\(255, 141, 7, 0.12\)/g, 'rgba(138, 43, 226, 0.18)');
css = css.replace(/rgba\(255, 141, 7, 0.3\)/g, 'rgba(138, 43, 226, 0.4)');
css = css.replace(/--accent: #FF8D07/g, '--accent: #8A2BE2');
css = css.replace(/--accent-hover: #FFA033/g, '--accent-hover: #9B30FF');
css = css.replace(/--accent-hover: #E67A00/g, '--accent-hover: #7b2cbf');
css = css.replace(/#FF8D07/g, '#8A2BE2'); // any other occurences

// Text / Branding
css = css.replace(/Xispeh/g, 'HAVEN');

// Export
fs.writeFileSync('apps/capture/src/styles/global.css', css);
console.log('CSS converted successfully!');
