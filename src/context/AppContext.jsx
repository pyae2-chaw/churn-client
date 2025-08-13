import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../lib/api";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  axios.defaults.withCredentials = false;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const mlApiUrl = import.meta.env.VITE_ML_API_URL;

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(false);

  const getAuthState = async () => {
    try {
      const { data } = await api.get("/api/auth/is-auth");
      if (data.success) {
        setIsLoggedin(true);
        getUserData();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getUserData = async () => {
    try {
      const { data } = await api.get("/api/user/data");
      data.success ? setUserData(data.userData) : toast.error(data.message);
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
