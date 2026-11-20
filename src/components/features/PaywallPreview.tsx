"use client";

import { APP_CONFIG } from "@/config/app.config";
import { copy } from "@/config/copy";
import { Button, Card } from "@/components/ui";

export interface PaywallPreviewProps {
  onUnlockClick: () => void;
}

/**
 * Kartu paywall terkunci (F4) dengan blurred overlay.
 * Isi F5 dan F6 tidak pernah ada di klien sebelum kode akses tervalidasi di server.
 */
export function PaywallPreview({ onUnlockClick }: PaywallPreviewProps) {
  const unlockLabel = APP_CONFIG.paywall.isBetaMode
    ? copy.paywall.beta.unlockButton
    : copy.paywall.unlockButton;

  return (
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
          <Button variant="primary" size="lg" onClick={onUnlockClick}>
            {unlockLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
