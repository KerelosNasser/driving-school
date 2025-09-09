'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { Menu, X, Car, Phone, Edit3, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditMode } from '@/contexts/editModeContext';
import { QuotaIndicator } from '@/components/QuotaIndicator';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-yellow-600" />
            <span className="font-bold text-xl text-gray-900">EG Driving School</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-yellow-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
            
            {/* Admin Link */}
            {isAdminUser && (
              <Link
                href="/admin"
                className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
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
                className="ml-2"
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

          {/* Auth & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="tel:+61431512095" className="flex items-center text-gray-700 hover:text-yellow-600">
              <Phone className="h-4 w-4 mr-1" />
              <span className="font-medium">04 3151 2095</span>
            </a>
            
            {/* Quota Indicator */}
            <QuotaIndicator />
            
            {isLoaded && (
              <>
                {user ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <SignInButton>
                    <Button variant="outline">Sign In</Button>
                  </SignInButton>
                )}
              </>
            )}
            
            <Button asChild>
              <Link href="/service-center">Service Center</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-yellow-600 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {isAdminUser && (
                <Link
                  href="/admin"
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              {/* Quick Edit Mode Toggle for Mobile */}
              {isAdminUser && (
                <Button
                  onClick={() => {
                    toggleEditMode();
                    setIsOpen(false);
                  }}
                  size="sm"
                  variant={isEditMode ? "destructive" : "secondary"}
                  className="w-full"
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
              )}
              
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {/* Mobile Quota Indicator */}
                <div className="flex justify-center">
                  <QuotaIndicator />
                </div>
                
                {isLoaded && (
                  <>
                    {user ? (
                      <UserButton afterSignOutUrl="/" />
                    ) : (
                      <SignInButton>
                        <Button variant="outline" className="w-full">Sign In</Button>
                      </SignInButton>
                    )}
                  </>
                )}
                <Button asChild className="w-full">
                  <Link href="/service-center">Service Center</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}