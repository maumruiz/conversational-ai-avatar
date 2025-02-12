"use client";

import { useState, useCallback } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  // const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          // setAudioURL(URL.createObjectURL(blob));
          setAudioBlob(blob);
        };

        recorder.start();
        setIsRecording(true);
      })
      .catch((err) => console.error("Error accessing microphone:", err));
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  return { isRecording, audioBlob, startRecording, stopRecording };
};
