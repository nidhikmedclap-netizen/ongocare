"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/auth";

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export default function TransactionalEmailEditor({
  category,
  templateId,
  title,
  description,
}) {
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [placeholders, setPlaceholders] = useState([]);
  const [preview, setPreview] = useState(null);
  const [source, setSource] = useState("code");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTemplate = useCallback(
    async (withPreview = false) => {
      setError("");
      setLoading(true);
      try {
        const url = `/api/emails/templates/${category}/${templateId}${
          withPreview ? "?preview=1" : ""
        }`;
        const res = await fetch(url, {
          headers: await authHeaders(),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load template");
        }
        setSubject(data.template?.subject || "");
        setEmailBody(data.template?.body || "");
        setPlaceholders(data.placeholders || []);
        setSource(data.template?.source || "code");
        if (withPreview) {
          setPreview(data.preview || null);
        }
      } catch (err) {
        setError(err?.message || "Failed to load template");
      } finally {
        setLoading(false);
      }
    },
    [category, templateId],
  );

  useEffect(() => {
    void loadTemplate(true);
  }, [loadTemplate]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(
        `/api/emails/templates/${category}/${templateId}`,
        {
          method: "PUT",
          headers: await authHeaders(),
          credentials: "include",
          body: JSON.stringify({ subject, body: emailBody }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save template");
      }
      setSuccess("Template saved.");
      setSource("firestore");
      await loadTemplate(true);
    } catch (err) {
      setError(err?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshPreview = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/emails/templates/${category}/${templateId}?preview=1`,
        { headers: await authHeaders(), credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to refresh preview");
      }
      setPreview(data.preview || null);
      setSubject(data.template?.subject || subject);
      setEmailBody(data.template?.body || emailBody);
    } catch (err) {
      setError(err?.message || "Failed to refresh preview");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-muted-foreground">
        Loading template…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {description} Source:{" "}
          <span className="font-medium">
            {source === "firestore" ? "saved dashboard template" : "code defaults"}
          </span>
        </p>
      </div>

      {placeholders.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="mb-2 font-medium text-foreground">Placeholders</div>
          <div className="flex flex-wrap gap-2">
            {placeholders.map((token) => (
              <code
                key={token}
                className="rounded bg-white px-2 py-1 text-xs"
              >
                {token}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold">Email subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mb-5 w-full rounded-md border px-3 py-2"
        />

        <label className="mb-2 block text-sm font-semibold">Email body</label>
        <textarea
          rows={14}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          className="w-full rounded-md border px-3 py-2 font-mono text-sm"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
          <button
            type="button"
            onClick={handleRefreshPreview}
            disabled={saving}
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Refresh preview
          </button>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 text-sm text-green-700" role="status">
            {success}
          </div>
        )}
      </div>

      {preview && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Preview (sample data)</h2>
          <div className="mb-4 text-sm text-muted-foreground">
            Subject:{" "}
            <span className="font-medium text-foreground">{preview.subject}</span>
          </div>
          <div
            className="overflow-hidden rounded-md border"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        </div>
      )}
    </div>
  );
}
