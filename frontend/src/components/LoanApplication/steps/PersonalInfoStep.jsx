import React from "react";
import { Input } from "../../UI/Input";

export default function PersonalInfoStep({ formData, setFormData, errors }) {
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  return (
    <div className="space-y-4">
      <Input
        name="full_name"
        label="Full Name"
        value={formData.full_name}
        onChange={onChange}
        error={errors.full_name}
      />
      <Input
        name="email"
        type="email"
        label="Email"
        value={formData.email}
        onChange={onChange}
        error={errors.email}
      />
      <Input
        name="phone"
        label="Phone Number"
        value={formData.phone}
        onChange={onChange}
        error={errors.phone}
      />
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
