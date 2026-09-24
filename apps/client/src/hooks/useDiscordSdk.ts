import { useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID || '');

export const useDiscordSdk = () => {
  const [auth, setAuth] = useState<any>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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

        const isDev = import.meta.env.DEV;
        const serverUrl = isDev ? 'http://localhost:3001' : '';

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
      } catch (err) {
        console.error('Erro na configuração do Discord SDK:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      }
    };

    setupDiscord();
  }, []);

  return { auth, channelId, discordSdk, isReady, error };
};

export { discordSdk };
