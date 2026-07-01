/**
 * useProctor - Central proctoring hook.
 * Manages browser focus, fullscreen, keyboard protection,
 * copy/paste blocking, and event buffering to backend.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useProctorStore, type ProctorEventLog } from "@/store/proctor-store";
import api from "@/services/api";

// Penalty map per event type
const PENALTIES: Record<string, number> = {
  tab_switch: 5,
  fullscreen_exit: 3,
  copy_attempt: 4,
  paste_attempt: 4,
  devtools_attempt: 6,
  right_click: 2,
  keyboard_shortcut: 3,
  multiple_faces: 8,
  no_face: 2,
  gaze_away: 1,
  low_light: 1,
  background_noise: 2,
  inactivity: 1,
};

const WARNING_MESSAGES: Record<string, string> = {
  tab_switch: "Please stay focused on the interview.",
  fullscreen_exit: "Fullscreen mode is recommended for the interview.",
  copy_attempt: "Copy is disabled during the interview.",
  paste_attempt: "Paste is disabled during the interview.",
  devtools_attempt: "Developer tools access is restricted.",
  right_click: "Right-click is disabled during the interview.",
  keyboard_shortcut: "This keyboard shortcut is restricted.",
  multiple_faces: "Multiple people detected. Please attend alone.",
  no_face: "Face not visible. Please stay in frame.",
  gaze_away: "Please maintain focus on the screen.",
  low_light: "Lighting conditions are too dark.",
  background_noise: "Excessive background noise detected.",
  inactivity: "Please stay active during the interview.",
};

export function useProctor(sessionId: string, enabled: boolean = true, onTerminate?: (reason: string) => void) {
  const store = useProctorStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  
  const eventBufferRef = useRef<ProctorEventLog[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Log event helper
  const logEvent = useCallback(
    (type: string, severity: "low" | "medium" | "high" = "medium") => {
      if (!enabled) return;

      const penalty = PENALTIES[type] || 1;
      const message = WARNING_MESSAGES[type] || "Suspicious activity detected.";

      const evt: ProctorEventLog = {
        id: `${type}-${Date.now()}`,
        event_type: type,
        severity,
        message,
        score_penalty: penalty,
        timestamp: new Date(),
      };

      storeRef.current.addEvent(evt);
      storeRef.current.decrementScore(penalty);
      storeRef.current.incrementWarnings();
      eventBufferRef.current.push(evt);

      // Show warning
      const warningId = `w-${Date.now()}-${Math.random()}`;
      storeRef.current.addWarning({ id: warningId, message, severity, timestamp: new Date() });
      setTimeout(() => storeRef.current.removeWarning(warningId), 4000);
    },
    [enabled]
  );

  // Reset inactivity timer
  const resetInactivity = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      logEvent("inactivity", "low");
    }, 120000); // 2 minutes of no interaction
  }, [logEvent]);

  // Flush events to backend
  const flushEvents = useCallback(async () => {
    if (eventBufferRef.current.length === 0) return;

    const batch = [...eventBufferRef.current];
    eventBufferRef.current = [];

    try {
      await api.post(`/api/proctor/${sessionId}/events`, {
        events: batch.map((e) => ({
          event_type: e.event_type,
          severity: e.severity,
          message: e.message,
          score_penalty: e.score_penalty,
          timestamp: e.timestamp.toISOString(),
        })),
        current_integrity_score: storeRef.current.integrityScore,
        warning_count: storeRef.current.warningCount,
      });
    } catch {
      // Re-add events if flush fails
      eventBufferRef.current = [...batch, ...eventBufferRef.current];
    }
  }, [sessionId]);

  useEffect(() => {
    if (!enabled) return;

    // ===== Visibility Change =====
    let tabTimer: ReturnType<typeof setTimeout> | null = null;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        storeRef.current.setFocused(false);
        logEvent("tab_switch", "high");
        if (onTerminate) {
          tabTimer = setTimeout(() => {
            onTerminate("Interview terminated: You switched tabs for more than 5 seconds.");
          }, 5000);
        }
      } else {
        storeRef.current.setFocused(true);
        if (tabTimer) clearTimeout(tabTimer);
      }
    };

    // ===== Window Blur/Focus =====
    const handleBlur = () => {
      storeRef.current.setFocused(false);
      logEvent("tab_switch", "medium");
    };
    const handleFocus = () => storeRef.current.setFocused(true);

    // ===== Fullscreen Change =====
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      storeRef.current.setFullscreen(isFS);
      if (!isFS) {
        logEvent("fullscreen_exit", "medium");
      }
    };

    // ===== Keyboard Protection =====
    const handleKeyDown = (e: KeyboardEvent) => {
      resetInactivity();

      // Block Ctrl+C, Ctrl+V, Ctrl+A
      if (e.ctrlKey || e.metaKey) {
        if (["c", "v", "a"].includes(e.key.toLowerCase())) {
          // Allow in textarea (for typing)
          const target = e.target as HTMLElement;
          if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
            if (e.key.toLowerCase() === "a") return; // Allow select all in input
          }
          if (e.key.toLowerCase() === "v") {
            e.preventDefault();
            logEvent("paste_attempt", "high");
            return;
          }
          if (e.key.toLowerCase() === "c") {
            e.preventDefault();
            logEvent("copy_attempt", "high");
            return;
          }
        }
        // Block Ctrl+Shift+I (DevTools)
        if (e.shiftKey && e.key.toLowerCase() === "i") {
          e.preventDefault();
          logEvent("devtools_attempt", "high");
          return;
        }
      }

      // Block F12
      if (e.key === "F12") {
        e.preventDefault();
        logEvent("devtools_attempt", "high");
      }
    };

    // ===== Copy/Paste/Right-click =====
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent("copy_attempt", "medium");
    };
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      e.preventDefault();
      logEvent("paste_attempt", "medium");
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent("right_click", "low");
    };

    // ===== Mouse/Key activity for inactivity =====
    const handleActivity = () => resetInactivity();

    // Register listeners
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousemove", handleActivity);

    // Request fullscreen
    const requestFS = async () => {
      try {
        await document.documentElement.requestFullscreen();
        storeRef.current.setFullscreen(true);
      } catch {
        // User may deny
      }
    };
    // Delay fullscreen request slightly for UX
    const fsTimer = setTimeout(requestFS, 1500);

    // Flush timer - send events to backend every 10s
    flushTimerRef.current = setInterval(flushEvents, 10000);

    // Start inactivity timer
    resetInactivity();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousemove", handleActivity);
      clearTimeout(fsTimer);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      // Final flush
      flushEvents();
      if (tabTimer) clearTimeout(tabTimer);
    };
  }, [enabled, logEvent, flushEvents, resetInactivity, onTerminate]);

  return { logEvent };
}
