'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Crosshair,
  Shield,
  TrendingUp,
  User,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Weapons', href: '/weapons', icon: Crosshair },
  { name: 'Loadouts', href: '/loadouts', icon: Shield },
  { name: 'Meta', href: '/meta', icon: TrendingUp },
  { name: 'Profile', href: '/profile', icon: User },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-50 border-b border-cod-surface bg-cod-gray/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Crosshair className="h-8 w-8 text-cod-orange transition-transform group-hover:rotate-45 group-hover:scale-110" />
                <div className="absolute inset-0 bg-cod-orange/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-display font-bold gradient-text">
                COD Loadout Pro
              </span>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2',
                      isActive
                        ? 'text-cod-orange'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>

                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cod-orange"
                        layoutId="navbar-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* CTA Button */}
            <Link href="/loadouts" className="btn-primary text-sm">
              Build Loadout
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 border-b border-cod-surface bg-cod-gray/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Crosshair className="h-6 w-6 text-cod-orange" />
              <span className="text-lg font-display font-bold gradient-text">
                COD Loadout
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border-t border-cod-surface bg-cod-gray"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300',
                      isActive
                        ? 'bg-cod-orange/20 text-cod-orange'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              <Link
                href="/loadouts"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full text-center block mt-4"
              >
                Build Loadout
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-cod-surface bg-cod-gray/95 backdrop-blur-md">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 transition-colors',
                  isActive ? 'text-cod-orange' : 'text-gray-400 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>

                {isActive && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-0.5 bg-cod-orange"
                    layoutId="bottom-nav-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
