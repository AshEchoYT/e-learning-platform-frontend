"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function AnimatedButton({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      <Button
        variant={variant}
        size={size}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.5 }}
        />
        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  );
}