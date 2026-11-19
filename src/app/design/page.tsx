import { notFound } from "next/navigation";
import { DesignGallery } from "./DesignGallery";

export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DesignGallery />;
}
