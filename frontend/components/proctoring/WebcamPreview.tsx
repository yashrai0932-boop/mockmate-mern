/**
 * WebcamPreview - Floating draggable webcam preview with detection overlay.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Minimize2, Maximize2, CameraOff } from "lucide-react";

interface WebcamPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  faceCount: number;
  detections: Array<{ bbox: number[]; class: string; score: number }>;
}

export default function WebcamPreview({
  videoRef,
  canvasRef,
  cameraActive,
  cameraError,
  faceCount,
  detections,
}: WebcamPreviewProps) {
  const [minimized, setMinimized] = useState(false);

  // Determine border color based on state
  const getBorderClass = () => {
    if (!cameraActive) return "border-white/10";
    if (faceCount > 1) return "border-red-500/60 shadow-red-500/20 shadow-lg";
    if (faceCount === 0) return "border-amber-500/50";
    return "border-green-500/30";
  };

  if (minimized) {
    return (
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full
          bg-white/[0.06] backdrop-blur-xl border border-white/10
          flex items-center justify-center hover:bg-white/[0.1] transition-colors
          shadow-xl"
        onClick={() => setMinimized(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Camera className="w-5 h-5 text-purple-400" />
        {cameraActive && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-black" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: -800, right: 0, top: -500, bottom: 0 }}
      initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-6 right-6 z-50 rounded-2xl overflow-hidden
        bg-black/60 backdrop-blur-xl border-2 ${getBorderClass()}
        shadow-2xl cursor-grab active:cursor-grabbing`}
      style={{ width: 200, height: 150 }}
    >
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Hidden canvas for detection */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Detection overlays */}
      {detections.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 320 240"
          preserveAspectRatio="none"
        >
          {detections.map((det, i) => (
            <rect
              key={i}
              x={320 - det.bbox[0] - det.bbox[2]}
              y={det.bbox[1]}
              width={det.bbox[2]}
              height={det.bbox[3]}
              fill="none"
              stroke={faceCount > 1 ? "#ef4444" : "#a855f7"}
              strokeWidth="2"
              rx="4"
              opacity="0.7"
            />
          ))}
        </svg>
      )}

      {/* Camera error overlay */}
      {cameraError && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <CameraOff className="w-6 h-6 text-red-400 mb-1" />
          <p className="text-[10px] text-red-400 px-2 text-center">Camera unavailable</p>
        </div>
      )}

      {/* Loading overlay */}
      {!cameraActive && !cameraError && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <Camera className="w-6 h-6 text-purple-400 mb-1 animate-pulse" />
          <p className="text-[10px] text-muted-foreground">Starting camera...</p>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-[9px] text-white/60 font-medium">
            {faceCount === 1 ? "1 person" : faceCount === 0 ? "No face" : `${faceCount} people`}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Minimize2 className="w-3 h-3 text-white/60" />
        </button>
      </div>
    </motion.div>
  );
}
