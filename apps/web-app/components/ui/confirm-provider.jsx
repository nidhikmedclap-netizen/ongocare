"use client";

import { useCallback, useEffect, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { setConfirmHandler } from "@/lib/ui/notify";
import styles from "./alert-dialog.module.css";

export default function ConfirmProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(null);
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    setConfirmHandler(confirm);
    return () => setConfirmHandler(null);
  }, [confirm]);

  const finish = (result) => {
    setOpen(false);
    resolver?.(result);
    setResolver(null);
    setOptions(null);
  };

  return (
    <>
      {children}
      <AlertDialog.Root open={open} onOpenChange={(next) => !next && finish(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={styles.overlay} />
          <AlertDialog.Content className={styles.content}>
            <AlertDialog.Title className={styles.title}>
              {options?.title || "Are you sure?"}
            </AlertDialog.Title>
            {options?.description ? (
              <AlertDialog.Description className={styles.description}>
                {options.description}
              </AlertDialog.Description>
            ) : null}
            <div className={styles.actions}>
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => finish(false)}
                >
                  {options?.cancelLabel || "Cancel"}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  className={`${styles.confirmBtn} ${
                    options?.destructive ? styles.confirmBtnDestructive : ""
                  }`}
                  onClick={() => finish(true)}
                >
                  {options?.confirmLabel || "Continue"}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
