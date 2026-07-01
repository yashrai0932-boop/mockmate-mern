"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Briefcase, Plus, Loader2, Search,
  Star, CheckCircle2, XCircle, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import api from "@/services/api";
import type { RecruiterJob, CandidateMatch } from "@/types";

export default function RecruiterPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.get("/api/recruiter/jobs");
      setJobs(res.data.jobs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleCreateJob = async () => {
    if (!title || !description) { toast.error("Title and description required"); return; }
    setCreating(true);
    try {
      const res = await api.post("/api/recruiter/job", { title, company, description });
      setJobs((prev) => [res.data, ...prev]);
      setTitle(""); setCompany(""); setDescription("");
      setDialogOpen(false);
      toast.success("Job posting created!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create job");
    } finally { setCreating(false); }
  };

  const loadCandidates = async (jobId: string) => {
    setSelectedJob(jobId);
    setLoadingCandidates(true);
    try {
      const res = await api.get(`/api/recruiter/candidates/${jobId}`);
      setCandidates(res.data.candidates);
    } catch { toast.error("Failed to load candidates"); }
    finally { setLoadingCandidates(false); }
  };

  if (user?.role !== "recruiter") {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <Users className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg mb-2">Recruiter Access Required</p>
        <p className="text-sm">Sign up with a recruiter account to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              <span className="gradient-text">Recruiter</span> Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Post jobs and find matching candidates</p>
          </div>
          <Button className="gradient-purple-cyan text-white border-0" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Job Posting
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="glass-strong border-white/10">
              <DialogHeader>
                <DialogTitle>Create Job Posting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Job Title</Label>
                  <Input placeholder="e.g. Senior Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                </div>
                <div>
                  <Label>Company (Optional)</Label>
                  <Input placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                </div>
                <div>
                  <Label>Job Description</Label>
                  <Textarea placeholder="Paste the full job description..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/5 border-white/10 mt-1 min-h-[120px]" />
                </div>
                <Button className="w-full gradient-purple-cyan text-white border-0" onClick={handleCreateJob} disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {creating ? "Creating..." : "Create Job"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Jobs list */}
        <div className="grid gap-4 mb-8">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className={`glass-card border-0 cursor-pointer transition-all hover:bg-white/[0.06] ${
                selectedJob === job.id ? "ring-1 ring-purple-500/30" : ""
              }`}
              onClick={() => loadCandidates(job.id)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.company && `${job.company} • `}{new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Search className="w-3 h-3 mr-1" /> Find Matches
                </Button>
              </CardContent>
            </Card>
          ))}
          {!loading && jobs.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No job postings yet. Create one to find candidates.</p>
            </div>
          )}
        </div>

        {/* Candidates */}
        {selectedJob && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" /> Matched Candidates
            </h2>
            {loadingCandidates ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No matching candidates found</div>
            ) : (
              <div className="space-y-4">
                {candidates.map((c) => (
                  <Card key={c.user_id} className="glass-card border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-full gradient-purple-cyan flex items-center justify-center text-white font-bold">
                          {c.full_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold gradient-text">{c.fit_score}%</div>
                          <div className="text-xs text-muted-foreground">Fit Score</div>
                        </div>
                      </div>
                      <Progress value={c.fit_score} className="h-1.5 mb-3" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Matching Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {c.matching_skills.map((s, i) => <Badge key={i} variant="outline" className="text-xs bg-green-500/5">{s}</Badge>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Missing Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {c.missing_skills.map((s, i) => <Badge key={i} variant="outline" className="text-xs bg-red-500/5">{s}</Badge>)}
                          </div>
                        </div>
                      </div>
                      {c.hiring_recommendation && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <Badge className={
                            c.hiring_recommendation.includes("hire") && !c.hiring_recommendation.includes("no")
                              ? "bg-green-500/15 text-green-400"
                              : "bg-amber-500/15 text-amber-400"
                          }>
                            AI: {c.hiring_recommendation.replace("_", " ")}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
