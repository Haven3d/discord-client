const http = require('http');
const { spawn, execSync } = require('child_process');
const path = require('path');

const port = 4000;

let npmProcess = null;
let cfProcess = null;
let logs = [];
let tunnelUrl = "";

// ============================================
// MATA TODOS os processos do projeto
// ============================================
function killAllProjectProcesses() {
    try { execSync('taskkill /F /IM cloudflared.exe 2>nul', { stdio: 'ignore' }); } catch(e){}
    try { execSync('taskkill /F /IM ngrok.exe 2>nul', { stdio: 'ignore' }); } catch(e){}
    
    // Mata todos os node.exe EXCETO o próprio painel (PID atual)
    const myPid = process.pid;
    try {
        const result = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH', { encoding: 'utf-8' });
        const lines = result.trim().split('\n');
        for (const line of lines) {
            const match = line.match(/"node\.exe","(\d+)"/);
            if (match) {
                const pid = parseInt(match[1]);
                if (pid !== myPid) {
                    try { execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: 'ignore' }); } catch(e){}
                }
            }
        }
    } catch(e) {
        try { execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'ignore' }); } catch(e){}
    }
    
    for (const p of [3001, 5173, 5174]) {
        try {
            const netstat = execSync(`netstat -ano | findstr :${p} | findstr LISTENING`, { encoding: 'utf-8' });
            const lines = netstat.trim().split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parseInt(parts[parts.length - 1]);
                if (pid && pid !== myPid) {
                    try { execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: 'ignore' }); } catch(e){}
                }
            }
        } catch(e){}
    }
}

const htmlPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Haven 3D - Painel do Servidor</title>
    <style>
        body { background-color: #2c2f33; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin: 0; padding-top: 40px; }
        h1 { color: #ffffff; font-weight: 600; margin-bottom: 30px;}
        .btn { padding: 15px 40px; font-size: 20px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; color: white; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2);}
        .btn:active { transform: translateY(2px); box-shadow: none; }
        .btn-start { background-color: #43b581; }
        .btn-start:hover { background-color: #3ca374; }
        .btn-stop { background-color: #f04747; }
        .btn-stop:hover { background-color: #d84040; }
        #url-box { margin: 20px auto; padding: 15px 25px; background: #23272a; border-radius: 8px; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; gap: 15px; border: 1px solid #7289da; flex-direction: column;}
        .url-row { display: flex; align-items: center; gap: 15px; }
        #tunnel-url { color: #43b581; font-weight: bold; letter-spacing: 0.5px;}
        #copy-btn { padding: 8px 15px; font-size: 14px; font-weight: bold; background: #7289da; border: none; color: white; border-radius: 5px; cursor: pointer; transition: 0.2s;}
        #copy-btn:hover { background: #5b6eae; }
        #discord-status { margin: 10px auto; padding: 10px 20px; border-radius: 6px; font-size: 15px; font-weight: 600; background: #faa61a22; color: #faa61a; border: 1px solid #faa61a; display: none; max-width: 600px;}
        #logs-container { margin-top: 30px; text-align: left; width: 80%; margin-left: 10%; }
        h3 { margin-bottom: 5px; color: #b9bbbe; font-size: 14px; text-transform: uppercase;}
        #logs { background: #18191c; color: #43b581; font-family: 'Consolas', monospace; font-size: 13px; padding: 15px; height: 350px; overflow-y: auto; border-radius: 5px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);}
    </style>
</head>
<body>
    <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" width="60" style="margin-bottom: 10px; filter: grayscale(100%) brightness(200%);">
    <h1>Gerenciador de Servidor - Haven 3D</h1>
    
    <div id="controls" style="display: flex; justify-content: center; gap: 20px;">
        <button id="main-btn" class="btn btn-start" onclick="toggle()">🚀 Ligar Servidor</button> 
        
    </div>
    
    <div id="url-box" style="display:none;">
        <div class="url-row">
            <span style="color: #b9bbbe;">🔗 Túnel Fixo (Cloudflare Zero Trust):</span> 
            <span id="tunnel-url">https://discord.haven3d.com.br</span>
            <button id="copy-btn" onclick="copyUrl()">Copiar Link</button>
        </div>
        <div id="discord-status">
            ⚠️ <b>Ação Necessária (Apenas uma vez):</b> Cole o link acima no <br><a href="https://discord.com/developers/applications/1552395456338731068/url-mappings" target="_blank" style="color: #fff; text-decoration: underline;">Discord Developer Portal (URL Mappings)</a>. Como o link agora é FIXO, você nunca mais precisará fazer isso!
        </div>
    </div>
    
    <div id="logs-container">
        <h3>Terminal do Sistema</h3>
        <div id="logs">Servidor offline. Clique em "Ligar Servidor" para iniciar.</div>
    </div>

    <script>
        let isRunning = false;
        let authEnabled = false;
        
        );
        }
        
        async function toggle() {
            document.getElementById('main-btn').disabled = true;
            document.getElementById('main-btn').innerText = '⏳ Aguarde...';
            const res = await fetch('/toggle', { method: 'POST' });
            const data = await res.json();
            isRunning = data.isRunning; authEnabled = data.authEnabled;
            document.getElementById('main-btn').disabled = false;
            updateUI();
        }

        function updateUI() {
            const btn = document.getElementById('main-btn');
            if(isRunning) {
                btn.className = 'btn btn-stop';
                btn.innerText = '🛑 Desligar Servidor';
                document.getElementById('url-box').style.display = 'flex';
            
            } else {
                btn.className = 'btn btn-start';
                btn.innerText = '🚀 Ligar Servidor';
                document.getElementById('url-box').style.display = 'none';
            }
        }

        function copyUrl() {
            const text = document.getElementById('tunnel-url').innerText;
            navigator.clipboard.writeText(text);
            const btn = document.getElementById('copy-btn');
            btn.innerText = 'Copiado!';
            btn.style.background = '#43b581';
            setTimeout(() => {
                btn.innerText = 'Copiar Link';
                btn.style.background = '#7289da';
            }, 2000);
        }

        setInterval(async () => {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                
                isRunning = data.isRunning;
                updateUI();
                
                const tunnelUrlEl = document.getElementById('tunnel-url');
                const copyBtn = document.getElementById('copy-btn');
                const discordStatusEl = document.getElementById('discord-status');
                
                if(isRunning) {
                    discordStatusEl.style.display = 'block';
                } else {
                    discordStatusEl.style.display = 'none';
                }

                if (data.logs && data.logs.length > 0) {
                    const logsDiv = document.getElementById('logs');
                    logsDiv.innerHTML = data.logs.join('<br>');
                    logsDiv.scrollTop = logsDiv.scrollHeight;
                }
            } catch (e) {}
        }, 1000);
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlPage);
    } else if (req.method === 'POST' && req.url === '/toggle') {
        if (npmProcess || cfProcess) {
            logs.push("🛑 Desligando todos os processos...");
            
            npmProcess = null;
            cfProcess = null;
            tunnelUrl = "";
            
            killAllProjectProcesses();
            
            logs.push("✅ Todos os processos foram encerrados.");
        } else {
            killAllProjectProcesses();
            
            logs = ["🚀 Iniciando sistema..."];
            tunnelUrl = "";
            
            npmProcess = spawn('npm', ['run', 'dev'], { shell: true, cwd: __dirname });
            npmProcess.stdout.on('data', d => {
                const txt = d.toString().trim();
                if(txt) logs.push('[Local] ' + txt.replace(/\n/g, '<br>[Local] '));
            });
            npmProcess.stderr.on('data', d => {
                const txt = d.toString().trim();
                if(txt && !txt.includes('DeprecationWarning')) logs.push('[Local] ' + txt);
            });
            
            logs.push("⏳ Aguardando Vite iniciar (3s)...");
            setTimeout(() => {
                logs.push("🌐 Iniciando túnel permanente Cloudflare Zero Trust...");
                tunnelUrl = "https://discord.haven3d.com.br";
                
                cfProcess = spawn(path.join(__dirname, 'cloudflared.exe'), ['tunnel', '--config', 'config.yml', 'run', 'discord-haven'], { shell: false });
                
                cfProcess.stdout.on('data', d => {
                    const line = d.toString().trim();
                    if(line) logs.push('[Cloudflare] ' + line);
                });
                cfProcess.stderr.on('data', d => {
                    const line = d.toString().trim();
                    if(line) logs.push('[Cloudflare] ' + line);
                    
                    if (line.includes('Registered tunnel connection')) {
                        logs.push('<span style="color: #43b581">🔗 TÚNEL ATIVO: ' + tunnelUrl + '</span>');
                    }
                });
                
                cfProcess.on('exit', (code) => {
                    logs.push('[Cloudflare] Processo encerrado (code: ' + code + ')');
                });
            }, 3000);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), authEnabled: (require('fs').readFileSync(require('path').join(__dirname, 'apps/client/.env'), 'utf8').includes('true')) }));
     else if (req.method === 'GET' && req.url === '/status') {
        if (logs.length > 100) logs = logs.slice(logs.length - 100);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ isRunning: !!(npmProcess || cfProcess), tunnelUrl, logs, authEnabled: (require('fs').readFileSync(require('path').join(__dirname, 'apps/client/.env'), 'utf8').includes('true')) }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

function openAppWindow() {
    const url = 'http://localhost:' + port;
    const cmd = process.platform === 'win32' 
        ? `start chrome --app=${url} || start msedge --app=${url} || start ${url}`
        : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    try {
        require('child_process').execSync(cmd);
    } catch (e) {
        console.error(e);
    }
}

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        openAppWindow();
        process.exit(0);
    }
});

server.listen(port, () => {
    openAppWindow();
});
