import React from "react";

export default function DocumentsStep({ formData, setFormData, errors }) {
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData({
      ...formData,
      documents: [...(formData.documents || []), ...files],
    });
  };
  const remove = (idx) => {
    const next = [...(formData.documents || [])];
    next.splice(idx, 1);
    setFormData({ ...formData, documents: next });
  };
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Upload Required Documents (ID Proof, Income Proof, Address Proof)
      </label>
      <input type="file" multiple onChange={handleFileUpload} />
      {errors.documents && (
        <p className="text-sm text-red-600">{errors.documents}</p>
      )}
      <ul className="list-disc pl-6 text-sm text-gray-600 dark:text-gray-400">
        {(formData.documents || []).map((doc, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <span>{doc.name}</span>
            <button
              className="text-red-600 text-xs"
              onClick={() => remove(idx)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
