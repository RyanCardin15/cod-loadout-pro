'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { User, Settings, LogOut, Heart, BarChart3 } from 'lucide-react';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
    },
    {
      icon: Heart,
      label: 'My Loadouts',
      href: '/loadouts',
    },
    {
      icon: BarChart3,
      label: 'Stats',
      href: '/profile#stats',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/profile#settings',
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cod-surface/50 transition-colors"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-cod-accent"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cod-accent to-cod-accent-dark flex items-center justify-center text-white font-semibold text-sm">
            {(user?.displayName || user?.email || 'U')[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-cod-gray border border-cod-surface rounded-lg shadow-xl overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-cod-surface bg-cod-surface/30">
            <p className="font-semibold text-white truncate">
              {user.displayName || 'Operator'}
            </p>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-cod-surface/50 transition-colors text-gray-300 hover:text-white"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Sign Out */}
          <div className="border-t border-cod-surface">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-cod-surface/50 transition-colors text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
