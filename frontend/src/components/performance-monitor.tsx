"use client";

import { useEffect, useState } from "react";

/**
 * Simple Performance Monitor
 * Monitors theme switching performance
 */

interface PerformanceData {
  themeChanges: number;
  averageTime: number;
  lastChangeTime: number;
  totalTime: number;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    themeChanges: 0,
    averageTime: 0,
    lastChangeTime: 0,
    totalTime: 0,
  });

  useEffect(() => {
    let startTime: number;
    let observer: MutationObserver;

    // Monitor CSS variable changes
    const monitorThemeChanges = () => {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style"
          ) {
            const endTime = performance.now();
            if (startTime) {
              const changeTime = endTime - startTime;

              setPerformance((prev) => {
                const newChanges = prev.themeChanges + 1;
                const newTotalTime = prev.totalTime + changeTime;
                const newAverageTime = newTotalTime / newChanges;

                return {
                  themeChanges: newChanges,
                  averageTime: newAverageTime,
                  lastChangeTime: changeTime,
                  totalTime: newTotalTime,
                };
              });
            }
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    };

    // Monitor theme button clicks
    const handleThemeChange = () => {
      startTime = performance.now();
    };

    // Add event listeners to theme buttons
    const addThemeListeners = () => {
      const themeButtons = document.querySelectorAll("[data-theme-button]");
      themeButtons.forEach((button) => {
        button.addEventListener("click", handleThemeChange);
      });
    };

    // Setup monitoring
    monitorThemeChanges();

    // Check for theme buttons periodically
    const interval = setInterval(addThemeListeners, 1000);

    return () => {
      if (observer) observer.disconnect();
      clearInterval(interval);

      const themeButtons = document.querySelectorAll("[data-theme-button]");
      themeButtons.forEach((button) => {
        button.removeEventListener("click", handleThemeChange);
      });
    };
  }, []);

  const resetStats = () => {
    setPerformance({
      themeChanges: 0,
      averageTime: 0,
      lastChangeTime: 0,
      totalTime: 0,
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 px-3 py-2 text-xs rounded shadow-lg z-50"
        style={{
          backgroundColor: "var(--primary, #3b82f6)",
          color: "#ffffff",
          borderRadius: "var(--radius, 0.5rem)",
          boxShadow: "var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1))",
        }}
      >
        📊 Performance
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 p-4 rounded shadow-lg z-50 min-w-64"
      style={{
        backgroundColor: "var(--background, #ffffff)",
        color: "var(--foreground, #1f2937)",
        borderRadius: "var(--radius, 0.5rem)",
        boxShadow: "var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1))",
        border: "1px solid var(--secondary, #64748b)",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">🚀 Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: "var(--secondary, #64748b)",
            color: "#ffffff",
            borderRadius: "var(--radius, 0.5rem)",
          }}
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Theme Changes:</span>
          <span className="font-mono">{performance.themeChanges}</span>
        </div>

        <div className="flex justify-between">
          <span>Average Time:</span>
          <span className="font-mono">
            {performance.averageTime.toFixed(2)}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span>Last Change:</span>
          <span className="font-mono">
            {performance.lastChangeTime.toFixed(2)}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span>Total Time:</span>
          <span className="font-mono">
            {performance.totalTime.toFixed(2)}ms
          </span>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs">
              Status:{" "}
              {performance.averageTime < 50
                ? "✅ Good"
                : performance.averageTime < 100
                ? "⚠️ OK"
                : "❌ Slow"}
            </span>
            <button
              onClick={resetStats}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: "var(--accent, #f59e0b)",
                color: "#ffffff",
                borderRadius: "var(--radius, 0.5rem)",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
