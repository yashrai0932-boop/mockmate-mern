/**
 * Voice Service - browser SpeechRecognition API wrapper.
 */

import api from "./api";

export const voiceService = {
  /**
   * Check if browser supports SpeechRecognition.
   */
  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  },

  /**
   * Create a SpeechRecognition instance.
   */
  createRecognition(): any {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return recognition;
  },

  /**
   * Transcribe audio file via backend Whisper API.
   */
  async transcribeAudio(audioBlob: Blob): Promise<any> {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    const response = await api.post("/api/voice/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
