import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar.jsx";
import mlApi from "./lib/mlApi.jsx";

function Upload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    // Some browsers set CSV mime weirdly, so rely on file name
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(selectedFile);
    } else {
      toast.error("Only CSV files are allowed.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", localStorage.getItem("user_id") || "anonymous");

    try {
      setUploading(true);

      const { data } = await mlApi.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (!e.total) return;
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        },
      });

      if (data?.status === "success") {
        toast.success("File uploaded successfully!");
        navigate("/results");
      } else {
        toast.error(data?.message || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Upload failed.");
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
