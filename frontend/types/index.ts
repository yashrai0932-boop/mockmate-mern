/**
 * MockMate TypeScript Type Definitions
 * Central type definitions for the entire frontend.
 */

// ===== Auth Types =====
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "recruiter";
  avatar_url?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  role: "user" | "recruiter";
}

// ===== Resume Types =====
export interface Resume {
  id: string;
  file_name: string;
  file_type: string;
  parsed_data?: ParsedResumeData;
  candidate_summary?: string;
  created_at: string;
}

export interface ParsedResumeData {
  skills: string[];
  projects: Array<{ name: string; description: string; technologies: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  experience: Array<{ title: string; company: string; duration: string; description: string }>;
  certifications: string[];
  technologies: string[];
}

// ===== Interview Types =====
export interface InterviewPersonality {
  key: string;
  name: string;
  icon: string;
  description: string;
}

export interface InterviewStartRequest {
  resume_id: string;
  target_role: string;
  personality: string;
  difficulty: "easy" | "medium" | "hard";
  company_style?: string;
  interview_type: string;
  total_questions: number;
}

export interface InterviewSession {
  id: string;
  target_role: string;
  personality: string;
  difficulty: string;
  status: "in_progress" | "completed" | "abandoned";
  current_question_index: number;
  total_questions: number;
  overall_score?: number;
  created_at: string;
  completed_at?: string;
}

export interface Question {
  id: string;
  text: string;
  category: "hr" | "technical" | "situational" | "behavioral";
  difficulty: number;
  order_index: number;
  related_resume_section?: string;
  is_follow_up: boolean;
  question_type?: "open_ended" | "multiple_choice";
  options?: string[];
}

export interface AnswerSubmitRequest {
  text: string;
  response_time_seconds?: number;
  input_method: "text" | "voice";
  voice_analysis?: VoiceAnalysis;
}

export interface AnswerFeedback {
  answer_id: string;
  scores: Scores;
  feedback: FeedbackDetail;
  next_question?: Question;
  is_interview_complete: boolean;
}

export interface Scores {
  communication: number;
  technical_depth: number;
  relevance: number;
  confidence: number;
  overall: number;
}

export interface FeedbackDetail {
  strengths: string[];
  weaknesses: string[];
  missing_concepts: string[];
  communication_feedback: string;
  improvement_suggestions: string[];
  ideal_answer: string;
}

// ===== Chat Message Types =====
export interface ChatMessage {
  id: string;
  type: "question" | "answer" | "feedback" | "system";
  content: string;
  timestamp: Date;
  question?: Question;
  feedback?: AnswerFeedback;
  isTyping?: boolean;
}

// ===== Report Types =====
export interface RoadmapItem {
  topic: string;
  action: string;
  priority: "high" | "medium" | "low";
  timeline: string;
  resources: string[];
}

export interface Report {
  id: string;
  session_id: string;
  overall_score: number;
  communication_score: number;
  technical_score: number;
  relevance_score: number;
  confidence_score: number;
  interview_summary?: string;
  strengths: string[];
  weaknesses: string[];
  personalized_roadmap: RoadmapItem[];
  hiring_recommendation?: string;
  hiring_explanation?: string;
  resume_suggestions: string[];
  integrity_score?: number;
  proctoring_summary?: ProctorSummary;
  created_at: string;
}

// ===== Analytics Types =====
export interface ScoreTrend {
  date: string;
  overall: number;
  communication: number;
  technical: number;
  relevance: number;
  confidence: number;
  role: string;
}

export interface WeakTopic {
  category: string;
  avg_score: number;
  attempts: number;
}

export interface AnalyticsDashboard {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  score_trends: ScoreTrend[];
  weak_topics: WeakTopic[];
  confidence_progress: Array<{ date: string; confidence: number }>;
  skill_heatmap: Record<string, number>;
  recent_sessions: Array<{
    id: string;
    target_role: string;
    status: string;
    overall_score?: number;
    created_at: string;
  }>;
}

// ===== Voice Types =====
export interface VoiceAnalysis {
  filler_words: Record<string, number>;
  filler_word_count: number;
  speaking_speed_wpm: number;
  word_count: number;
  pause_indicators: number;
  confidence_indicators: {
    hedging_phrases: number;
    assertive_phrases: number;
  };
}

export interface TranscriptionResult {
  transcript: string;
  duration_seconds?: number;
  analysis?: VoiceAnalysis;
  error?: string;
}

// ===== Recruiter Types =====
export interface RecruiterJob {
  id: string;
  title: string;
  company?: string;
  description: string;
  created_at: string;
}

export interface CandidateMatch {
  user_id: string;
  full_name: string;
  email: string;
  resume_id: string;
  fit_score: number;
  matching_skills: string[];
  missing_skills: string[];
  interview_summary?: string;
  hiring_recommendation?: string;
}

// ===== Proctoring Types =====
export interface ProctorEvent {
  event_type: string;
  severity: "low" | "medium" | "high";
  message: string;
  score_penalty: number;
  timestamp?: string;
}

export interface ProctorTimelineItem {
  time: string;
  type: string;
  severity: string;
  message: string;
}

export interface ProctorSummary {
  session_id: string;
  integrity_score: number;
  total_events: number;
  warning_count: number;
  event_breakdown: Record<string, number>;
  timeline: ProctorTimelineItem[];
}

