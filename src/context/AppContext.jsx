import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  axios.defaults.withCredentials = true;

  const rawBackend = import.meta.env.VITE_BACKEND_URL;
  const backendUrl = rawBackend && rawBackend !== '""' ? rawBackend : "";
  const rawMl = import.meta.env.VITE_ML_API_URL;
  const mlApiUrl = rawMl && rawMl !== '""' ? rawMl : "/ml";

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(false);

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth", {
        withCredentials: true,
      });
      if (data.success) {
        setIsLoggedin(true);
        getUserData(true);
      } else {
        setIsLoggedin(false);
      }
    } catch (error) {
      // Silence 401 / not logged in on first load
      if (error?.response?.status === 401) {
        setIsLoggedin(false);
      } else {
        console.warn("is-auth error:", error?.message || error);
        setIsLoggedin(false);
      }
    }
  };

  const getUserData = async (silent = false) => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/data");
      if (data.success) {
        setUserData(data.userData);
      } else {
        if (!silent) toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    backendUrl,
    mlApiUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
