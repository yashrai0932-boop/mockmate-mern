"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain, Upload, FileText, Loader2, ArrowRight,
  Target, Gauge, Users, Briefcase, Sparkles, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { resumeService } from "@/services/resume";
import { interviewService } from "@/services/interview";
import type { Resume, InterviewPersonality } from "@/types";

const difficultyOptions = [
  { value: "easy", label: "Easy", desc: "Relaxed pace, foundational questions", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  { value: "medium", label: "Medium", desc: "Balanced depth and breadth", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "hard", label: "Hard", desc: "Deep technical grilling", color: "text-red-400 border-red-500/30 bg-red-500/10" },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [personalities, setPersonalities] = useState<InterviewPersonality[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [targetRole, setTargetRole] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState("friendly_mentor");
  const [difficulty, setDifficulty] = useState("medium");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [resumeRes, personalityRes] = await Promise.all([
          resumeService.list(),
          interviewService.getPersonalities(),
        ]);
        setResumes(resumeRes.resumes);
        setPersonalities(personalityRes.personalities);
        if (resumeRes.resumes.length > 0) setSelectedResume(resumeRes.resumes[0].id);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await resumeService.upload(file);
      setResumes((prev) => [res, ...prev]);
      setSelectedResume(res.id);
      toast.success("Resume uploaded and parsed!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, resumeId: string) => {
    e.stopPropagation();
    try {
      await resumeService.delete(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      if (selectedResume === resumeId) {
        const remaining = resumes.filter((r) => r.id !== resumeId);
        setSelectedResume(remaining.length > 0 ? remaining[0].id : "");
      }
      toast.success("Resume deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  const handleStart = async () => {
    if (!selectedResume) { toast.error("Please select a resume"); return; }
    if (!targetRole.trim()) { toast.error("Please enter a target role"); return; }
    setStarting(true);
    try {
      const result = await interviewService.startInterview({
        resume_id: selectedResume,
        target_role: targetRole,
        personality: selectedPersonality,
        difficulty: difficulty as "easy" | "medium" | "hard",
        interview_type: "mixed",
        total_questions: totalQuestions,
      });
      router.push(`/dashboard/interview/${result.session_id}?firstQ=${encodeURIComponent(JSON.stringify(result.first_question))}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to start interview");
      setStarting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Setup</span> Your Interview
        </h1>
        <p className="text-muted-foreground mb-8">Configure your mock interview session</p>
      </motion.div>

      <div className="space-y-6">
        {/* Resume Selection */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Resume</h3>
                  <p className="text-xs text-muted-foreground">Select or upload your resume</p>
                </div>
              </div>

              {resumes.length > 0 && (
                <div className="grid gap-2 mb-4">
                  {resumes.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResume(r.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        selectedResume === r.id
                          ? "bg-purple-500/15 border border-purple-500/30"
                          : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06]"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{r.file_name}</span>
                      <Badge variant="outline" className="text-xs">{r.file_type.toUpperCase()}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
                        onClick={(e) => handleDelete(e, r.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <input type="file" ref={fileRef} accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
              <Button
                variant="outline"
                className="w-full border-dashed border-white/20 hover:bg-white/5"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "Parsing resume..." : "Upload New Resume"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Target Role */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Target Role</h3>
                  <p className="text-xs text-muted-foreground">What position are you preparing for?</p>
                </div>
              </div>
              <Input
                placeholder="e.g. Software Engineer, Product Manager, Data Scientist"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-purple-500"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Personality Selection */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Interviewer Personality</h3>
                  <p className="text-xs text-muted-foreground">Choose your AI interviewer style</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {personalities.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPersonality(p.key)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedPersonality === p.key
                        ? "bg-purple-500/15 border border-purple-500/30"
                        : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty & Questions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Difficulty & Length</h3>
                  <p className="text-xs text-muted-foreground">Set the interview parameters</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {difficultyOptions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`p-3 rounded-xl text-center transition-all border ${
                      difficulty === d.value ? d.color : "border-transparent bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Number of Questions: {totalQuestions}</Label>
                <input
                  type="range"
                  min={5}
                  max={25}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full mt-2 accent-purple-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5 (Quick)</span><span>15 (Standard)</span><span>25 (Full)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Start Button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            size="lg"
            className="w-full gradient-purple-cyan text-white text-lg py-6 border-0 glow-purple hover:opacity-90 transition-all"
            onClick={handleStart}
            disabled={starting || !selectedResume || !targetRole.trim()}
          >
            {starting ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Preparing interview...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" /> Start Interview</>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
