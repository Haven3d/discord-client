const fs = require('fs');
let c = fs.readFileSync('apps/client/src/App.tsx', 'utf8');

c = c.replace(/  useEffect\(\(\) => \{\n    if \(!isInsideDiscord && !socketService\.getSocket\(\)\) \{\n      connectSocket\(\{ room: 'default-room', uid: 'dev-user', name: 'Dev User', role: 'viewer' \}\);\n    \}\n  \}, \[isInsideDiscord\]\);\n\n/g, '');

c = c.replace(/if \(isReady && auth && channelId\) \{/g, 'if (isReady && auth) {\\n      const roomToJoin = channelId || \\'default-room\\';');
c = c.replace(/room: channelId,/g, 'room: roomToJoin,');

c = c.replace(/  if \(error && isInsideDiscord\) \{\n    return \(\n      <div style=\{\{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' \}\}>\n        <p style=\{\{ color: '#ef4444', fontSize: '16px' \}\}>\n          Erro: \{error\.message\}\n          <br \/><br \/>\n          <small>Abra este link por dentro do Discord \(como uma Activity\) ou mude isInsideDiscord para false no App\.tsx para testar o layout\.</small>\n        <\/p>\n      <\/div>\n    \);\n  \}/g, `  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>
          Erro: {error.message}
          <br /><br />
          <small>Verifique a conexão com a API do Discord.</small>
        </p>
      </div>
    );
  }`);

fs.writeFileSync('apps/client/src/App.tsx', c);
