"use client";

import { useState } from "react";
import { Download, UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { BASE_URL, uploadHousingPayments } from "@/services/zazzauPayments";

export default function HousingPaymentUploadCard({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Download template
  const handleDownloadTemplate = () => {
    window.open(`${BASE_URL}/api/v1/excel/template/housing`, "_blank");
  };

  // Upload file
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an Excel file (.xlsx or .xls) first.");
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const data = await uploadHousingPayments(file);
      setMessage(data.message || `Processed ${data?.data?.totalProcessed || "all"} housing payments successfully!`);
      setFile(null);
      if (typeof onUploadSuccess === "function") {
        onUploadSuccess(data);
      }
    } catch (err) {
      setError(err?.message || "Failed to upload housing payments file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs max-w-xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upload Housing Deductions</h2>
          <p className="text-xs text-slate-500">Upload monthly housing deduction records via Excel (.xlsx)</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer w-fit"
        >
          <Download className="h-4 w-4 text-blue-600" />
          <span>Download Template</span>
        </button>
      </div>

      {message && (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 p-3.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-emerald-900">Upload Successful</p>
            <p className="text-xs text-emerald-700">{message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-3.5 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-red-900">Upload Failed</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
            isDragOver
              ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
              : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/60"
          }`}
        >
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-slate-800 text-center">
            {file ? file.name : "Click to select or drag & drop Excel file"}
          </span>
          <span className="text-xs text-slate-400 mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports .xlsx or .xls (Staff ID, Legacy Id, Full Name, Amount, Period, Command)"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing Housing Records...</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              <span>Upload Housing Records</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
