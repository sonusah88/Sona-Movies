import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../lib/supabaseClient'; // Expected to be implemented by user

/**
 * Custom hook to manage Supabase Realtime Watch Party synchronization.
 * Because we use third-party iframes (CORS restricted), this relies on 
 * manual "Sync Play", "Sync Pause" events triggered by the host.
 */
export function useWatchParty(roomId, userId) {
  const [participants, setParticipants] = useState([]);
  const [roomState, setRoomState] = useState({ isPlaying: false, hostId: null });
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    // 1. Initialize Supabase Realtime Channel
    // const roomChannel = supabase.channel(`watch_party:${roomId}`, {
    //   config: {
    //     presence: { key: userId },
    //     broadcast: { self: true },
    //   },
    // });

    // Mocking the channel for now until Supabase client is installed
    const mockChannel = {
      send: (params) => {
        console.log(`[WatchParty] Broadcast event:`, params);
        // Simulate broadcast self
        handleBroadcast(params);
      },
      unsubscribe: () => console.log(`[WatchParty] Unsubscribed from ${roomId}`)
    };
    
    setChannel(mockChannel);

    // 2. Listen to Presence State (Who is in the room)
    /*
    roomChannel.on('presence', { event: 'sync' }, () => {
      const state = roomChannel.presenceState();
      const currentParticipants = Object.keys(state).map(key => state[key][0]);
      setParticipants(currentParticipants);
    });
    */

    // 3. Listen to Broadcast Events (Play/Pause commands from host)
    const handleBroadcast = ({ type, event, payload }) => {
      if (type === 'broadcast') {
        switch (event) {
          case 'SYNC_PLAY':
            console.log("🎬 Host initiated Play!");
            setRoomState(prev => ({ ...prev, isPlaying: true }));
            // We would trigger a visual indicator here for the user to manually click play
            break;
          case 'SYNC_PAUSE':
            console.log("⏸️ Host initiated Pause!");
            setRoomState(prev => ({ ...prev, isPlaying: false }));
            break;
          default:
            break;
        }
      }
    };

    /*
    roomChannel.on('broadcast', { event: 'SYNC_PLAY' }, handleBroadcast);
    roomChannel.on('broadcast', { event: 'SYNC_PAUSE' }, handleBroadcast);
    
    // Subscribe to the channel
    roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await roomChannel.track({ user_id: userId, joined_at: new Date().toISOString() });
      }
    });

    return () => {
      roomChannel.unsubscribe();
    };
    */
   
    return () => mockChannel.unsubscribe();
  }, [roomId, userId]);

  // Actions for the Host
  const broadcastPlay = useCallback(() => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'SYNC_PLAY',
        payload: { timestamp: Date.now() }
      });
    }
  }, [channel]);

  const broadcastPause = useCallback(() => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'SYNC_PAUSE',
        payload: { timestamp: Date.now() }
      });
    }
  }, [channel]);

  return {
    participants,
    roomState,
    broadcastPlay,
    broadcastPause
  };
}
