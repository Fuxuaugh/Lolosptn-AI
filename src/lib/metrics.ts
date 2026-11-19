/**
 * Helper client-side untuk mengirim event metrik anonim ke `POST /api/metric`.
 * Fire-and-forget: tidak pernah melempar error atau memblokir interaksi pengguna.
 */

import type { MetricEvent } from "@/config/app.config";

export function trackMetric(event: MetricEvent): void {
  try {
    void fetch("/api/metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {
      // Metrik bersifat best-effort, abaikan galat jaringan
    });
  } catch {
    // Abaikan jika environment tidak mendukung fetch
  }
}
