'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-t from-cod-gray to-cod-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cod-orange/20 rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-cod-orange/50">
            <Sparkles className="h-4 w-4 text-cod-orange" />
            <span className="text-sm font-medium text-cod-orange">
              Free to Use
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-display font-bold">
            Ready to <span className="gradient-text">Dominate</span>?
          </h2>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join thousands of players using Counterplay to build better loadouts,
            counter enemies, and climb the ranks.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/loadouts"
              className="group btn-primary flex items-center space-x-2 text-lg px-8 py-4"
            >
              <span>Start Building</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/weapons"
              className="btn-ghost text-lg px-8 py-4"
            >
              Browse Weapons
            </Link>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-cod-surface">
            <div>
              <div className="text-2xl font-display font-bold text-cod-orange mb-1">No Signup</div>
              <div className="text-sm text-gray-400">Start using immediately</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-cod-blue mb-1">100% Free</div>
              <div className="text-sm text-gray-400">All features included</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-cod-green mb-1">Always Updated</div>
              <div className="text-sm text-gray-400">Latest meta data</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
