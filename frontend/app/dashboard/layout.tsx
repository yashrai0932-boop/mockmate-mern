"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/interview/setup", icon: MessageSquare, label: "New Interview" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/resumes", icon: FileText, label: "Resumes" },
  { href: "/dashboard/recruiter", icon: Users, label: "Recruiter" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-48">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden md:flex w-64 border-r border-white/5 flex-col fixed h-full z-40 bg-background/80 backdrop-blur-xl">
        <SidebarContent pathname={pathname} user={user} handleLogout={handleLogout} />
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* ===== Mobile Header ===== */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-purple-cyan flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">MockMate</span>
          </Link>
          <Sheet>
            <SheetTrigger className="text-muted-foreground p-2 hover:bg-white/5 rounded-md transition-colors">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-background border-white/10" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <SidebarContent pathname={pathname} user={user} handleLogout={handleLogout} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

function SidebarContent({ pathname, user, handleLogout }: any) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-purple-cyan flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">MockMate</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname === item.href || pathname.startsWith(item.href + "/");
          // Hide recruiter tab for non-recruiters
          if (item.href === "/dashboard/recruiter" && user?.role !== "recruiter") return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full gradient-purple-cyan flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );
}


