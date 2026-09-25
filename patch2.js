const fs = require('fs'); let c = fs.readFileSync('apps/client/src/App.tsx', 'utf8');
c = c.replace(/const isInsideDiscord = import\.meta\.env\.VITE_REQUIRE_DISCORD_AUTH === 'true';\\s*/, '');
c = c.replace(/useEffect\\(\\(\\)[^}]+setWatchingStreamerId\\(null\\);\\s*}\\s*}, \\[watchingStreamerId, activeStreamers\\]\\);\\s*useEffect\\(\\(\\) => {\\s*if \\(!isInsideDiscord[^}]+role: 'viewer' }\\);\\s*}\\s*}, \\[isInsideDiscord\\]\\);/, 
'useEffect(() => {\\n    if (watchingStreamerId && !activeStreamers.includes(watchingStreamerId)) {\\n      setWatchingStreamerId(null);\\n    }\\n  }, [watchingStreamerId, activeStreamers]);');
c = c.replace(/if \\(isReady && auth && channelId\\) {/, 'if (isReady && auth) {\\n      channelId = channelId || 'default-room';');
c = c.replace(/if \\(error && isInsideDiscord\\) {[\\s\\S]*?<small>Abra este link por dentro do Discord.*?<\\/small>[\\s\\S]*?<\\/div>\\s*\\);\\s*}/, 
'if (error) {\\n    return (\\n      <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#1e1e1e', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>\\n        <p style={{ color: '#ef4444' }}>\\n          Erro: {error.message}\\n          <br /><br />\\n          <small>Verifique a conexao com a API do Discord.</small>\\n        </p>\\n      </div>\\n    );\\n  }');
fs.writeFileSync('apps/client/src/App.tsx', c);

