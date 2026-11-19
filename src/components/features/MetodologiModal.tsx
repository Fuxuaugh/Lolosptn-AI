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
      footer={<Button onClick={onClose}>{copy.common.close}</Button>}
    >
      <div className="space-y-4 leading-relaxed">
        <p className="text-fg-muted">{copy.metodologi.intro}</p>
        <div className="space-y-3">
          {copy.metodologi.sections.map((section) => (
            <div key={section.heading} className="space-y-1">
              <h3 className="text-sm font-semibold text-fg">
                {section.heading}
              </h3>
              <p className="text-sm text-fg-muted">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
