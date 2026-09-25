
const fs = require('fs');
let c = fs.readFileSync('PainelServidor.js', 'utf8');

c = c.replace(/<div id="controls" style="display: flex; justify-content: center; gap: 20px;">\\s*<button id="main-btn" class="btn btn-start" onclick="toggle()">.*?<\\/button>\\s*<\\/div>/s, 
    '<div id="controls" style="display: flex; justify-content: center; gap: 20px;">\\n        <button id="main-btn" class="btn btn-start" onclick="toggle()">Ligar Servidor</button>\\n        <button id="auth-btn" class="btn" style="background-color: #7289da;" onclick="toggleAuth()">Auth: Desligado</button>\\n    </div>');

c = c.replace('let isRunning = false;', 'let isRunning = false;\\n        let authEnabled = false;');

c = c.replace('async function toggle() {', 'async function toggleAuth() {\\n            document.getElementById('auth-btn').innerText = 'Aguarde...';\\n            await fetch('/toggleAuth', { method: 'POST' });\\n        }\\n\\n        async function toggle() {');

c = c.replace('if(isRunning) {', 'if(isRunning) {');
c = c.replace('document.getElementById('url-box').style.display = 'flex';', 'document.getElementById('url-box').style.display = 'flex';\\n            if (authEnabled) { document.getElementById('auth-btn').innerText = 'Auth: Ligado'; document.getElementById('auth-btn').style.backgroundColor = '#43b581'; } else { document.getElementById('auth-btn').innerText = 'Auth: Desligado'; document.getElementById('auth-btn').style.backgroundColor = '#7289da'; }');

c = c.replace('isRunning = data.isRunning;', 'isRunning = data.isRunning; authEnabled = data.authEnabled || false;');

c = c.replace('res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess) }));', 'res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), authEnabled: (require('fs').readFileSync('apps/client/.env', 'utf8').includes('true')) }));');
c = c.replace('res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), tunnelUrl, logs }));', 'res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), tunnelUrl, logs, authEnabled: (require('fs').readFileSync('apps/client/.env', 'utf8').includes('true')) }));');

const toggleAuthEndpoint = 
    } else if (req.method === 'POST' && req.url === '/toggleAuth') {
        const envPath = require('path').join(__dirname, 'apps/client/.env');
        let envContent = require('fs').readFileSync(envPath, 'utf8');
        if (envContent.includes('VITE_REQUIRE_DISCORD_AUTH=true')) {
            envContent = envContent.replace('VITE_REQUIRE_DISCORD_AUTH=true', 'VITE_REQUIRE_DISCORD_AUTH=false');
        } else {
            envContent = envContent.replace('VITE_REQUIRE_DISCORD_AUTH=false', 'VITE_REQUIRE_DISCORD_AUTH=true');
        }
        require('fs').writeFileSync(envPath, envContent);
        res.writeHead(200);
        res.end();
;

c = c.replace('} else if (req.method === 'GET' && req.url === '/status') {', toggleAuthEndpoint + '\\n    } else if (req.method === 'GET' && req.url === '/status') {');

fs.writeFileSync('PainelServidor.js', c);

