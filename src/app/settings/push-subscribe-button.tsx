"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<
    "checking" | "unsupported" | "subscribed" | "unsubscribed"
  >(() => (isPushSupported() ? "checking" : "unsupported"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "checking") return;
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    });
  }, [status]);

  async function subscribe() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was denied.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await savePushSubscription(subscription.toJSON() as never);
      setStatus("subscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable push");
    }
  }

  async function unsubscribe() {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disable push");
    }
  }

  if (status === "checking") return null;
  if (status === "unsupported") {
    return (
      <p className="text-sm text-gray-500">
        Push notifications aren&apos;t supported in this browser. On iPhone,
        add this app to your Home Screen first (Share → Add to Home Screen),
        then try again from there.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={status === "subscribed" ? unsubscribe : subscribe}
        className="w-fit rounded bg-black px-3 py-2 text-sm text-white"
      >
        {status === "subscribed"
          ? "Disable push on this device"
          : "Enable push on this device"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
