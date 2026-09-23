export interface UserInfo {
  id: string;
  username: string;
  avatar: string;
}

export interface Room {
  participants: Map<string, UserInfo>;
  streamers: Set<string>;
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();

  getRoom(channelId: string): Room | undefined {
    return this.rooms.get(channelId);
  }

  joinRoom(channelId: string, socketId: string, userInfo: UserInfo): void {
    if (!this.rooms.has(channelId)) {
      this.rooms.set(channelId, {
        participants: new Map(),
        streamers: new Set(),
      });
    }

    const room = this.rooms.get(channelId)!;
    room.participants.set(socketId, userInfo);
  }

  leaveRoom(channelId: string, socketId: string): void {
    const room = this.rooms.get(channelId);
    if (!room) return;

    room.participants.delete(socketId);
    room.streamers.delete(socketId);

    if (room.participants.size === 0) {
      this.rooms.delete(channelId);
    }
  }

  startStream(channelId: string, socketId: string): void {
    const room = this.rooms.get(channelId);
    if (room) {
      room.streamers.add(socketId);
    }
  }

  stopStream(channelId: string, socketId: string): void {
    const room = this.rooms.get(channelId);
    if (room) {
      room.streamers.delete(socketId);
    }
  }

  getRoomParticipants(channelId: string): { socketId: string; user: UserInfo }[] {
    const room = this.rooms.get(channelId);
    if (!room) return [];

    return Array.from(room.participants.entries()).map(([socketId, user]) => ({
      socketId,
      user,
    }));
  }

  removeParticipantFromAllRooms(socketId: string): void {
    for (const [channelId, room] of this.rooms.entries()) {
      if (room.participants.has(socketId)) {
        this.leaveRoom(channelId, socketId);
      }
    }
  }
}

export const roomManager = new RoomManager();
