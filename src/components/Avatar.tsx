import React, { useState, useEffect } from "react";
import { DEFAULT_AVATAR_URL } from "../constants/config";

type AvatarProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
  alt?: string;
  size?: number | string; // optional numeric px or tailwind size classes via className
  fallback?: string;
};

export default function Avatar({ src, alt = "avatar", fallback, className = "", loading = "lazy", decoding = "async", ...rest }: AvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src ?? fallback ?? DEFAULT_AVATAR_URL);

  useEffect(() => {
    setCurrentSrc(src ?? fallback ?? DEFAULT_AVATAR_URL);
  }, [src, fallback]);

  const handleError = () => {
    if (currentSrc === (fallback ?? DEFAULT_AVATAR_URL)) return;
    setCurrentSrc(fallback ?? DEFAULT_AVATAR_URL);
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
}
