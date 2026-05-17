"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Completa la barra cuando la ruta cambia
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // Inicia la barra al hacer clic en cualquier enlace interno
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("/") || href.startsWith(location.origin)) {
        NProgress.start();
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
