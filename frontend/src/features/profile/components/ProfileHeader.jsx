import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import AvatarUploader from "./AvatarUploader";

export default function ProfileHeader({
  loading,
  initials,
  preview,
  name,
  email,
  premium,
  onAvatar,
  onEditToggle,
  editing,
  disabled,
}) {
  return (
    <MotionFadeIn>
      <Paper
        className="rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(90deg, rgba(132,204,22,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(34,197,94,0.02) 100%)",
        }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <AvatarUploader
                preview={preview}
                onFile={onAvatar}
                disabled={disabled}
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  {loading ? (
                    <span className="h-6 w-48 bg-base-200 rounded animate-pulse block" />
                  ) : (
                    name
                  )}
                </h1>
                <Text variant="muted" className="mt-1">
                  {loading ? (
                    <span className="h-4 w-56 bg-base-200 rounded animate-pulse block" />
                  ) : (
                    email
                  )}
                </Text>
                {premium && !loading && (
                  <div className="mt-2">
                    <span className="badge badge-primary badge-sm">
                      Premium Member
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant={editing ? "outline" : "primary"}
              size="md"
              onClick={onEditToggle}
              disabled={disabled}>
              {editing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </div>
      </Paper>
    </MotionFadeIn>
  );
}
