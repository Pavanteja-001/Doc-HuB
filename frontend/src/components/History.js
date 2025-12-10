// frontend/src/components/History.js
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
              Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-2xl">No questions asked yet</p>
              <p className="mt-4">Start chatting with your documents!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 hover:shadow-xl transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-indigo-800">
                      Q: {item.question}
                    </h3>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-5 mb-4">
                    <p className="text-gray-800 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>

                  {item.references && item.references.length > 0 && (
                    <div>
                      <p className="font-semibold text-indigo-700 mb-2">
                        Referenced Documents:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {item.references.map((ref, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium"
                          >
                            {ref.docName}
                          </span>
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
