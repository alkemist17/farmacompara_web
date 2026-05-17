"use client";

import { useRef, useEffect, useState } from "react";
import React from "react";

const SPEED = 0.5; // px por frame (~30px/seg a 60fps)

export default function CarruselSlider({ children }: { children: React.ReactNode }) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const pausedRef   = useRef(false);
  const dragging    = useRef(false);
  const hasDragged  = useRef(false);
  const startX      = useRef(0);
  const scrollStart = useRef(0);
  const [grabbing, setGrabbing] = useState(false);

  // Duplica los items para que el loop sea continuo sin salto visible
  const items = React.Children.toArray(children);
  const duplicated = [
    ...items,
    ...items.map((child, i) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { key: `dup-${i}` })
        : child
    ),
  ];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const tick = () => {
      if (!pausedRef.current && !dragging.current) {
        el.scrollLeft += SPEED;
        // Cuando llega a la mitad (segunda copia) vuelve al inicio sin salto
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current  = true;
    hasDragged.current = false;
    setGrabbing(true);
    startX.current      = e.clientX;
    scrollStart.current = trackRef.current?.scrollLeft ?? 0;
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !trackRef.current) return;
    const delta = Math.abs(e.clientX - startX.current);
    if (delta > 5) hasDragged.current = true;
    trackRef.current.scrollLeft = scrollStart.current + (startX.current - e.clientX);
  };

  const stopDrag = () => {
    dragging.current = false;
    setGrabbing(false);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
    }
  };

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true;  }}
      onMouseLeave={() => { pausedRef.current = false; stopDrag(); }}
      onClickCapture={onClickCapture}
    >
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scrollbar-none select-none"
        style={{ cursor: grabbing ? "grabbing" : "grab", scrollBehavior: "auto" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
      >
        {duplicated}
      </div>
    </div>
  );
}
