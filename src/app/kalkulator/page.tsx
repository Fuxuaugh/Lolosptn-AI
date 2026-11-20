import type { Metadata } from "next";
import { HomeCalculator } from "@/components/features";
import { copy } from "@/config/copy";

export const metadata: Metadata = {
  title: copy.meta.kalkulatorTitle,
  description: copy.meta.kalkulatorDescription,
};

export default function KalkulatorPage() {
  return <HomeCalculator />;
}
