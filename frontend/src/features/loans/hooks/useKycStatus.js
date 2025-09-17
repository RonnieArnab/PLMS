// src/hooks/useKycStatus.js
import { useEffect, useState } from "react";
import api from "@api/api"; // ✅ use your axios instance

export default function useKycStatus() {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const res = await api.get("/api/kyc/status"); // ✅ token auto-attached
        console.log("KYC API response:", res.data);

        if (res.data?.status?.aadhaar_kyc_status) {
          setKycStatus(res.data.status.aadhaar_kyc_status);
        }
      } catch (err) {
        console.error("Failed to fetch KYC status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKyc();
  }, []);

  return { kycStatus, loading };
}
