const fs = require('fs');
let c = fs.readFileSync('PainelServidor.js', 'utf8');

if (!c.includes('toggleAuth')) {
    c = c.replace(/<button id="main-btn" .*?<\/button>/, 
        `$& \n        <button id="auth-btn" class="btn" style="background-color: #7289da;" onclick="toggleAuth()">Auth: Desligado</button>`);
    
    c = c.replace('let isRunning = false;', 'let isRunning = false;\n        let authEnabled = false;');
    
    c = c.replace('async function toggle() {', `async function toggleAuth() {
            document.getElementById('auth-btn').innerText = 'Aguarde...';
            await fetch('/toggleAuth', { method: 'POST' });
        }
        
        async function toggle() {`);
        
    c = c.replace('document.getElementById(\'url-box\').style.display = \'flex\';', `document.getElementById('url-box').style.display = 'flex';
            if (authEnabled) { 
                document.getElementById('auth-btn').innerText = 'Auth: Ligado'; 
                document.getElementById('auth-btn').style.backgroundColor = '#43b581'; 
            } else { 
                document.getElementById('auth-btn').innerText = 'Auth: Desligado'; 
                document.getElementById('auth-btn').style.backgroundColor = '#7289da'; 
            }`);
            
    c = c.replace('isRunning = data.isRunning;', 'isRunning = data.isRunning; authEnabled = data.authEnabled;');
    
    const statusRoute = `} else if (req.method === 'GET' && req.url === '/status') {`;
    const toggleAuthRoute = `} else if (req.method === 'POST' && req.url === '/toggleAuth') {
        const envPath = require('path').join(__dirname, 'apps/client/.env');
        let envContent = '';
        try { envContent = require('fs').readFileSync(envPath, 'utf8'); } catch(e){}
        if (envContent.includes('VITE_REQUIRE_DISCORD_AUTH=true')) {
            envContent = envContent.replace('VITE_REQUIRE_DISCORD_AUTH=true', 'VITE_REQUIRE_DISCORD_AUTH=false');
        } else {
            envContent = envContent.replace('VITE_REQUIRE_DISCORD_AUTH=false', 'VITE_REQUIRE_DISCORD_AUTH=true');
        }
        require('fs').writeFileSync(envPath, envContent);
        res.writeHead(200);
        res.end();
    `;
    c = c.replace(statusRoute, toggleAuthRoute + statusRoute);
    
    const isRunningEnd = `res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess) }));`;
    const isRunningEndNew = `res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), authEnabled: (require('fs').readFileSync(require('path').join(__dirname, 'apps/client/.env'), 'utf8').includes('true')) }));`;
    c = c.replace(isRunningEnd, isRunningEndNew);
    
    const isRunningEnd2 = `res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), tunnelUrl, logs }));`;
    const isRunningEndNew2 = `res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), tunnelUrl, logs, authEnabled: (require('fs').readFileSync(require('path').join(__dirname, 'apps/client/.env'), 'utf8').includes('true')) }));`;
    c = c.replace(isRunningEnd2, isRunningEndNew2);
    
    fs.writeFileSync('PainelServidor.js', c);
}
