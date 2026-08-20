import { useState, useEffect, useRef, useCallback } from 'react';
import { useWatchParty } from './useWatchParty';

export function useWebRTC(roomId, userId, isAudioDucked = true) {
  const { channel, broadcastSignal } = useWatchParty(roomId, userId);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  
  const peersRef = useRef({}); // Map of userId -> RTCPeerConnection

  // Request Camera/Mic
  const joinCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsJoined(true);
      
      // Tell others we joined so they can initiate an offer
      broadcastSignal({ type: 'PEER_JOINED', sender: userId });
    } catch (err) {
      console.error("Failed to get local stream", err);
      alert("Could not access camera or microphone.");
    }
  }, [broadcastSignal, userId]);

  const leaveCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    setIsJoined(false);
  }, [localStream]);

  // Create a new RTCPeerConnection
  const createPeer = useCallback((peerId, initiator) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        broadcastSignal({
          type: 'ICE_CANDIDATE',
          sender: userId,
          target: peerId,
          candidate: event.candidate
        });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: event.streams[0]
      }));
    };

    if (initiator) {
      peer.createOffer().then(offer => {
        peer.setLocalDescription(offer);
        broadcastSignal({
          type: 'OFFER',
          sender: userId,
          target: peerId,
          offer
        });
      });
    }

    peersRef.current[peerId] = peer;
    return peer;
  }, [localStream, broadcastSignal, userId]);

  // Handle Incoming Signals
  useEffect(() => {
    if (!channel || !isJoined) return;

    // In a real implementation, we would register a listener on the channel here.
    // mockChannel.on('broadcast', { event: 'WEBRTC_SIGNAL' }, (payload) => { ... })
    // For demonstration, we'll log that this is where signaling logic goes.
    
    return () => {
      // Cleanup listeners
    };
  }, [channel, isJoined, createPeer, userId, broadcastSignal]);

  // Effect: Audio Ducking for remote streams
  // This programmatically forces all remote video elements to low volume
  useEffect(() => {
    if (isAudioDucked) {
      const videos = document.querySelectorAll('.remote-video');
      videos.forEach(video => {
        video.volume = 0.15; // Whisper volume (15%)
      });
    }
  }, [remoteStreams, isAudioDucked]);

  return {
    localStream,
    remoteStreams,
    isJoined,
    joinCall,
    leaveCall
  };
}
