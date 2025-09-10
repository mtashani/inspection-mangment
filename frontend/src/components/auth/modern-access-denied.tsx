"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Shield, ArrowLeft, Home, HelpCircle, Mail } from "lucide-react";

interface ModernAccessDeniedProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showHelpButton?: boolean;
}

export function ModernAccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this resource. Please contact your administrator if you believe this is an error.",
  showHomeButton = true,
  showHelpButton = true,
}: ModernAccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  What you can do:
                </h3>
                <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    Check if you&apos;re logged in with the correct account
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    Contact your administrator for access permissions
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    Try logging out and back in again
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.back()}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>

                {showHomeButton && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="w-full h-11 font-medium"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                )}

                {showHelpButton && (
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/login")}
                    className="w-full h-11 font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Sign in with different account
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center mt-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Contact your system administrator for assistance
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>admin@company.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
