"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Mic, MicOff, Clock, Brain, CheckCircle2,
  XCircle, AlertTriangle, Lightbulb, ArrowRight,
  BarChart3, Loader2, StopCircle, ChevronDown, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { interviewService } from "@/services/interview";
import { voiceService } from "@/services/voice";
import type { Question, ChatMessage, AnswerFeedback } from "@/types";

// Proctoring
import { useProctor } from "@/hooks/use-proctor";
import { useCameraProctor } from "@/hooks/use-camera-proctor";
import { useAudioProctor } from "@/hooks/use-audio-proctor";
import ProctoringPanel from "@/components/proctoring/ProctoringPanel";
import WebcamPreview from "@/components/proctoring/WebcamPreview";
import WarningToast from "@/components/proctoring/WarningToast";

interface Message {
  id: string;
  role: "ai" | "user" | "feedback" | "system";
  content: string;
  question?: Question;
  feedback?: AnswerFeedback;
  timestamp: Date;
}

export default function InterviewChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [confidenceAvg, setConfidenceAvg] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState<number>(Date.now());
  const [questionElapsed, setQuestionElapsed] = useState(0);

  const TOTAL_INTERVIEW_TIME = 600; // 10 minutes
  
  // Dynamic question timing based on difficulty
  const timePerQuestion = currentQuestion 
    ? (currentQuestion.difficulty < 4 ? 30 : currentQuestion.difficulty > 7 ? 90 : 60)
    : Math.max(30, Math.floor(TOTAL_INTERVIEW_TIME / totalQuestions));

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmittedRef = useRef(false);

  // ===== Proctoring Hooks =====
  const handleEndInterview = useCallback(async (reason?: string) => {
    try {
      await interviewService.completeInterview(sessionId);
      setIsComplete(true);
      if (timerRef.current) clearInterval(timerRef.current);
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (reason) {
        toast.error(reason, { duration: 8000 });
      }
      router.push(`/dashboard/report/${sessionId}`);
    } catch { /* ignore */ }
  }, [sessionId, router]);

  const handleTerminate = useCallback((reason: string) => {
    if (!isComplete) handleEndInterview(reason);
  }, [isComplete, handleEndInterview]);

  const { logEvent } = useProctor(sessionId, true, handleTerminate);
  const { videoRef, canvasRef, cameraActive, cameraError, faceCount, detections } =
    useCameraProctor(true, logEvent, handleTerminate);
  const { audioLevel, voiceEnergy } = useAudioProctor(true, logEvent);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= TOTAL_INTERVIEW_TIME && !isComplete) {
          handleEndInterview("Time limit reached. Interview ended automatically.");
        }
        return next;
      });
      setQuestionElapsed((qe) => qe + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isComplete, handleEndInterview]);

  // Load first question from URL params
  useEffect(() => {
    const firstQStr = searchParams.get("firstQ");
    if (firstQStr) {
      try {
        const q: Question = JSON.parse(decodeURIComponent(firstQStr));
        setCurrentQuestion(q);
        setMessages([
          {
            id: "system-start",
            role: "system",
            content: "Interview started. Good luck! 🚀",
            timestamp: new Date(),
          },
          {
            id: `q-${q.id}`,
            role: "ai",
            content: q.text,
            question: q,
            timestamp: new Date(),
          },
        ]);
        setAnswerStartTime(Date.now());
      } catch { /* ignore */ }
    }
  }, [searchParams]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      hr: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      technical: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      behavioral: "bg-green-500/15 text-green-400 border-green-500/30",
      situational: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
    return colors[cat] || colors.hr;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-cyan-400";
    if (score >= 4) return "text-amber-400";
    return "text-red-400";
  };

  // Voice recording
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (liveTranscript) setInput((prev) => (prev ? prev + " " : "") + liveTranscript);
      setLiveTranscript("");
    } else {
      if (!voiceService.isSupported()) {
        toast.error("Speech recognition not supported in this browser");
        return;
      }
      const recognition = voiceService.createRecognition();
      if (!recognition) return;

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            setInput((prev) => (prev ? prev + " " : "") + event.results[i][0].transcript);
            setLiveTranscript("");
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setLiveTranscript(interim);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error("Speech recognition error");
      };

      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      toast.info("🎤 Listening...");
    }
  };

  // Submit answer
  const handleSubmit = useCallback(async (overrideText?: string) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if ((!text && overrideText === undefined) || !currentQuestion || isSubmitting) return;

    const responseTime = (Date.now() - answerStartTime) / 1000;

    // Add user message
    setMessages((prev) => [...prev, {
      id: `a-${Date.now()}`,
      role: "user",
      content: text || "(Skipped due to time limit)",
      timestamp: new Date(),
    }]);
    setInput("");
    setIsSubmitting(true);

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: typingId,
      role: "ai",
      content: "thinking",
      timestamp: new Date(),
    }]);

    try {
      const result: AnswerFeedback = await interviewService.submitAnswer(sessionId, {
        text,
        response_time_seconds: responseTime,
        input_method: "text",
      });

      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== typingId));

      // Add feedback message
      setMessages((prev) => [...prev, {
        id: `fb-${result.answer_id}`,
        role: "feedback",
        content: "",
        feedback: result,
        timestamp: new Date(),
      }]);

      // Update confidence average
      if (result.scores.confidence) {
        setConfidenceAvg((prev) => {
          const n = questionIndex + 1;
          return ((prev * questionIndex) + result.scores.confidence) / n;
        });
      }

      if (result.is_interview_complete) {
        setIsComplete(true);
        setMessages((prev) => [...prev, {
          id: "system-end",
          role: "system",
          content: "Interview completed! 🎉 View your detailed report.",
          timestamp: new Date(),
        }]);
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (result.next_question) {
        const nq = result.next_question;
        setCurrentQuestion(nq);
        setQuestionIndex((prev) => prev + 1);
        setAnswerStartTime(Date.now());
        setQuestionElapsed(0);
        hasAutoSubmittedRef.current = false;

        // Add next question with slight delay
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: `q-${nq.id}`,
            role: "ai",
            content: nq.text,
            question: nq,
            timestamp: new Date(),
          }]);
        }, 800);
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      toast.error("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  }, [input, currentQuestion, isSubmitting, answerStartTime, sessionId, questionIndex, timerRef]);

  // Auto-submit question if time expires
  useEffect(() => {
    if (questionElapsed >= timePerQuestion && !isSubmitting && !isComplete && currentQuestion && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      toast.warning("Time's up for this question! Auto-advancing...");
      handleSubmit(input || "Skipped due to time limit.");
    }
  }, [questionElapsed, timePerQuestion, isSubmitting, isComplete, currentQuestion, input, handleSubmit]);
  return (
    <div className="flex flex-col h-screen">
      {/* ===== Proctoring Overlays ===== */}
      <ProctoringPanel />
      <WebcamPreview
        videoRef={videoRef}
        canvasRef={canvasRef}
        cameraActive={cameraActive}
        cameraError={cameraError}
        faceCount={faceCount}
        detections={detections}
      />
      <WarningToast />

      {/* ===== Top Bar ===== */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-3 md:px-6 glass shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-sm">Mock Interview</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Q{questionIndex + 1}/{totalQuestions}
          </Badge>
          {currentQuestion && (
            <Badge className={getCategoryColor(currentQuestion.category)}>
              {currentQuestion.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Confidence meter */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-muted-foreground">Confidence:</span>
            <span className={getScoreColor(confidenceAvg)}>{confidenceAvg ? confidenceAvg.toFixed(1) : "—"}</span>
          </div>
          {/* Audio level indicator */}
          <div className="hidden md:flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  audioLevel > i * 20 ? "bg-green-400" : "bg-white/10"
                }`}
                style={{ height: `${8 + i * 3}px` }}
              />
            ))}
          </div>
          {/* Question Timer */}
          <div className="flex items-center gap-1 md:gap-2">
            <div className="text-xs text-muted-foreground w-6 md:w-8 text-right">
              {Math.max(0, timePerQuestion - questionElapsed)}s
            </div>
            <div className="w-10 md:w-16">
              <Progress value={Math.min(100, (questionElapsed / timePerQuestion) * 100)} className="h-1.5 [&>div]:bg-amber-400" />
            </div>
          </div>
          {/* Global Timer */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground md:border-l md:border-white/10 md:pl-4">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="font-mono text-white/90">{formatTime(TOTAL_INTERVIEW_TIME - elapsed)}</span>
          </div>
          {/* Progress */}
          <div className="hidden md:block w-24 ml-2">
            <Progress value={((questionIndex) / totalQuestions) * 100} className="h-1.5" />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10 h-8 px-2 md:px-3 ml-1 md:ml-0"
            onClick={() => handleEndInterview()}
          >
            <StopCircle className="w-3.5 h-3.5 md:mr-1" /> <span className="hidden md:inline">End</span>
          </Button>
        </div>
      </div>

      {/* ===== Chat Area ===== */}
      <div className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === "system" && (
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground bg-white/5 px-4 py-1.5 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                )}

                {msg.role === "ai" && msg.content === "thinking" && (
                  <div className="flex gap-3 max-w-3xl">
                    <div className="w-8 h-8 rounded-full gradient-purple-cyan flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === "ai" && msg.content !== "thinking" && (
                  <div className="flex gap-3 max-w-3xl">
                    <div className="w-8 h-8 rounded-full gradient-purple-cyan flex items-center justify-center shrink-0 mt-1">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass-card px-5 py-4 rounded-2xl rounded-tl-sm flex-1">
                      {msg.question && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(msg.question.category)} >
                            {msg.question.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Difficulty: {msg.question.difficulty.toFixed(1)}/10
                          </span>
                          {msg.question.is_follow_up && (
                            <Badge variant="outline" className="text-xs">Follow-up</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )}

                {msg.role === "user" && (
                  <div className="flex gap-3 max-w-3xl ml-auto flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-bold text-purple-400">You</span>
                    </div>
                    <div className="bg-purple-500/15 border border-purple-500/20 px-5 py-4 rounded-2xl rounded-tr-sm">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )}

                {msg.role === "feedback" && msg.feedback && (
                  <div className="max-w-3xl ml-11">
                    <div className="glass-card p-5 rounded-2xl space-y-4">
                      {/* Scores */}
                      <div className="grid grid-cols-5 gap-3">
                        {Object.entries(msg.feedback.scores).map(([key, val]) => (
                          <div key={key} className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(val)}`}>
                              {val.toFixed(1)}
                            </div>
                            <div className="text-[10px] text-muted-foreground capitalize">
                              {key.replace("_", " ")}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Feedback details */}
                      <div className="grid gap-3">
                        {msg.feedback.feedback.strengths.length > 0 && (
                          <div className="flex gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-green-400 mb-1">Strengths</p>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {msg.feedback.feedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}
                        {msg.feedback.feedback.weaknesses.length > 0 && (
                          <div className="flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-amber-400 mb-1">Areas to Improve</p>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {msg.feedback.feedback.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}
                        {msg.feedback.feedback.ideal_answer && (
                          <div className="flex gap-2">
                            <Lightbulb className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-cyan-400 mb-1">Ideal Answer</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {msg.feedback.feedback.ideal_answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Complete banner */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto"
            >
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-purple-cyan flex items-center justify-center mx-auto mb-4 glow-purple">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Interview Complete!</h3>
                <p className="text-muted-foreground text-sm mb-4">View your detailed performance report</p>
                <Button
                  className="gradient-purple-cyan text-white border-0"
                  onClick={() => {
                    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                    router.push(`/dashboard/report/${sessionId}`);
                  }}
                >
                  View Report <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ===== Input Area ===== */}
      {!isComplete && (
        <div className="border-t border-white/5 p-4 glass">
          {currentQuestion?.question_type === "multiple_choice" && currentQuestion.options ? (
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto py-4 px-6 justify-start text-left bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 whitespace-normal transition-all"
                  onClick={() => handleSubmit(opt)}
                  disabled={isSubmitting}
                >
                  <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center mr-3 shrink-0 text-xs font-bold text-purple-400">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm">{opt}</span>
                </Button>
              ))}
            </div>
          ) : (
            <>
              {liveTranscript && (
                <div className="text-sm text-purple-400 mb-2 px-2 italic">
                  🎤 {liveTranscript}
                </div>
              )}
              <div className="flex gap-3 max-w-3xl mx-auto items-end">
                <Button
                  variant="outline"
                  size="icon"
                  className={`shrink-0 h-11 w-11 rounded-xl ${
                    isRecording
                      ? "bg-red-500/15 border-red-500/30 text-red-400 animate-pulse"
                      : "border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Textarea
                  placeholder="Type your answer..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                  }}
                  className="min-h-[44px] max-h-32 bg-white/5 border-white/10 focus:border-purple-500 resize-none rounded-xl"
                  rows={1}
                />

                <Button
                  size="icon"
                  className="shrink-0 h-11 w-11 rounded-xl gradient-purple-cyan text-white border-0"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || !input.trim()}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
