import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Header = () => {
  const { userData } = useContext(AppContext);
  return (
    <div className="flex flex-col items-center mt-8 px-4 text-center text-grey-800">
      <img
        src={assets.header_img}
        alt=""
        className="w-36 h-36 rounded-full mb-6"
      />
      <h1 className="flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2">
        Hello! {userData ? userData.name : "User"}!
        <img className="w-8 aspect-square" src={assets.hand_wave} />
      </h1>
      <h2 className="text-3xl sm:text-5xl font-semibold mb-4">
        Welcome to Churn Predictions!!!
      </h2>
      <p className="mb-8 max-w-md">
        This tool was trained on a regional dataset. Results may be more
        accurate for banks with customer behavior similar to that of Botswana.
        For other regions, predictions may vary. The tool also does not predict
        when a customer will churn — only if they are at risk.
      </p>
    </div>
  );
};

export default Header;
