/**
 * useCameraProctor - Camera AI hook using TensorFlow.js COCO-SSD.
 * Detects: face count, multiple people, no face, low light.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useProctorStore } from "@/store/proctor-store";

// Lazy-load TF and model
let cocoModel: any = null;
let modelLoading = false;

async function loadModel() {
  if (cocoModel) return cocoModel;
  if (modelLoading) {
    // Wait for the other load to finish
    while (modelLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return cocoModel;
  }
  modelLoading = true;
  try {
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    cocoModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    return cocoModel;
  } finally {
    modelLoading = false;
  }
}

interface CameraProctorResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  faceCount: number;
  isLowLight: boolean;
  detections: Array<{ bbox: number[]; class: string; score: number }>;
}

export function useCameraProctor(
  enabled: boolean = true,
  onViolation?: (type: string) => void,
  onTerminate?: (reason: string) => void
): CameraProctorResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceCount, setFaceCount] = useState(0);
  const [isLowLight, setIsLowLight] = useState(false);
  const [detections, setDetections] = useState<Array<{ bbox: number[]; class: string; score: number }>>([]);

  const store = useProctorStore();

  // Track previous violation states to avoid spamming
  const lastViolationRef = useRef<Record<string, number>>({});

  const canFireViolation = useCallback((type: string, cooldownMs: number = 10000) => {
    const now = Date.now();
    const last = lastViolationRef.current[type] || 0;
    if (now - last > cooldownMs) {
      lastViolationRef.current[type] = now;
      return true;
    }
    return false;
  }, []);

  // Check brightness of canvas
  const checkBrightness = useCallback((canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let totalBrightness = 0;
    const sampleStep = 40; // Sample every Nth pixel for performance
    let sampleCount = 0;
    for (let i = 0; i < data.length; i += 4 * sampleStep) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
      sampleCount++;
    }
    const avgBrightness = totalBrightness / sampleCount;
    return avgBrightness < 40; // Very dark
  }, []);

  // Start camera
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let multipleFacesTimer: ReturnType<typeof setTimeout> | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);
        store.setCameraActive(true);

        // Load COCO-SSD model
        await loadModel();

        // Start detection loop (every 2.5s)
        detectionRef.current = setInterval(async () => {
          if (!videoRef.current || !canvasRef.current || !cocoModel) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState < 2) return;

          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Check brightness
          const dark = checkBrightness(canvas);
          setIsLowLight(dark);
          store.setLowLight(dark);
          if (dark && canFireViolation("low_light", 30000)) {
            onViolation?.("low_light");
          }

          // Run COCO-SSD detection
          try {
            const predictions = await cocoModel.detect(canvas);
            const people = predictions.filter(
              (p: any) => p.class === "person" && p.score > 0.5
            );

            const count = people.length;
            setFaceCount(count);
            store.setFaceCount(count);
            setDetections(
              people.map((p: any) => ({
                bbox: p.bbox,
                class: p.class,
                score: p.score,
              }))
            );

            // Violations
            if (count === 0 && canFireViolation("no_face", 15000)) {
              onViolation?.("no_face");
            }
            if (count > 1) {
              if (canFireViolation("multiple_faces", 15000)) {
                onViolation?.("multiple_faces");
              }
              if (onTerminate && !multipleFacesTimer) {
                multipleFacesTimer = setTimeout(() => {
                  onTerminate("Interview terminated: Multiple people detected for more than 5 seconds.");
                }, 5000);
              }
            } else {
              if (multipleFacesTimer) {
                clearTimeout(multipleFacesTimer);
                multipleFacesTimer = null;
              }
            }

            // Simple gaze check: if person bbox center is far from frame center
            if (count === 1) {
              const [bx, by, bw, bh] = people[0].bbox;
              const centerX = bx + bw / 2;
              const frameCenterX = canvas.width / 2;
              const drift = Math.abs(centerX - frameCenterX) / canvas.width;
              const gazing = drift > 0.35;
              store.setGazeAway(gazing);
              if (gazing && canFireViolation("gaze_away", 20000)) {
                onViolation?.("gaze_away");
              }
            }
          } catch {
            // Detection can fail occasionally, ignore
          }
        }, 2500);
      } catch (err: any) {
        setCameraError(err.message || "Camera access denied");
        store.setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (detectionRef.current) clearInterval(detectionRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (multipleFacesTimer) clearTimeout(multipleFacesTimer);
      store.setCameraActive(false);
    };
  }, [enabled, onViolation, onTerminate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { videoRef, canvasRef, cameraActive, cameraError, faceCount, isLowLight, detections };
}
