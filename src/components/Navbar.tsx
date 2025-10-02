import React, { useContext, useRef, useEffect, useLayoutEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LanguageDropdown } from "./LanguageDropdown";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import { DEFAULT_AVATAR_URL } from "../constants/config";
import { ROLE } from "./profile/RoleUtils";

// List of main navigation links for the navbar
const navLinks = [
  { name: "Home", path: "/" },
  { name: "Learn", path: "/learn" },
  { name: "Pricing", path: "/pricing" },
  { name: "Contact", path: "/contact" },
];

// Main Navbar component
export const Navbar: React.FC = () => {
  // Get current route location
  const location = useLocation();

  // Ref for the nav container (used for animated border calculations)
  const navRef = useRef<HTMLDivElement>(null);
  // State for the animated active border's position and width
  const [activeStyle, setActiveStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);
  // Refs for each nav link (to measure their position/width)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // State for mobile menu and avatar dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const navigate = useNavigate();

  // Get user and logout from AuthContext
  const { user, logout } = useContext(AuthContext);

  // Ref for avatar dropdown (to detect outside clicks)
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setAvatarDropdown(false);
      }
    }
    if (avatarDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarDropdown]);

  // --- Animated active border logic ---
  // Update active border position/width on route change
  useLayoutEffect(() => {
    if (!navRef.current) return;
    // Find the index of the active nav link
    const idx = navLinks.findIndex((l) => l.path === location.pathname);
    if (idx === -1) {
      setActiveStyle(null);
      return;
    }
    // Get the DOM node for the active link
    const link = linkRefs.current[idx];
    if (link) {
      // Calculate position/width relative to nav container
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      setActiveStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
      });
    }
  }, [location.pathname]);

  // Recalculate active border on window resize
  useEffect(() => {
    const handleResize = () => {
      const idx = navLinks.findIndex((l) => l.path === location.pathname);
      if (idx === -1) {
        setActiveStyle(null);
        return;
      }
      const link = linkRefs.current[idx];
      if (link && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        setActiveStyle({
          left: linkRect.left - navRect.left,
          width: linkRect.width,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname]);

  // --- Render Navbar UI ---
  return (
    <header className="flex items-center justify-between pt-5 px-4 md:pr-12 md:pl-16 bg-transparent w-full relative">
      {/* Logo */}
      <div className="font-bold text-3xl md:text-4xl tracking-wide text-white">
        Labverse
      </div>

      {/* Mobile menu button (hamburger) */}
      <div className="md:hidden flex items-center">
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="text-white text-3xl focus:outline-none cursor-pointer"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Desktop navigation links with animated active border */}
      <nav
        className="hidden md:flex gap-4 md:gap-8 items-center mt-3 md:mt-0 relative"
        ref={navRef}
        style={{ minHeight: 40 }}
      >
        {/* Animated active border (slides to active tab) */}
        {activeStyle && (
          <div
            className="absolute bottom-0 h-[3px] bg-white rounded-full transition-all duration-300"
            style={{
              left: activeStyle.left,
              width: activeStyle.width,
              zIndex: 1,
            }}
          />
        )}
        {/* Render nav links and attach refs for measurement */}
        {navLinks.map((link, i) => (
          <Link
            key={link.name}
            to={link.path}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            className={
              "text-white text-[17px] font-medium pb-0.5 transition-all relative z-10" +
              (location.pathname === link.path
                ? ""
                : " opacity-80 hover:opacity-100")
            }
          >
            {link.name}
          </Link>
        ))}
      </nav>
      {/* Language dropdown and user/account buttons (desktop) */}
      <div className="hidden md:flex items-center mt-3 md:mt-0">
        <div className="mr-6 md:mr-16">
          <LanguageDropdown />
        </div>
        {/* If user is logged in, show avatar and dropdown */}
        {user ? (
          <div className="relative mr-8" ref={avatarRef}>
            {/* Avatar button toggles dropdown */}
            <button
              className="flex items-center gap-2 bg-white text-gray-900 rounded-full border-2 border-white hover:bg-gray-100 transition cursor-pointer focus:outline-none"
              onClick={() => setAvatarDropdown((v) => !v)}
            >
              <img
                src={user.avatarUrl || DEFAULT_AVATAR_URL}
                alt="avatar"
                className="size-11 rounded-full object-cover border border-gray-300"
              />
            </button>
            {/* Avatar dropdown menu */}
            {avatarDropdown && (
              <div className="text-[15px] absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                {user?.role === ROLE.ADMIN && (
                  <>
                    <div className="px-4 py-1 text-[13px] uppercase tracking-wide text-gray-400">Admin</div>
                    <Link to="/admin" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <span>Console</span>
                    </Link>
                    <Link to="/admin/users" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <span>Users</span>
                    </Link>
                    <Link to="/admin/labs" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <span>Labs</span>
                    </Link>
                    <Link to="/admin/reports" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <span>Reports</span>
                    </Link>
                    <Link to="/admin/revenue" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <span>Revenue</span>
                    </Link>
                    <div className="my-1 h-px bg-gray-100" />
                  </>
                )}
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  <span className="flex items-center">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="far"
                      data-icon="circle-user"
                      className="size-5 mr-2 text-gray-600"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M406.5 399.6C387.4 352.9 341.5 320 288 320l-64 0c-53.5 0-99.4 32.9-118.5 79.6C69.9 362.2 48 311.7 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3l64 0c38.8 0 71.2 27.6 78.5 64.3zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z"
                      ></path>
                    </svg>
                    <span>View Profile</span>
                  </span>
                </Link>
                <Link
                  to="/account"
                  className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  <span className="flex items-center">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="far"
                      data-icon="gear"
                      className="size-5 mr-2 text-gray-600"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M256 0c17 0 33.6 1.7 49.8 4.8c7.9 1.5 21.8 6.1 29.4 20.1c2 3.7 3.6 7.6 4.6 11.8l9.3 38.5C350.5 81 360.3 86.7 366 85l38-11.2c4-1.2 8.1-1.8 12.2-1.9c16.1-.5 27 9.4 32.3 15.4c22.1 25.1 39.1 54.6 49.9 86.3c2.6 7.6 5.6 21.8-2.7 35.4c-2.2 3.6-4.9 7-8 10L459 246.3c-4.2 4-4.2 15.5 0 19.5l28.7 27.3c3.1 3 5.8 6.4 8 10c8.2 13.6 5.2 27.8 2.7 35.4c-10.8 31.7-27.8 61.1-49.9 86.3c-5.3 6-16.3 15.9-32.3 15.4c-4.1-.1-8.2-.8-12.2-1.9L366 427c-5.7-1.7-15.5 4-16.9 9.8l-9.3 38.5c-1 4.2-2.6 8.2-4.6 11.8c-7.7 14-21.6 18.5-29.4 20.1C289.6 510.3 273 512 256 512s-33.6-1.7-49.8-4.8c-7.9-1.5-21.8-6.1-29.4-20.1c-2-3.7-3.6-7.6-4.6-11.8l-9.3-38.5c-1.4-5.8-11.2-11.5-16.9-9.8l-38 11.2c-4 1.2-8.1 1.8-12.2 1.9c-16.1 .5-27-9.4-32.3-15.4c-22-25.1-39.1-54.6-49.9-86.3c-2.6-7.6-5.6-21.8 2.7-35.4c2.2-3.6 4.9-7 8-10L53 265.7c4.2-4 4.2-15.5 0-19.5L24.2 218.9c-3.1-3-5.8-6.4-8-10C8 195.3 11 181.1 13.6 173.6c10.8-31.7 27.8-61.1 49.9-86.3c5.3-6 16.3-15.9 32.3-15.4c4.1 .1 8.2 .8 12.2 1.9L146 85c5.7 1.7 15.5-4 16.9-9.8l9.3-38.5c1-4.2 2.6-8.2 4.6-11.8c7.7-14 21.6-18.5 29.4-20.1C222.4 1.7 239 0 256 0zM218.1 51.4l-8.5 35.1c-7.8 32.3-45.3 53.9-77.2 44.6L97.9 120.9c-16.5 19.3-29.5 41.7-38 65.7l26.2 24.9c24 22.8 24 66.2 0 89L59.9 325.4c8.5 24 21.5 46.4 38 65.7l34.6-10.2c31.8-9.4 69.4 12.3 77.2 44.6l8.5 35.1c24.6 4.5 51.3 4.5 75.9 0l8.5-35.1c7.8-32.3 45.3-53.9 77.2-44.6l34.6 10.2c16.5-19.3 29.5-41.7 38-65.7l-26.2-24.9c-24-22.8-24-66.2 0-89l26.2-24.9c-8.5-24-21.5-46.4-38-65.7l-34.6 10.2c-31.8 9.4-69.4-12.3-77.2-44.6l-8.5-35.1c-24.6-4.5-51.3-4.5-75.9 0zM208 256a48 48 0 1 0 96 0 48 48 0 1 0 -96 0zm48 96a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"
                      ></path>
                    </svg>
                    <span>Manage Account</span>
                  </span>
                </Link>
                <button
                  className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setAvatarDropdown(false);
                    logout();
                    navigate("/login");
                  }}
                >
                  <span className="flex items-center">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="far"
                      data-icon="arrow-right-to-bracket"
                      className="size-5 mr-2 text-red-600"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M217 401L345 273c9.4-9.4 9.4-24.6 0-33.9L217 111c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l87 87L24 232c-13.3 0-24 10.7-24 24s10.7 24 24 24l246.1 0-87 87c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0zM344 80l80 0c22.1 0 40 17.9 40 40l0 272c0 22.1-17.9 40-40 40l-80 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l80 0c48.6 0 88-39.4 88-88l0-272c0-48.6-39.4-88-88-88l-80 0c-13.3 0-24 10.7-24 24s10.7 24 24 24z"
                      ></path>
                    </svg>
                    <span>Log Out</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // If not logged in, show login/signup buttons
          <>
            <Link to="/login">
              <button className="bg-transparent border-2 border-white text-white rounded-full px-4 md:px-6 py-1.5 font-medium mr-2 md:mr-4 hover:bg-white hover:text-gray-900 transition cursor-pointer">
                Log In
              </button>
            </Link>
            <Link to="/signup">
              <button className="bg-lime-400 text-gray-900 border-none rounded-full px-5 md:px-7 py-2 font-bold hover:bg-lime-300 transition cursor-pointer mr-4 md:mr-8">
                Get Started
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu (hamburger) */}
      {menuOpen && (
        <div className="absolute left-0 top-full w-full bg-[#141e30f1] shadow-lg rounded-b-xl z-50 py-6 flex flex-col items-center md:hidden">
          {/* Mobile nav links */}
          <nav className="flex flex-col items-center space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-white text-xl font-medium pb-0.5 transition-all ${
                  location.pathname === link.path
                    ? "border-b-2 border-white"
                    : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user?.role === ROLE.ADMIN && (
              <>
                <div className="text-white/70 text-sm mt-2">Admin</div>
                <Link to="/admin" className="text-white text-lg" onClick={() => setMenuOpen(false)}>Console</Link>
                <Link to="/admin/users" className="text-white text-lg" onClick={() => setMenuOpen(false)}>Users</Link>
                <Link to="/admin/labs" className="text-white text-lg" onClick={() => setMenuOpen(false)}>Labs</Link>
                <Link to="/admin/reports" className="text-white text-lg" onClick={() => setMenuOpen(false)}>Reports</Link>
                <Link to="/admin/revenue" className="text-white text-lg" onClick={() => setMenuOpen(false)}>Revenue</Link>
              </>
            )}
          </nav>
          {/* Mobile language dropdown and user/account buttons */}
          <div className="flex flex-col items-center mt-6 gap-4">
            <div className="mb-3">
              <LanguageDropdown />
            </div>
            {user ? (
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <button className="flex items-center gap-2 bg-white text-gray-900 rounded-full px-6 py-2 font-medium border-2 border-white hover:bg-gray-100 transition cursor-pointer w-40">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-lg text-gray-700">
                      {user.username?.[0] || "P"}
                    </span>
                  )}
                  <span className="ml-2">Profile</span>
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <button className="bg-transparent border-2 border-white text-white rounded-full px-6 py-2 font-medium hover:bg-white hover:text-gray-900 transition cursor-pointer w-40">
                    Log In
                  </button>
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>
                  <button className="bg-lime-400 text-gray-900 border-none rounded-full px-7 py-2 font-bold hover:bg-lime-300 transition cursor-pointer w-40">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
