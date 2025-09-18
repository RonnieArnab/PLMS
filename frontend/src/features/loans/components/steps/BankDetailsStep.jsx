// src/components/steps/BankDetailsStep.jsx
import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/Input";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { useAuth } from "@context/AuthContext";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@components/ui/Button";

export default function BankDetailsStep({ formData, setFormData, errors }) {
  const { user, fetchCustomer } = useAuth();
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillError, setAutoFillError] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());

  // Auto-fill function
  const autoFillFromProfile = async () => {
    if (!user || !fetchCustomer) return;

    setAutoFillLoading(true);
    setAutoFillError(null);

    try {
      const response = await fetchCustomer();
      if (response?.ok) {
        const customer = response.customer || response.user;
        if (customer) {
          const newFormData = { ...formData };
          const filledFields = new Set();

          // Map customer profile fields to bank details form fields
          if (customer.bank_name && !formData.bank_name) {
            newFormData.bank_name = customer.bank_name;
            filledFields.add("bank_name");
          }
          if (customer.account_number && !formData.account_number) {
            newFormData.account_number = customer.account_number;
            filledFields.add("account_number");
          }
          if (customer.ifsc_code && !formData.ifsc) {
            newFormData.ifsc = customer.ifsc_code;
            filledFields.add("ifsc");
          }
          if (customer.account_holder && !formData.account_holder) {
            newFormData.account_holder = customer.account_holder;
            filledFields.add("account_holder");
          }

          setFormData(newFormData);
          setAutoFilledFields(filledFields);
        } else {
          setAutoFillError("Customer profile data not found");
        }
      } else {
        setAutoFillError("Failed to fetch customer profile for auto-fill");
      }
    } catch (error) {
      console.error("Auto-fill error:", error);
      setAutoFillError("Error loading customer profile");
    } finally {
      setAutoFillLoading(false);
    }
  };

  // Auto-fill on component mount
  useEffect(() => {
    // Small delay to ensure context is fully initialized
    const timer = setTimeout(() => {
      autoFillFromProfile();
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  // Handle manual override - remove field from auto-filled set
  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (autoFilledFields.has(field)) {
      setAutoFilledFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  // Enhanced input component with auto-fill indicators
  const renderField = (
    field,
    label,
    type = "text",
    placeholder = "",
    gridCols = null
  ) => {
    const isAutoFilled = autoFilledFields.has(field);
    const hasError = errors[field];

    const inputProps = {
      name: field,
      label: (
        <span className="flex items-center gap-2">
          {label}
          {isAutoFilled && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={12} />
              Auto-filled
            </span>
          )}
        </span>
      ),
      type,
      value: formData[field] || "",
      onChange: (e) => handleFieldChange(field, e.target.value),
      placeholder,
      error: hasError,
      className: `${isAutoFilled ? "border-green-300 bg-green-50" : ""} ${
        hasError ? "border-red-300" : ""
      }`,
    };

    if (gridCols) {
      return (
        <div className="relative">
          <Input {...inputProps} />
          {isAutoFilled && (
            <div className="absolute right-2 top-8">
              <CheckCircle size={16} className="text-green-500" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <Input {...inputProps} />
        {isAutoFilled && (
          <div className="absolute right-2 top-8">
            <CheckCircle size={16} className="text-green-500" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-4">
      {/* Auto-fill status */}
      {autoFillLoading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading your bank details...</span>
        </div>
      )}

      {autoFillError && (
        <div className="flex items-center gap-2 text-yellow-700 text-sm p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
          <AlertCircle size={16} />
          <span>{autoFillError}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={autoFillFromProfile}
            className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      <h4 className="font-semibold mb-2">Bank details (used for disbursal)</h4>
      <Text size="sm" className="mb-3 text-base-content/60">
        Provide a bank account to which approved funds should be disbursed.
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderField("bank_name", "Bank name", "text", "Enter your bank name")}
        {renderField(
          "account_number",
          "Account number",
          "text",
          "Enter your account number"
        )}
        {renderField("ifsc", "IFSC code", "text", "Enter IFSC code")}
        {renderField(
          "account_holder",
          "Account holder name",
          "text",
          "Enter account holder name"
        )}
      </div>
    </Card>
  );
}
