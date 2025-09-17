// src/components/steps/FinancialInfoStep.jsx
import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/Input";
import { Grid } from "@components/ui/Grid";
import { useAuth } from "@context/AuthContext";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@components/ui/Button";

export default function FinancialInfoStep({ formData, setFormData, errors }) {
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

          // Map customer profile fields to financial form fields
          if (customer.profession && !formData.profession) {
            newFormData.profession = customer.profession;
            filledFields.add('profession');
          }
          if (customer.employer && !formData.employer) {
            newFormData.employer = customer.employer;
            filledFields.add('employer');
          }
          if (customer.annual_income && !formData.annual_income) {
            newFormData.annual_income = customer.annual_income;
            filledFields.add('annual_income');
          }
          if (customer.net_monthly_income && !formData.net_monthly_income) {
            newFormData.net_monthly_income = customer.net_monthly_income;
            filledFields.add('net_monthly_income');
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
      setAutoFilledFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  // Enhanced input component with auto-fill indicators
  const renderField = (field, label, type = "text", placeholder = "", gridCols = null) => {
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
      className: `${isAutoFilled ? 'border-green-300 bg-green-50' : ''} ${hasError ? 'border-red-300' : ''}`
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
    <div className="space-y-4">
      {/* Auto-fill status */}
      {autoFillLoading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading your financial information...</span>
        </div>
      )}

      {autoFillError && (
        <div className="flex items-center gap-2 text-yellow-700 text-sm p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertCircle size={16} />
          <span>{autoFillError}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={autoFillFromProfile}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      <Grid cols={2} className="gap-4">
        {renderField("profession", "Profession / Employer", "text", "Enter your profession", 2)}
        {renderField("employer", "Employer / Business", "text", "Enter your employer", 2)}
        {renderField("annual_income", "Annual income (₹)", "number", "Enter annual income", 2)}
        {renderField("net_monthly_income", "Net monthly income (₹)", "number", "Enter net monthly income", 2)}
      </Grid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField("loan_amount", "Requested loan amount (₹)", "number", "Enter loan amount")}
        {renderField("tenure_months", "Tenure (months)", "number", "Enter tenure in months")}
      </div>

      {renderField("purpose", "Purpose / Notes", "text", "Enter loan purpose")}
    </div>
  );
}
