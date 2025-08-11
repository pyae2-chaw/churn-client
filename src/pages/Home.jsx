import React, { useContext, useState } from "react";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { AppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

function Home() {
  const { isLoggedin } = useContext(AppContext);

  // Checklist state
  const checklistItems = [
    "File must be in CSV format (.csv)",
    "Maximum file size allowed: 15 MB",
    "Must contain at least 50 rows",
    "No empty rows or columns values",
    "All columns must contain valid, non-missing numeric values.",
    `Must include the following columns:\n
- Customer ID\n
- Credit Score\n
- Customer Tenure\n
- Balance\n
- NumOfProducts\n
- Outstanding Loans\n
- Income\n
- Credit History Length\n
- NumComplaints`,
  ];

  const [checked, setChecked] = useState(
    new Array(checklistItems.length).fill(false)
  );

  const handleCheck = (index) => {
    const newChecked = [...checked];
    newChecked[index] = !newChecked[index];
    setChecked(newChecked);
  };

  const allChecked = checked.every((item) => item === true);

  return (
    <div className="pt-1 min-h-screen bg-gradient-to-br from-gray-200 to-pink-100 text-gray-800">
      <Navbar />
      <Header />

      <div className="pt-8">
        <div className="max-w-7xl mx-auto bg-white/90 rounded-2xl shadow-xl px-6 sm:px-16 md:px-24 py-10 text-center">
          {/* Interactive Checklist Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-rose-400 mb-3">
              Checklist Before Upload
            </h2>
            <p className="text-gray-600 mb-4">
              Make sure your file is compatible:
            </p>
            <ul className="text-left max-w-xl mx-auto text-gray-700 space-y-3">
              {checklistItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  {isLoggedin ? (
                    <>
                      <input
                        type="checkbox"
                        checked={checked[index]}
                        onChange={() => handleCheck(index)}
                        className="mt-1 h-4 w-4 accent-pink-500 focus:ring-pink-400"
                      />
                      <span>
                        {item.split("\n").map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 mt-2 bg-gray-500 rounded-full" />
                      <span>
                        {item.split("\n").map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <p className="text-lg font-medium text-rose-400 mb-4 mt-4">
                Sample CSV
              </p>
              <img
                src={assets.sample}
                alt="Sample CSV"
                className="w-full h-auto rounded-xl shadow-lg border border-gray-300 object-contain"
              />
            </div>
          </section>

          {/* Upload & View Buttons */}
          {isLoggedin && (
            <div className="flex justify-center gap-6 mt-10">
              <Link
                to={allChecked ? "/upload" : "#"}
                onClick={(e) => {
                  if (!allChecked) e.preventDefault();
                }}
                className={`px-6 py-2.5 rounded-full font-semibold shadow-md transition duration-200 ${
                  allChecked
                    ? "bg-gradient-to-r from-rose-200 to-rose-400 text-gray-800 hover:brightness-110"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Upload CSV
              </Link>
              <Link
                to="/results"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-200 to-rose-400 text-gray-800 font-semibold shadow-md hover:brightness-110 transition duration-200"
              >
                View Results
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600 pb-10">
          <p>📧 Contact us: churnpredictor@example.com</p>
          <p>© {new Date().getFullYear()} Churn Predictor</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
