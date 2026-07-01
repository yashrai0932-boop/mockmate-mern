/**
 * ProctoringPanel - Floating side panel showing live proctoring status.
 * Collapsible, glassmorphic, with animated indicators.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Camera, Mic, Maximize, Eye, AlertTriangle,
  ChevronLeft, ChevronRight, Activity,
} from "lucide-react";
import { useProctorStore } from "@/store/proctor-store";

function StatusDot({ active, color }: { active: boolean; color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${color}`}
        />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          active ? color : "bg-white/10"
        }`}
      />
    </span>
  );
}

function IntegrityRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 20;
  const progress = (score / 100) * circumference;
  const getColor = () => {
    if (score >= 80) return "stroke-green-400";
    if (score >= 60) return "stroke-cyan-400";
    if (score >= 40) return "stroke-amber-400";
    return "stroke-red-400";
  };
  const getTextColor = () => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-cyan-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="relative w-14 h-14 mx-auto">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24" cy="24" r="20" fill="none"
          stroke="currentColor" strokeWidth="3"
          className="text-white/5"
        />
        <circle
          cx="24" cy="24" r="20" fill="none"
          strokeWidth="3" strokeLinecap="round"
          className={getColor()}
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${getTextColor()}`}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

export default function ProctoringPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const store = useProctorStore();

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-6 h-12 flex items-center justify-center rounded-l-lg
          bg-white/[0.04] backdrop-blur-xl border border-r-0 border-white/[0.06]
          hover:bg-white/[0.08] transition-colors"
      >
        {collapsed ? (
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 180, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div
              className="w-[180px] p-4 space-y-4
                bg-white/[0.03] backdrop-blur-2xl
                border border-white/[0.06] border-r-0
                rounded-l-2xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Proctor
                </span>
              </div>

              {/* Integrity Score */}
              <div className="text-center">
                <IntegrityRing score={store.integrityScore} />
                <p className="text-[10px] text-muted-foreground mt-1">Integrity</p>
              </div>

              {/* Status indicators */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Camera</span>
                  </div>
                  <StatusDot active={store.cameraActive} color="bg-green-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Microphone</span>
                  </div>
                  <StatusDot active={store.micActive} color="bg-green-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Fullscreen</span>
                  </div>
                  <StatusDot active={store.isFullscreen} color="bg-cyan-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Focus</span>
                  </div>
                  <StatusDot active={store.isFocused} color="bg-cyan-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Faces</span>
                  </div>
                  <span className={`text-[11px] font-mono ${
                    store.faceCount === 1 ? "text-green-400" :
                    store.faceCount === 0 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {store.faceCount}
                  </span>
                </div>
              </div>

              {/* Warning count */}
              {store.warningCount > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-amber-400">
                    {store.warningCount} warning{store.warningCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
