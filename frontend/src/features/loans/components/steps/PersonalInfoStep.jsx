// src/components/steps/PersonalInfoStep.jsx
import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/Input";
import { Grid } from "@components/ui/Grid";
import { useAuth } from "@context/AuthContext";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@components/ui/Button";

export default function PersonalInfoStep({ formData, setFormData, errors }) {
  const { user, fetchCustomer } = useAuth();
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillError, setAutoFillError] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());

  // Auto-fill function
  const autoFillFromProfile = async () => {
    if (!user) return;

    setAutoFillLoading(true);
    setAutoFillError(null);

    try {
      const response = await fetchCustomer();
      if (response?.ok) {
        const customer = response.customer || response.user;
        if (customer) {
          const newFormData = { ...formData };
          const filledFields = new Set();

          // Map customer profile fields to form fields
          if (customer.full_name && !formData.full_name) {
            newFormData.full_name = customer.full_name;
            filledFields.add('full_name');
          }
          if (customer.email && !formData.email) {
            newFormData.email = customer.email;
            filledFields.add('email');
          }
          if (customer.phone && !formData.phone) {
            newFormData.phone = customer.phone;
            filledFields.add('phone');
          }
          if (customer.address && !formData.address) {
            newFormData.address = customer.address;
            filledFields.add('address');
          }
          if (customer.date_of_birth && !formData.dob) {
            // Format date if needed
            const dob = customer.date_of_birth;
            newFormData.dob = dob.split('T')[0]; // Extract date part
            filledFields.add('dob');
          }
          if (customer.gender && !formData.gender) {
            newFormData.gender = customer.gender;
            filledFields.add('gender');
          }
          if (customer.nationality && !formData.nationality) {
            newFormData.nationality = customer.nationality;
            filledFields.add('nationality');
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
    autoFillFromProfile();
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
          <span>Loading your profile information...</span>
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
        {renderField("full_name", "Full name", "text", "Enter your full name", 2)}
        {renderField("email", "Email", "email", "Enter your email", 2)}
        {renderField("phone", "Phone", "tel", "Enter your phone number", 2)}
        {renderField("dob", "Date of birth", "date", "", 2)}
        {renderField("gender", "Gender", "text", "Enter your gender", 2)}
        {renderField("nationality", "Nationality", "text", "Enter your nationality", 2)}
      </Grid>

      {renderField("address", "Address", "text", "Enter your address")}
    </div>
  );
}
