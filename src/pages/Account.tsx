import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { DEFAULT_AVATAR_URL } from "../constants/config";

export const Account = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#f3f6fb] via-[#e7eaf7] to-[#e3c6e6] py-10">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-3xl font-bold text-[#1a144b] mb-6">
          Account Settings
        </h2>
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src={user?.avatarUrl || DEFAULT_AVATAR_URL}
              alt="avatar"
              className="w-28 h-28 rounded-full object-cover border-4 border-lime-400 shadow mb-2"
            />
          </div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">
              Bio
            </label>
          </div>
          <div className="w-full mb-8">
            <label className="block text-gray-700 font-semibold mb-1">
              Subscription
            </label>
            <div className="flex items-center gap-4">
              <span className="text-lime-600 font-bold">
                {user?.subscription || "Free"}
              </span>
            </div>
          </div>
          <div className="flex gap-4"></div>
        </div>
      </div>
    </div>
  );
};
