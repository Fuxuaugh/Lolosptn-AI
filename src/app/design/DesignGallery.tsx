"use client";

import { useState } from "react";
import { copy } from "@/config/copy";
import {
  Badge,
  Button,
  Callout,
  Card,
  Input,
  Modal,
  Select,
  Skeleton,
  Tabs,
  type SelectOption,
  type TabOption,
} from "@/components/ui";

const SAMPLE_TABS: readonly TabOption[] = [
  { value: "tab-a", label: copy.form.jalur.snbt },
  { value: "tab-b", label: copy.form.jalur.snbp },
];

const SAMPLE_SELECT_OPTIONS: readonly SelectOption[] = [
  { value: "385", label: 'UPN "VETERAN" JAWA TIMUR', description: "Kota Surabaya" },
  { value: "382", label: "INSTITUT TEKNOLOGI SEPULUH NOPEMBER", description: "Kota Surabaya" },
  { value: "381", label: "UNIVERSITAS AIRLANGGA", description: "Kota Surabaya" },
  { value: "372", label: "UNIVERSITAS BRAWIJAYA", description: "Kota Malang" },
  { value: "373", label: "UNIVERSITAS NEGERI MALANG", description: "Kota Malang" },
  { value: "383", label: "UNIVERSITAS NEGERI SURABAYA", description: "Kota Surabaya" },
  { value: "371", label: "UNIVERSITAS JEMBER", description: "Kabupaten Jember" },
];

export function DesignGallery() {
  const [activeTab, setActiveTab] = useState<string>(SAMPLE_TABS[0].value);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [sampleInput, setSampleInput] = useState<string>("600");
  const [modalOpen, setModalOpen] = useState(false);

  const activeTabLabel =
    SAMPLE_TABS.find((t) => t.value === activeTab)?.label ?? "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-section px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-fg">{copy.design.title}</h1>
        <p className="text-sm text-fg-muted">{copy.design.subtitle}</p>
      </header>

      <Card title={copy.design.sections.badges}>
        <div className="flex flex-wrap gap-2">
          <Badge status="safe" showEnglish />
          <Badge status="target" showEnglish />
          <Badge status="reach" showEnglish />
        </div>
      </Card>

      <Card title={copy.design.sections.buttons}>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">{copy.design.buttonPrimary}</Button>
          <Button variant="secondary">{copy.design.buttonSecondary}</Button>
          <Button variant="ghost">{copy.design.buttonGhost}</Button>
          <Button disabled>{copy.design.buttonDisabled}</Button>
          <Button isLoading>{copy.design.buttonLoading}</Button>
        </div>
      </Card>

      <Card title={copy.design.sections.callouts}>
        <div className="flex flex-col gap-3">
          <Callout tone="warning" title={copy.disclaimer.title}>
            <p>{copy.disclaimer.body}</p>
            <p className="mt-2">
              <strong>{copy.disclaimer.privacyTitle}:</strong>{" "}
              {copy.disclaimer.privacy}
            </p>
          </Callout>
          <Callout tone="info" title={copy.design.infoCalloutTitle}>
            {copy.design.infoCalloutBody}
          </Callout>
        </div>
      </Card>

      <Card title={copy.design.sections.cards}>
        <div className="flex flex-col gap-3">
          <Card
            as="article"
            variant="elevated"
            title={copy.design.cardTitle}
            description={copy.design.cardBody}
            actions={<Badge status="safe" size="sm" />}
          >
            <p className="text-sm text-fg-muted">{copy.status.safe.description}</p>
          </Card>
          <Card
            as="article"
            variant="flat"
            title={copy.design.cardTitle}
            description={copy.design.cardBody}
          />
        </div>
      </Card>

      <Card title={copy.design.sections.tabs}>
        <div className="space-y-3">
          <Tabs
            options={SAMPLE_TABS}
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel={copy.form.jalurLabel}
          />
          <p className="text-sm text-fg-muted">
            {copy.design.tabsPanel(activeTabLabel)}
          </p>
        </div>
      </Card>

      <Card title={copy.design.sections.select}>
        <div className="space-y-2">
          <Select
            label={copy.form.ptnLabel}
            options={SAMPLE_SELECT_OPTIONS}
            value={selectedValue}
            onChange={setSelectedValue}
            placeholder={copy.form.ptnPlaceholder}
            searchPlaceholder={copy.form.ptnSearch}
            clearable
          />
          <p className="text-xs text-fg-muted">
            {selectedValue
              ? copy.design.selectedValue(selectedValue)
              : copy.design.nothingSelected}
          </p>
        </div>
      </Card>

      <Card title={copy.design.sections.inputs}>
        <div className="flex flex-col gap-4">
          <Input
            label={copy.design.inputSampleLabel}
            type="number"
            inputMode="decimal"
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            helperText={copy.form.snbt.averageHelper}
            required
          />
          <Input
            label={copy.design.inputErrorLabel}
            type="number"
            defaultValue="1500"
            error={copy.form.validation.range(200, 1000)}
          />
        </div>
      </Card>

      <Card title={copy.design.sections.modal}>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          {copy.design.openModal}
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={copy.metodologi.title}
          footer={
            <Button onClick={() => setModalOpen(false)}>
              {copy.common.close}
            </Button>
          }
        >
          <p>{copy.design.modalBody}</p>
        </Modal>
      </Card>

      <Card title={copy.design.sections.skeleton}>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-11 w-full" rounded="control" />
        </div>
      </Card>
    </main>
  );
}
