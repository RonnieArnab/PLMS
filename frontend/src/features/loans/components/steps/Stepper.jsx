// src/components/steps/Stepper.jsx
import React from "react";
import { motion } from "framer-motion";
import { Text } from "@components/ui/Text";

/**
 * Single-scroll Stepper
 *
 * Props:
 *  - steps: [{ id: number, label: string, icon?: Component, subtitle?: string }]
 *  - current: number (1-based)
 *  - onStepClick?: fn(id)
 *  - className?: string
 */
export default function Stepper({
  steps = [],
  current = 1,
  onStepClick = null,
  className = "",
}) {
  if (!steps?.length) return null;

  const total = steps.length;
  const percent =
    total > 1 ? Math.round(((current - 1) / (total - 1)) * 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* gradient card wrapper */}
      <div
        className="rounded-2xl p-3 shadow-md border border-base-200 overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(132,204,22,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(34,197,94,0.02) 100%)",
        }}>
        {/* single scroll container: each item contains both circle + label */}
        <div className="overflow-x-auto">
          <div className="flex items-start gap-6 py-2 px-1 min-w-[640px]">
            {steps.map((s, idx) => {
              const isActive = current === s.id;
              const isDone = current > s.id;
              const Icon = s.icon ?? null;

              return (
                <div
                  key={s.id}
                  className="flex-shrink-0 w-28 flex flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={() => onStepClick?.(s.id)}
                    disabled={!onStepClick}
                    aria-current={isActive ? "step" : undefined}
                    className="focus:outline-none">
                    <motion.div
                      initial={false}
                      animate={isActive ? { scale: 1.06 } : { scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 26,
                      }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold transition-shadow ${
                        isActive
                          ? "bg-lime-500 text-white shadow-lg"
                          : isDone
                          ? "bg-lime-100 text-lime-700"
                          : "bg-white text-base-content/60 border border-base-200"
                      }`}>
                      {Icon ? (
                        <Icon
                          className={`${isActive ? "text-white" : ""} w-5 h-5`}
                        />
                      ) : (
                        s.id
                      )}
                    </motion.div>
                  </button>

                  <div className="mt-2 w-full">
                    <Text
                      size="sm"
                      weight={isActive ? "semibold" : "normal"}
                      className={`block truncate ${
                        isActive ? "text-base-content" : "text-base-content/70"
                      }`}>
                      {s.label}
                    </Text>
                    {s.subtitle && (
                      <div className="text-xs text-base-content/50 mt-1 truncate">
                        {s.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* progress bar (single, full width) */}
        <div className="mt-4 px-2 relative">
          {/* Track */}
          <div className="w-full h-3 rounded-full bg-base-200 overflow-hidden relative">
            {/* animated gradient stripes */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="h-full rounded-full bg-[length:200%_100%]"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #84cc16, #22c55e 10px, #a3e635 10px, #84cc16 20px)",
                backgroundSize: "200% 100%",
                animation: "progress-stripes 1.5s linear infinite",
              }}
            />

            {/* milestone dots (positioned along the track) */}
            {steps.map((s, idx) => {
              const left = `${(idx / (steps.length - 1)) * 100}%`;
              const isActive = current === s.id;
              const isDone = current > s.id;
              return (
                <div
                  key={`dot-${s.id}`}
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-transform transform ${
                    isActive
                      ? "bg-lime-500 border-lime-600 shadow-md scale-125"
                      : isDone
                      ? "bg-lime-300 border-lime-400"
                      : "bg-white border-base-300"
                  }`}
                  style={{ left }}
                />
              );
            })}
          </div>

          {/* footer text */}
          <div className="mt-2 flex items-center justify-between text-sm text-base-content/70">
            <span>
              <span className="font-semibold">{percent}%</span> completed
            </span>
            <span>
              Step {current} of {total}
            </span>
          </div>
        </div>
      </div>

      {/* add the small CSS keyframes required for the stripe animation */}
      <style jsx>{`
        @keyframes progress-stripes {
          from {
            background-position: 200% 0;
          }
          to {
            background-position: 0 0;
          }
        }
      `}</style>
    </div>
  );
}
