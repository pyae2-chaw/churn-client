import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar.jsx";
import mlApi from "../lib/mlApi.js";

const MAX_SIZE_MB = 15;

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isCsv = f.name.toLowerCase().endsWith(".csv");
    const okSize = f.size <= MAX_SIZE_MB * 1024 * 1024;
    if (!isCsv) return toast.error("Only CSV files are allowed.");
    if (!okSize) return toast.error(`File too large. Max ${MAX_SIZE_MB} MB.`);
    setFile(f);
  };

  // For dev convenience: call /auth/login once to set cookie.
  // In production, you'd normally already have a cookie from your real login flow.
  const ensureSession = async () => {
    try {
      if (import.meta.env.DEV) {
        await mlApi.post("/auth/login");
      }
      return true;
    } catch {
      toast.error("Could not establish session.");
      return false;
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    if (!(await ensureSession())) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      setUploading(true);
      setProgress(0);

      const { data } = await mlApi.post(`/predict`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false, // critical for cookies
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      if (data?.success) {
        toast.success("File uploaded successfully!");
        navigate("/results");
      } else {
        toast.error(data?.error || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Upload failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-28 px-4 sm:px-16 bg-gradient-to-br from-gray-200 to-pink-100 text-gray-800 text-center">
        <h1 className="text-3xl font-bold text-rose-400 mb-6">
          📤 Upload Your CSV File
        </h1>

        <div
          className="border-2 border-dashed border-rose-300 rounded-2xl p-10 bg-white/90 shadow-xl cursor-pointer max-w-2xl mx-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-gray-600 mb-4">
            Drag & drop your CSV here or click to select
          </p>

          {file && (
            <div className="flex flex-col items-center gap-2">
              <p className="font-medium text-gray-800">{file.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-sm text-rose-500 hover:underline"
              >
                ❌ Delete File
              </button>
            </div>
          )}

          <input
            type="file"
            accept=".csv,text/csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {uploading && (
          <div className="mt-6">
            <p className="mb-2">Uploading... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-rose-400 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`mt-8 px-8 py-2.5 rounded-full font-semibold shadow-md transition duration-200 ${
            !file || uploading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-gradient-to-r from-rose-200 to-rose-400 text-gray-800 hover:brightness-110"
          }`}
        >
          {uploading ? "Uploading..." : "Submit File"}
        </button>

        <div className="mt-6">
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-rose-200 to-rose-400 hover:brightness-110 text-gray-800 px-6 py-2 rounded-full font-semibold shadow-md transition duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    </>
  );
}

export default Upload;
