'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';

export function Hero() {
  const [hoveredWeapon, setHoveredWeapon] = useState<number | null>(null);

  const topWeapons = [
    { name: 'MCW', tier: 'S', pickRate: '32%' },
    { name: 'SVA 545', tier: 'S', pickRate: '28%' },
    { name: 'BP50', tier: 'A', pickRate: '24%' },
    { name: 'Holger 556', tier: 'A', pickRate: '21%' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cod-black via-cod-gray to-cod-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cod-orange/30 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cod-blue/30 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-cod-orange/50"
            >
              <Sparkles className="h-4 w-4 text-cod-orange" />
              <span className="text-sm font-medium text-cod-orange">
                Real-Time Meta Tracking
              </span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-7xl font-display font-bold leading-tight"
              >
                Master Your
                <span className="block gradient-text">Loadouts</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 max-w-xl"
              >
                Get expert Call of Duty weapon loadouts, counters, and meta analysis.
                Build the perfect setup with AI-powered recommendations.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/loadouts"
                className="group btn-primary flex items-center space-x-2"
              >
                <span>Build Loadout</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link href="/weapons" className="btn-ghost flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Browse Weapons</span>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-cod-surface"
            >
              <div>
                <div className="text-3xl font-display font-bold text-cod-orange">150+</div>
                <div className="text-sm text-gray-400">Weapons Tracked</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-cod-blue">50K+</div>
                <div className="text-sm text-gray-400">Loadouts Built</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-cod-green">24/7</div>
                <div className="text-sm text-gray-400">Meta Updates</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Top Weapons Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="glass rounded-2xl p-8 border border-cod-orange/30 hud-corner">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display font-bold text-cod-orange">
                  Top Meta Weapons
                </h3>
                <div className="px-3 py-1 rounded-full bg-cod-orange/20 text-cod-orange text-xs font-mono">
                  LIVE
                </div>
              </div>

              <div className="space-y-3">
                {topWeapons.map((weapon, index) => (
                  <motion.div
                    key={weapon.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    onMouseEnter={() => setHoveredWeapon(index)}
                    onMouseLeave={() => setHoveredWeapon(null)}
                    className={`
                      relative p-4 rounded-xl transition-all duration-300 cursor-pointer
                      ${hoveredWeapon === index ? 'bg-cod-orange/20 scale-105' : 'bg-white/5'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-display font-bold text-gray-600">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{weapon.name}</div>
                          <div className="text-sm text-gray-400">
                            Pick Rate: {weapon.pickRate}
                          </div>
                        </div>
                      </div>

                      <div className={`
                        px-3 py-1 rounded-lg font-bold text-sm
                        ${weapon.tier === 'S' ? 'tier-S' : 'tier-A'}
                      `}>
                        {weapon.tier}
                      </div>
                    </div>

                    {hoveredWeapon === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <Link
                          href={`/weapons/${weapon.name.toLowerCase().replace(' ', '-')}`}
                          className="text-cod-orange text-sm hover:underline inline-flex items-center"
                        >
                          View Loadout
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              <Link
                href="/meta"
                className="mt-6 block w-full text-center py-3 rounded-lg bg-cod-orange/10 hover:bg-cod-orange/20 text-cod-orange font-semibold transition-colors"
              >
                View Full Tier List →
              </Link>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-6 -right-6 w-32 h-32 bg-cod-orange/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                y: [0, 20, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-6 -left-6 w-32 h-32 bg-cod-blue/20 rounded-full blur-3xl"
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-6 h-10 border-2 border-cod-orange rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-cod-orange rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
