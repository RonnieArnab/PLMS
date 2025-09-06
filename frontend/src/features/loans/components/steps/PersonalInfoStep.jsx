// src/components/steps/PersonalInfoStep.jsx
import React from "react";
import { Input } from "@components/ui/Input";
import { Grid } from "@components/ui/Grid";

export default function PersonalInfoStep({ formData, setFormData, errors }) {
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="space-y-4">
      <Grid cols={2} className="gap-4">
        <Input
          name="full_name"
          label="Full name"
          value={formData.full_name}
          onChange={onChange}
          error={errors.full_name}
        />
        <Input
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={onChange}
          error={errors.email}
        />
        <Input
          name="phone"
          label="Phone"
          value={formData.phone}
          onChange={onChange}
          error={errors.phone}
        />
        <Input
          name="dob"
          label="Date of birth"
          type="date"
          value={formData.dob || ""}
          onChange={onChange}
          error={errors.dob}
        />
        <Input
          name="gender"
          label="Gender"
          value={formData.gender || ""}
          onChange={onChange}
        />
        <Input
          name="nationality"
          label="Nationality"
          value={formData.nationality || ""}
          onChange={onChange}
        />
      </Grid>

      <Input
        name="address"
        label="Address"
        value={formData.address}
        onChange={onChange}
        error={errors.address}
      />
    </div>
  );
}
