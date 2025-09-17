import React from "react";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Text } from "@components/ui/Text";
import useKycStatus from "../hooks/useKycStatus.js";

export default function KycGate({ children }) {
  const navigate = useNavigate();
  const { kycStatus, loading } = useKycStatus();
if (loading) return <p className="p-6">Checking KYC status...</p>;

const allowed = ["AUTO_APPROVED", "VERIFIED"].includes(kycStatus?.toUpperCase());

  if (!allowed) {

  return (
    <div className="flex justify-center items-center h-[60vh] px-4">
      <Card className="max-w-lg w-full p-6 rounded-xl shadow-md border border-base-300 bg-base-100 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-base-content">
            KYC Verification Required
          </h2>
          <p className="text-base-content/70 text-sm leading-relaxed">
            To continue with loan applications and manage your loans, please
            complete your Aadhaar KYC verification.
          </p>
          <Button
            onClick={() => navigate("/profile/kyc")}
            className="mt-4 w-full sm:w-auto"
          >
            Update KYC
          </Button>
        </div>
      </Card>
    </div>
  );
}
 return children;
}
