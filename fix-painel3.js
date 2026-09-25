const fs = require('fs'); let c = fs.readFileSync('PainelServidor.js', 'utf8'); const newScript =  + '' + <script>
        let isRunning = false;
        let authEnabled = false;
        async function fetchStatus() {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                isRunning = data.isRunning;
                authEnabled = data.authEnabled;
                
                const btn = document.getElementById('main-btn');
                const authBtn = document.getElementById('auth-btn');
                const urlBox = document.getElementById('url-box');
                const tunnelUrl = document.getElementById('tunnel-url');
                
                if (isRunning) {
                    btn.className = 'btn btn-stop';
                    btn.innerHTML = 'Desligar Servidor';
                    urlBox.style.display = 'flex';
                    if (data.tunnelUrl) {
                        tunnelUrl.innerText = data.tunnelUrl;
                        document.getElementById('discord-status').style.display = 'block';
                    }
                } else {
                    btn.className = 'btn btn-start';
                    btn.innerHTML = 'Ligar Servidor';
                    urlBox.style.display = 'none';
                    document.getElementById('discord-status').style.display = 'none';
                }
                
                if (authEnabled) {
                    authBtn.innerHTML = 'Auth: Ligado';
                    authBtn.style.backgroundColor = '#43b581';
                } else {
                    authBtn.innerHTML = 'Auth: Desligado';
                    authBtn.style.backgroundColor = '#7289da';
                }
                
                if (data.logs && data.logs.length > 0) {
                    const logsDiv = document.getElementById('logs');
                    logsDiv.innerHTML = data.logs.join('<br>');
                    logsDiv.scrollTop = logsDiv.scrollHeight;
                }
            } catch(e) {}
        }
        
        async function toggle() {
            const btn = document.getElementById('main-btn');
            btn.innerHTML = 'Aguarde...';
            await fetch('/toggle', { method: 'POST' });
            setTimeout(fetchStatus, 1000);
        }
        
        async function toggleAuth() {
            const btn = document.getElementById('auth-btn');
            btn.innerHTML = 'Aguarde...';
            await fetch('/toggleAuth', { method: 'POST' });
            fetchStatus();
        }
 + '' + ; c = c.replace(/<script>[\\s\\S]*?<\\/script>/, newScript + '</script>'); fs.writeFileSync('PainelServidor.js', c);
