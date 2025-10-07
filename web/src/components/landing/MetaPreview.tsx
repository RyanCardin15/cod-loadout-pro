'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export function MetaPreview() {
  const metaChanges = [
    { weapon: 'MCW', change: 'up', percentage: '+12%', tier: 'S' },
    { weapon: 'SVA 545', change: 'up', percentage: '+8%', tier: 'S' },
    { weapon: 'BP50', change: 'down', percentage: '-5%', tier: 'A' },
    { weapon: 'Holger 556', change: 'up', percentage: '+6%', tier: 'A' },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-cod-gray to-cod-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cod-orange rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-cod-orange/50">
              <div className="w-2 h-2 bg-cod-orange rounded-full animate-pulse" />
              <span className="text-sm font-medium text-cod-orange">
                Updated Every Hour
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-display font-bold">
              Stay Ahead of the <span className="gradient-text">Meta</span>
            </h2>

            <p className="text-xl text-gray-400">
              Track weapon performance in real-time with data from pro players,
              streamers, and the community. Never fall behind the meta again.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-cod-orange/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-cod-orange rounded-full" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Live Tier Lists</div>
                  <div className="text-gray-400 text-sm">See which weapons are dominating right now</div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-cod-blue/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-cod-blue rounded-full" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Buff & Nerf Tracking</div>
                  <div className="text-gray-400 text-sm">Stay updated on all weapon balance changes</div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-cod-green/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-cod-green rounded-full" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Pro Player Insights</div>
                  <div className="text-gray-400 text-sm">Learn from the best with pro loadouts and strategies</div>
                </div>
              </li>
            </ul>

            <Link href="/meta" className="btn-primary inline-flex items-center space-x-2">
              <span>View Full Meta</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          {/* Meta Changes Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border border-cod-blue/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display font-bold">Recent Changes</h3>
              <div className="text-xs text-gray-400 font-mono">Last 24h</div>
            </div>

            <div className="space-y-4">
              {metaChanges.map((item, index) => (
                <motion.div
                  key={item.weapon}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`
                      px-2 py-1 rounded font-bold text-xs
                      ${item.tier === 'S' ? 'tier-S' : 'tier-A'}
                    `}>
                      {item.tier}
                    </div>
                    <div className="font-semibold">{item.weapon}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`
                      font-mono text-sm font-bold
                      ${item.change === 'up' ? 'text-cod-green' : 'text-red-400'}
                    `}>
                      {item.percentage}
                    </span>
                    {item.change === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-cod-green" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              href="/meta"
              className="mt-6 block w-full text-center py-3 rounded-lg bg-cod-blue/10 hover:bg-cod-blue/20 text-cod-blue font-semibold transition-colors"
            >
              See All Changes →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
