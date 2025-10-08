'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Target, Zap, Shield, Crosshair } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Floating Orb
function FloatingOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.5;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2}>
      <MeshDistortMaterial
        color="#ff6b00"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

// Particle Component
function Particle({ index }: { index: number }) {
  const [position] = useState(() => ({
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
  }));

  return (
    <motion.div
      className="absolute w-1 h-1 bg-cod-orange/30 rounded-full"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 0],
        y: [position.y, position.y - 100],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: index * 0.1,
        ease: 'linear',
      }}
      style={{ left: position.x, top: position.y }}
    />
  );
}

export function HeroEnhanced() {
  const [hoveredWeapon, setHoveredWeapon] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 20,
          y: (e.clientY - rect.top - rect.height / 2) / 20,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const topWeapons = [
    { name: 'MCW', tier: 'S', pickRate: '32%', icon: Crosshair, color: 'orange' },
    { name: 'SVA 545', tier: 'S', pickRate: '28%', icon: Zap, color: 'blue' },
    { name: 'BP50', tier: 'A', pickRate: '24%', icon: Shield, color: 'green' },
    { name: 'Holger 556', tier: 'A', pickRate: '21%', icon: Target, color: 'purple' },
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <FloatingOrb />
        </Canvas>
      </div>

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cod-black via-cod-gray to-cod-black">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(0,149,255,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}

        {/* Grid Pattern with Parallax */}
        <motion.div
          style={{ y: y2 }}
          className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"
        />
      </div>

      <motion.div
        style={{ opacity }}
        className="container relative z-10 mx-auto px-4 py-20"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
            style={{
              transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            {/* Animated Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/5 border border-cod-orange/50 shadow-lg shadow-cod-orange/20"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,107,0,0.4)' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-cod-orange" />
              </motion.div>
              <span className="text-sm font-medium text-cod-orange">
                AI-Powered Meta Tracking
              </span>
              <motion.div
                className="w-2 h-2 bg-cod-orange rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Headline with Text Gradient Animation */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-7xl font-display font-bold leading-tight"
              >
                <span className="inline-block">Master Your</span>
                <motion.span
                  className="block bg-gradient-to-r from-cod-orange via-cod-blue to-cod-green bg-clip-text text-transparent bg-[length:200%_auto]"
                  animate={{ backgroundPosition: ['0% center', '200% center'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  Loadouts
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 max-w-xl"
              >
                Get expert Call of Duty weapon loadouts, counters, and meta analysis.
                Build the perfect setup with{' '}
                <span className="text-cod-orange font-semibold">AI-powered</span>{' '}
                recommendations.
              </motion.p>
            </div>

            {/* Enhanced CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/loadouts"
                  className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-cod-orange to-cod-orange-dark overflow-hidden shadow-lg shadow-cod-orange/50 hover:shadow-2xl hover:shadow-cod-orange/70 transition-all duration-300"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="relative flex items-center space-x-2 text-white font-bold">
                    <span>Build Loadout</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/weapons"
                  className="px-8 py-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                >
                  <Target className="h-5 w-5 text-cod-orange" />
                  <span className="font-semibold">Browse Weapons</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Animated Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
            >
              {[
                { value: '150+', label: 'Weapons Tracked', color: 'cod-orange' },
                { value: '50K+', label: 'Loadouts Built', color: 'cod-blue' },
                { value: '24/7', label: 'Meta Updates', color: 'cod-green' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="text-center"
                >
                  <motion.div
                    className={`text-3xl font-display font-bold text-${stat.color} mb-1`}
                    animate={{ textShadow: ['0 0 10px rgba(255,107,0,0.5)', '0 0 20px rgba(255,107,0,0.8)', '0 0 10px rgba(255,107,0,0.5)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Weapon Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
            style={{
              transform: `translate(${-mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-cod-orange to-cod-blue bg-clip-text text-transparent">
                  Top Meta Weapons
                </h3>
                <motion.div
                  className="px-3 py-1 rounded-full bg-cod-orange/20 border border-cod-orange text-cod-orange text-xs font-mono"
                  animate={{ boxShadow: ['0 0 10px rgba(255,107,0,0.5)', '0 0 20px rgba(255,107,0,0.8)', '0 0 10px rgba(255,107,0,0.5)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  LIVE
                </motion.div>
              </div>

              {/* Weapon Cards */}
              <div className="space-y-3">
                {topWeapons.map((weapon, index) => {
                  const Icon = weapon.icon;
                  return (
                    <motion.div
                      key={weapon.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      onMouseEnter={() => setHoveredWeapon(index)}
                      onMouseLeave={() => setHoveredWeapon(null)}
                      whileHover={{ scale: 1.02, x: 10 }}
                      className="relative group"
                    >
                      <div className={`
                        relative p-5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
                        ${hoveredWeapon === index
                          ? 'bg-gradient-to-r from-cod-orange/30 to-cod-blue/20 shadow-lg shadow-cod-orange/30'
                          : 'bg-white/5 hover:bg-white/10'
                        }
                      `}>
                        {/* Rank Badge */}
                        <motion.div
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-cod-orange/20 flex items-center justify-center text-xs font-bold"
                          animate={hoveredWeapon === index ? { rotate: 360 } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          #{index + 1}
                        </motion.div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <motion.div
                              className={`w-12 h-12 rounded-xl bg-${weapon.color}-500/20 flex items-center justify-center`}
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <Icon className={`h-6 w-6 text-${weapon.color}-400`} />
                            </motion.div>
                            <div>
                              <div className="text-lg font-bold">{weapon.name}</div>
                              <div className="text-sm text-gray-400">
                                Pick Rate: {weapon.pickRate}
                              </div>
                            </div>
                          </div>

                          <motion.div
                            className={`
                              px-4 py-2 rounded-xl font-bold text-sm
                              ${weapon.tier === 'S' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}
                              text-white shadow-lg
                            `}
                            whileHover={{ scale: 1.1 }}
                          >
                            {weapon.tier}
                          </motion.div>
                        </div>

                        {hoveredWeapon === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/10"
                          >
                            <Link
                              href={`/weapons/${weapon.name.toLowerCase().replace(' ', '-')}`}
                              className="group/link flex items-center justify-between text-cod-orange hover:text-cod-orange-light transition-colors"
                            >
                              <span className="text-sm font-semibold">View Full Loadout</span>
                              <ArrowRight className="h-4 w-4 group-hover/link:translate-x-2 transition-transform" />
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* View All Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/meta"
                  className="mt-6 block w-full text-center py-4 rounded-xl bg-gradient-to-r from-cod-orange/20 to-cod-blue/20 hover:from-cod-orange/30 hover:to-cod-blue/30 border border-cod-orange/30 text-white font-bold transition-all duration-300 shadow-lg"
                >
                  View Full Tier List →
                </Link>
              </motion.div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-8 -right-8 w-32 h-32 bg-cod-orange/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [360, 180, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-8 -left-8 w-32 h-32 bg-cod-blue/30 rounded-full blur-3xl"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="w-6 h-10 border-2 border-cod-orange rounded-full flex items-start justify-center p-2 backdrop-blur-sm">
            <motion.div
              className="w-1 h-2 bg-cod-orange rounded-full"
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <motion.div
            className="absolute inset-0 border-2 border-cod-orange rounded-full"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
