"use client"

import * as React from "react"
import { motion } from "motion/react"

export function ShiningText({ text }: { text: string }) {
  return (
    <motion.h1
      className="bg-[linear-gradient(110deg,#bfbfbf,35%,#000,50%,#bfbfbf,75%,#bfbfbf)] bg-[length:200%_100%] bg-clip-text text-base font-normal text-transparent"
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.h1>
  )
}
