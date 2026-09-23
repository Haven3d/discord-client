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

        // Use current origin if VITE_SERVER_URL is not set (Discord Proxy)
        const isDev = import.meta.env.DEV;
        let serverUrl = import.meta.env.VITE_SERVER_URL?.replace(/\/$/, '') || (isDev ? 'http://localhost:3001' : '');
        
        // Driblando o Vercel enviroment - se for a mesma url do client, usamos proxy
        if (serverUrl.includes('discord-client-server')) {
             serverUrl = ''; // Força usar o proxy do discord (.discordsays.com)
        }

        const response = await fetch(`${serverUrl}/api/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Falha ao obter token');
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
