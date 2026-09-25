const fs = require('fs');
let c = fs.readFileSync('apps/client/src/App.tsx', 'utf8');
let lines = c.split('\n');
let out = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Remove "if (!isInsideDiscord && false) {" block
    if (line.includes('if (!isInsideDiscord && false) {')) {
        skip = true;
        continue;
    }
    
    // Remove "if (error && isInsideDiscord)" block
    if (line.includes('if (error && isInsideDiscord) {')) {
        skip = true;
        out.push('  if (error) {');
        out.push('    return (');
        out.push('      <div style={{ display: \\'flex\\', justifyContent: \\'center\\', alignItems: \\'center\\', height: \\'100vh\\', padding: \\'20px\\', textAlign: \\'center\\' }}>');
        out.push('        <p style={{ color: \\'#ef4444\\', fontSize: \\'16px\\' }}>');
        out.push('          Erro: {error.message}');
        out.push('          <br /><br />');
        out.push('          <small>Verifique a conexao com a API do Discord.</small>');
        out.push('        </p>');
        out.push('      </div>');
        out.push('    );');
        out.push('  }');
        continue;
    }
    
    if (skip && line.includes('  }')) {
        skip = false;
        continue;
    }
    if (skip) continue;

    // Remove connectSocket for !isInsideDiscord
    if (line.includes('if (!isInsideDiscord && !socketService.getSocket()) {')) {
        out.pop(); // remove `useEffect(() => {`
        skip = true;
        continue;
    }
    if (skip && line.includes('}, [isInsideDiscord]);')) {
        skip = false;
        continue;
    }

    out.push(line);
}

fs.writeFileSync('apps/client/src/App.tsx', out.join('\n'));
