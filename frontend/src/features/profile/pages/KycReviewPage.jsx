// src/pages/KycReviewPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import api from "@api/api";
import useCustomer from "@features/profile/hooks/useCustomer";
import useKYC from "@features/profile/hooks/useKyc";

/**
 * KycReviewPage - Aadhaar only
 */
export default function KycReviewPage() {
  const navigate = useNavigate();
  const { customer, refreshCustomer } = useCustomer();
  const { aadhaar, refresh: refreshKyc } = useKYC();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);
  const [requestingManual, setRequestingManual] = useState(false);

  const fetchLatestReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      // Prefer fetching the latest KYC record if API offers endpoint for record by id
      if (customer?.latest_kyc_id) {
        const resp = await api.get(
          `/api/kyc/records/${customer.latest_kyc_id}`
        );
        setRecord(resp.data || null);
      } else {
        // Fallback: synthesize from /status snapshot
        if (aadhaar) {
          setRecord({
            id: aadhaar.latest_kyc_id || null,
            status: aadhaar.status || "NEEDS_REVIEW",
            created_at: null,
            parsed: {
              aadhaar_last4: aadhaar.aadhaar_no
                ? String(aadhaar.aadhaar_no).slice(-4)
                : null,
            },
            confidence_score: null,
            file: null,
            notes: null,
          });
        } else {
          throw new Error("No KYC record found");
        }
      }
    } catch (e) {
      console.error("fetchLatestReview error:", e);
      setError(
        e?.response?.data?.error || e.message || "Failed to load review details"
      );
    } finally {
      setLoading(false);
    }
  }, [customer, aadhaar]);

  useEffect(() => {
    fetchLatestReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRequestManualReview = async () => {
    setRequestingManual(true);
    try {
      // try to request manual review for latest record
      if (record?.id) {
        const res = await api.post(
          `/api/kyc/records/${record.id}/request-review`
        );
        if (res?.data?.ok) {
          await fetchLatestReview();
          await refreshCustomer?.();
          await refreshKyc?.();
        }
      } else {
        // generic request
        const res = await api.post("/api/kyc/records/request-review");
        if (res?.data?.ok) {
          await fetchLatestReview();
          await refreshCustomer?.();
          await refreshKyc?.();
        } else {
          setError(res?.data?.error || "Request submitted");
        }
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Request failed");
    } finally {
      setRequestingManual(false);
    }
  };

  const goBack = () => navigate("/profile");
  const reuploadAadhaar = () => navigate("/kyc");

  return (
    <MotionFadeIn>
      <div className="max-w-3xl mx-auto p-6">
        <Button
          variant="outline"
          size="sm"
          onClick={goBack}
          className="flex items-center gap-2 my-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Paper className="rounded-2xl p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold">Aadhaar KYC — Review</h1>
            <Text variant="muted" className="mt-1">
              If automatic verification failed, you can re-upload your Aadhaar
              or request manual review.
            </Text>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-48 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-base-200 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-red-50 text-red-700 border border-red-100">
              <AlertCircle className="inline-block mr-2 w-4 h-4 align-middle" />
              {error}
            </div>
          ) : (
            <>
              <Card className="p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Aadhaar Record</div>
                    <div className="text-sm text-muted">
                      Submitted:{" "}
                      {record?.created_at
                        ? new Date(record.created_at).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant={
                        record?.status === "APPROVED" ? "success" : "warning"
                      }>
                      {record?.status || "NEEDS_REVIEW"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Detected fields</div>
                    <div className="text-xs mt-2 space-y-1">
                      {record?.parsed?.aadhaar_last4 ? (
                        <div>
                          Aadhaar last4: ****{" "}
                          {String(record.parsed.aadhaar_last4)}
                        </div>
                      ) : (
                        <div>Aadhaar: not found</div>
                      )}
                      <div className="text-xs text-muted mt-2">
                        Text sample (truncated):
                      </div>
                      <pre className="text-xs bg-base-200 p-2 rounded max-h-28 overflow-y-auto">
                        {record?.parsed?.textSample
                          ? record.parsed.textSample.slice(0, 600) +
                            (record.parsed.textSample.length > 600 ? "..." : "")
                          : "n/a"}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium">
                      Confidence & files
                    </div>
                    <div className="text-xs mt-2 space-y-1">
                      <div>
                        Confidence score:{" "}
                        <strong>
                          {record?.confidence_score ??
                            record?.confidence ??
                            "n/a"}
                        </strong>
                      </div>
                      <div>
                        Status: <strong>{record?.status}</strong>
                      </div>
                      <div className="mt-2">
                        {record?.file && (
                          <div>
                            <div className="text-xs">Document:</div>
                            <a
                              href={record.file.file_path}
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(record.file.file_path, "_blank");
                              }}
                              className="text-sm underline">
                              Open document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={reuploadAadhaar}>
                  Re-upload Aadhaar
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => {
                    fetchLatestReview();
                  }}>
                  <RefreshCw className="w-4 h-4 inline-block mr-2" /> Refresh
                </Button>
                <div className="ml-auto">
                  <Button
                    variant="destructive"
                    onClick={onRequestManualReview}
                    disabled={requestingManual}>
                    {requestingManual
                      ? "Requesting..."
                      : "Request manual review"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Paper>
      </div>
    </MotionFadeIn>
  );
}
