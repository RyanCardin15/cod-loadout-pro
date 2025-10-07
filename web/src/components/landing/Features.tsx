'use client';

import { motion } from 'framer-motion';
import {
  Target,
  Shield,
  TrendingUp,
  Zap,
  Brain,
  Users
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Target,
      title: 'Smart Weapon Search',
      description: 'Find the perfect weapon for your playstyle with AI-powered recommendations and filters.',
      color: 'cod-orange',
    },
    {
      icon: Shield,
      title: 'Optimized Loadouts',
      description: 'Get complete loadouts with the best attachments, perks, and equipment combinations.',
      color: 'cod-blue',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Meta',
      description: 'Stay ahead with live tier lists and meta tracking updated from pro players and community data.',
      color: 'cod-green',
    },
    {
      icon: Zap,
      title: 'Counter Strategies',
      description: 'Analyze enemy loadouts and get instant counter recommendations with tactical advice.',
      color: 'cod-orange',
    },
    {
      icon: Brain,
      title: 'Playstyle Analysis',
      description: 'Get personalized recommendations based on your unique playstyle and preferences.',
      color: 'cod-blue',
    },
    {
      icon: Users,
      title: 'Community Builds',
      description: 'Access loadouts from top players and share your own builds with the community.',
      color: 'cod-green',
    },
  ];

  return (
    <section className="py-24 bg-cod-gray relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Everything You Need to <span className="gradient-text">Dominate</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            All the tools and data you need to build the perfect loadout and stay ahead of the meta.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-glow group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-7 w-7 text-${feature.color}`} />
                </div>

                <h3 className="text-2xl font-display font-bold mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
