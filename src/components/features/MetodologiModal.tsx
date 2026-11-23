"use client";

import { copy } from "@/config/copy";
import { Button, Modal } from "@/components/ui";

export interface MetodologiModalProps {
  open: boolean;
  onClose: () => void;
}

export function MetodologiModal({ open, onClose }: MetodologiModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.metodologi.title}
      footer={
        <Button onClick={onClose} className="w-full sm:w-auto">
          {copy.common.close}
        </Button>
      }
    >
      <div className="space-y-4 leading-relaxed">
        <p className="text-sm font-medium text-fg-muted">
          {copy.metodologi.intro}
        </p>
        <div className="space-y-2.5">
          {copy.metodologi.sections.map((section) => (
            <section
              key={section.heading}
              className="space-y-1 rounded-control border-2 border-line bg-surface-warm p-3.5"
            >
              <h3 className="font-display text-sm font-bold text-fg">
                {section.heading}
              </h3>
              <p className="text-sm leading-relaxed text-fg-muted">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
