"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { VStack, HStack } from "@/components/ui/stack";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Shield,
  Sparkles,
  CheckCircle,
  Users,
  BarChart3,
  Settings,
  Zap,
  Lock,
  Star,
  Award,
  TrendingUp,
  Globe,
} from "lucide-react";
import { EnhancedLoginForm } from "./enhanced-login-form";

const features = [
  {
    icon: CheckCircle,
    title: "AI-Powered Inspections",
    description: "Machine learning algorithms that predict maintenance needs and optimize inspection schedules automatically",
    color: "text-emerald-500",
    bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20",
    badge: "Smart",
  },
  {
    icon: Users,
    title: "Global Team Sync",
    description: "Real-time collaboration across multiple sites with instant notifications and seamless workflow management",
    color: "text-blue-500", 
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
    badge: "Connected",
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    description: "Advanced data visualization with predictive insights that help prevent equipment failures before they occur",
    color: "text-purple-500",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
    badge: "Intelligent",
  },
  {
    icon: Settings,
    title: "Enterprise Security",
    description: "Bank-level security with role-based access, audit trails, and compliance reporting for enterprise environments",
    color: "text-orange-500",
    bgColor: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20",
    badge: "Secure",
  },
];

const stats = [
  { icon: TrendingUp, value: "99.9%", label: "Uptime" },
  { icon: Globe, value: "50+", label: "Countries" },
  { icon: Award, value: "10k+", label: "Companies" },
  { icon: Star, value: "4.9/5", label: "Rating" },
];

export function PremiumLoginPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Rotate features every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Loading animation
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-base-100)] via-[var(--color-base-200)]/30 to-[var(--color-primary)]/5 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-success)]/20 to-[var(--color-primary)]/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)`,
          }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
      </div>
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Premium Branding */}
        <div className={`hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center transition-all duration-1000 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <Container size="lg" padding="lg">
            <VStack gap="xl" className="max-w-2xl mx-auto">
              {/* Premium Logo and Brand */}
              <div className="flex items-center gap-6 mb-12">
                <div className="relative group">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-info)] rounded-[var(--radius-box)] shadow-[calc(var(--depth)*2)] flex items-center justify-center transform group-hover:scale-110 transition-all duration-500">
                    <Shield className="w-10 h-10 text-[var(--color-primary-content)]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)] rounded-full flex items-center justify-center shadow-[var(--depth)]">
                    <Zap className="w-4 h-4 text-[var(--color-success-content)]" />
                  </div>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-info)] rounded-[var(--radius-box)] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                </div>
                <VStack gap="sm">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-base-content)] via-[var(--color-primary)] to-[var(--color-info)] bg-clip-text text-transparent">
                    InspectionPro
                  </h1>
                  <p className="text-[var(--color-base-content)]/70 font-semibold text-lg">
                    Enterprise Inspection Platform
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)] rounded-[var(--radius-selector)] text-xs font-bold text-[var(--color-success-content)] shadow-[var(--depth)]">
                      PREMIUM
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)] rounded-[var(--radius-selector)] text-xs font-bold text-[var(--color-primary-content)] shadow-[var(--depth)]">
                      ENTERPRISE
                    </div>
                  </div>
                </VStack>
              </div>

              {/* Hero Message */}
              <VStack gap="lg" className="text-center lg:text-left">
                <div className="space-y-6">
                  <h2 className="text-6xl xl:text-7xl font-bold text-[var(--color-base-content)] leading-tight">
                    The Future of
                    <span className="block bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-info)] bg-clip-text text-transparent animate-gradient">
                      Smart Inspections
                    </span>
                  </h2>
                  <p className="text-xl text-[var(--color-base-content)]/70 leading-relaxed max-w-2xl">
                    Experience next-generation inspection management with AI-powered insights, 
                    real-time collaboration, and enterprise-grade security that transforms how you work.
                  </p>
                </div>
              </VStack>

              {/* Stats Section */}
              <div className="grid grid-cols-4 gap-6 my-12">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="text-center group cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-info)] rounded-[var(--radius-selector)] flex items-center justify-center shadow-[var(--depth)] group-hover:shadow-[calc(var(--depth)*2)] group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-6 h-6 text-[var(--color-primary-content)]" />
                      </div>
                      <div className="text-2xl font-bold text-[var(--color-base-content)] group-hover:text-[var(--color-primary)] transition-colors duration-300">
                        {stat.value}
                      </div>
                      <div className="text-sm text-[var(--color-base-content)]/70 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Premium Features */}
              <VStack gap="lg">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="w-7 h-7 text-[var(--color-primary)]" />
                  <h3 className="text-2xl font-bold text-[var(--color-base-content)]">
                    Premium Features
                  </h3>
                </div>

                <div className="space-y-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = index === currentFeature;

                    return (
                      <div
                        key={index}
                        className={`group relative overflow-hidden rounded-[var(--radius-box)] border transition-all duration-700 cursor-pointer ${
                          isActive
                            ? 'bg-[var(--color-base-100)] shadow-[calc(var(--depth)*3)] border-[var(--color-primary)]/20 scale-105 transform'
                            : 'bg-[var(--color-base-100)]/60 shadow-[var(--depth)] border-[var(--color-base-300)] hover:shadow-[calc(var(--depth)*2)] hover:scale-102 transform'
                        }`}
                        onClick={() => setCurrentFeature(index)}
                      >
                        {/* Premium Glow Effect */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 via-[var(--color-accent)]/10 to-[var(--color-info)]/10 animate-pulse" />
                        )}
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-info)]" />
                        )}
                        
                        <div className="relative flex items-start gap-6 p-8">
                          <div className={`flex items-center justify-center w-16 h-16 rounded-[var(--radius-box)] transition-all duration-500 ${
                            isActive ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-base-200)]'
                          }`}>
                            <Icon className={`w-8 h-8 transition-all duration-500 ${
                              isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-base-content)]/50'
                            }`} />
                          </div>
                          
                          <VStack gap="sm" className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className={`text-lg font-bold transition-colors duration-500 ${
                                isActive ? 'text-[var(--color-base-content)]' : 'text-[var(--color-base-content)]/70'
                              }`}>
                                {feature.title}
                              </h4>
                              <div className={`px-2 py-1 rounded-[var(--radius-selector)] text-xs font-bold transition-all duration-500 ${
                                isActive 
                                  ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-info)] text-[var(--color-primary-content)] shadow-[var(--depth)]' 
                                  : 'bg-[var(--color-base-200)] text-[var(--color-base-content)]/70'
                              }`}>
                                {feature.badge}
                              </div>
                            </div>
                            <p className={`text-sm leading-relaxed transition-colors duration-500 ${
                              isActive ? 'text-[var(--color-base-content)]/70' : 'text-[var(--color-base-content)]/50'
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
                <div className="flex items-center justify-center gap-4 mt-12">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`relative overflow-hidden rounded-[var(--radius-selector)] transition-all duration-500 ${
                        index === currentFeature
                          ? 'w-16 h-4 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-info)] shadow-[var(--depth)]'
                          : 'w-4 h-4 bg-[var(--color-base-300)] hover:bg-[var(--color-base-content)]/30 hover:scale-125'
                      }`}
                    >
                      {index === currentFeature && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-info)] animate-pulse" />
                          <div className="absolute inset-0 bg-[var(--color-base-100)]/20 animate-ping" />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </VStack>
            </VStack>
          </Container>
        </div>

        {/* Right Side - Premium Login Form */}
        <div className={`w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
          <div className="w-full max-w-md">
            {/* Mobile Premium Logo */}
            <div className="lg:hidden flex items-center justify-center mb-12">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-info)] rounded-[var(--radius-box)] shadow-[calc(var(--depth)*3)] flex items-center justify-center">
                  <Shield className="w-12 h-12 text-[var(--color-primary-content)]" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)] rounded-full flex items-center justify-center shadow-[var(--depth)]">
                  <Zap className="w-5 h-5 text-[var(--color-success-content)]" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-info)] rounded-[var(--radius-box)] blur-xl opacity-30" />
              </div>
            </div>

            {/* Premium Login Card */}
            <Card 
              variant="elevated"
              className="bg-[var(--color-base-100)]/90 backdrop-blur-2xl border-[var(--color-base-300)]/30 shadow-[calc(var(--depth)*3)] relative overflow-hidden"
            >
              {/* Premium Card Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-[var(--color-accent)]/5 to-[var(--color-info)]/5" />
              
              <CardHeader className="text-center space-y-6 pb-8 relative">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-base-content)] via-[var(--color-primary)] to-[var(--color-info)] bg-clip-text text-transparent">
                    Welcome Back
                  </h2>
                  <p className="text-[var(--color-base-content)]/70 text-lg">
                    Access your premium dashboard
                  </p>
                </div>
                
                {/* Premium Badge */}
                <div className="flex justify-center">
                  <div className="px-4 py-2 bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)] rounded-[var(--radius-selector)] text-sm font-bold text-[var(--color-success-content)] shadow-[var(--depth)] flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    PREMIUM ACCESS
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 relative">
                <EnhancedLoginForm />
              </CardContent>
            </Card>

            {/* Premium Footer */}
            <div className="mt-10 text-center space-y-6">
              <div className="flex items-center justify-center gap-6 text-xs text-[var(--color-base-content)]/70">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Enterprise SSL</span>
                </div>
                <div className="w-1 h-1 bg-[var(--color-base-300)] rounded-full" />
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>SOC 2 Certified</span>
                </div>
                <div className="w-1 h-1 bg-[var(--color-base-300)] rounded-full" />
                <span>24/7 Support</span>
              </div>
              <p className="text-xs text-[var(--color-base-content)]/50">
                InspectionPro Enterprise v2.1 • Trusted by 10,000+ companies worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}