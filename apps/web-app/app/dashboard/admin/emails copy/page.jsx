"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import styles from "../../patient/dashboard.module.css";
import admin from "../admin.module.css";

export default function EmailsPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("/api/emails/templates");

        console.log("response====", response);
        if (!response.ok) {
          throw new Error("Failed to load email templates");
        }

        const json = await response.json();

        setTemplates(json.data || []);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "Failed to load email templates"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.kicker}>Emails</div>

          <h1 className={styles.pageTitle}>
            Handle Emails
          </h1>

          <p>
            Here you can see and manage all email
            templates.
          </p>
        </div>
      </header>

      {loading && (
        <div className={admin.card}>
          Loading templates...
        </div>
      )}

      {error && (
        <div className={admin.card}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className={admin.card}>
          <Accordion
            type="single"
            collapsible
            className="w-full"
          >
            {templates.map((group) => (
              <AccordionItem
                key={group.category}
                value={group.category}
              >
                <AccordionTrigger className="no-underline hover:no-underline text-gray-600">
                  {group.category}
                </AccordionTrigger>

                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {group.templates?.map((template) => (
                      <Link
                        key={template.id}
                        href={`/dashboard/admin/emails/templates/${group.category}/${template.id}`}
                        className="block rounded-md border p-3 transition-colors hover:bg-muted no-underline hover:no-underline text-gray-600"
                        style={{
                          textDecoration: "none",
                        }}
                      >
                        {template.name}
                      </Link>
                    ))}

                    {group.templates?.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No templates found
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </>
  );
}