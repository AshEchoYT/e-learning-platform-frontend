"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { authClient, useSession } from "@/lib/auth-client";
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp, 
  Play,
  Download,
  Calendar,
  Target,
  Loader2
} from "lucide-react";

interface Enrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  courseImage: string;
  instructorName: string;
  progress: number;
  lastAccessed: string;
}

interface Certificate {
  id: number;
  courseId: number;
  courseTitle: string;
  issuedAt: string;
}

interface DashboardStats {
  totalEnrollments: number;
  completedCourses: number;
  totalCertificates: number;
  totalLearningHours: number;
  weeklyHours: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEnrollments: 0,
    completedCourses: 0,
    totalCertificates: 0,
    totalLearningHours: 0,
    weeklyHours: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?redirect=/dashboard/student');
      return;
    }

    if (!session?.user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("bearer_token");
        
        const response = await fetch('/api/dashboard/student', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        
        setEnrollments(data.enrollments || []);
        setCertificates(data.certificates || []);
        
        // Calculate stats
        const inProgressCourses = data.enrollments?.filter((e: Enrollment) => e.progress < 100).length || 0;
        const completedCourses = data.enrollments?.filter((e: Enrollment) => e.progress === 100).length || 0;
        const totalHours = Math.floor(Math.random() * 200) + 50; // Simulated for now
        const weeklyHours = Math.floor(Math.random() * 15) + 5; // Simulated for now
        
        setStats({
          totalEnrollments: inProgressCourses,
          completedCourses,
          totalCertificates: data.certificates?.length || 0,
          totalLearningHours: totalHours,
          weeklyHours,
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, isPending, router]);

  // Mock data for charts (would come from API in production)
  const learningData = [
    { day: "Mon", hours: 2 },
    { day: "Tue", hours: 3 },
    { day: "Wed", hours: 1.5 },
    { day: "Thu", hours: 4 },
    { day: "Fri", hours: 2.5 },
    { day: "Sat", hours: 5 },
    { day: "Sun", hours: 3 },
  ];

  const progressData = [
    { month: "Jul", courses: 1 },
    { month: "Aug", courses: 2 },
    { month: "Sep", courses: 3 },
    { month: "Oct", courses: 3 },
    { month: "Nov", courses: 4 },
    { month: "Dec", courses: stats.completedCourses },
  ];

  if (isLoading) {
    return (
      <>
        <CursorGlow />
        <Header />
        <main className="pt-24 pb-20 min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <CursorGlow />
        <Header />
        <main className="pt-24 pb-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <CursorGlow />
      <Header />

      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-purple-50/50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome back, {session?.user?.name || 'Student'}! 👋</h1>
                <p className="text-muted-foreground">Continue your learning journey</p>
              </div>
              <Avatar className="w-16 h-16">
                <AvatarImage src={session?.user?.image || `https://i.pravatar.cc/150?u=${session?.user?.email}`} />
                <AvatarFallback>{session?.user?.name?.[0] || 'S'}</AvatarFallback>
              </Avatar>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: BookOpen, label: "Courses In Progress", value: stats.totalEnrollments.toString(), color: "from-blue-500 to-cyan-500" },
              { icon: Award, label: "Certificates Earned", value: stats.totalCertificates.toString(), color: "from-purple-500 to-pink-500" },
              { icon: Clock, label: "Learning Hours", value: stats.totalLearningHours.toString(), color: "from-orange-500 to-red-500" },
              { icon: TrendingUp, label: "This Week", value: `${stats.weeklyHours}h`, color: "from-green-500 to-emerald-500" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Courses */}
            <div className="lg:col-span-2 space-y-8">
              {/* Continue Learning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Continue Learning</h2>
                  <Link href="/courses">
                    <Button variant="ghost">View All</Button>
                  </Link>
                </div>

                {enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.slice(0, 3).map((enrollment, index) => (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="flex gap-4 p-4">
                            <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image src={enrollment.courseImage} alt={enrollment.courseTitle} fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{enrollment.courseTitle}</h3>
                              <p className="text-sm text-muted-foreground mb-3">by {enrollment.instructorName}</p>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium">{enrollment.progress}%</span>
                                  </div>
                                  <Progress value={enrollment.progress} className="h-2" />
                                </div>
                                <Link href={`/courses/${enrollment.courseId}`}>
                                  <Button size="sm">Continue</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start your learning journey by enrolling in a course
                    </p>
                    <Link href="/courses">
                      <Button>Browse Courses</Button>
                    </Link>
                  </Card>
                )}
              </motion.div>

              {/* Learning Activity Charts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-2xl font-bold mb-6">Learning Activity</h2>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Hours This Week</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={learningData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Goals */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Learning Goals</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Weekly Goal</span>
                        <span className="text-sm font-medium">{stats.weeklyHours} / 10 hrs</span>
                      </div>
                      <Progress value={(stats.weeklyHours / 10) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Monthly Courses</span>
                        <span className="text-sm font-medium">{stats.completedCourses} / 3 completed</span>
                      </div>
                      <Progress value={(stats.completedCourses / 3) * 100} className="h-2" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Upcoming Deadlines */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Upcoming</h3>
                  </div>
                  <div className="space-y-3">
                    {enrollments.length > 0 ? (
                      enrollments.slice(0, 3).map((enrollment, index) => (
                        <div key={enrollment.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? "bg-red-500" : "bg-green-500"}`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{enrollment.courseTitle}</p>
                            <p className="text-xs text-muted-foreground">Continue learning</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming items
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Certificates */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Certificates</h3>
                    </div>
                    <Badge>{certificates.length}</Badge>
                  </div>
                  {certificates.length > 0 ? (
                    <div className="space-y-3">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                          <p className="font-medium text-sm mb-1">{cert.courseTitle}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Complete courses to earn certificates
                    </p>
                  )}
                </Card>
              </motion.div>

              {/* Progress Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Course Completion</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="courses" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}