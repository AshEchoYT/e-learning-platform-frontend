"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";
import AnimatedButton from "@/components/AnimatedButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Plus, 
  Users, 
  DollarSign, 
  TrendingUp, 
  BookOpen,
  Upload,
  Check,
  Video,
  FileText,
  Settings
} from "lucide-react";

export default function InstructorDashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
  });

  const myCourses = [
    { id: 1, title: "Complete Web Development Bootcamp", students: 12543, revenue: 994340, rating: 4.8 },
    { id: 2, title: "Advanced React Patterns", students: 8921, revenue: 535260, rating: 4.9 },
    { id: 3, title: "Node.js Masterclass", students: 6543, revenue: 392580, rating: 4.7 },
  ];

  const revenueData = [
    { month: "Jul", revenue: 45000 },
    { month: "Aug", revenue: 52000 },
    { month: "Sep", revenue: 48000 },
    { month: "Oct", revenue: 61000 },
    { month: "Nov", revenue: 72000 },
    { month: "Dec", revenue: 85000 },
  ];

  const studentData = [
    { month: "Jul", students: 1200 },
    { month: "Aug", students: 1850 },
    { month: "Sep", students: 2100 },
    { month: "Oct", students: 2600 },
    { month: "Nov", students: 3200 },
    { month: "Dec", students: 4100 },
  ];

  const totalStudents = myCourses.reduce((acc, course) => acc + course.students, 0);
  const totalRevenue = myCourses.reduce((acc, course) => acc + course.revenue, 0);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Course Information</h3>
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Complete Web Development Bootcamp"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn..."
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={courseData.category} onValueChange={(value) => setCourseData({ ...courseData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-dev">Web Development</SelectItem>
                  <SelectItem value="data-science">Data Science</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                placeholder="79.99"
                value={courseData.price}
                onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Upload Content</h3>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-2">Upload Course Video</p>
              <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-2">Upload Resources</p>
              <p className="text-sm text-muted-foreground">PDFs, code files, etc.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Review & Publish</h3>
            <Card className="p-4">
              <h4 className="font-semibold mb-2">{courseData.title || "Course Title"}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {courseData.description || "Course description will appear here..."}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <Badge>{courseData.category || "Category"}</Badge>
                <span className="font-semibold">${courseData.price || "0.00"}</span>
              </div>
            </Card>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Ready to publish!</p>
                <p className="text-sm text-green-700 dark:text-green-300">Your course is ready to go live.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CursorGlow />
      <Header />

      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Instructor Dashboard 🎓</h1>
                <p className="text-muted-foreground">Manage your courses and track your success</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <AnimatedButton className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Course
                  </AnimatedButton>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                  </DialogHeader>
                  
                  {/* Progress Indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                              step <= currentStep
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step < currentStep ? <Check className="w-5 h-5" /> : step}
                          </div>
                          {step < 3 && (
                            <div
                              className={`w-24 h-1 mx-2 ${
                                step < currentStep ? "bg-primary" : "bg-muted"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Details</span>
                      <span>Content</span>
                      <span>Publish</span>
                    </div>
                  </div>

                  {renderStep()}

                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                    >
                      Previous
                    </Button>
                    {currentStep < 3 ? (
                      <Button onClick={() => setCurrentStep(currentStep + 1)}>
                        Next
                      </Button>
                    ) : (
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                        Publish Course
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: BookOpen, label: "Total Courses", value: myCourses.length.toString(), color: "from-blue-500 to-cyan-500" },
              { icon: Users, label: "Total Students", value: totalStudents.toLocaleString(), color: "from-purple-500 to-pink-500" },
              { icon: DollarSign, label: "Total Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}k`, color: "from-green-500 to-emerald-500" },
              { icon: TrendingUp, label: "Avg Rating", value: "4.8", color: "from-orange-500 to-red-500" },
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

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <h3 className="font-semibold mb-6">Revenue Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6">
                <h3 className="font-semibold mb-6">Student Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* My Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-6">My Courses</h2>
            <div className="space-y-4">
              {myCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.students.toLocaleString()} students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>${(course.revenue / 1000).toFixed(0)}k revenue</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>{course.rating} rating</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Video className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}