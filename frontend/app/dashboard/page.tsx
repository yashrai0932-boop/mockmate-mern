"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { analyticsService } from "@/services/analytics";
import { interviewService } from "@/services/interview";
import type { AnalyticsDashboard, InterviewSession } from "@/types";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsService.getDashboard();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      icon: MessageSquare,
      label: "Total Interviews",
      value: analytics?.total_interviews ?? 0,
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: Trophy,
      label: "Average Score",
      value: analytics?.average_score ? `${analytics.average_score}/10` : "—",
      color: "from-cyan-500 to-teal-600",
    },
    {
      icon: Target,
      label: "Completed",
      value: analytics?.completed_interviews ?? 0,
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: TrendingUp,
      label: "Weak Areas",
      value: analytics?.weak_topics?.length ?? 0,
      color: "from-amber-500 to-orange-600",
    },
  ];

  const getScoreColor = (score: number | undefined | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 8) return "score-excellent";
    if (score >= 6) return "score-good";
    if (score >= 4) return "score-average";
    return "score-poor";
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          className="text-3xl font-bold mb-2"
          initial="hidden" animate="visible" variants={fadeIn} custom={0}
        >
          Welcome back, <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span>
        </motion.h1>
        <motion.p
          className="text-muted-foreground"
          initial="hidden" animate="visible" variants={fadeIn} custom={1}
        >
          Ready for your next mock interview?
        </motion.p>
      </div>

      {/* Quick Start */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={2}>
        <Card className="glass-card mb-8 overflow-hidden border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-purple-cyan flex items-center justify-center glow-purple">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Start a New Interview</h3>
                <p className="text-sm text-muted-foreground">Upload resume, pick a role, and begin</p>
              </div>
            </div>
            <Link href="/dashboard/interview/setup">
              <Button className="gradient-purple-cyan text-white border-0 hover:opacity-90">
                Start Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial="hidden" animate="visible" variants={fadeIn} custom={i + 3}>
            <Card className="glass-card border-0 hover:bg-white/[0.06] transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : card.value}
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Interviews */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={7}>
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Interviews</CardTitle>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : analytics?.recent_sessions && analytics.recent_sessions.length > 0 ? (
              <div className="space-y-3">
                {analytics.recent_sessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={
                      session.status === "completed"
                        ? `/dashboard/report/${session.id}`
                        : `/dashboard/interview/${session.id}`
                    }
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{session.target_role}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={session.status === "completed" ? "default" : "secondary"}
                        className={
                          session.status === "completed"
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }
                      >
                        {session.status}
                      </Badge>
                      {session.overall_score && (
                        <span className={`text-lg font-bold ${getScoreColor(session.overall_score)}`}>
                          {session.overall_score.toFixed(1)}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-2">No interviews yet</p>
                <Link href="/dashboard/interview/setup">
                  <Button variant="outline" size="sm">Start your first interview</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
