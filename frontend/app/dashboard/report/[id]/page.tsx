"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy, TrendingUp, Brain, Target, MessageSquare,
  Mic, CheckCircle2, XCircle, ArrowRight, Lightbulb,
  Calendar, Clock, BookOpen, Star, Download, Share2,
  Loader2, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { analyticsService } from "@/services/analytics";
import type { Report } from "@/types";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from "recharts";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsService.getReport(id as string);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-30" />
        <p>Report not found</p>
        <Link href="/dashboard" className="mt-4">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const radarData = [
    { subject: "Communication", score: report.communication_score, fullMark: 10 },
    { subject: "Technical", score: report.technical_score, fullMark: 10 },
    { subject: "Relevance", score: report.relevance_score, fullMark: 10 },
    { subject: "Confidence", score: report.confidence_score, fullMark: 10 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-cyan-400";
    if (score >= 4) return "text-amber-400";
    return "text-red-400";
  };

  const getRecommendationBadge = (rec: string | undefined) => {
    const map: Record<string, { label: string; color: string }> = {
      strong_hire: { label: "Strong Hire", color: "bg-green-500/15 text-green-400 border-green-500/30" },
      hire: { label: "Hire", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
      lean_hire: { label: "Lean Hire", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
      lean_no_hire: { label: "Lean No Hire", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
      no_hire: { label: "No Hire", color: "bg-red-500/15 text-red-400 border-red-500/30" },
    };
    const m = map[rec || "lean_hire"] || map.lean_hire;
    return <Badge className={m.color}>{m.label}</Badge>;
  };

  const getPriorityColor = (p: string) => {
    if (p === "high") return "text-red-400";
    if (p === "medium") return "text-amber-400";
    return "text-green-400";
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Interview <span className="gradient-text">Report</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {new Date(report.created_at).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          {getRecommendationBadge(report.hiring_recommendation)}
        </div>

        {/* Overall Score + Radar */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Score Card */}
          <Card className="glass-card border-0">
            <CardContent className="p-8 text-center">
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(report.overall_score / 10) * 327} 327`}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="oklch(0.628 0.255 292)" />
                      <stop offset="100%" stopColor="oklch(0.777 0.152 194)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{report.overall_score.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold">Overall Score</h3>

              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  { label: "Communication", score: report.communication_score },
                  { label: "Technical", score: report.technical_score },
                  { label: "Relevance", score: report.relevance_score },
                  { label: "Confidence", score: report.confidence_score },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`text-xl font-bold ${getScoreColor(s.score)}`}>{s.score.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(1 0 0 / 8%)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="score"
                    stroke="oklch(0.628 0.255 292)"
                    fill="oklch(0.628 0.255 292)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Interview Integrity */}
        {report.proctoring_summary && (
          <Card className="glass-card border-0 mb-6 border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" /> Interview Integrity
                <div className="ml-auto flex items-center gap-3 text-sm font-normal">
                  <Badge variant="outline" className="border-white/10">
                    Score: <span className={`ml-1 font-bold ${getScoreColor((report.proctoring_summary.integrity_score || 100) / 10)}`}>
                      {report.proctoring_summary.integrity_score || 100}/100
                    </span>
                  </Badge>
                  {report.proctoring_summary.warning_count > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                      {report.proctoring_summary.warning_count} Warnings
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Breakdown */}
                {Object.keys(report.proctoring_summary.event_breakdown).length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Event Breakdown</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(report.proctoring_summary.event_breakdown).map(([type, count]) => (
                        <Badge key={type} variant="secondary" className="bg-white/5">
                          {type.replace("_", " ")}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Perfect integrity score! No suspicious activity detected.
                  </p>
                )}

                {/* Timeline */}
                {report.proctoring_summary.timeline.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Incident Timeline</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {report.proctoring_summary.timeline.map((evt, i) => (
                        <div key={i} className="flex gap-3 text-sm bg-white/5 p-2.5 rounded-lg">
                          <span className="font-mono text-xs text-muted-foreground mt-0.5">{evt.time}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium capitalize">{evt.type.replace("_", " ")}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                                evt.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                evt.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {evt.severity}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{evt.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {report.interview_summary && (
          <Card className="glass-card border-0 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" /> Interview Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {report.interview_summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Star className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Target className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{w}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Roadmap */}
        {report.personalized_roadmap.length > 0 && (
          <Card className="glass-card border-0 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-cyan-400" /> Personalized Improvement Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.personalized_roadmap.map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.03]">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.priority === "high" ? "bg-red-500/15 text-red-400" :
                        item.priority === "medium" ? "bg-amber-500/15 text-amber-400" :
                        "bg-green-500/15 text-green-400"
                      }`}>
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{item.topic}</span>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">⏱ {item.timeline}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.action}</p>
                      {item.resources?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {item.resources.map((r, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hiring Explanation */}
        {report.hiring_explanation && (
          <Card className="glass-card border-0 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> AI Hiring Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                {getRecommendationBadge(report.hiring_recommendation)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.hiring_explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/dashboard/interview/setup">
            <Button className="gradient-purple-cyan text-white border-0">
              <Brain className="w-4 h-4 mr-2" /> New Interview
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="outline" className="border-white/10">
              <TrendingUp className="w-4 h-4 mr-2" /> View Analytics
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
