"use client";
import React, { useEffect, useRef, useState } from "react";

type RevealProps = React.PropsWithChildren<{
  className?: string;
  as?: React.ElementType;
  delayMs?: number;
  variant?: "up" | "down" | "left" | "right";
}>;

export default function Reveal({ children, className = "", as = "div", delayMs = 0, variant = "up" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current as Element | null;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs) {
              const t = setTimeout(() => setVisible(true), delayMs);
              return () => clearTimeout(t);
            }
            setVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  const Comp: any = as;
  return (
    <Comp
      ref={ref}
  className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
  data-variant={variant}
    >
      {children}
    </Comp>
  );
}
