const check = async () => {
  const r = await fetch('https://discord-client-client.vercel.app/');
  const html = await r.text();
  const match = html.match(/src="(\/assets\/index-.*?\.js)"/);
  if (match) {
    const js = await (await fetch('https://discord-client-client.vercel.app' + match[1])).text();
    console.log('Includes Client ID?', js.includes('1552395456338731068'));
  }
};
check();
