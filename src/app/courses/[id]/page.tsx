"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";
import ParallaxHero from "@/components/ParallaxHero";
import AnimatedButton from "@/components/AnimatedButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  Clock, 
  Users, 
  Star, 
  Globe, 
  Award, 
  Play, 
  CheckCircle2, 
  BookOpen,
  BarChart,
  MessageSquare,
  Share2,
  Loader2,
  Lock
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  instructorName: string;
  categoryId: number;
  categoryName: string;
  price: number;
  duration: string;
  image: string;
  studentsCount: number;
  rating: number;
  published: boolean;
}

interface Lesson {
  id: number;
  courseId: number;
  title: string;
  duration: string;
  videoUrl: string;
  order: number;
  locked: boolean;
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  courseId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch course details
        const courseResponse = await fetch(`/api/courses?id=${id}`);
        if (!courseResponse.ok) throw new Error('Failed to fetch course');
        const courseData = await courseResponse.json();
        
        if (courseData.length === 0) {
          setError('Course not found');
          return;
        }
        
        setCourse(courseData[0]);

        // Fetch lessons
        const lessonsResponse = await fetch(`/api/courses/${id}/lessons`);
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData);
        }

        // Fetch reviews
        const reviewsResponse = await fetch(`/api/reviews?courseId=${id}`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }

        // Check enrollment status if user is logged in
        if (session?.user) {
          const enrollmentResponse = await fetch(`/api/enrollments?courseId=${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
            },
          });
          if (enrollmentResponse.ok) {
            const enrollmentData = await enrollmentResponse.json();
            setIsEnrolled(enrollmentData.length > 0);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [id, session]);

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }

    try {
      setIsEnrolling(true);
      
      const token = localStorage.getItem("bearer_token");
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: parseInt(id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll');
      }

      toast.success('Successfully enrolled in the course!');
      setIsEnrolled(true);
      
      // Redirect to first lesson
      if (lessons.length > 0) {
        router.push(`/courses/${id}/lesson/${lessons[0].id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleStartCourse = () => {
    if (lessons.length > 0) {
      router.push(`/courses/${id}/lesson/${lessons[0].id}`);
    }
  };

  // Group lessons by section (for now, group every 3 lessons)
  const groupedLessons = lessons.reduce((acc: { title: string; lessons: Lesson[] }[], lesson, index) => {
    const sectionIndex = Math.floor(index / 3);
    if (!acc[sectionIndex]) {
      acc[sectionIndex] = {
        title: `Section ${sectionIndex + 1}`,
        lessons: [],
      };
    }
    acc[sectionIndex].lessons.push(lesson);
    return acc;
  }, []);

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => Math.floor(r.rating) === rating).length;
    return {
      rating,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });

  if (isLoading) {
    return (
      <>
        <CursorGlow />
        <Header />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !course) {
    return (
      <>
        <CursorGlow />
        <Header />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'The course you are looking for does not exist.'}</p>
            <AnimatedButton onClick={() => router.push('/courses')}>
              Browse Courses
            </AnimatedButton>
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

      <main className="pt-20">
        {/* Hero Section with Parallax */}
        <ParallaxHero className="bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="mb-4 bg-white/20 text-white border-white/30">
                  {course.categoryName}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {course.title}
                </h1>
                <p className="text-xl text-white/80 mb-6">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{course.rating.toFixed(1)}</span>
                    <span className="text-white/70">({reviews.length} ratings)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{course.studentsCount.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {isEnrolled ? (
                    <AnimatedButton 
                      size="lg" 
                      className="bg-white text-purple-900 hover:bg-white/90"
                      onClick={handleStartCourse}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Continue Learning
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton 
                      size="lg" 
                      className="bg-white text-purple-900 hover:bg-white/90"
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Enroll Now - ${course.price}
                        </>
                      )}
                    </AnimatedButton>
                  )}
                  <AnimatedButton size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </AnimatedButton>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl"
                      onClick={isEnrolled ? handleStartCourse : handleEnroll}
                    >
                      <Play className="w-8 h-8 text-purple-900 ml-1" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </ParallaxHero>

        {/* What You'll Learn */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-8">What You&apos;ll Learn</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Master the fundamentals and advanced concepts",
                  "Build real-world projects from scratch",
                  "Learn industry best practices and patterns",
                  "Get hands-on experience with modern tools",
                  "Understand performance optimization techniques",
                  "Prepare for professional certifications",
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Tabs */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="curriculum" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                    <TabsTrigger value="instructor">Instructor</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="curriculum" className="mt-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <h3 className="text-2xl font-bold mb-4">Course Curriculum</h3>
                      <p className="text-muted-foreground mb-6">
                        {lessons.length} lectures • {course.duration}
                      </p>
                      
                      {groupedLessons.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {groupedLessons.map((section, sectionIndex) => (
                            <AccordionItem key={sectionIndex} value={`section-${sectionIndex}`}>
                              <AccordionTrigger className="text-lg font-semibold">
                                <div className="flex items-center justify-between flex-1 mr-4">
                                  <span>{section.title}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {section.lessons.length} lessons
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2">
                                  {section.lessons.map((lesson, lessonIndex) => (
                                    <motion.div
                                      key={lesson.id}
                                      whileHover={{ x: 4 }}
                                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                                      onClick={() => isEnrolled && router.push(`/courses/${id}/lesson/${lesson.id}`)}
                                    >
                                      <div className="flex items-center gap-3">
                                        {!isEnrolled && lesson.locked ? (
                                          <Lock className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                          <Play className="w-5 h-5 text-primary" />
                                        )}
                                        <span className={!isEnrolled && lesson.locked ? "text-muted-foreground" : ""}>
                                          {lesson.title}
                                        </span>
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {lesson.duration}
                                      </span>
                                    </motion.div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-muted-foreground">No lessons available yet.</p>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="instructor" className="mt-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <h3 className="text-2xl font-bold mb-6">About the Instructor</h3>
                      <Card className="p-6">
                        <div className="flex items-start gap-6">
                          <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Avatar className="w-24 h-24">
                              <AvatarImage src={`https://i.pravatar.cc/150?img=${course.instructorId}`} />
                              <AvatarFallback>{course.instructorName[0]}</AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold mb-2">{course.instructorName}</h4>
                            <p className="text-muted-foreground mb-4">
                              Senior Software Engineer & Educator
                            </p>
                            
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Star className="w-4 h-4" />
                                  <span>4.9 Rating</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Users className="w-4 h-4" />
                                  <span>50K+ Students</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <BookOpen className="w-4 h-4" />
                                  <span>15 Courses</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-muted-foreground leading-relaxed">
                              With over 10 years of industry experience and a passion for teaching, 
                              {course.instructorName} has helped thousands of students worldwide achieve 
                              their career goals. Specializing in modern web technologies and best 
                              practices, bringing real-world expertise to every lesson.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <h3 className="text-2xl font-bold mb-6">Student Reviews</h3>
                      
                      {reviews.length > 0 && (
                        <>
                          {/* Rating Summary */}
                          <Card className="p-6 mb-6">
                            <div className="flex items-center gap-8">
                              <div className="text-center">
                                <div className="text-5xl font-bold mb-2">{course.rating.toFixed(1)}</div>
                                <div className="flex items-center gap-1 mb-2 justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-5 h-5 ${
                                        i < Math.floor(course.rating)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="text-sm text-muted-foreground">Course Rating</div>
                              </div>
                              <div className="flex-1">
                                {ratingDistribution.map(({ rating, percentage }) => (
                                  <div key={rating} className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-1 w-12">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm">{rating}</span>
                                    </div>
                                    <Progress value={percentage} className="flex-1" />
                                    <span className="text-sm text-muted-foreground w-12">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Card>

                          {/* Reviews List */}
                          <div className="space-y-6">
                            {reviews.map((review, index) => (
                              <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Card className="p-6">
                                  <div className="flex items-start gap-4">
                                    <Avatar>
                                      <AvatarImage src={review.userAvatar} />
                                      <AvatarFallback>{review.userName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{review.userName}</h4>
                                        <span className="text-sm text-muted-foreground">
                                          {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                          <Star 
                                            key={i} 
                                            className={`w-4 h-4 ${
                                              i < review.rating 
                                                ? "fill-yellow-400 text-yellow-400" 
                                                : "text-gray-300"
                                            }`} 
                                          />
                                        ))}
                                      </div>
                                      <p className="text-muted-foreground">{review.comment}</p>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {reviews.length === 0 && (
                        <Card className="p-12 text-center">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h4 className="text-lg font-semibold mb-2">No reviews yet</h4>
                          <p className="text-muted-foreground">
                            Be the first to review this course after enrolling
                          </p>
                        </Card>
                      )}
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column - Course Info Card */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky top-24"
                >
                  <Card className="p-6">
                    <h3 className="text-2xl font-bold mb-6">This course includes:</h3>
                    <div className="space-y-4 mb-6">
                      {[
                        { icon: Clock, text: `${course.duration} on-demand video` },
                        { icon: BookOpen, text: `${lessons.length} lessons` },
                        { icon: Award, text: "Certificate of completion" },
                        { icon: Globe, text: "Access on mobile and TV" },
                        { icon: BarChart, text: "Full lifetime access" },
                        { icon: MessageSquare, text: "Q&A support" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    {isEnrolled ? (
                      <AnimatedButton 
                        className="w-full mb-3 bg-gradient-to-r from-purple-600 to-blue-600"
                        onClick={handleStartCourse}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Continue Learning
                      </AnimatedButton>
                    ) : (
                      <AnimatedButton 
                        className="w-full mb-3 bg-gradient-to-r from-purple-600 to-blue-600"
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>Enroll Now - ${course.price}</>
                        )}
                      </AnimatedButton>
                    )}
                    <AnimatedButton variant="outline" className="w-full">
                      Add to Wishlist
                    </AnimatedButton>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}