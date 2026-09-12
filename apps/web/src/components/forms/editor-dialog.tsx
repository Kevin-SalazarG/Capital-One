"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  dirty = false,
  busy = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  dirty?: boolean;
  busy?: boolean;
  children: ReactNode;
}) {
  const [confirmClose, setConfirmClose] = useState(false);
  function changeOpen(next: boolean) {
    if (busy) return;
    if (!next && dirty) {
      setConfirmClose(true);
      return;
    }
    setConfirmClose(false);
    onOpenChange(next);
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        showCloseButton={!busy}
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {confirmClose ? (
          <div className="space-y-5">
            <p role="alert" className="text-sm">
              Tienes cambios sin guardar. ¿Quieres descartarlos?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                Seguir editando
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmClose(false);
                  onOpenChange(false);
                }}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        ) : (
          children
        )}
      </DialogContent>
    </Dialog>
  );
}
