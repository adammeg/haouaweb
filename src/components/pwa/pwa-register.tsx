"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let reloading = false;
    const onControllerChange = () => {
      if (reloading || sessionStorage.getItem("hawae-sw-v3-reloaded")) return;
      reloading = true;
      sessionStorage.setItem("hawae-sw-v3-reloaded", "1");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        /* optional offline support */
      });
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);
  return null;
}
