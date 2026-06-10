'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Info, Menu, X } from 'lucide-react';

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
            <div className="p-2 bg-chart-eu/10 rounded-lg group-hover:bg-chart-eu/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-chart-eu" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-text-primary">Trajectory EU</h1>
              <p className="text-xs text-text-tertiary -mt-0.5">Economic Growth Projections</p>
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