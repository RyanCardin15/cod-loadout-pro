'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-5xl lg:text-6xl font-display font-bold gradient-text">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

export function Stats() {
  const stats = [
    { label: 'Weapons Tracked', value: 150, suffix: '+' },
    { label: 'Loadouts Created', value: 50000, suffix: '+' },
    { label: 'Active Users', value: 10000, suffix: '+' },
    { label: 'Win Rate Boost', value: 15, suffix: '%' },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-cod-black to-cod-gray relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-cod-orange rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cod-blue rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <Counter value={stat.value} suffix={stat.suffix} />
              <div className="mt-2 text-gray-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
