/**
 * useAudioProctor - Audio monitoring hook using Web Audio API.
 * Detects: excessive noise, suspicious silence, voice energy for confidence.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useProctorStore } from "@/store/proctor-store";

interface AudioProctorResult {
  audioLevel: number; // 0-100
  isSilent: boolean;
  isNoisy: boolean;
  voiceEnergy: number; // 0-100
}

export function useAudioProctor(
  enabled: boolean = true,
  onViolation?: (type: string) => void
): AudioProctorResult {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSilent, setIsSilent] = useState(false);
  const [isNoisy, setIsNoisy] = useState(false);
  const [voiceEnergy, setVoiceEnergy] = useState(50);

  const store = useProctorStore();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const silenceStartRef = useRef<number>(Date.now());
  const noisyCountRef = useRef<number>(0);
  const lastNoiseWarningRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        store.setMicActive(true);

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const monitor = () => {
          if (cancelled) return;

          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);

          // Voice energy (for confidence analysis)
          const energy = Math.min(100, Math.round((avg / 80) * 100));
          setVoiceEnergy(energy);

          // Silence detection (< 5% for > 45 seconds)
          if (level < 5) {
            const silenceDuration = (Date.now() - silenceStartRef.current) / 1000;
            if (silenceDuration > 45) {
              setIsSilent(true);
            }
          } else {
            silenceStartRef.current = Date.now();
            setIsSilent(false);
          }

          // Noise detection (> 80% sustained)
          if (level > 80) {
            noisyCountRef.current++;
            if (noisyCountRef.current > 30) { // ~2.5 seconds sustained
              setIsNoisy(true);
              store.setAudioNoisy(true);
              const now = Date.now();
              if (now - lastNoiseWarningRef.current > 30000) {
                lastNoiseWarningRef.current = now;
                onViolation?.("background_noise");
              }
            }
          } else {
            noisyCountRef.current = Math.max(0, noisyCountRef.current - 1);
            if (noisyCountRef.current === 0) {
              setIsNoisy(false);
              store.setAudioNoisy(false);
            }
          }

          rafRef.current = requestAnimationFrame(monitor);
        };

        // Run at ~12fps for audio levels
        const slowMonitor = () => {
          monitor();
        };
        rafRef.current = requestAnimationFrame(slowMonitor);
      } catch {
        store.setMicActive(false);
      }
    };

    startAudio();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      store.setMicActive(false);
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { audioLevel, isSilent, isNoisy, voiceEnergy };
}
