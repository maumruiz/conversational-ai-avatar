"use client";

import { Mic, Square } from "lucide-react";
import { useCallback, useEffect } from "react";

import { useConversation } from "@/lib/store";

import { useAudioRecorder } from "../hooks/useAudioRecorder";

export default function AudioRecorder() {
  const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();
  const messages = useConversation((state) => state.messages);
  const addMessage = useConversation((state) => state.addMessage);
  const setMessageResult = useConversation((state) => state.setMessageResult);

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const fetchConversation = useCallback(
    async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.ogg");
      formData.append("messages", JSON.stringify(messages));

      try {
        const response = await fetch("/api/conversation/speech", {
          method: "POST",
          body: formData,
        });

        const result = JSON.parse((await response.headers.get("result")) || "{}");
        const userMessage = JSON.parse((await response.headers.get("usermessage")) || "{}");
        const audio = await response.blob();
        const visemes = JSON.parse((await response.headers.get("visemes")) || "[]");
        const audioUrl = URL.createObjectURL(audio);
        const audioPlayer = new Audio(audioUrl);

        console.log(userMessage);
        console.log(result);
        console.log(visemes);

        setMessageResult({
          visemes,
          audioPlayer,
        });
        audioPlayer.onended = () => {
          setMessageResult(null);
        };
        audioPlayer.currentTime = 0;
        audioPlayer.play();

        addMessage(userMessage);
        addMessage(result);
      } catch (err) {
        console.error("Error sending audio file:", err);
      }
    },
    [messages]
  );

  useEffect(() => {
    if (audioBlob) {
      fetchConversation(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  return (
    <div>
      <button
        onClick={handleRecordClick}
        className={`flex size-16 items-center justify-center rounded-full text-sm font-bold text-white transition-all duration-300 ease-in-out hover:scale-110 ${
          isRecording
            ? "animate-pulse bg-red-600"
            : "bg-slate-900 shadow-lg hover:bg-slate-950 hover:shadow-xl"
        }`}
      >
        {isRecording ? <Square className="size-6" /> : <Mic className="size-8" />}
      </button>
      {/* <p className="mt-4 text-xl font-semibold text-white">
        {isRecording ? "Recording..." : "Tap to Record"}
      </p> */}
      {/* {hasRecorded && audioURL && (
        <div className="mt-8">
          <audio src={audioURL} controls className="w-64" />
        </div>
      )} */}
    </div>
  );
}
