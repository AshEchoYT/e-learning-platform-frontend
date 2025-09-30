"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  instructorName: string;
  categoryName: string;
  duration: string;
  studentsCount: number;
  rating: number;
  price: number;
  image: string;
}

interface Category {
  id: number;
  name: string;
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch courses with filters
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams({
          published: 'true',
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        if (selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }

        // Map sortBy to API parameters
        switch (sortBy) {
          case 'popular':
            params.append('sort', 'studentsCount');
            params.append('order', 'desc');
            break;
          case 'rating':
            params.append('sort', 'rating');
            params.append('order', 'desc');
            break;
          case 'price-low':
            params.append('sort', 'price');
            params.append('order', 'asc');
            break;
          case 'price-high':
            params.append('sort', 'price');
            params.append('order', 'desc');
            break;
        }

        const response = await fetch(`/api/courses?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <>
      <CursorGlow />
      <Header />

      <main className="pt-24 pb-20 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Explore Courses
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover your next learning adventure from our extensive catalog
              </p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative max-w-2xl mx-auto"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-20 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 flex-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory('All')}
                >
                  <Badge
                    variant={selectedCategory === 'All' ? "default" : "outline"}
                    className={`cursor-pointer ${
                      selectedCategory === 'All'
                        ? "bg-gradient-to-r from-purple-600 to-blue-600"
                        : ""
                    }`}
                  >
                    All
                  </Badge>
                </motion.button>
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <Badge
                      variant={selectedCategory === category.name ? "default" : "outline"}
                      className={`cursor-pointer ${
                        selectedCategory === category.name
                          ? "bg-gradient-to-r from-purple-600 to-blue-600"
                          : ""
                      }`}
                    >
                      {category.name}
                    </Badge>
                  </motion.button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `Showing ${courses.length} courses`}
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">Failed to load courses: {error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CourseCard
                    id={course.id.toString()}
                    title={course.title}
                    description={course.description}
                    image={course.image}
                    instructor={course.instructorName}
                    duration={course.duration}
                    students={course.studentsCount}
                    rating={course.rating}
                    price={course.price}
                    category={course.categoryName}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No courses found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}