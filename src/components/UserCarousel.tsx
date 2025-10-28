import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { DEFAULT_AVATAR_URL } from "../constants/config";

import "swiper/swiper-bundle.css";
import Avatar from "./Avatar";

export type UserCarouselItem = {
  email: string;
  username: string;
  avatarUrl: string | null;
  onClick: () => void;
};

interface UserCarouselProps {
  users: UserCarouselItem[];
  activeUserEmail?: string | null;
}

export default function UserCarousel({
  users,
  activeUserEmail,
}: UserCarouselProps) {
  return (
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={24}
      slidesPerView={4}
      centeredSlides
      breakpoints={{
        640: { slidesPerView: 4 },
        480: { slidesPerView: 2 },
        0: { slidesPerView: 1 },
      }}
      className="user-carousel"
      style={{ padding: "0 32px" }}
    >
      {users.map((user, idx) => {
        const isActive = user.email === activeUserEmail;
        return (
          <SwiperSlide key={user.username + idx}>
            <div
              className={`group relative flex min-h-[150px] min-w-[140px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:bg-sky-50 hover:shadow-xl ${
                isActive
                  ? "border-transparent bg-gradient-to-br from-sky-100 via-indigo-100 to-purple-100 shadow-[0_20px_50px_-18px_rgba(80,140,255,0.4)]"
                  : ""
              }`}
              onClick={() => {
                try {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } catch {
                  window.scrollTo(0, 0);
                }
                user.onClick();
              }}
            >
              <Avatar
                src={user.avatarUrl || undefined}
                fallback={DEFAULT_AVATAR_URL}
                alt={user.username}
                className={`h-16 w-16 rounded-full border-2 border-white object-cover shadow-lg transition-transform duration-300 ${
                  isActive ? "scale-105" : "group-hover:scale-105"
                }`}
              />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {user.username}
              </span>
              <span className="text-xs text-slate-500">{user.email}</span>
              {isActive && (
                <span className="absolute -top-1 -right-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 shadow">
                  ⭐
                </span>
              )}
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
