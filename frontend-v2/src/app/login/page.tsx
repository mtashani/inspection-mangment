'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Shield,
  BarChart3,
  FileText,
  Settings,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Shield,
    title: 'Advanced Security',
    description:
      'Enterprise-grade security with role-based access control and audit trails',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Comprehensive dashboards with real-time inspection data and performance metrics',
  },
  {
    icon: FileText,
    title: 'Smart Reporting',
    description:
      'Automated report generation with customizable templates and professional layouts',
  },
  {
    icon: Settings,
    title: 'Equipment Management',
    description:
      'Complete asset lifecycle management with maintenance scheduling and tracking',
  },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Redirect to dashboard when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, isRedirecting]);

  // Rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Don't render login form if user is already authenticated or redirecting
  if (isAuthenticated || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
      // Show success message
      toast.success('Login successful! Redirecting to dashboard...');
      // Immediately redirect after successful login
      setIsRedirecting(true);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      
      // Display user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Reset form on error to allow retry
      form.reset({
        username: data.username, // Keep username but clear password
        password: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
      {/* Left Side - Features Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />

        {/* Logo and Title */}
        <div className="relative z-10 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Inspection Management</h1>
              <p className="text-muted-foreground">Professional System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Streamline Your Inspection Workflow
          </h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive solution for equipment inspection, maintenance
            tracking, and compliance management
          </p>
        </div>

        {/* Animated Features */}
        <div className="relative z-10 space-y-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = index === currentFeature;

            return (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-500 ${
                  isActive
                    ? 'bg-primary/10 border border-primary/20 scale-105'
                    : 'bg-background/50 border border-transparent scale-100 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                {isActive && (
                  <CheckCircle className="w-5 h-5 text-primary animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Indicators */}
        <div className="relative z-10 flex gap-2 mt-8">
          {features.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentFeature ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-background/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your inspection management dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          {...field}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            {...field}
                            disabled={isLoading}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-sm text-destructive text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Login Failed</span>
                    </div>
                    <p className="text-xs">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Forgot your password?
              </p>
              <p className="text-xs text-muted-foreground">
                Contact your system administrator for password recovery
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
