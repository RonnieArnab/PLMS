import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { CreditCard } from "lucide-react";

export default function HeaderHero({ onApply = () => {} }) {
  return (
    <MotionFadeIn delay={0.04}>
      <Paper
        className="rounded-2xl p-6 overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(132,204,22,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(34,197,94,0.02) 100%)",
        }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Welcome back! <span className="inline-block">👋</span>
            </h1>
            <Text variant="muted" className="mt-2">
              Quick overview of your loan portfolio and recent activity.
            </Text>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Input
              placeholder="Search applications, borrowers..."
              className="hidden md:block max-w-sm"
            />
            <Button
              variant="gradient"
              size="lg"
              className="gap-2"
              onClick={onApply}
              style={{
                backgroundImage: "linear-gradient(90deg, #84cc16, #22c55e)",
                color: "white",
              }}>
              <CreditCard className="w-4 h-4 text-white" />
              Apply for New Loan
            </Button>
          </div>
        </div>
      </Paper>
    </MotionFadeIn>
  );
}
