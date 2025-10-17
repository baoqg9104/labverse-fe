import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { DEFAULT_AVATAR_URL } from "../constants/config";

import "swiper/swiper-bundle.css";

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
              className={`flex flex-col items-center min-w-[120px] cursor-pointer rounded-xl p-3 transition border-2 ${
                isActive
                  ? "border-blue-400 bg-[#ffffff75]"
                  : "border-blue-100 hover:bg-[#e9e9ff"
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
              <img
                src={user.avatarUrl || DEFAULT_AVATAR_URL}
                alt={user.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-white mb-2"
              />
              <span className="font-semibold text-[#1a144b] text-sm">
                {user.username}
              </span>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
