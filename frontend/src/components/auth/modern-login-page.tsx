"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { VStack, HStack } from "@/components/ui/stack";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Sparkles,
  CheckCircle,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { EnhancedLoginForm } from "./enhanced-login-form";

const features = [
  {
    icon: CheckCircle,
    title: "Inspection Management",
    description: "Streamlined inspection workflows and tracking",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Coordinate with inspectors and administrators",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Comprehensive reporting and data insights",
  },
  {
    icon: Settings,
    title: "System Administration",
    description: "Manage users, permissions, and configurations",
  },
];

export function ModernLoginPage() {
  const [currentFeature, setCurrentFeature] = useState(0);

  // Rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[var(--color-base-100)] via-[var(--color-base-200)]/50 to-[var(--color-base-200)]">
      {/* Left Side - Branding and Features */}
      <div className="flex lg:w-1/2 xl:w-3/5 flex-col justify-center">
        <Container size="lg" padding="lg">
          <VStack gap="xl" className="max-w-lg">
            {/* Logo and Brand */}
            <HStack gap="md" align="center">
              <div className="flex items-center justify-center h-12 w-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)] rounded-[var(--radius-box)] shadow-[var(--depth)]">
                <Shield className="h-6 w-6 text-[var(--color-primary-content)]" />
              </div>
              <VStack gap="none">
                <h1 className="text-2xl font-bold text-[var(--color-base-content)]">
                  Inspection Management
                </h1>
                <p className="text-sm text-[var(--color-base-content)]/70">
                  Professional inspection system
                </p>
              </VStack>
            </HStack>

            {/* Welcome Message */}
            <VStack gap="md">
              <h2 className="text-4xl font-bold text-[var(--color-base-content)] leading-tight">
                Welcome to your
                <span className="block bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-info)] bg-clip-text text-transparent">
                  inspection workspace
                </span>
              </h2>
              <p className="text-lg text-[var(--color-base-content)]/70 leading-relaxed">
                Manage inspections, track compliance, and collaborate with your
                team in one comprehensive platform.
              </p>
            </VStack>

            {/* Animated Features */}
            <VStack gap="lg">
              <HStack gap="sm" align="center">
                <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-semibold text-[var(--color-base-content)]">
                  Key Features
                </h3>
              </HStack>

              <VStack gap="md">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isActive = index === currentFeature;

                  return (
                    <Card
                      key={index}
                      variant={isActive ? "default" : "ghost"}
                      className={`transition-all duration-300 ${
                        isActive 
                          ? "shadow-[var(--depth)] border-[var(--color-primary)]/20" 
                          : "opacity-70"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-[var(--radius-selector)] flex-shrink-0 ${
                            isActive ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-base-300)]"
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              isActive ? "text-[var(--color-primary)]" : "text-[var(--color-base-content)]/50"
                            }`} />
                          </div>
                          <VStack gap="xs">
                            <h4 className={`font-semibold ${
                              isActive ? "text-[var(--color-base-content)]" : "text-[var(--color-base-content)]/70"
                            }`}>
                              {feature.title}
                            </h4>
                            <p className={`text-sm text-[var(--color-base-content)]/70 ${
                              isActive ? "opacity-100" : "opacity-80"
                            }`}>
                              {feature.description}
                            </p>
                          </VStack>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </VStack>

              {/* Progress Indicators */}
              <HStack gap="sm" className="mt-6">
                {features.map((_, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 h-2 rounded-[var(--radius-selector)] ${
                      index === currentFeature
                        ? "w-12 bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/30"
                        : "w-3 bg-[var(--color-base-300)] hover:bg-[var(--color-base-content)]/30"
                    }`}
                  />
                ))}
              </HStack>
            </VStack>
          </VStack>
        </Container>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center">
        <Container size="sm" padding="md">
          <VStack gap="lg" className="w-full max-w-md">
            <Card className="overflow-hidden">
              <CardContent className="p-6 pb-8">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center justify-center mb-6">
                  <div className="flex items-center justify-center h-16 w-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)] rounded-[var(--radius-box)] shadow-[var(--depth)]">
                    <Shield className="h-8 w-8 text-[var(--color-primary-content)]" />
                  </div>
                </div>

                <VStack gap="sm" align="center" className="text-center">
                  <h2 className="text-2xl font-bold text-[var(--color-base-content)]">
                    Welcome Back
                  </h2>
                  <p className="text-[var(--color-base-content)]/70">
                    Sign in to access your inspection dashboard
                  </p>
                </VStack>
              </CardContent>

              <CardContent className="p-6 pt-0">
                <EnhancedLoginForm />
              </CardContent>
            </Card>

            {/* Footer */}
            <VStack gap="md" align="center" className="text-center">
              <HStack gap="md" align="center" justify="center">
                <span className="text-xs text-[var(--color-base-content)]/70">Secure</span>
                <div className="h-1 w-1 bg-[var(--color-base-300)] rounded-full" />
                <span className="text-xs text-[var(--color-base-content)]/70">Reliable</span>
                <div className="h-1 w-1 bg-[var(--color-base-300)] rounded-full" />
                <span className="text-xs text-[var(--color-base-content)]/70">Professional</span>
              </HStack>
              <p className="text-xs text-[var(--color-base-content)]/50">
                Inspection Management System v2.0
              </p>
            </VStack>
          </VStack>
        </Container>
      </div>
    </div>
  );
}
