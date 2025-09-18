// import React, { useState } from "react";
// import { Button } from "@components/ui/Button";
// import { Input } from "@components/ui/Input";
// import { CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

// export default function KycVerificationStep({ formData, setFormData, errors }) {
//   const [panMsg, setPanMsg] = useState("");
//   const [aadMsg, setAadMsg] = useState("");

//   const onChange = (e) =>
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//   const verifyPAN = async () => {
//     setPanMsg("");
//     const pan = (formData.pan_no || "").toUpperCase();
//     if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
//       setPanMsg("Invalid PAN format (ABCDE1234F)");
//       setFormData({ ...formData, pan_verified: false });
//       return;
//     }
//     await new Promise((r) => setTimeout(r, 600));
//     setFormData({ ...formData, pan_no: pan, pan_verified: true });
//     setPanMsg("PAN verified successfully");
//   };

//   const verifyAadhaar = async () => {
//     setAadMsg("");
//     const a = formData.aadhaar_no || "";
//     if (!/^\d{12}$/.test(a)) {
//       setAadMsg("Enter 12-digit Aadhaar number");
//       setFormData({ ...formData, aadhaar_verified: false });
//       return;
//     }
//     await new Promise((r) => setTimeout(r, 600));
//     const ok = (formData.kyc_otp || "").length === 6;
//     setFormData({ ...formData, aadhaar_verified: ok });
//     setAadMsg(
//       ok ? "Aadhaar verified successfully" : "OTP sent (enter any 6 digits)"
//     );
//   };

//   return (
//     <div className="space-y-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="p-4 rounded-lg border dark:border-gray-700">
//           <div className="flex items-center justify-between mb-2">
//             <h4 className="font-medium">PAN Verification</h4>
//             {formData.pan_verified ? (
//               <span className="inline-flex items-center text-green-600 text-sm">
//                 <CheckCircle className="w-4 h-4 mr-1" />
//                 Verified
//               </span>
//             ) : formData.pan_no ? (
//               <span className="inline-flex items-center text-red-600 text-sm">
//                 <AlertCircle className="w-4 h-4 mr-1" />
//                 Not verified
//               </span>
//             ) : null}
//           </div>
//           <Input
//             name="pan_no"
//             label="PAN Number"
//             value={formData.pan_no}
//             onChange={onChange}
//             error={errors.pan_no}
//             placeholder="ABCDE1234F"
//           />
//           <Button size="sm" className="mt-2" onClick={verifyPAN}>
//             Verify PAN
//           </Button>
//           {panMsg && (
//             <p
//               className={`text-sm mt-2 ${
//                 panMsg.includes("Invalid") ? "text-red-600" : "text-green-600"
//               }`}>
//               {panMsg}
//             </p>
//           )}
//         </div>
//         <div className="p-4 rounded-lg border dark:border-gray-700">
//           <div className="flex items-center justify-between mb-2">
//             <h4 className="font-medium">Aadhaar e-KYC</h4>
//             {formData.aadhaar_verified ? (
//               <span className="inline-flex items-center text-green-600 text-sm">
//                 <CheckCircle className="w-4 h-4 mr-1" />
//                 Verified
//               </span>
//             ) : formData.aadhaar_no ? (
//               <span className="inline-flex items-center text-red-600 text-sm">
//                 <AlertCircle className="w-4 h-4 mr-1" />
//                 Not verified
//               </span>
//             ) : null}
//           </div>
//           <Input
//             name="aadhaar_no"
//             label="Aadhaar Number"
//             value={formData.aadhaar_no}
//             onChange={onChange}
//             error={errors.aadhaar_no}
//             placeholder="12-digit number"
//           />
//           <div className="flex gap-2 mt-2">
//             <Input
//               name="kyc_otp"
//               label="Enter 6-digit OTP (mock)"
//               value={formData.kyc_otp || ""}
//               onChange={onChange}
//             />
//             <Button size="sm" onClick={verifyAadhaar}>
//               Send/Verify OTP
//             </Button>
//           </div>
//           {aadMsg && <p className="text-sm mt-2">{aadMsg}</p>}
//         </div>
//       </div>
//     </div>
//   );
// }
