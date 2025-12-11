import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const Dashboard = () => {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const fetchDocs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/docs/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");

      await API.post("/docs/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000,
      });
      setFile(null);
      fetchDocs();
    } catch (err) {
      alert("Upload failed! Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the document: "${docName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/docs/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`Document "${docName}" deleted successfully.`);
      fetchDocs(); // Refresh the document list
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/*  HEADER: APP NAME & LOGOUT BUTTON  */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {/* Application Name */}
              DOC HUB
            </div>
            <span className="text-sm text-gray-500">DocIntel AI</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
      {/*  END HEADER */}

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Upload Zone */}
        <div
          className={`relative bg-white rounded-2xl shadow-xl border-2 border-dashed p-10 mb-10 text-center transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50 shadow-2xl"
              : "border-gray-300 hover:border-indigo-400"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* ... Upload UI elements ... */}
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Drop your documents here
          </h3>
          <p className="text-gray-600 mb-6">PDF and TXT files supported</p>

          <label className="cursor-pointer">
            <span className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition transform hover:-translate-y-1">
              Choose File
            </span>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) =>
                e.target.files?.[0] && setFile(e.target.files[0])
              }
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
              <p className="text-green-800 font-medium">
                Selected: {file.name}
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`mt-6 px-10 py-4 rounded-xl font-bold text-white transition ${
              file && !uploading
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {uploading ? "Uploading & Processing..." : "Upload Document"}
          </button>
        </div>

        {/* Documents Grid */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Your Documents
          </h2>
          {docs.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow">
              <p className="text-xl">
                No documents yet. Upload your first one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs.map((doc) => (
                <div
                  key={doc._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 border border-gray-200 overflow-hidden relative"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        {doc.type?.includes("pdf") ? (
                          <svg
                            className="w-8 h-8 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-8 h-8 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          doc.status === "ready"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {doc.status || "processing"}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 truncate">
                      {doc.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : "Just now"}
                    </p>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(doc._id, doc.name)}
                    className="absolute top-2 right-2 p-1 text-red-500 bg-white rounded-full hover:bg-red-50 hover:text-red-700 transition z-10"
                    title="Delete Document"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/chat"
            className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xl py-5 px-12 rounded-2xl hover:shadow-2xl transition transform hover:scale-105"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Ask AI Anything</span>
          </Link>

          <Link
            to="/history"
            className="group flex items-center justify-center space-x-3 bg-gray-700 hover:bg-gray-800 text-white font-bold text-xl py-5 px-12 rounded-2xl transition transform hover:scale-105"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Query History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
