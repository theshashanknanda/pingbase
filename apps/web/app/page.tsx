'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from "@auth0/nextjs-auth0"
import { getAccessToken } from "@auth0/nextjs-auth0";
import React from 'react';
import { 
  Menu,
  X,
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Globe, 
  Zap, 
  Shield, 
  BarChart3, 
  Bell,
  Star,
  ArrowRight,
  MonitorSpeaker,
  TrendingUp,
  Users,
  Mail,
  MessageCircle,
  PlayCircle,
  ArrowLeft
} from 'lucide-react';

export default function Home() {
  const [animatedCount, setAnimatedCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedCount(prev => prev < 99.9 ? prev + 0.1 : 99.9);
    }, 50);
    
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Globe className="h-6 w-6 text-blue-600" />,
      title: "Global Monitoring",
      description: "Monitor your websites from 15+ locations worldwide with 30-second intervals"
    },
    {
      icon: <Bell className="h-6 w-6 text-blue-600" />,
      title: "Short Interval Pinging",
      description: "Short interval finds out the moment your site goes down"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      title: "Past Analytics",
      description: "Comprehensive uptime statistics, response times, and performance insights"
    },
  ];

  const statusData = [
    { name: "Website", status: "up", uptime: "99.98%", responseTime: "245ms" },
    { name: "API", status: "up", uptime: "100%", responseTime: "89ms" },
    { name: "Database", status: "up", uptime: "99.95%", responseTime: "12ms" },
    { name: "CDN", status: "Down", uptime: "99.92%", responseTime: "156ms" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-black/30 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
                <MonitorSpeaker className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                PingBase
              </span>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg">
                Features
              </a>
              <a href="#status" className="text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg">
                Demo
              </a>
              <Button 
                variant="ghost" 
                className="text-white/90 hover:bg-white/10"
                onClick={() => window.location.href = user ? '/auth/logout' : '/auth/login'}
              >
                {user ? 'Logout' : 'Login'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20"
                onClick={() => window.location.href = user ? '/dashboard' : '/auth/login?returnTo=/dashboard'}
              >
                {user ? 'Dashboard' : 'Get Started'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <a
                href="#features"
                className="block px-3 py-2 text-base font-medium text-white hover:bg-white/10 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#status"
                className="block px-3 py-2 text-base font-medium text-white hover:bg-white/10 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </a>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/90 hover:bg-white/10"
                onClick={() => {
                  window.location.href = user ? '/auth/logout' : '/auth/login';
                  setMobileMenuOpen(false);
                }}
              >
                {user ? 'Logout' : 'Login'}
              </Button>
              <Button 
                className="w-full justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 mt-2"
                onClick={() => {
                  window.location.href = user ? '/dashboard' : '/auth/login?returnTo=/dashboard';
                  setMobileMenuOpen(false);
                }}
              >
                {user ? 'Dashboard' : 'Get Started'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
          <div className="text-center p-4">
            
            <h1 className="text-5xl md:text-7xl p-4 font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
              Keep Your Website
              <span className="block mt-2">Always Online</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-10">
              Real-time website monitoring. Never miss a moment of downtime with our powerful monitoring platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-500/30"
                onClick={() => window.location.href = '#features'}
              >
                Start Monitoring
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg font-medium rounded-xl transition-all duration-300 hover:border-white/40"
                onClick={() => window.location.href = "#features"}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Monitoring Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to ensure your website stays online and performs at its best
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gray-800 border border-gray-700 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-gray-800/90"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-900/50 to-blue-700/50 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {React.cloneElement(feature.icon, { className: 'h-6 w-6 text-blue-400' })}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section id="status" className="py-20 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              System Status
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real-time monitoring of our infrastructure
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statusData.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800/50 hover:bg-gray-800/80 p-6 rounded-xl border border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-blue-500/30"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-gray-300">
                        Status: 
                        <span className={`ml-1 font-medium ${
                          item.status === 'up' ? 'text-green-400' : 
                          item.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className={`h-3 w-3 rounded-full mt-1.5 ${
                      item.status === 'up' ? 'bg-green-400' : 
                      item.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-400">
                      Uptime: <span className="text-gray-200 font-medium">{item.uptime}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Response: <span className="text-gray-200 font-medium">{item.responseTime}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">PingBase</h3>
              <p className="text-gray-400 text-sm">Reliable website monitoring and status pages for businesses of all sizes.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#status" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm"> {new Date().getFullYear()} PingBase. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
