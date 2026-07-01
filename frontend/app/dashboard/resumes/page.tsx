"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Loader2, Trash2, Eye, Code, GraduationCap, Briefcase, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { resumeService } from "@/services/resume";
import type { Resume } from "@/types";

export default function ResumesPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await resumeService.list();
        setResumes(res.resumes);
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
      toast.success("Resume uploaded and parsed successfully!");
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
      if (selectedResume?.id === resumeId) setSelectedResume(null);
      toast.success("Resume deleted successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              My <span className="gradient-text">Resumes</span>
            </h1>
            <p className="text-muted-foreground text-sm">Upload and manage your resumes</p>
          </div>
          <div>
            <input type="file" ref={fileRef} accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
            <Button
              className="gradient-purple-cyan text-white border-0"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? "Parsing..." : "Upload Resume"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">No resumes uploaded yet</p>
            <p className="text-sm mb-4">Upload a PDF or DOCX to get started</p>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Upload Resume
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <Card
                key={resume.id}
                className={`glass-card border-0 cursor-pointer transition-all hover:bg-white/[0.06] ${
                  selectedResume?.id === resume.id ? "ring-1 ring-purple-500/30" : ""
                }`}
                onClick={() => setSelectedResume(selectedResume?.id === resume.id ? null : resume)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{resume.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(resume.created_at).toLocaleDateString()} • {resume.file_type.toUpperCase()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {resume.parsed_data ? "Parsed" : "Pending"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      onClick={(e) => handleDelete(e, resume.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Expanded parsed data */}
                  {selectedResume?.id === resume.id && resume.parsed_data && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-white/5 space-y-4"
                    >
                      {resume.candidate_summary && (
                        <div>
                          <p className="text-xs font-medium text-purple-400 mb-1">AI Summary</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{resume.candidate_summary}</p>
                        </div>
                      )}

                      {resume.parsed_data.skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-cyan-400 mb-2 flex items-center gap-1">
                            <Code className="w-3 h-3" /> Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.parsed_data.skills.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-white/[0.03]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.parsed_data.experience?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Experience
                          </p>
                          {resume.parsed_data.experience.map((exp, i) => (
                            <div key={i} className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium text-foreground">{exp.title}</span>
                              {exp.company && ` at ${exp.company}`}
                              {exp.duration && ` • ${exp.duration}`}
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.parsed_data.education?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> Education
                          </p>
                          {resume.parsed_data.education.map((edu, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              {edu.degree} — {edu.institution} {edu.year && `(${edu.year})`}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
