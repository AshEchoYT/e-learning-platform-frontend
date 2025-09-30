"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: number;
  category: string;
}

export default function CourseCard({
  id,
  title,
  description,
  image,
  instructor,
  duration,
  students,
  rating,
  price,
  category,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <motion.div
        whileHover={{ y: -8, rotateX: 5, rotateY: 5 }}
        transition={{ duration: 0.3 }}
        className="h-full perspective-1000"
      >
        <Card className="overflow-hidden h-full group cursor-pointer border-2 hover:border-primary/50 transition-colors hover:shadow-2xl hover:shadow-primary/20">
          <div className="relative h-48 overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary/90 backdrop-blur-sm">{category}</Badge>
            </div>
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full font-bold text-primary">
              ${price}
            </div>
          </div>

          <div className="p-5">
            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">•</span>
              <span className="text-sm text-muted-foreground">{instructor}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{students.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}