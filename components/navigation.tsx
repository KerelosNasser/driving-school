'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { Menu, X, Car, Phone, Edit3, EyeOff, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditMode } from '@/contexts/editModeContext';
import { QuotaIndicator } from '@/components/QuotaIndicator';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoaded } = useUser();
  const { isEditMode, toggleEditMode, isAdmin } = useEditMode();
  const isAdminUser = user?.emailAddresses[0]?.emailAddress === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/packages', label: 'Packages' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/reviews', label: 'Reviews' },
  ];

  // Handle scroll effect for navigation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95 backdrop-blur-md shadow-lg border-b border-emerald-700/30' 
          : 'bg-gradient-to-r from-emerald-900/90 via-teal-800/85 to-blue-900/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Simplified Logo with Trust Badge */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Car className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="font-bold text-xl text-white group-hover:text-emerald-200 transition-colors">
                EG Driving School
              </span>
              <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-200">
                <Shield className="h-3 w-3 text-green-400" />
                <span>Licensed</span>
                <Star className="h-3 w-3 text-yellow-400 ml-1" />
                <span>4.9★</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-emerald-100 hover:text-white transition-colors font-medium relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-200"></span>
              </Link>
            ))}
            
            {/* Admin Link */}
            {isAdminUser && (
              <Link
                href="/admin"
                className="text-purple-300 hover:text-purple-200 transition-colors font-medium"
              >
                Admin
              </Link>
            )}
            
            {/* Quick Edit Mode Toggle for Admins */}
            {isAdminUser && (
              <Button
                onClick={toggleEditMode}
                size="sm"
                variant={isEditMode ? "destructive" : "secondary"}
                className="ml-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                {isEditMode ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Exit Edit
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Desktop CTA Section */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Phone Number */}
            <a 
              href="tel:+61431512095" 
              className="flex items-center text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <Phone className="h-4 w-4 mr-1" />
              <span className="font-medium text-sm">04 3151 2095</span>
            </a>
            
            {/* Quota Indicator */}
            <QuotaIndicator />
            
            {isLoaded && (
              <>
                {user ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <SignInButton>
                    <Button variant="outline" size="sm" className="bg-white/10 border-emerald-400/30 text-emerald-100 hover:bg-white/20 hover:text-white">Sign In</Button>
                  </SignInButton>
                )}
              </>
            )}
            
            {/* Main CTA */}
            <Button 
              asChild 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
            >
              <Link href="/service-center">Book Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-emerald-700/30 bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95 backdrop-blur-md">
            <div className="py-4 space-y-3">
              {/* Trust Badge for Mobile */}
              <div className="px-4 py-2 bg-emerald-800/30 rounded-lg mx-4 flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-green-300 font-medium">Licensed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-emerald-100 font-medium">4.9★ Rating</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="px-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block text-emerald-100 hover:text-white transition-colors font-medium py-3 px-3 rounded-lg hover:bg-emerald-800/30"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {isAdminUser && (
                  <Link
                    href="/admin"
                    className="block text-purple-300 hover:text-purple-200 transition-colors font-medium py-3 px-3 rounded-lg hover:bg-purple-800/30"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin
                  </Link>
                )}
              </div>
              
              {/* Admin Edit Toggle for Mobile */}
              {isAdminUser && (
                <div className="px-4">
                  <Button
                    onClick={() => {
                      toggleEditMode();
                      setIsOpen(false);
                    }}
                    size="sm"
                    variant={isEditMode ? "destructive" : "secondary"}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    {isEditMode ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Exit Edit Mode
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Enable Edit Mode
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Mobile CTA Section */}
              <div className="px-4 pt-3 border-t border-emerald-700/30 space-y-3">
                {/* Phone CTA */}
                <a 
                  href="tel:+61431512095" 
                  className="flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now: 04 3151 2095
                </a>

                {/* Quota Indicator */}
                <div className="flex justify-center">
                  <QuotaIndicator />
                </div>
                
                {/* Auth Section */}
                {isLoaded && (
                  <div className="flex justify-center">
                    {user ? (
                      <UserButton afterSignOutUrl="/" />
                    ) : (
                      <SignInButton>
                        <Button variant="outline" className="w-full bg-white/10 border-emerald-400/30 text-emerald-100 hover:bg-white/20 hover:text-white">Sign In</Button>
                      </SignInButton>
                    )}
                  </div>
                )}
                
                {/* Main CTA */}
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-3"
                >
                  <Link href="/service-center">Book Your Lesson</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}