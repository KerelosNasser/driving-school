import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">EG Driving School</h3>
            <p className="text-gray-300">Professional driving lessons in Brisbane with experienced instructors.</p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-300 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-300 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-300 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/packages" className="text-gray-300 hover:text-white transition-colors">
                  Packages
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-gray-300 hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-gray-300" />
                <a href="tel:+61400000000" className="text-gray-300 hover:text-white transition-colors">
                  0400 000 000
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-gray-300" />
                <a href="mailto:info@brisbanedrivingschool.com" className="text-gray-300 hover:text-white transition-colors">
                  info@brisbanedrivingschool.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={16} className="text-gray-300 mt-1" />
                <span className="text-gray-300">
                  Brisbane, Queensland, Australia
                </span>
              </li>
            </ul>
          </div>

          {/* Book Now */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ready to Start?</h3>
            <p className="text-gray-300">Book your driving lesson today and take the first step towards getting your license.</p>
            <Link 
              href="/book" 
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>© {currentYear} EG Driving School. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}