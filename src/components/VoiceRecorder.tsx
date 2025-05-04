"use client";
import { useAudioWebSocket } from "@/hooks/useWebSocket";
import { useRef, useState } from "react";

export default function VoiceRecorder() {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { connect, sendAudio, isConnected } = useAudioWebSocket();

  const startInterview = () => {
    connect();
    setInterviewStarted(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm;codecs=opus" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, sending audio...");
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const buffer = await blob.arrayBuffer();
        sendAudio(buffer);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
    } catch (e) {
      console.error("Error starting recording:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!interviewStarted) {
    return (
      <div className="flex flex-col items-center p-8">
        <button
          onClick={startInterview}
          className="px-6 py-3 bg-blue-500 text-white font-bold rounded"
        >
          Start Interview
        </button>
      </div>
    );
  }

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
