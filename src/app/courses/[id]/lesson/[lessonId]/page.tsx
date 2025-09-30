"use client";

import { useState, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  MessageSquare,
  BookOpen,
  List,
  Loader2
} from "lucide-react";

interface Lesson {
  id: number;
  courseId: number;
  title: string;
  duration: string;
  videoUrl: string;
  transcript: string;
  order: number;
  locked: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
}

interface Note {
  id: number;
  lessonId: number;
  userId: number;
  content: string;
  timestamp: string;
  createdAt: string;
}

interface LessonProgress {
  id: number;
  userId: number;
  lessonId: number;
  completed: boolean;
  progress: number;
  lastPosition: number;
}

export default function LessonPlayerPage({ 
  params 
}: { 
  params: Promise<{ id: string; lessonId: string }> 
}) {
  const { id, lessonId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [note, setNote] = useState("");
  
  // Data states
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/courses/${id}/lesson/${lessonId}`)}`);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem("bearer_token");
        
        // Fetch course
        const courseResponse = await fetch(`/api/courses?id=${id}`);
        if (!courseResponse.ok) throw new Error('Failed to fetch course');
        const courseData = await courseResponse.json();
        if (courseData.length > 0) setCourse(courseData[0]);
        
        // Fetch all lessons for sidebar
        const lessonsResponse = await fetch(`/api/courses/${id}/lessons`);
        if (!lessonsResponse.ok) throw new Error('Failed to fetch lessons');
        const lessonsData = await lessonsResponse.json();
        setAllLessons(lessonsData);
        
        // Fetch current lesson
        const lessonResponse = await fetch(`/api/lessons?id=${lessonId}`);
        if (!lessonResponse.ok) throw new Error('Failed to fetch lesson');
        const lessonData = await lessonResponse.json();
        if (lessonData.length > 0) setCurrentLesson(lessonData[0]);
        
        // Fetch lesson notes
        const notesResponse = await fetch(`/api/lessons/${lessonId}/notes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData);
        }
        
        // Fetch progress for all lessons
        const progressPromises = lessonsData.map((lesson: Lesson) =>
          fetch(`/api/lessons/${lesson.id}/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : null)
        );
        
        const progressResults = await Promise.all(progressPromises);
        const completed = progressResults
          .filter((p, index) => p && p.completed)
          .map((_, index) => lessonsData[index].id);
        setCompletedLessons(completed);
        
        // Get current lesson progress
        const currentProgressResponse = await fetch(`/api/lessons/${lessonId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (currentProgressResponse.ok) {
          const currentProgressData = await currentProgressResponse.json();
          setProgress(currentProgressData);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load lesson data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, lessonId, session, router]);

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      setIsSavingNote(true);
      const token = localStorage.getItem("bearer_token");
      
      const response = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: note,
          timestamp: '00:00', // You can track actual video timestamp
        }),
      });

      if (!response.ok) throw new Error('Failed to save note');

      const newNote = await response.json();
      setNotes([...notes, newNote]);
      setNote('');
      toast.success('Note saved successfully');
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: true,
          progress: 100,
          lastPosition: 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to mark as complete');

      setCompletedLessons([...completedLessons, parseInt(lessonId)]);
      toast.success('Lesson marked as complete!');
    } catch (err) {
      toast.error('Failed to mark lesson as complete');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    // Note: You may need to add a DELETE endpoint for notes
    setNotes(notes.filter(n => n.id !== noteId));
    toast.success('Note deleted');
  };

  const navigateToLesson = (newLessonId: number) => {
    router.push(`/courses/${id}/lesson/${newLessonId}`);
  };

  const currentLessonIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  
  const completionPercentage = allLessons.length > 0 
    ? (completedLessons.length / allLessons.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !currentLesson || !course) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The lesson you are looking for does not exist.'}</p>
          <Button onClick={() => router.push(`/courses/${id}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  // Parse transcript if it's a JSON string
  let transcriptData: { time: string; text: string }[] = [];
  try {
    transcriptData = currentLesson.transcript ? JSON.parse(currentLesson.transcript) : [];
  } catch {
    transcriptData = [];
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${id}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Course
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">{course.title}</h1>
            <p className="text-sm text-muted-foreground">
              Lesson {currentLessonIndex + 1} of {allLessons.length}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
          <List className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="relative bg-black aspect-video w-full">
            {currentLesson.videoUrl ? (
              <video
                src={currentLesson.videoUrl}
                controls
                className="w-full h-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <>
                <Image
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&h=1080&fit=crop"
                  alt="Video placeholder"
                  fill
                  className="object-cover opacity-60"
                />
                
                {/* Play/Pause Overlay */}
                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsPlaying(true)}
                        className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl"
                      >
                        <Play className="w-10 h-10 text-purple-900 ml-2" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Tabs Below Video */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="transcript">
                  <FileText className="w-4 h-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Notes ({notes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                  <p className="text-muted-foreground mb-6">
                    Duration: {currentLesson.duration}
                  </p>
                  
                  {!completedLessons.includes(parseInt(lessonId)) && (
                    <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-2">Complete this lesson</h3>
                          <p className="text-sm text-muted-foreground">
                            Mark as complete when you finish watching
                          </p>
                        </div>
                        <Button onClick={handleMarkComplete}>
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      </div>
                    </Card>
                  )}

                  <div className="flex gap-3">
                    {previousLesson && (
                      <Button 
                        variant="outline"
                        onClick={() => navigateToLesson(previousLesson.id)}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous Lesson
                      </Button>
                    )}
                    {nextLesson && (
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                        onClick={() => navigateToLesson(nextLesson.id)}
                      >
                        Next Lesson
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xl font-bold mb-4">Transcript</h3>
                  {transcriptData.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {transcriptData.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          >
                            <span className="text-sm font-mono text-primary font-semibold">
                              {item.time}
                            </span>
                            <p className="flex-1 text-sm">{item.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground">No transcript available for this lesson.</p>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xl font-bold mb-4">My Notes</h3>
                  
                  <Card className="p-4 mb-6">
                    <Textarea
                      placeholder="Add a note for this lesson..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mb-3 min-h-[100px]"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleSaveNote}
                      disabled={isSavingNote || !note.trim()}
                    >
                      {isSavingNote ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Note'
                      )}
                    </Button>
                  </Card>

                  <div className="space-y-3">
                    {notes.length > 0 ? (
                      notes.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-mono text-primary">{item.timestamp}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteNote(item.id)}
                              >
                                Delete
                              </Button>
                            </div>
                            <p className="text-sm">{item.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No notes yet. Add your first note above!
                      </p>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar - Lesson List */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 border-l border-border bg-card overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold mb-2">Course Content</h3>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {completedLessons.length} of {allLessons.length} lessons completed
                </p>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {allLessons.map((lesson) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const isCurrent = lesson.id === parseInt(lessonId);
                    
                    return (
                      <motion.div
                        key={lesson.id}
                        whileHover={{ x: 4 }}
                        className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => navigateToLesson(lesson.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {isCompleted ? (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : isCurrent ? (
                              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <Play className="w-3 h-3 text-primary ml-0.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-current rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium mb-1 ${
                              isCurrent ? "text-primary-foreground" : ""
                            }`}>
                              {lesson.title}
                            </p>
                            <p className={`text-xs ${
                              isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {lesson.duration}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}