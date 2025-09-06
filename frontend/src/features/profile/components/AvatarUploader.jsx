import React from "react";
import { Camera } from "lucide-react";
import { Button } from "@components/ui/Button.jsx";

export default function AvatarUploader({ preview, onFile, disabled }) {
  return (
    <div className="relative">
      {preview ? (
        <div
          className="w-24 h-24 rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, rgba(132,204,22,0.08), rgba(34,197,94,0.04))",
          }}>
          <img
            src={preview}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-xl font-bold text-white"
          style={{
            background: "linear-gradient(90deg,#84cc16,#22c55e)",
          }}>
          {/* initials will be rendered by parent usually */}
          <span>AG</span>
        </div>
      )}

      <label
        title="Change avatar"
        className="absolute -bottom-1 -right-1 bg-base-100 border border-base-200 rounded-full p-1 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile && onFile(e.target.files?.[0])}
          disabled={disabled}
        />
        <Camera className="w-4 h-4 text-base-content/70" />
      </label>
    </div>
  );
}
