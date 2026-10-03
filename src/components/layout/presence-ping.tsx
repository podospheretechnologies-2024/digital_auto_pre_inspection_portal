"use client";

import { useEffect } from "react";

/** Laravel last-activity / last-activity-active presence ping */
export function PresencePing() {
  useEffect(() => {
    const ping = (online: boolean) => {
      void fetch("/api/v2/account/last-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online }),
        keepalive: true,
      }).catch(() => undefined);
    };

    ping(true);
    const id = window.setInterval(() => ping(true), 60_000);

    const onHide = () => {
      if (document.visibilityState === "hidden") ping(false);
      else ping(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", () => ping(false));

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      ping(false);
    };
  }, []);

  return null;
}
