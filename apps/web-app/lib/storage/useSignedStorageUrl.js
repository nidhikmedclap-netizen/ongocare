"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import { userErrorMessage } from "@/lib/ui/userErrorMessage";

/** Fetch a short-lived signed URL for a storage path the user may access. */
export function useSignedStorageUrl(path) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!path) {
      setUrl("");
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");
        const res = await fetch(
          `/api/storage/signed-url?path=${encodeURIComponent(path)}`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) {
          throw new Error(userErrorMessage(data, "load"));
        }
        setUrl(data.url || "");
      } catch (err) {
        if (!cancelled) {
          setUrl("");
          setError(userErrorMessage(err, "load"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { url, loading, error };
}
