import { useContext, useState, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { DEFAULT_AVATAR_URL } from "../constants/config";

export const Account = () => {
  const { user } = useContext(AuthContext);

  const [avatar, setAvatar] = useState(user?.avatarUrl || DEFAULT_AVATAR_URL);
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [subscription, setSubscription] = useState<string>("Free");
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setAvatar(url);
    }
  };

  const handleSave = () => {
    setEditing(false);
  };

  return (
    <div className="mt-5 min-h-screen flex flex-col items-center bg-gradient-to-b from-[#f3f6fb] via-[#e7eaf7] to-[#e3c6e6] py-10">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-3xl font-bold text-[#1a144b] mb-6">
          Account Settings
        </h2>
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src={avatar}
              alt="avatar"
              className="w-28 h-28 rounded-full object-cover border-4 border-lime-400 shadow mb-2"
            />
            {editing && (
              <button
                className="absolute bottom-2 right-2 bg-lime-400 text-white rounded-full p-2 shadow hover:bg-lime-500"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z"
                  />
                </svg>
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
          </div>
          {editing ? (
            <input
              className="mt-2 text-xl font-bold text-center border-b border-gray-300 focus:outline-none focus:border-lime-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          ) : (
            <div className="mt-2 text-xl font-bold text-center">{username}</div>
          )}
        </div>
        <div className="w-full mb-6">
          <label className="block text-gray-700 font-semibold mb-1">Bio</label>
          {editing ? (
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-lime-400"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          ) : (
            <div className="text-gray-600">{bio}</div>
          )}
        </div>
        <div className="w-full mb-8">
          <label className="block text-gray-700 font-semibold mb-1">
            Subscription
          </label>
          <div className="flex items-center gap-4">
            <span className="text-lime-600 font-bold">{subscription}</span>
            {editing && (
              <select
                className="border border-gray-300 rounded-lg p-1 focus:outline-none focus:border-lime-400"
                value={subscription || "Free"}
                onChange={(e) => setSubscription(e.target.value)}
              >
                <option value="Free">Free</option>
                <option value="Premium">Premium</option>
              </select>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          {editing ? (
            <>
              <button
                className="px-6 py-2 rounded-full bg-lime-400 text-white font-bold shadow hover:bg-lime-500 transition"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-bold shadow hover:bg-gray-300 transition"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="px-6 py-2 rounded-full bg-lime-400 text-white font-bold shadow hover:bg-lime-500 transition"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
