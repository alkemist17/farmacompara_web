"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Heart, Bell, LogOut } from "lucide-react";

interface Props {
  name: string;
  email: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function UserMenu({ name, email, open, onToggle, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const displayName = name || email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg border transition-all text-sm font-medium ${
          open
            ? "border-primary-400 bg-primary-50 text-primary-700 shadow-sm"
            : "border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
        }`}
      >
        {/* Avatar con iniciales */}
        <span className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-white">
          {initials}
        </span>
        <span className="hidden lg:block max-w-[120px] truncate">{displayName}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
          {/* Info del usuario */}
          <div className="px-4 py-2.5 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>

          {/* Acciones */}
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-4 h-4 text-red-400" />
            Favoritos y alertas
          </Link>

          <div className="border-t border-gray-50 my-1" />

          <button
            onClick={() => { onClose(); signOut({ callbackUrl: "/" }); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
