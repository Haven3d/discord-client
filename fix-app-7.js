const fs = require('fs');
let lines = fs.readFileSync('apps/client/src/App.tsx', 'utf8').split(/\r?\n/);

lines = lines.map(line => {
    if (line.includes('if (isReady && auth) {\\n      const roomToJoin = channelId || "default-room";')) {
        return '    if (isReady && auth) {\n      const roomToJoin = channelId || "default-room";';
    }
    if (line.includes('const isInsideDiscord = import.meta.env.VITE_REQUIRE_DISCORD_AUTH === \'true\';')) {
        return '';
    }
    if (line.includes('Lê do painel de controle se a autenticação estrita do Discord é exigida')) {
        return '';
    }
    if (line.includes('if (error && isInsideDiscord) {')) {
        return '  if (error) {';
    }
    if (line.includes('Abra este link por dentro do Discord (como uma Activity) ou mude isInsideDiscord para false no App.tsx para testar o layout.')) {
        return '          <small>Verifique a conexao com a API do Discord.</small>';
    }
    return line;
});

fs.writeFileSync('apps/client/src/App.tsx', lines.join('\n'));
