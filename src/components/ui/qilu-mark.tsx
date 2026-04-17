import { useId } from "react";
import { cx } from "@/lib/cx";

type QiluMarkProps = {
  size?: "md" | "lg";
};

export function QiluMark({ size = "md" }: QiluMarkProps) {
  const boxClass = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const svgClass = size === "lg" ? "h-12 w-12" : "h-8 w-8";
  const uid = useId().replace(/:/g, "");
  const roadGradientId = `road-${uid}`;
  const outlineGradientId = `outline-${uid}`;
  const laneGradientId = `lane-${uid}`;

  return (
    <div className={cx("flex items-center justify-center", boxClass)} aria-hidden="true">
      <svg viewBox="0 0 48 48" className={svgClass} fill="none">
        <defs>
          <linearGradient id={roadGradientId} x1="24" y1="7.5" x2="24" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7f5ef" />
            <stop offset="1" stopColor="#dbd6ca" />
          </linearGradient>
          <linearGradient id={outlineGradientId} x1="24" y1="7.5" x2="24" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2a3430" />
            <stop offset="1" stopColor="#1a201d" />
          </linearGradient>
          <linearGradient id={laneGradientId} x1="24" y1="15" x2="24" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffd86e" />
            <stop offset="1" stopColor="#e7b83d" />
          </linearGradient>
        </defs>

        <path
          d="M13.5 41C15.8 31.2 19.3 20.9 24 7.8C28.7 20.9 32.2 31.2 34.5 41H13.5Z"
          stroke={`url(#${outlineGradientId})`}
          strokeWidth="1.2"
          strokeLinejoin="round"
          fill={`url(#${roadGradientId})`}
        />
        <path
          d="M19.6 41C20.9 32.2 22.5 23.5 24 15.2C25.5 23.5 27.1 32.2 28.4 41H19.6Z"
          className="fill-panel"
        />
        <path d="M24 17V21" stroke={`url(#${laneGradientId})`} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 24V29" stroke={`url(#${laneGradientId})`} strokeWidth="2.3" strokeLinecap="round" />
        <path d="M24 32.5V40" stroke={`url(#${laneGradientId})`} strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M11.5 41H36.5"
          className="stroke-line"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
