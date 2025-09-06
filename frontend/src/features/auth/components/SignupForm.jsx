import React, { useState } from "react";
import { useAuth } from "@context/AuthContext";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";

export const SignupForm = ({ onToggleMode }) => {
  const { signup, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    aadhaar: "",
    pan: "",
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.aadhaar) newErrors.aadhaar = "Aadhaar is required";
    if (!formData.pan) newErrors.pan = "PAN is required";

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    try {
      await signup(formData);
    } catch {
      setErrors({ general: "Signup failed, please try again" });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  return (
    <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-2xl shadow-md">
          ✨
        </div>
        <h2 className="text-3xl font-extrabold text-green-700 mt-4">
          Create Account
        </h2>
        <p className="text-gray-500 mt-2">Join ProLoan today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <Input
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          className="rounded-xl"
        />

        <Input
          type="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          className="rounded-xl"
        />

        <Input
          type="text"
          name="phone"
          label="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="Enter your phone number"
          className="rounded-xl"
        />

        <Input
          type="text"
          name="aadhaar"
          label="Aadhaar Number"
          value={formData.aadhaar}
          onChange={handleChange}
          error={errors.aadhaar}
          placeholder="Enter Aadhaar (12 digits)"
          className="rounded-xl"
        />

        <Input
          type="text"
          name="pan"
          label="PAN Number"
          value={formData.pan}
          onChange={handleChange}
          error={errors.pan}
          placeholder="Enter PAN (e.g. ABCDE1234F)"
          className="rounded-xl"
        />

        <Button
          type="submit"
          className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition text-lg"
          loading={loading}>
          Sign Up
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onToggleMode}
            className="text-green-600 hover:text-green-700 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
