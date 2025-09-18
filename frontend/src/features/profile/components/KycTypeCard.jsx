// src/features/profile/components/KycTypeCard.jsx
import React, { useMemo } from "react";
import { Card } from "@components/ui/Card.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { DownloadCloud } from "lucide-react";

/**
 * KycTypeCard - Aadhaar only
 */
export default function KycTypeCard({
  type, // expects "AADHAAR"
  status,
  parsed,
  lastResponse,
  loading,
  onChangeField,
  onSelectFile,
  onSubmit,
  fields = {},
  errors = {},
}) {
  // only Aadhaar supported
  const badge = useMemo(() => {
    const s = String(status || "").toUpperCase();
    if (s === "VERIFIED" || s === "AUTO_APPROVED")
      return <Badge variant="success">Verified</Badge>;
    if (s === "PENDING") return <Badge variant="warning">Pending</Badge>;
    if (s === "NEEDS_REVIEW")
      return <Badge variant="warning">Needs review</Badge>;
    if (s === "REJECTED") return <Badge variant="danger">Rejected</Badge>;
    return <Badge variant="secondary">Not submitted</Badge>;
  }, [status]);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Aadhaar</h3>
          <div className="text-sm text-muted mt-1">
            Upload Aadhaar PDF or image. Submit Aadhaar separately.
          </div>
        </div>

        <div className="flex items-center gap-2">{badge}</div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <Input
            label="Aadhaar number"
            name="aadhaar_no"
            value={fields.aadhaar_no || ""}
            onChange={(e) =>
              onChangeField(
                "aadhaar_no",
                (e && e.target && String(e.target.value).replace(/\D/g, "")) ||
                  ""
              )
            }
            placeholder="123412341234"
            error={errors.aadhaar_no}
            autoComplete="off"
          />
          <div className="text-xs text-muted">
            Saved:{" "}
            <span className="font-medium">
              {parsed?.aadhaar_last4
                ? `**** **** ${parsed.aadhaar_last4}`
                : "—"}
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm text-base-content/70">Aadhaar file</label>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={(e) => onSelectFile(e?.target?.files?.[0] || null)}
            className="file-input file-input-bordered w-full"
            disabled={loading}
          />
          <div className="mt-2 space-y-1">
            <Input
              label="PDF passcode (optional)"
              value={fields.aadhaar_pdf_pass || ""}
              onChange={(e) =>
                onChangeField("aadhaar_pdf_pass", e?.target?.value || "")
              }
              placeholder="If PDF is password-protected"
            />
            <Input
              label="ZIP passcode (optional)"
              value={fields.aadhaar_zip_pass || ""}
              onChange={(e) =>
                onChangeField("aadhaar_zip_pass", e?.target?.value || "")
              }
              placeholder="If ZIP is password-protected"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => onChangeField("clear", true)}
          disabled={loading}>
          Clear
        </Button>
        <Button
          variant="gradient"
          type="button"
          onClick={onSubmit}
          disabled={loading}
          style={{
            backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
            color: "white",
          }}>
          {loading ? "Submitting..." : "Submit Aadhaar"}
        </Button>
      </div>

      {lastResponse && (
        <div className="mt-4 p-3 rounded border bg-base-100 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                Status: {String(lastResponse.status || "UNKNOWN")}
              </div>
              <div className="text-xs text-muted">
                Confidence: {String(lastResponse.confidence ?? "n/a")}
              </div>
            </div>
            <div>
              {lastResponse.xmlDownloadRoute && (
                <a
                  href={lastResponse.xmlDownloadRoute}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm underline text-lime-600">
                  <DownloadCloud className="w-4 h-4" /> XML
                </a>
              )}
            </div>
          </div>

          <div className="mt-2">
            {lastResponse.parsed?.aadhaar_last4 && (
              <div>Aadhaar last4: **** {lastResponse.parsed.aadhaar_last4}</div>
            )}
            {lastResponse.parsed?.dob && (
              <div>DOB: {lastResponse.parsed.dob}</div>
            )}
            {lastResponse.confidenceReasons?.length > 0 && (
              <div className="mt-2 text-xs text-muted">
                Reasons: {lastResponse.confidenceReasons.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
