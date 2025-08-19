'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Info, Menu, X } from 'lucide-react';

// Custom animated arrow component
function AnimatedArrow() {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 3000); // Animate every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-6 h-6">
      <svg
        key={animationKey}
        className="w-6 h-6 text-purple-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        {/* Arrow pointing diagonally up-right */}
        <g transform="rotate(-45 12 12)">
          {/* Segment 1 - Base */}
          <rect 
            x="3" 
            y="11" 
            width="3" 
            height="2" 
            rx="1"
            className="animate-pulse"
            style={{
              animationDelay: '0ms',
              animationDuration: '2500ms'
            }}
          >
            <animate
              attributeName="fill"
              values="currentColor;white;currentColor"
              dur="2.5s"
              begin="0s"
              repeatCount="1"
            />
          </rect>
          
          {/* Segment 2 */}
          <rect 
            x="6" 
            y="11" 
            width="3" 
            height="2" 
            rx="1"
            className="animate-pulse"
            style={{
              animationDelay: '400ms',
              animationDuration: '2500ms'
            }}
          >
            <animate
              attributeName="fill"
              values="currentColor;white;currentColor"
              dur="2.5s"
              begin="0.4s"
              repeatCount="1"
            />
          </rect>
          
          {/* Segment 3 */}
          <rect 
            x="9" 
            y="11" 
            width="3" 
            height="2" 
            rx="1"
            className="animate-pulse"
            style={{
              animationDelay: '800ms',
              animationDuration: '2500ms'
            }}
          >
            <animate
              attributeName="fill"
              values="currentColor;white;currentColor"
              dur="2.5s"
              begin="0.8s"
              repeatCount="1"
            />
          </rect>
          
          {/* Segment 4 */}
          <rect 
            x="12" 
            y="11" 
            width="3" 
            height="2" 
            rx="1"
            className="animate-pulse"
            style={{
              animationDelay: '1200ms',
              animationDuration: '2500ms'
            }}
          >
            <animate
              attributeName="fill"
              values="currentColor;white;currentColor"
              dur="2.5s"
              begin="1.2s"
              repeatCount="1"
            />
          </rect>
          
          {/* Arrow head */}
          <polygon 
            points="15,8 15,10 18,10 21,12 18,14 15,14 15,16"
            className="animate-pulse"
            style={{
              animationDelay: '1600ms',
              animationDuration: '2500ms'
            }}
          >
            <animate
              attributeName="fill"
              values="currentColor;white;currentColor"
              dur="2.5s"
              begin="1.6s"
              repeatCount="1"
            />
          </polygon>
        </g>
      </svg>
    </div>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background-primary border-b border-border-light sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <AnimatedArrow />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-text-primary">Trajectory EU</h1>
              <p className="text-xs text-text-tertiary -mt-0.5">Aiming for the future we want</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-text-primary">Trajectory EU</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors touch-target"
            >
              Compare
            </Link>
            <Link 
              href="/methodology" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors flex items-center space-x-1 touch-target"
            >
              <Info className="h-4 w-4" />
              <span>Methodology</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-3 -mr-3 hover:bg-background-secondary rounded-lg transition-colors touch-target"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border-light animate-slide-up">
            <nav className="py-4 space-y-1">
              <Link 
                href="/" 
                className="block px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg font-medium transition-colors touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Compare Trajectories
              </Link>
              <Link 
                href="/methodology" 
                className="flex items-center space-x-2 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg font-medium transition-colors touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info className="h-4 w-4" />
                <span>Methodology & Sources</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}