"use client";

import { useState } from "react";
import { copy } from "@/config/copy";
import { Button, Card, Modal } from "@/components/ui";

/**
 * Placeholder paywall terkunci untuk M4 (F4/F5/F6 akan dihubungkan di M5–M6).
 * Tidak ada data F5/F6 nyata di klien sebelum kode akses valid di server.
 */
export function PaywallPreview() {
  const [noticeOpen, setNoticeOpen] = useState(false);

  return (
    <>
      <Card
        title={copy.paywall.lockedTitle}
        description={copy.paywall.lockedBody}
      >
        <div className="relative overflow-hidden rounded-control border border-line bg-surface-muted p-4">
          {/* Kerangka placeholder diburamkan (tanpa data asli) */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none space-y-3 blur-sm"
          >
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-fg-muted">
                {copy.paywall.alternativesTitle}
              </p>
              <div className="h-10 rounded-control bg-surface" />
              <div className="h-10 rounded-control bg-surface" />
              <div className="h-10 rounded-control bg-surface" />
            </div>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold text-fg-muted">
                {copy.paywall.aiTitle}
              </p>
              <div className="h-16 rounded-control bg-surface" />
            </div>
          </div>

          {/* Overlay tombol pembuka */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/65 p-4 text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setNoticeOpen(true)}
            >
              {copy.paywall.unlockButton}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        title={copy.paywall.previewNoticeTitle}
        footer={
          <Button onClick={() => setNoticeOpen(false)}>
            {copy.common.close}
          </Button>
        }
      >
        <p className="leading-relaxed text-fg-muted">
          {copy.paywall.previewNoticeBody}
        </p>
      </Modal>
    </>
  );
}
