const fs = require('fs');
let c = fs.readFileSync('apps/client/src/App.tsx', 'utf8');

c = c.replace(`  // L\\xc3\\xaata do painel de controle se a autentica\\xc3\\x83\\xc2\\xac\\xc3\\x83\\xc2\\xbco estrita do Discord \\xc3\\x83\\xc2\\xb8 exigida\\n  const isInsideDiscord = import.meta.env.VITE_REQUIRE_DISCORD_AUTH === 'true'; \\n\\n`, '');
c = c.replace(`  // L\\xc3\\x87 do painel de controle se a autentica\\xc3\\x9c\\xc3\\x8do estrita do Discord \\xc3\\x87 exigida\n  const isInsideDiscord = import.meta.env.VITE_REQUIRE_DISCORD_AUTH === 'true'; \n\n`, '');
c = c.replace(/\/\/ L.*?\n  const isInsideDiscord.*?\n\n/, '');

c = c.replace(/  useEffect\(\(\) => \{\r?\n    if \(!isInsideDiscord && !socketService\.getSocket\(\)\) \{\r?\n      connectSocket\(\{ room: 'default-room', uid: 'dev-user', name: 'Dev User', role: 'viewer' \}\);\r?\n    \}\r?\n  \}, \[isInsideDiscord\]\);\r?\n\r?\n/, '');

c = c.replace(/if \(isReady && auth && channelId\) \{/, 'if (isReady && auth) {\\n      const roomToJoin = channelId || "default-room";');
c = c.replace(/room: channelId,/, 'room: roomToJoin,');

const oldErrorBlock = `  if (error && isInsideDiscord) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>
          Erro: {error.message}
          <br /><br />
          <small>Abra este link por dentro do Discord (como uma Activity) ou mude isInsideDiscord para false no App.tsx para testar o layout.</small>
        </p>
      </div>
    );
  }`;

const newErrorBlock = `  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>
          Erro: {error.message}
          <br /><br />
          <small>Verifique a conexão com a API do Discord.</small>
        </p>
      </div>
    );
  }`;

c = c.replace(oldErrorBlock, newErrorBlock);

c = c.replace(/  if \(!isInsideDiscord && false\) \{\r?\n     \/\/ ignoring old branch\r?\n  \}\r?\n/, '');

c = c.replace(/<button id="fullscreen" className="btn" data-tip="Tela cheia" aria-label="Tela cheia" onClick=\{\(\) => \{\r?\n                  const videoContainer = document.getElementById\('video-container'\);\r?\n                  if \(videoContainer\) \{\r?\n                    if \(!document.fullscreenElement\) \{\r?\n                      videoContainer.requestFullscreen\(\).catch\(\(err\) => \{\r?\n                        console.log\(\`Erro ao tentar tela cheia: \$\{err.message\}\`\);\r?\n                      \}\);\r?\n                    \} else \{\r?\n                      document.exitFullscreen\(\);\r?\n                    \}\r?\n                  \}\r?\n                \}\}>/, 
`<button id="fullscreen" className="btn" data-tip="Tela cheia" aria-label="Tela cheia" onClick={() => {
                  const videoContainer = document.getElementById('video-container');
                  if (videoContainer) {
                    const isCssFullscreen = videoContainer.classList.contains('css-fullscreen');
                    if (!document.fullscreenElement && !isCssFullscreen) {
                      videoContainer.requestFullscreen().catch((err) => {
                        console.log('Fallback CSS tela cheia (Discord block)');
                        videoContainer.classList.add('css-fullscreen');
                      });
                    } else {
                      if (document.fullscreenElement) { document.exitFullscreen().catch(()=>{}); }
                      videoContainer.classList.remove('css-fullscreen');
                    }
                  }
                }}>`);

fs.writeFileSync('apps/client/src/App.tsx', c);
