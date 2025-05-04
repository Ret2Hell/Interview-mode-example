"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export const useAudioWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current) return;

    const socket = new WebSocket("ws://localhost:8000/ws/audio-stream");
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const data = JSON.parse(event.data);
          console.log("Transcript:", data.transcript);
        } catch (e) {
          console.error("Failed to parse JSON message:", event.data, e);
        }
      } else {
        // audio Blob or ArrayBuffer
        console.log("Received audio data");
        const audioBlob = new Blob([event.data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch((e) => console.error("Error playing audio:", e));
      }
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
      socketRef.current = null;
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
      setIsConnected(false);
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up WebSocket connection");
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, []);

  const sendAudio = useCallback((audioBuffer: ArrayBuffer) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending audio data...");
      socketRef.current.send(audioBuffer);
    } else {
      console.error("WebSocket is not connected or not ready.");
    }
  }, []);

  return { connect, sendAudio, isConnected };
};
