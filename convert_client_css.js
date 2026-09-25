const fs = require('fs');

let css = fs.readFileSync('ref/client_reference.css', 'utf8');

// Colors
css = css.replace(/--c-orange: #FF8D07/g, '--c-orange: #8A2BE2');
css = css.replace(/--c-orange-bright: #FFA033/g, '--c-orange-bright: #9B30FF');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.16\)/g, 'rgba(138, 43, 226, 0.3)');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.08\)/g, 'rgba(138, 43, 226, 0.12)');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.22\)/g, 'rgba(138, 43, 226, 0.3)');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.1\)/g, 'rgba(138, 43, 226, 0.15)');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.32\)/g, 'rgba(138, 43, 226, 0.4)');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.12\)/g, 'rgba(138, 43, 226, 0.18)');
css = css.replace(/rgba\(255,\s*141,\s*7,\s*0\.3\)/g, 'rgba(138, 43, 226, 0.4)');
css = css.replace(/rgba\(255,141,7,/g, 'rgba(138,43,226,');
css = css.replace(/--accent:\s*#FF8D07/g, '--accent: #8A2BE2');
css = css.replace(/--accent-hover:\s*#FFA033/g, '--accent-hover: #9B30FF');
css = css.replace(/--accent-hover:\s*#E67A00/g, '--accent-hover: #7b2cbf');
css = css.replace(/#FF8D07/g, '#8A2BE2'); 

// Text / Branding
css = css.replace(/Xispeh/g, 'HAVEN');

// Export
fs.writeFileSync('apps/client/src/styles/global.css', css);
console.log('Client CSS converted successfully!');
