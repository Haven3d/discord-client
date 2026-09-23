const fs = require('fs');

let m = fs.readFileSync('apps/capture/src/main.tsx', 'utf8');
m = m.replace(/App\.tsx/g, 'App');
fs.writeFileSync('apps/capture/src/main.tsx', m);

let w = fs.readFileSync('apps/capture/src/services/webrtc-sender.ts', 'utf8');
w = w.replace(/constructor\(socket: Socket, channelId: string\)/, 'constructor(socket: Socket, _channelId: string)');
fs.writeFileSync('apps/capture/src/services/webrtc-sender.ts', w);
console.log('Fixed more');
