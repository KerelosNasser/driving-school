import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Car, Shield, Star, Award } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const trustStats = [
    { icon: Star, value: '4.9★', label: 'Rating' },
    { icon: Award, value: '95%', label: 'Pass Rate' },
    { icon: Shield, value: '15+', label: 'Years' },
  ];
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Stats - Mobile Friendly */}
        <div className="py-6 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            {trustStats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-lg font-bold text-blue-400">{stat.value}</div>
                <div className="text-xs text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2">
                <Car className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold">EG Driving School</h3>
                  <p className="text-xs text-blue-400">Licensed & Trusted</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Brisbane's premier driving school with over 15 years of experience helping students become safe, confident drivers.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" 
                   className="text-gray-400 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-gray-800">
                  <Facebook size={18} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                   className="text-gray-400 hover:text-pink-400 transition-colors p-2 rounded-full hover:bg-gray-800">
                  <Instagram size={18} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                   className="text-gray-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-gray-800">
                  <Twitter size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/packages', label: 'Packages' },
                  { href: '/about', label: 'About Us' },
                  { href: '/reviews', label: 'Reviews' },
                  { href: '/contact', label: 'Contact' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400">Contact</h3>
              <div className="space-y-3">
                <a 
                  href="tel:+61431512095" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  <Phone size={16} className="text-green-500" />
                  <span>04 3151 2095</span>
                </a>
                <a 
                  href="mailto:info@egdrivingschool.com" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  <Mail size={16} className="text-blue-500" />
                  <span>info@egdrivingschool.com</span>
                </a>
                <div className="flex items-start space-x-2 text-gray-300 text-sm">
                  <MapPin size={16} className="text-purple-500 mt-0.5" />
                  <div>
                    <div>Brisbane & Surrounds</div>
                    <div className="text-xs text-gray-400">Queensland, Australia</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400">Get Started</h3>
              <p className="text-gray-300 text-sm">
                Ready to start your driving journey? Book your first lesson today.
              </p>
              
              <div className="space-y-2">
                <Link 
                  href="/service-center" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                >
                  Book Now
                </Link>
                <Link 
                  href="/packages" 
                  className="block w-full border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                >
                  View Packages
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-gray-400 text-sm">© {currentYear} EG Driving School. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-1">Licensed Driving Instructor | ABN: 12 345 678 901</p>
            </div>
            
            <div className="flex space-x-4 text-xs">
              <Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}