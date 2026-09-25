import { useState, useEffect, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

let discordSdk: any;
try {
  discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID || '123456789012345678');
} catch (e) {
  console.warn('Rodando fora do Discord, SDK mockado para evitar crash.');
  discordSdk = {
    ready: () => Promise.resolve(),
    commands: {
      authorize: () => Promise.resolve({ code: 'mock-code' }),
      authenticate: () => Promise.resolve({ user: { id: 'dev', username: 'Dev User' } })
    },
    channelId: 'default-room'
  };
}

export const useDiscordSdk = () => {
  const [auth, setAuth] = useState<any>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const setupStarted = useRef(false);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    const setupDiscord = async () => {
      try {
        await discordSdk.ready();

        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID || '',
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds'],
        });

        const serverUrl = import.meta.env.VITE_SERVER_URL || '';

        const response = await fetch(`${serverUrl}/api/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Falha ao obter token: ${response.status} - ${errText}`);
        }

        const { access_token } = await response.json();
        const authResult = await discordSdk.commands.authenticate({ access_token });
        
        setAuth(authResult.user);
        
        if (discordSdk.channelId != null) {
            setChannelId(discordSdk.channelId);
        }
        setIsReady(true);
      } catch (err: any) {
        console.error('Erro na configuração do Discord SDK:', err);
        const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
        setError(new Error(errMsg));
      }
    };

    setupDiscord();
  }, []);

  return { auth, channelId, discordSdk, isReady, error };
};

export { discordSdk };
