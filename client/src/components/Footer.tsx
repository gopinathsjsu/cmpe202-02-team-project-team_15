import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Navigation Links - Left */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Login
            </Link>
            <Link to="/signup" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Sign Up
            </Link>
            <Link to="/search" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Shop
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              About Us
            </Link>
            <Link to="/faq" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              FAQ
            </Link>
          </div>

          {/* Social Media - Right */}
          <div className="flex justify-center md:justify-end">
            <a
              href="https://github.com/gopinathsjsu/cmpe202-02-team-project-team_15"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200"></div>

        {/* Bottom Section */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright - Left */}
          <p className="text-gray-600 text-sm text-center md:text-left">
            {currentYear} Campus Market. All rights reserved.
          </p>

          {/* Logo - Center */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-lg">CM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Campus Market</span>
          </Link>

          {/* Legal Links - Right */}
          <div className="flex flex-wrap justify-center md:justify-end gap-6">
            <Link to="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

