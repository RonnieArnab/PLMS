// // src/pages/LoanApplicationForm.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { DashboardLayout } from "@components/layout/DashboardLayout";
// import { Card } from "@components/ui/Card";
// import { Button } from "@components/ui/Button";
// import { Text } from "@components/ui/Text";
// import { AlertCircle } from "lucide-react";

// // import your individual step components
// import {
//   Stepper,
//   LoanTypeStep,
//   PersonalInfoStep,
//   FinancialInfoStep,
//   KycVerificationStep,
//   DocumentsStep,
//   CompareLoansStep,
//   ReviewSubmitStep,
// } from "@features/loans/components/steps/index"; // adjust path as needed

// import { useLoanApp } from "../context/LoanAppContext"; // keep your context hook

// // --- validation (same as you had) ---
// function validateStep(step, data, final = false) {
//   const errs = {};
//   switch (step) {
//     case 1: {
//       if (!data.full_name?.trim()) errs.full_name = "Full name is required";
//       if (!data.email?.trim()) errs.email = "Email is required";
//       if (!data.phone?.trim()) errs.phone = "Phone is required";
//       if (!data.address?.trim()) errs.address = "Address is required";
//       break;
//     }
//     case 2: {
//       if (!data.product_id) errs.product_id = "Select a loan product";
//       break;
//     }
//     case 4: {
//       if (!data.loan_amount) errs.loan_amount = "Loan amount is required";
//       if (!data.tenure_months) errs.tenure_months = "Tenure is required";
//       break;
//     }
//     case 5: {
//       if (!data.pan_no) errs.pan_no = "PAN is required";
//       if (!data.aadhaar_no) errs.aadhaar_no = "Aadhaar is required";
//       break;
//     }
//     case 6: {
//       if (!data.documents?.length)
//         errs.documents = "Upload at least one document";
//       break;
//     }
//     default:
//       break;
//   }
//   if (final) {
//     [
//       "full_name",
//       "email",
//       "phone",
//       "address",
//       "product_id",
//       "loan_amount",
//       "tenure_months",
//     ].forEach((k) => {
//       if (!data[k]) errs[k] ??= "Required";
//     });
//   }
//   return { valid: Object.keys(errs).length === 0, errors: errs };
// }

// /* ---------------------------
//    Skeleton components used during loading
//    --------------------------- */

// function StepperSkeleton({ stepsCount = 7 }) {
//   return (
//     <div className="rounded-2xl p-3 shadow-md border border-base-200 overflow-hidden">
//       <div className="overflow-x-auto">
//         <div className="flex items-start gap-6 py-2 px-1 min-w-[640px]">
//           {Array.from({ length: stepsCount }).map((_, idx) => (
//             <div
//               key={idx}
//               className="flex-shrink-0 w-28 flex flex-col items-center text-center">
//               <div className="w-14 h-14 rounded-full bg-base-200 animate-pulse" />
//               <div className="mt-2 w-full">
//                 <div className="h-4 bg-base-200 rounded w-20 mx-auto animate-pulse" />
//                 <div className="h-3 bg-base-200 rounded w-14 mt-2 mx-auto animate-pulse" />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="mt-4 px-2 relative">
//         <div className="w-full h-3 rounded-full bg-base-200 overflow-hidden relative">
//           <div
//             className="h-full bg-base-200 animate-pulse"
//             style={{ width: "40%" }}
//           />
//         </div>
//         <div className="mt-2 flex items-center justify-between text-sm text-base-content/70">
//           <span>
//             <span className="font-semibold">—</span> completed
//           </span>
//           <span>Step — of {stepsCount}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FormSkeleton() {
//   return (
//     <Card className="p-6 space-y-6">
//       <div className="animate-pulse space-y-4">
//         <div className="h-6 w-1/3 bg-base-200 rounded" />
//         <div className="h-12 bg-base-200 rounded" />
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="h-12 bg-base-200 rounded" />
//           <div className="h-12 bg-base-200 rounded" />
//           <div className="h-12 bg-base-200 rounded" />
//           <div className="h-12 bg-base-200 rounded" />
//         </div>

//         <div className="flex items-center justify-between pt-6 border-t border-base-200">
//           <div className="h-10 w-28 bg-base-200 rounded" />
//           <div className="flex gap-3">
//             <div className="h-10 w-28 bg-base-200 rounded" />
//             <div className="h-10 w-28 bg-base-200 rounded" />
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// }

// /* ---------------------------
//    Main page component
//    --------------------------- */

// export function LoanApplicationContent() {
//   // renamed to currentStep so Stepper/current naming matches
//   const [currentStep, setCurrentStep] = useState(1);
//   const [errors, setErrors] = useState({});

//   // loading state (simulate fetch)
//   const [loading, setLoading] = useState(true);

//   const {
//     values,
//     setValues,
//     products,
//     files,
//     addFile,
//     setLastDocType,
//     removeFile,
//   } = useLoanApp();

//   const steps = useMemo(
//     () => [
//       { id: 1, label: "Personal Info", icon: undefined },
//       { id: 2, label: "Bank", icon: undefined },
//       { id: 3, label: "Compare", icon: undefined },
//       { id: 4, label: "Financial", icon: undefined },
//       { id: 5, label: "KYC", icon: undefined },
//       { id: 6, label: "Documents", icon: undefined },
//       { id: 7, label: "Review", icon: undefined },
//     ],
//     []
//   );

//   const formData = useMemo(
//     () => ({
//       ...values,
//       documents: files.map((f) =>
//         f.file?.name ? { name: f.file.name, ...f } : f
//       ),
//       product:
//         products?.find(
//           (p) => String(p.product_id) === String(values.product_id)
//         ) || null,
//     }),
//     [values, files, products]
//   );

//   // helper to update form data via context setValues
//   const setFormData = (next) => {
//     if (typeof next === "function") {
//       const updated = next(formData);
//       setValues((prev) => ({ ...prev, ...updated }));
//     } else if (next && typeof next === "object") {
//       setValues((prev) => ({ ...prev, ...next }));
//     }
//   };

//   // simulate loading (replace with actual fetch)
//   useEffect(() => {
//     const t = setTimeout(() => setLoading(false), 800);
//     return () => clearTimeout(t);
//   }, []);

//   const goNext = () => {
//     const { valid, errors: e } = validateStep(currentStep, formData);
//     setErrors(e);
//     if (!valid) return;
//     setCurrentStep((s) => Math.min(s + 1, steps.length));
//   };

//   const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

//   const handleSubmit = () => {
//     const { valid, errors: e } = validateStep(currentStep, formData, true);
//     setErrors(e);
//     if (!valid) return;

//     const payload = {
//       applicant: {
//         full_name: formData.full_name,
//         email: formData.email,
//         phone: formData.phone,
//         address: formData.address,
//       },
//       loan: {
//         product_id: formData.product_id,
//         loan_amount: Number(formData.loan_amount),
//         tenure_months: Number(formData.tenure_months),
//         interest_rate_apr: formData.product?.base_interest_apr ?? null,
//         processing_fee_pct: formData.product?.processing_fee_pct ?? null,
//         purpose: formData.purpose ?? null,
//       },
//       kyc: {
//         pan_no: formData.pan_no,
//         pan_verified: !!formData.pan_verified,
//         aadhaar_no: formData.aadhaar_no,
//         aadhaar_verified: !!formData.aadhaar_verified,
//       },
//       documents: files.map((f) => ({
//         document_type: f.document_type,
//         name: f.file?.name ?? f.name ?? "document",
//       })),
//     };

//     console.log("Submitted Loan Application:", payload);
//     alert("Loan Application Submitted Successfully!");
//   };

//   return (
//     <div className="max-w-5xl mx-auto space-y-6">
//       {/* Stepper */}
//       <Card className="relative overflow-hidden p-6">
//         {/* decorative gradient blob (absolute, non-interactive) */}
//         <div
//           aria-hidden
//           style={{
//             position: "absolute",
//             right: -120,
//             top: -60,
//             width: 340,
//             height: 340,
//             borderRadius: "50%",
//             background:
//               "radial-gradient(circle at 30% 30%, rgba(132,204,22,0.18), rgba(34,197,94,0.07) 35%, transparent 50%)",
//             filter: "blur(28px)",
//             pointerEvents: "none",
//             zIndex: 0,
//           }}
//         />

//         <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
//           {/* left column: title + description + quick bank info */}
//           <div className="flex-1 min-w-0">
//             <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
//               Loan Application
//             </h2>

//             <Text variant="muted" className="mt-2 block md:max-w-xl">
//               Complete the form to apply — we only need a few details to get you
//               started. You can save progress anytime and come back to continue.
//             </Text>

//             {/* quick actions row */}
//             <div className="mt-4 flex flex-wrap items-center gap-3">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => {
//                   /* saveDraft handler */
//                   console.log("Save draft");
//                 }}
//                 disabled={loading}>
//                 Save Draft
//               </Button>

//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => {
//                   /* open help */
//                   console.log("Open help");
//                 }}
//                 disabled={loading}>
//                 Help
//               </Button>

//               <div className="ml-2 text-sm text-base-content/60 hidden sm:inline">
//                 <span className="inline-block rounded-full w-2 h-2 bg-lime-500 mr-2 align-middle" />
//                 Auto-save enabled
//               </div>
//             </div>

//             {/* bank / user quick info to fill empty left space */}
//             <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
//               <div className="p-3 rounded-lg bg-base-200/60">
//                 <div className="text-xs text-base-content/60">Account name</div>
//                 <div className="font-medium mt-1">Arnab Ghosh</div>
//               </div>

//               <div className="p-3 rounded-lg bg-base-200/60">
//                 <div className="text-xs text-base-content/60">Bank</div>
//                 <div className="font-medium mt-1">State Bank of India</div>
//               </div>

//               <div className="p-3 rounded-lg bg-base-200/60">
//                 <div className="text-xs text-base-content/60">
//                   Account number
//                 </div>
//                 <div className="font-medium mt-1">XXXX-XXXX-1234</div>
//               </div>

//               <div className="p-3 rounded-lg bg-base-200/60">
//                 <div className="text-xs text-base-content/60">IFSC</div>
//                 <div className="font-medium mt-1">SBIN0001234</div>
//               </div>
//             </div>
//           </div>

//           {/* right column: compact stepper card (white on top of gradient) */}
//           <div className="w-full md:w-[48%] lg:w-[40%]">
//             <div
//               className="rounded-xl p-4 shadow-md border border-base-200"
//               style={{
//                 background:
//                   "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.98))",
//               }}>
//               {/* subtle header in the stepper card */}
//               <div className="flex items-center justify-between mb-3">
//                 <div>
//                   <div className="text-sm font-semibold">Progress</div>
//                   <div className="text-xs text-base-content/60">
//                     Follow each step to complete your application
//                   </div>
//                 </div>

//                 <div className="text-sm text-base-content/60">
//                   Step {currentStep} of {steps.length}
//                 </div>
//               </div>

//               {/* Stepper or StepperSkeleton */}
//               <div className="mt-2">
//                 {loading ? (
//                   <StepperSkeleton stepsCount={steps.length} />
//                 ) : (
//                   <Stepper
//                     steps={steps}
//                     current={currentStep}
//                     onStepClick={(id) => {
//                       // allow mild navigation but avoid jumping too far ahead
//                       const allowJump = id <= currentStep + 1;
//                       if (!allowJump) return;
//                       setCurrentStep(id);
//                       setErrors({});
//                     }}
//                   />
//                 )}
//               </div>

//               {/* small footer with percent and a call-to-action */}
//               <div className="mt-4 flex items-center justify-between">
//                 <div className="text-sm text-base-content/70">
//                   <span className="font-medium">
//                     {Math.round(
//                       ((currentStep - 1) / Math.max(1, steps.length - 1)) * 100
//                     )}
//                     %
//                   </span>{" "}
//                   completed
//                 </div>

//                 <div>
//                   <Button
//                     variant="gradient"
//                     size="sm"
//                     onClick={() =>
//                       setCurrentStep((s) => Math.min(s + 1, steps.length))
//                     }
//                     style={{
//                       backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
//                       color: "white",
//                     }}
//                     disabled={loading}>
//                     Continue
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </Card>

//       {/* Form */}
//       {loading ? (
//         <FormSkeleton />
//       ) : (
//         <Card className="p-6 space-y-6">
//           {/* show top validation summary */}
//           {Object.keys(errors).length > 0 && (
//             <div className="p-4 rounded-lg bg-red-50 border border-red-200">
//               <div className="flex items-center gap-2 text-red-700">
//                 <AlertCircle className="w-4 h-4" />
//                 <Text size="sm" weight="medium">
//                   Fix the highlighted fields to continue.
//                 </Text>
//               </div>
//             </div>
//           )}

//           {/* step content */}
//           {currentStep === 1 && (
//             <PersonalInfoStep
//               formData={formData}
//               setFormData={setFormData}
//               errors={errors}
//             />
//           )}
//           {currentStep === 2 && (
//             <LoanTypeStep
//               products={products}
//               formData={formData}
//               setFormData={setFormData}
//               errors={errors}
//             />
//           )}
//           {currentStep === 3 && (
//             <CompareLoansStep
//               products={products}
//               formData={formData}
//               setFormData={setFormData}
//             />
//           )}
//           {currentStep === 4 && (
//             <FinancialInfoStep
//               formData={formData}
//               setFormData={setFormData}
//               errors={errors}
//             />
//           )}
//           {currentStep === 5 && (
//             <KycVerificationStep
//               formData={formData}
//               setFormData={setFormData}
//               errors={errors}
//             />
//           )}
//           {currentStep === 6 && (
//             <DocumentsStep
//               formData={formData}
//               setFormData={setFormData}
//               errors={errors}
//               addFile={addFile}
//               setLastDocType={setLastDocType}
//               removeFile={removeFile}
//             />
//           )}
//           {currentStep === 7 && <ReviewSubmitStep formData={formData} />}

//           {/* actions */}
//           <div className="flex justify-between pt-6 border-t border-base-200">
//             <Button
//               variant="outline"
//               onClick={goBack}
//               disabled={currentStep === 1}>
//               Back
//             </Button>

//             {currentStep < steps.length ? (
//               <Button onClick={goNext}>Next</Button>
//             ) : (
//               <Button
//                 onClick={handleSubmit}
//                 className="bg-lime-600 hover:bg-lime-700">
//                 Confirm & Submit
//               </Button>
//             )}
//           </div>
//         </Card>
//       )}
//     </div>
//   );
// }

// export function LoanApplicationForm() {
//   return (
//     <DashboardLayout>
//       <LoanApplicationContent />
//     </DashboardLayout>
//   );
// }

// export default LoanApplicationForm;




// src/pages/LoanApplicationForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@context/AuthContext";

// import your individual step components
import {
  Stepper,
  LoanTypeStep,
  PersonalInfoStep,
  FinancialInfoStep,
  KycVerificationStep,
  DocumentsStep,
  CompareLoansStep,
  ReviewSubmitStep,
} from "@features/loans/components/steps/index"; // adjust path as needed

// --- validation ---
function validateStep(step, data, final = false) {
  const errs = {};
  switch (step) {
    case 1: {
      if (!data.full_name?.trim()) errs.full_name = "Full name is required";
      if (!data.email?.trim()) errs.email = "Email is required";
      if (!data.phone?.trim()) errs.phone = "Phone is required";
      if (!data.address?.trim()) errs.address = "Address is required";
      break;
    }
    case 2: {
      if (!data.product_id) errs.product_id = "Select a loan product";
      break;
    }
    case 4: {
      if (!data.loan_amount) errs.loan_amount = "Loan amount is required";
      if (!data.tenure_months) errs.tenure_months = "Tenure is required";
      break;
    }
    case 5: {
      if (!data.pan_no) errs.pan_no = "PAN is required";
      if (!data.aadhaar_no) errs.aadhaar_no = "Aadhaar is required";
      break;
    }
    case 6: {
      if (!data.documents?.length)
        errs.documents = "Upload at least one document";
      break;
    }
    default:
      break;
  }
  if (final) {
    [
      "full_name",
      "email",
      "phone",
      "address",
      "product_id",
      "loan_amount",
      "tenure_months",
    ].forEach((k) => {
      if (!data[k]) errs[k] ??= "Required";
    });
  }
  return { valid: Object.keys(errs).length === 0, errors: errs };
}

function StepperSkeleton({ stepsCount = 7 }) {
  return (
    <div className="rounded-2xl p-3 shadow-md border border-base-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex items-start gap-6 py-2 px-1 min-w-[640px]">
          {Array.from({ length: stepsCount }).map((_, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-28 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-base-200 animate-pulse" />
              <div className="mt-2 w-full">
                <div className="h-4 bg-base-200 rounded w-20 mx-auto animate-pulse" />
                <div className="h-3 bg-base-200 rounded w-14 mt-2 mx-auto animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 px-2 relative">
        <div className="w-full h-3 rounded-full bg-base-200 overflow-hidden relative">
          <div
            className="h-full bg-base-200 animate-pulse"
            style={{ width: "40%" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-base-content/70">
          <span>
            <span className="font-semibold">—</span> completed
          </span>
          <span>Step — of {stepsCount}</span>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <Card className="p-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-base-200 rounded" />
        <div className="h-12 bg-base-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-12 bg-base-200 rounded" />
          <div className="h-12 bg-base-200 rounded" />
          <div className="h-12 bg-base-200 rounded" />
          <div className="h-12 bg-base-200 rounded" />
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-base-200">
          <div className="h-10 w-28 bg-base-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-base-200 rounded" />
            <div className="h-10 w-28 bg-base-200 rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LoanApplicationContent() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [values, setValues] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    product_id: "",
    loan_amount: "",
    tenure_months: "",
    pan_no: "",
    pan_verified: false,
    aadhaar_no: "",
    aadhaar_verified: false,
    purpose: "",
  });
  const [files, setFiles] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/loan-products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const formData = useMemo(() => {
    return {
      ...values,
      documents: files.map((f) =>
        f.file?.name ? { name: f.file.name, ...f } : f
      ),
      product:
        products.find((p) => String(p.product_id) === String(values.product_id)) ||
        null,
    };
  }, [values, files, products]);

  const setFormData = (next) => {
    if (typeof next === "function") {
      const updated = next(formData);
      setValues((prev) => ({ ...prev, ...updated }));
    } else if (next && typeof next === "object") {
      setValues((prev) => ({ ...prev, ...next }));
    }
  };

  const goNext = () => {
    const { valid, errors: e } = validateStep(currentStep, formData);
    setErrors(e);
    if (!valid) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const { valid, errors: e } = validateStep(currentStep, formData, true);
    setErrors(e);
    if (!valid) return;

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // 1. Prepare customer profile payload
    const customerProfilePayload = {
      user_id: user?.id,
      full_name: values.full_name,
      aadhaar_no: values.aadhaar_no,
      pan_no: values.pan_no,
      profession: values.profession || "", // add this field to your form if needed
      years_experience: values.years_experience ? Number(values.years_experience) : 0,
      annual_income: values.annual_income ? Number(values.annual_income) : 0,
      kyc_status: "PENDING",
      address: values.address,
    };

    console.log("customer payload", customerProfilePayload);

    // 2. Create or update customer profile
    try {
      const profileRes = await fetch("http://localhost:4000/api/loan-applications/customer-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerProfilePayload),
      });
      const profileData = await profileRes.json();
      if (!profileData.success) {
        setSubmitError(profileData.message || "Failed to create customer profile");
        setSubmitLoading(false);
        return;
      }
    } catch (err) {
      setSubmitError("Network error while creating customer profile.");
      setSubmitLoading(false);
      return;
    }

    // 3. Prepare loan application payload (as before)
    const payload = {
      user_id: user?.id,
      product_id: formData.product_id,
      loan_amount: Number(formData.loan_amount),
      tenure_months: Number(formData.tenure_months),
      application_status: "DRAFT",
      approved_amount: null,
      interest_rate_apr: formData.product?.base_interest_apr ? Number(formData.product.base_interest_apr) : null,
      processing_fee: formData.product?.processing_fee_pct ? Number(formData.product.processing_fee_pct) : null,
      risk_grade: null,
    };

    // 4. Submit loan application (as before)
    try {
      const res = await fetch("http://localhost:4000/api/loan-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        alert("Loan Application Submitted Successfully!");
      } else {
        setSubmitError(data.message || "Submission failed");
      }
    } catch (err) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const steps = useMemo(
    () => [
      { id: 1, label: "Personal Info" },
      { id: 2, label: "Loan Type" },
      { id: 3, label: "Compare Loans" },
      { id: 4, label: "Financial Info" },
      { id: 5, label: "KYC Verification" },
      { id: 6, label: "Documents" },
      { id: 7, label: "Review & Submit" },
    ],
    []
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="relative overflow-hidden p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
              Loan Application
            </h2>
            <Text variant="muted" className="mt-2 block md:max-w-xl">
              Complete the form to apply — we only need a few details to get you
              started.
            </Text>
          </div>
          <div className="w-full md:w-[48%] lg:w-[40%]">
            <div className="rounded-xl p-4 shadow-md border border-base-200 bg-white/95">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">Progress</div>
                  <div className="text-xs text-base-content/60">
                    Follow each step to complete your application
                  </div>
                </div>
                <div className="text-sm text-base-content/60">
                  Step {currentStep} of {steps.length}
                </div>
              </div>
              <div className="mt-2">
                {loading ? <StepperSkeleton stepsCount={steps.length} /> : <Stepper steps={steps} current={currentStep} onStepClick={(id) => {
                  const allowJump = id <= currentStep + 1;
                  if (!allowJump) return;
                  setCurrentStep(id);
                  setErrors({});
                }} />}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {loading ? <FormSkeleton /> : (
        <Card className="p-6 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <Text size="sm" weight="medium">
                  Fix the highlighted fields to continue.
                </Text>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
              Loan Application Submitted Successfully!
            </div>
          )}

          {currentStep === 1 && (
            <PersonalInfoStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <LoanTypeStep
              products={products}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <CompareLoansStep
              products={products}
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 4 && (
            <FinancialInfoStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          )}
          {currentStep === 5 && (
            <KycVerificationStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          )}
          {currentStep === 6 && (
            <DocumentsStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              addFile={(file) => setFiles((prev) => [...prev, file])}
              setLastDocType={(type) => { }}
              removeFile={(file) => setFiles((prev) => prev.filter((f) => f !== file))}
            />
          )}
          {currentStep === 7 && <ReviewSubmitStep formData={formData} />}

          <div className="flex justify-between pt-6 border-t border-base-200">
            <Button variant="outline" onClick={goBack} disabled={currentStep === 1 || submitLoading}>
              Back
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={goNext} disabled={submitLoading}>Next</Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-lime-600 hover:bg-lime-700"
                disabled={submitLoading}
              >
                {submitLoading ? "Submitting..." : "Confirm & Submit"}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export function LoanApplicationForm() {
  return (
    <DashboardLayout>
      <LoanApplicationContent />
    </DashboardLayout>
  );
}

export default LoanApplicationForm;