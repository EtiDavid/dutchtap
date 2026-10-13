"use client";

import { useEffect } from "react";

const RELOADED_KEY = "dutchtap:sw-reloaded";

/**
 * Registers the offline service worker after load; never blocks first paint.
 *
 * Returning visitors may be served one page by the previous worker (which cached pages first). When the new worker takes over, the
 * page reloads once to show the current version. Sessions are saved as you go, so nothing is lost by that reload. The worker is
 * also asked to check for an update whenever the app becomes visible again, so a deployment reaches people who keep the app open.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const hadController = !!navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (!hadController) return; // the very first install: nothing stale to replace
      try { if (sessionStorage.getItem(RELOADED_KEY)) return; sessionStorage.setItem(RELOADED_KEY, "1"); } catch { /* reload anyway */ }
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((r) => { registration = r; }).catch(() => {
        // Offline support is a progressive enhancement; failing silently is fine.
      });
    };
    const checkForUpdate = () => { if (document.visibilityState === "visible") void registration?.update().catch(() => {}); };
    document.addEventListener("visibilitychange", checkForUpdate);
    if (document.readyState === "complete") register(); else window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", checkForUpdate);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
