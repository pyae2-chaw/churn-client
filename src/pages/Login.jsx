import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

function Login() {
  const navigate = useNavigate();

  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContext);

  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      axios.defaults.withCredentials = true;

      if (state === "Sign Up") {
        const { data } = await axios.post(backendUrl + "/api/auth/register", {
          name,
          email,
          companyName,
          password,
        });

        if (data.success) {
          // ✅ Get user details and store user_id
          if (data.user?._id) {
            localStorage.setItem("user_id", data.user._id);
          }
          setIsLoggedin(true);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/auth/login", {
          email,
          password,
        });

        if (data.success) {
          // ✅ Save user_id to localStorage
          if (data.user?._id) {
            localStorage.setItem("user_id", data.user._id);
          }
          setIsLoggedin(true);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error("Login/Register Error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-gray-200 to-pink-100 relative">
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="Logo"
        className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
      />

      <div className="bg-white/90 p-10 rounded-2xl shadow-xl w-full sm:w-96 text-gray-800">
        <h2 className="text-3xl font-semibold text-rose-300 mb-3 text-center">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          {state === "Sign Up"
            ? "Create your account"
            : "Login to your account!"}
        </p>

        <form onSubmit={onSubmitHandler}>
          {state === "Sign Up" && (
            <div className="mb-4 flex items-center gap-3 w-full px-5 py-3 rounded-full bg-pink-100">
              <img
                src={assets.person_icon}
                alt=""
                className="w-5 h-5 text-gray-800"
              />
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-full"
                type="text"
                placeholder="Full Name"
                required
              />
            </div>
          )}

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-3 rounded-full bg-pink-100">
            <img
              src={assets.mail_icon}
              alt=""
              className="w-5 h-5 text-gray-800"
            />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-full"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          {state === "Sign Up" && (
            <div className="mb-4 flex items-center gap-3 w-full px-5 py-3 rounded-full bg-pink-100">
              <img
                src={assets.companyname_icon}
                alt=""
                className="w-5 h-5 text-gray-800"
              />
              <input
                onChange={(e) => setCompanyName(e.target.value)}
                value={companyName}
                className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-full"
                type="text"
                placeholder="Company Name"
                required
              />
            </div>
          )}

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-3 rounded-full bg-pink-100">
            <img
              src={assets.lock_icon}
              alt=""
              className="w-5 h-5 text-gray-800"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-full"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <p
            onClick={() => navigate("/reset-password")}
            className="mb-4 text-rose-300 cursor-pointer"
          >
            Forgot password?
          </p>

          <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-rose-200 to-rose-400 text-gray-800 font-semibold shadow-md hover:brightness-110 transition duration-200">
            {state}
          </button>

          {state === "Sign Up" ? (
            <p className="text-rose-300 text-center text-xs mt-4">
              Already have an account?{" "}
              <span
                onClick={() => setState("Login")}
                className="text-rose-400 cursor-pointer underline hover:text-rose-600 transition duration-200"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-rose-300 text-center text-xs mt-4">
              Don't have an account?{" "}
              <span
                onClick={() => setState("Sign Up")}
                className="text-rose-400 cursor-pointer underline hover:text-rose-600 transition duration-200"
              >
                Sign Up
              </span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
