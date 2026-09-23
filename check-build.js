const check = async () => {
  const r = await fetch('https://discord-client-client.vercel.app/');
  const html = await r.text();
  const match = html.match(/src="(\/assets\/index-.*?\.js)"/);
  if (match) {
    const js = await (await fetch('https://discord-client-client.vercel.app' + match[1])).text();
    console.log('Using localhost:', js.includes('localhost:3001'));
    console.log('Using correct Vercel url:', js.includes('discord-client-server.vercel.app'));
  }
};
check();
