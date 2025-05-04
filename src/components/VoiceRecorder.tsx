"use client";
import { useAudioWebSocket } from "@/hooks/useWebSocket";
import { useRef, useState } from "react";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { sendAudio, isConnected } = useAudioWebSocket();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm;codecs=opus" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, processing audio...");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const arrayBuffer = await audioBlob.arrayBuffer();
        console.log(
          `Sending audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`
        );
        sendAudio(arrayBuffer);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      console.log("MediaRecorder not active or not recording.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-8">
      <p>Connection Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!isConnected && !isRecording}
        className={`px-6 py-3 text-white font-bold rounded ${
          isRecording ? "bg-red-500" : "bg-green-500"
        } ${
          !isConnected && !isRecording ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isRecording ? "Stop" : "Start"} Recording
      </button>
    </div>
  );
}
