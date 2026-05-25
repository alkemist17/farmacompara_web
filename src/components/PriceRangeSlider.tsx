"use client";

import { useState, useCallback } from "react";
import { formatCOP } from "@/lib/format";

interface Props {
  globalMin: number;
  globalMax: number;
  currentMin: number | null;
  currentMax: number | null;
  onRelease: (min: number | null, max: number | null) => void;
}

export default function PriceRangeSlider({
  globalMin, globalMax, currentMin, currentMax, onRelease,
}: Props) {
  const [lo, setLo] = useState(currentMin ?? globalMin);
  const [hi, setHi] = useState(currentMax ?? globalMax);

  const fillLeft  = ((lo  - globalMin) / (globalMax - globalMin)) * 100;
  const fillRight = ((hi  - globalMin) / (globalMax - globalMin)) * 100;

  const commit = useCallback(() => {
    onRelease(
      lo <= globalMin  ? null : lo,
      hi >= globalMax  ? null : hi,
    );
  }, [lo, hi, globalMin, globalMax, onRelease]);

  return (
    <div className="px-1">
      <div className="price-range-wrap">
        <div className="price-range-track">
          <div
            className="price-range-fill"
            style={{ left: `${fillLeft}%`, right: `${100 - fillRight}%` }}
          />
        </div>
        <input
          type="range"
          className="price-range-input"
          min={globalMin} max={globalMax} step={500}
          value={lo}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v <= hi) setLo(v);
          }}
          onMouseUp={commit}
          onTouchEnd={commit}
        />
        <input
          type="range"
          className="price-range-input"
          min={globalMin} max={globalMax} step={500}
          value={hi}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v >= lo) setHi(v);
          }}
          onMouseUp={commit}
          onTouchEnd={commit}
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-gray-500">
        <span>{formatCOP(lo)}</span>
        <span>{formatCOP(hi)}</span>
      </div>
    </div>
  );
}
