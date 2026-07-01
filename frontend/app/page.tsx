"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Mic,
  BarChart3,
  FileText,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Users,
  ChevronRight,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  {
    icon: Brain,
    title: "AI-Powered Questions",
    desc: "Dynamic questions based on your resume, role, and previous answers. Adapts difficulty in real-time.",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: Mic,
    title: "Voice Interview Mode",
    desc: "Speak your answers naturally. Real-time transcription, filler word detection, and confidence analysis.",
    color: "from-cyan-500 to-teal-600",
  },
  {
    icon: BarChart3,
    title: "Instant Feedback",
    desc: "Get scored on Communication, Technical Depth, Relevance, and Confidence after every answer.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: FileText,
    title: "Smart Resume Parsing",
    desc: "Upload PDF or DOCX. AI extracts skills, projects, experience and generates your candidate profile.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Sparkles,
    title: "Personalized Roadmap",
    desc: "Get a detailed improvement plan with resources, timelines, and priority topics after each interview.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Users,
    title: "5 AI Personalities",
    desc: "Practice with a Friendly Mentor, Strict FAANG Interviewer, Startup Founder, and more.",
    color: "from-violet-500 to-purple-600",
  },
];

const steps = [
  { num: "01", title: "Upload Resume", desc: "Drop your PDF or DOCX resume and let AI analyze it" },
  { num: "02", title: "Choose Role & Style", desc: "Pick your target role and interviewer personality" },
  { num: "03", title: "Start Interview", desc: "Answer questions via text or voice in a ChatGPT-style UI" },
  { num: "04", title: "Get Your Report", desc: "Detailed scores, feedback, roadmap, and hiring recommendation" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ===== Navbar ===== */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-purple-cyan flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">MockMate</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="gradient-purple-cyan text-white border-0 shadow-lg hover:opacity-90 transition-opacity">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="mesh-gradient absolute inset-0" />
        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-cyan-500/8 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-muted-foreground mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Powered by NVIDIA NIM AI
              <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={1}
          >
            Ace Your Next Interview{" "}
            <span className="gradient-text">with AI</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={2}
          >
            Upload your resume, choose your target role, and practice with
            realistic AI interviewers. Get instant feedback, detailed scores,
            and a personalized improvement roadmap.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={3}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="gradient-purple-cyan text-white text-lg px-8 py-6 border-0 glow-purple hover:opacity-90 transition-all"
              >
                Start Practicing Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white/10 hover:bg-white/5"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex justify-center gap-12 mt-16"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            custom={4}
          >
            {[
              { label: "AI Personalities", value: "5+" },
              { label: "Question Types", value: "4" },
              { label: "Instant Feedback", value: "Real-time" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete interview preparation platform powered by cutting-edge AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card p-6 hover:bg-white/[0.06] transition-all duration-300 group cursor-default"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-24 px-6 relative">
        <div className="mesh-gradient absolute inset-0 opacity-50" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="text-5xl font-bold gradient-text opacity-30 mb-3">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="glass-card p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Ace Your Interview?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of candidates preparing smarter with AI-powered mock interviews.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="gradient-purple-cyan text-white text-lg px-10 py-6 border-0 glow-purple hover:opacity-90"
              >
                Get Started — It&apos;s Free
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-purple-cyan flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">MockMate</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MockMate. AI-powered interview preparation.
          </p>
        </div>
      </footer>
    </div>
  );
}
