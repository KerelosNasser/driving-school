"use client";

import React from "react";
import { ThreeDot, BlinkBlur,Atom } from "react-loading-indicators";

interface LoadingIndicatorProps {
  color?: string;
  size?: "small" | "medium" | "large";
  text?: string;
  className?: string;
  variant?: "dots" | "lines" | "bars";
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  color = "#059669", // emerald-600 from your service center
  size = "medium",
  text,
  className = "",
  variant = "dots"
}) => {
  const sizeMap = {
    small: { width: "16px", height: "16px" },
    medium: { width: "32px", height: "32px" },
    large: { width: "48px", height: "48px" },
  };

  const renderLoader = () => {
    switch (variant) {
      case "lines":
        return (
          <Atom
            color={color}
            width={sizeMap[size].width}
            visible={true}
          />
        );
      case "bars":
        return (
          <BlinkBlur
            color={color}
            size={sizeMap[size].width}
            text={text}
            textColor={color}
          />
        );
      case "dots":
      default:
        return (
          <ThreeDot
            color={color}
            size={sizeMap[size].width}
            text={text}
            textColor={color}
          />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderLoader()}
    </div>
  );
};

export { LoadingIndicator };