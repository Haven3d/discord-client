import React from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

interface StartButtonProps {
  discordSdk: DiscordSDK;
  channelId: string | null;
  userId: string;
}

export const StartButton: React.FC<StartButtonProps> = ({ discordSdk, channelId, userId }) => {
  const handleStart = () => {
    const captureUrl = import.meta.env.VITE_CAPTURE_URL || 'https://discord-capture.vercel.app';
    const url = new URL(captureUrl);
    
    if (channelId) url.searchParams.set('channelId', channelId);
    if (userId) url.searchParams.set('userId', userId);

    discordSdk.commands.openExternalLink({ url: url.toString() });
  };

  return (
    <button
      onClick={handleStart}
      style={{
        backgroundColor: 'var(--accent)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
      Transmitir Tela
    </button>
  );
};
