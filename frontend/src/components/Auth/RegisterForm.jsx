import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Card } from "../UI/Card";

export const RegisterForm = ({ onToggleMode }) => {
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profession: "",
    phone_number: "",
    aadhaar_no: "",
    pan_no: "",
  });
  const [errors, setErrors] = useState({});

  const professions = [
    "Doctor",
    "Lawyer",
    "Engineer",
    "Architect",
    "Accountant",
    "Consultant",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = {};

    if (!formData.name) e2.name = "Full name is required";
    if (!formData.email) e2.email = "Email is required";
    if (!formData.password) e2.password = "Password is required";
    if (!formData.confirmPassword) e2.confirmPassword = "Confirm your password";
    if (formData.password && formData.password.length < 6)
      e2.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      e2.confirmPassword = "Passwords do not match";
    if (!formData.profession) e2.profession = "Profession is required";

    if (!/^\d{10}$/.test(formData.phone_number))
      e2.phone_number = "Enter 10-digit phone";
    if (!/^\d{12}$/.test(formData.aadhaar_no))
      e2.aadhaar_no = "Enter 12-digit Aadhaar";
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.pan_no))
      e2.pan_no = "Enter valid PAN (ABCDE1234F)";

    setErrors(e2);
    if (Object.keys(e2).length) return;

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.profession,
        formData.phone_number,
        formData.aadhaar_no,
        formData.pan_no
      );
    } catch {
      setErrors({ general: "Registration failed" });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  return (
    <Card className="w-full max-w-md mx-auto" padding="lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Join us to apply for professional loans
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <Input
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Input
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Profession
          </label>
          <select
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.profession ? "border-red-500" : "border-gray-300"
            }`}>
            <option value="">Select your profession</option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.profession && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.profession}
            </p>
          )}
        </div>

        <Input
          name="phone_number"
          label="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          error={errors.phone_number}
          placeholder="10-digit mobile"
        />
        <Input
          name="aadhaar_no"
          label="Aadhaar Number"
          value={formData.aadhaar_no}
          onChange={handleChange}
          error={errors.aadhaar_no}
          placeholder="12-digit Aadhaar"
        />
        <Input
          name="pan_no"
          label="PAN"
          value={formData.pan_no}
          onChange={handleChange}
          error={errors.pan_no}
          placeholder="ABCDE1234F"
        />

        <Input
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Input
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-500 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </Card>
  );
};
