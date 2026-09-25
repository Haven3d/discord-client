const fs = require('fs');

let css = fs.readFileSync('apps/capture/src/App.tsx', 'utf8');

css = css.replace(/Sessǜo/g, 'Sessão');
css = css.replace(/sessǜo/g, 'sessão');
css = css.replace(/invǭlida/g, 'inválida');
css = css.replace(/invǭlido/g, 'inválido');
css = css.replace(/indisponvel/g, 'indisponível');

fs.writeFileSync('apps/capture/src/App.tsx', css);
