"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { formContent } from "@/content";

export default function LeadSuccessMotion() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="lead-form-panel p-8 text-center text-white sm:p-10"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <CheckCircle2 aria-hidden="true" className="text-gold-300 mx-auto" size={42} />
      <h3 className="section-title mt-5 text-2xl">{formContent.successTitle}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/65">{formContent.successText}</p>
    </motion.div>
  );
}
