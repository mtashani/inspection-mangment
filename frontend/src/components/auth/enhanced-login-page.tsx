"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { VStack, HStack } from "@/components/ui/stack";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Sparkles,
  CheckCircle,
  Users,
  BarChart3,
  Settings,
  Zap,
  Lock,
} from "lucide-react";
import { EnhancedLoginForm } from "./enhanced-login-form";

const features = [
  {
    icon: CheckCircle,
    title: "Smart Inspection Management",
    description: "AI-powered workflows with automated tracking and real-time updates",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    icon: Users,
    title: "Team Collaboration Hub",
    description: "Seamless coordination between inspectors, managers, and administrators",
    color: "text-blue-500", 
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive insights with predictive maintenance recommendations",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    icon: Settings,
    title: "Enterprise Configuration",
    description: "Flexible system administration with role-based access control",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
];

export function EnhancedLoginPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Rotate features every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Loading animation
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding and Features */}
        <div className={`hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center transition-all duration-1000 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <Container size="lg" padding="lg">
            <VStack gap="xl" className="max-w-2xl mx-auto">
              {/* Logo and Brand */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <VStack gap="none">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Inspection Pro
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Next-Generation Management Platform
                  </p>
                </VStack>
              </div>

              {/* Welcome Message */}
              <VStack gap="lg" className="text-center lg:text-left">
                <div className="space-y-4">
                  <h2 className="text-5xl xl:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                    Welcome to the
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Future of Inspections
                    </span>
                  </h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    Transform your inspection workflows with intelligent automation, 
                    real-time collaboration, and powerful analytics that drive results.
                  </p>
                </div>
              </VStack>

              {/* Animated Features */}
              <VStack gap="lg" className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Platform Highlights
                  </h3>
                </div>

                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = index === currentFeature;

                    return (
                      <div
                        key={index}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 shadow-xl border-blue-200 dark:border-blue-800 scale-105'
                            : 'bg-white/50 dark:bg-slate-800/50 shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md hover:scale-102'
                        }`}
                        onClick={() => setCurrentFeature(index)}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500" />
                        )}
                        
                        <div className="flex items-start gap-4 p-6">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                            isActive ? feature.bgColor : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            <Icon className={`w-6 h-6 transition-colors duration-300 ${
                              isActive ? feature.color : 'text-slate-500 dark:text-slate-400'
                            }`} />
                          </div>
                          <VStack gap="sm" className="flex-1">
                            <h4 className={`font-semibold transition-colors duration-300 ${
                              isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {feature.title}
                            </h4>
                            <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                              isActive ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                            }`}>
                              {feature.description}
                            </p>
                          </VStack>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Progress Indicators */}
                <div className="flex items-center justify-center gap-3 mt-8">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                        index === currentFeature
                          ? 'w-12 h-3 bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'w-3 h-3 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                      }`}
                    >
                      {index === currentFeature && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </VStack>
            </VStack>
          </Container>
        </div>

        {/* Right Side - Login Form */}
        <div className={`w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Login Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-2xl">
              <Card.Header className="text-center space-y-4 pb-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Welcome Back
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Sign in to access your inspection dashboard
                  </p>
                </div>
              </Card.Header>

              <Card.Content className="pt-0">
                <EnhancedLoginForm />
              </Card.Content>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span>Secure SSL</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <span>Enterprise Grade</span>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <span>24/7 Support</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Inspection Management System v2.1 • Built with ❤️ for professionals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}