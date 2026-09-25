const fs = require('fs');
let c = fs.readFileSync('apps/client/src/App.tsx', 'utf8');

c = c.replace(/const isInsideDiscord = import\.meta\.env\.VITE_REQUIRE_DISCORD_AUTH === 'true';\s*/g, '');

c = c.replace(/useEffect\(\(\) => \{\s*if \(\!isInsideDiscord[^}]+\}\s*\}, \[isInsideDiscord\]\);\s*/g, '');

c = c.replace(/if \(error && isInsideDiscord\) \{[\s\S]*?\}\s*if \(\!isReady\)/, `if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>
          Erro: {error.message}
          <br /><br />
          <small>Verifique se a API do Discord esta rodando ou se você esta em um ambiente seguro (https/localhost).</small>
        </p>
      </div>
    );
  }

  if (!isReady)`);
  
c = c.replace(/<button id="fullscreen".*?onClick=\{.*?\}\s*>\s*<svg/s, `<button id="fullscreen" className="btn" data-tip="Tela cheia" aria-label="Tela cheia" onClick={() => {
                  const videoContainer = document.getElementById('video-container');
                  if (videoContainer) {
                    const isCssFullscreen = videoContainer.classList.contains('css-fullscreen');
                    if (!document.fullscreenElement && !isCssFullscreen) {
                      videoContainer.requestFullscreen().catch((err) => {
                        console.log('Fallback CSS tela cheia');
                        videoContainer.classList.add('css-fullscreen');
                      });
                    } else {
                      if (document.fullscreenElement) { document.exitFullscreen().catch(()=>{}); }
                      videoContainer.classList.remove('css-fullscreen');
                    }
                  }
                }}>
                  <svg`);

fs.writeFileSync('apps/client/src/App.tsx', c);
