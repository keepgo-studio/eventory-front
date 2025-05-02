"use state"

import React, { useState } from 'react'

type ImgProps = React.ComponentPropsWithoutRef<"img"> & {
  fallback?: string;
};

export default function SmartImage({
  src,
  alt,
  className,
  fallback = "/fallback-image.png",
  ...props
}: ImgProps
) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  const imgSrc = error ? fallback : src;

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`rounded-md w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}