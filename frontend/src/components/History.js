import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/docs/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (err) {
        console.error("History fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Query History
              </h1>
              <p className="text-gray-600 mt-2">
                All your past questions and AI answers
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-2"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="bg-gray-100 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
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
              </div>
              <p className="text-2xl font-semibold">No questions asked yet</p>
              <p className="mt-2">Start chatting with your documents!</p>
              <Link
                to="/chat"
                className="mt-6 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition"
              >
                Ask Your First Question
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 hover:shadow-xl transition"
                >
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                          Q
                        </span>
                        <h3 className="font-bold text-xl text-indigo-800 break-words">
                          {item.question}
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full ml-4 flex-shrink-0">
                      {new Date(
                        item.createdAt || item.timestamp
                      ).toLocaleString()}
                    </span>
                  </div>

                  {/* Answer Section */}
                  <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                        A
                      </span>
                      <p className="text-gray-800 leading-relaxed flex-1">
                        {item.answer}
                      </p>
                    </div>
                  </div>

                  {/* UPDATED: Sources Section - Only Show Actually Used Documents */}
                  {item.references && item.references.length > 0 && (
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="font-semibold text-indigo-700 mb-4 flex items-center gap-2">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Sources Used:
                      </p>
                      <div className="space-y-3">
                        {item.references.map((ref, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200"
                          >
                            {/* Document Name */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <strong className="text-sm text-indigo-700 break-words">
                                📄 {ref.docName}
                              </strong>
                            </div>

                            {/* Excerpt from Document */}
                            <div className="ml-8 bg-white p-3 rounded border-l-4 border-indigo-400">
                              <p className="text-xs text-gray-700 italic leading-relaxed">
                                "{ref.excerpt}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
