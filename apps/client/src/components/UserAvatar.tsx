import React from 'react';

interface UserAvatarProps {
  user: {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
  };
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img
        src={avatarUrl}
        alt={`${user.username}'s avatar`}
        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
      />
      <span style={{ fontWeight: 500 }}>{user.username}</span>
    </div>
  );
};
