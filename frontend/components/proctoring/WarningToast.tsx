/**
 * WarningToast - Non-blocking proctoring warning popups.
 * Slides in from top-right, auto-dismisses, stacks.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Camera, Mic, Monitor, Eye,
  Keyboard, Copy, Shield, X,
} from "lucide-react";
import { useProctorStore } from "@/store/proctor-store";

const EVENT_ICONS: Record<string, React.ElementType> = {
  tab_switch: Monitor,
  fullscreen_exit: Monitor,
  copy_attempt: Copy,
  paste_attempt: Copy,
  devtools_attempt: Keyboard,
  right_click: Keyboard,
  keyboard_shortcut: Keyboard,
  multiple_faces: Camera,
  no_face: Camera,
  gaze_away: Eye,
  low_light: Camera,
  background_noise: Mic,
  inactivity: AlertTriangle,
};

function getWarningStyle(severity: string) {
  switch (severity) {
    case "high":
      return {
        bg: "bg-red-500/10 border-red-500/25",
        icon: "text-red-400",
        text: "text-red-300",
      };
    case "medium":
      return {
        bg: "bg-amber-500/10 border-amber-500/25",
        icon: "text-amber-400",
        text: "text-amber-300",
      };
    default:
      return {
        bg: "bg-blue-500/10 border-blue-500/25",
        icon: "text-blue-400",
        text: "text-blue-300",
      };
  }
}

export default function WarningToast() {
  const { activeWarnings, removeWarning } = useProctorStore();

  // Only show last 3 warnings
  const visibleWarnings = activeWarnings.slice(-3);

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {visibleWarnings.map((warning) => {
          const style = getWarningStyle(warning.severity);
          // Try to extract event type from id
          const eventType = warning.id.split("-")[0] || "tab_switch";
          const Icon = EVENT_ICONS[eventType] || AlertTriangle;

          return (
            <motion.div
              key={warning.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${style.bg}`}
            >
              <div className={`mt-0.5 ${style.icon}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Proctor Alert
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${style.text}`}>
                  {warning.message}
                </p>
              </div>
              <button
                onClick={() => removeWarning(warning.id)}
                className="mt-0.5 text-white/20 hover:text-white/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
