import { useState } from "react";
import Skeleton from "@mui/material/Skeleton";

interface Props {
  src: string;
  alt?: string;
  className?: string; // wrapper classes (size)
  imgClassName?: string; // img-specific classes
}

export default function SkeletonImage({ src, alt, className = "", imgClassName = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={`${className} relative overflow-hidden`}> 
      {!loaded && !errored && (
        <Skeleton variant="rounded" width="100%" height="100%" />
      )}
      {!errored ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`${imgClassName} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 bg-gray-100">
          Failed to load
        </div>
      )}
    </div>
  );
}
