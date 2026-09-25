const fs = require('fs');
let c = fs.readFileSync('PainelServidor.js', 'utf8');

// Remove HTML button
c = c.replace(/<button id="auth-btn".*?<\/button>/g, '');

// Remove UI update logic
c = c.replace(/if\s*\(authEnabled\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?#7289da';\s*\}/g, '');

// Remove toggleAuth script function
c = c.replace(/async function toggleAuth\(\)\s*\{[\s\S]*?\}/g, '');

// Remove HTTP endpoint
c = c.replace(/\} else if \(req.method === 'POST' && req.url === '\/toggleAuth'\) \{[\s\S]*?res\.end\(\);\s*\}/g, '');

// Save back
fs.writeFileSync('PainelServidor.js', c);
