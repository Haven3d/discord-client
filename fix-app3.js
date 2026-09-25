const fs = require('fs');
let c = fs.readFileSync('apps/client/src/App.tsx', 'utf8');

c = c.replace(/useEffect\(\(\) => \{\s*if \(\!isInsideDiscord[^}]+}[^}]+}, \[isInsideDiscord\]\);\s*/, '');
c = c.replace(/if \(error && isInsideDiscord\) \{[\s\S]*?\}\s*(?=if \(!isReady\))/, `if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '16px' }}>
          Erro: {error.message}
          <br /><br />
          <small>Verifique a conexao com a API do Discord.</small>
        </p>
      </div>
    );
  }
  
  `);
fs.writeFileSync('apps/client/src/App.tsx', c);
