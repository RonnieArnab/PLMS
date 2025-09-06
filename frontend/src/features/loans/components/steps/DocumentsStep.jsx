import React, { useRef } from "react";

/**
 * DocumentsStep (context-integrated)
 * - Uses LoanAppContext helpers: addFile, removeFile, setLastDocType (optional)
 * - DOES NOT mutate formData.documents directly; it mirrors from context `files`
 * - Keeps validation happy for step 6 (documents length > 0)
 */
export default function DocumentsStep({
  formData,
  errors,
  addFile,
  removeFile,
  setLastDocType,
}) {
  const inputRef = useRef(null);

  const MAX_MB = 5;
  const MAX_FILES = 10;
  const accept = ["image/*", ".pdf", ".jpg", ".jpeg", ".png", ".webp"].join(
    ","
  );

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // enforce cap
    const current = formData.documents?.length || 0;
    const available = Math.max(0, MAX_FILES - current);
    if (available <= 0) {
      alert(`You can upload up to ${MAX_FILES} files.`);
      resetInput();
      return;
    }

    const toProcess = files.slice(0, available);

    for (const f of toProcess) {
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`"${f.name}" exceeds ${MAX_MB}MB limit.`);
        continue;
      }
      // Store in context (this is what step 6 validator reads via formData)
      addFile(f);
    }

    resetInput();
  };

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = ""; // keep it uncontrolled
  };

  const onChangeDocType = (idx, value) => {
    // Context only exposes setLastDocType; if the last item changed, call it.
    // (Optional) If you want per-row updates, add a setFileType(idx, type) in context.
    if (idx === (formData.documents?.length || 1) - 1) {
      setLastDocType?.(value);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Upload Required Documents (ID Proof, Income Proof, Address Proof)
      </label>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileUpload}
        />
        <span className="text-xs text-gray-500">
          Max {MAX_FILES} files, up to {MAX_MB}MB each
        </span>
      </div>

      {errors?.documents && (
        <p className="text-sm text-red-600">{errors.documents}</p>
      )}

      <ul className="space-y-2">
        {(formData.documents || []).map((doc, idx) => (
          <li
            key={`${doc.name}-${idx}`}
            className="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-gray-700 p-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {doc.name}
              </p>
              <p className="text-xs text-gray-500">
                {doc.type || "file"}
                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}
              </p>
              {doc.url && (
                <a
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer">
                  Preview
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-900"
                defaultValue={doc.document_type || "OTHER"}
                onChange={(e) => onChangeDocType(idx, e.target.value)}>
                <option value="AADHAAR">Aadhaar</option>
                <option value="PAN">PAN</option>
                <option value="ID">ID Proof</option>
                <option value="INCOME">Income Proof</option>
                <option value="ADDRESS">Address Proof</option>
                <option value="OTHER">Other</option>
              </select>

              <button
                type="button"
                className="text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50"
                onClick={() => removeFile(idx)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
