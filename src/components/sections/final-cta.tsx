"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-[--accent] px-8 py-16 text-center text-[--primary-foreground]"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[--primary-foreground]" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[--primary-foreground]" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Start helping your people today.
            </h2>
            <p className="mt-4 text-lg opacity-85 max-w-lg mx-auto">
              Join thousands of HR professionals who use Atlas to work faster, smarter, and more confidently.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[--bg-app] px-6 text-sm font-semibold text-[--text-primary] hover:bg-[--bg-app]/90 transition-colors"
              >
                Get started free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/tools"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-[--primary-foreground]/40 px-6 text-sm font-semibold text-[--primary-foreground] hover:bg-[--primary-foreground]/10 transition-colors"
              >
                Explore tools
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-70">No credit card required. Free forever plan available.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
