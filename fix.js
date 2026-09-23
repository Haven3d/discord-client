const fs = require('fs');
const files = [
  'apps/capture/src/components/CameraPreview.tsx',
  'apps/capture/src/components/CapturePanel.tsx',
  'apps/capture/src/components/QualitySelector.tsx',
  'apps/capture/src/components/StreamStatus.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import React(?:, \{.*?\})? from 'react';\r?\n/g, (m) => m.includes('{') ? m.replace('React, ', '').replace('React ', '') : '');
  fs.writeFileSync(f, c);
});
let m = fs.readFileSync('apps/capture/src/main.tsx', 'utf8');
m = m.replace(/import React from 'react';\r?\n/, '');
m = m.replace(/<React.StrictMode>/g, '<StrictMode>').replace(/<\/React.StrictMode>/g, '</StrictMode>');
m = "import { StrictMode } from 'react';\n" + m;
fs.writeFileSync('apps/capture/src/main.tsx', m);
console.log('Fixed');
