"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Target, Brain, Loader2,
  MessageSquare, AlertTriangle, Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService } from "@/services/analytics";
import type { AnalyticsDashboard } from "@/types";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsService.getDashboard();
        setData(res);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "#4ade80";
    if (score >= 6) return "#22d3ee";
    if (score >= 4) return "#fbbf24";
    return "#f87171";
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" /> <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Analytics</span> Dashboard
        </h1>
        <p className="text-muted-foreground mb-8">Track your progress over time</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: MessageSquare, label: "Total Interviews", value: data?.total_interviews ?? 0, color: "from-purple-500 to-indigo-600" },
          { icon: Trophy, label: "Avg Score", value: data?.average_score ? `${data.average_score.toFixed(1)}/10` : "—", color: "from-cyan-500 to-teal-600" },
          { icon: Target, label: "Completed", value: data?.completed_interviews ?? 0, color: "from-green-500 to-emerald-600" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card border-0">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Trends */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" /> Score Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.score_trends && data.score_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.score_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 10 }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    />
                    <YAxis domain={[0, 10]} tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.02 260)",
                        border: "1px solid oklch(1 0 0 / 10%)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="overall" stroke="oklch(0.628 0.255 292)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="communication" stroke="oklch(0.777 0.152 194)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="technical" stroke="oklch(0.723 0.219 149)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="confidence" stroke="oklch(0.769 0.188 70)" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">Complete interviews to see trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weak Topics */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Performance by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.weak_topics && data.weak_topics.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.weak_topics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                    <XAxis type="number" domain={[0, 10]} tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 10 }} />
                    <YAxis
                      type="category" dataKey="category" width={100}
                      tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 12, textTransform: "capitalize" } as any}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.02 260)",
                        border: "1px solid oklch(1 0 0 / 10%)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="avg_score" radius={[0, 6, 6, 0]}>
                      {data.weak_topics.map((entry, i) => (
                        <Cell key={i} fill={getScoreColor(entry.avg_score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
                  <Target className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">No category data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
