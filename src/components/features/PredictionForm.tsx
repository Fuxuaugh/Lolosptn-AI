"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  APP_CONFIG,
  type Akreditasi,
  type Jalur,
  type PrestasiLevel,
} from "@/config/app.config";
import { copy } from "@/config/copy";
import {
  findProdiByKode,
  getProdiByJalur,
  getPtnList,
  type ProdiIndexItem,
} from "@/lib/dataset";
import {
  calculateSnbtUserScore,
  type SnbpProfileInput,
  type SnbtScoreInput,
} from "@/lib/prediction";
import {
  Button,
  Callout,
  Card,
  Input,
  Select,
  Tabs,
  cn,
  focusRing,
  type SelectOption,
  type TabOption,
} from "@/components/ui";

export type PredictionFormPayload =
  | {
      jalur: "snbt";
      pilihan1: ProdiIndexItem;
      pilihan2: ProdiIndexItem | null;
      snbtInput: SnbtScoreInput;
    }
  | {
      jalur: "snbp";
      pilihan1: ProdiIndexItem;
      pilihan2: ProdiIndexItem | null;
      snbpProfile: Omit<SnbpProfileInput, "hasAlumni">;
      pilihan1HasAlumni: boolean;
      pilihan2HasAlumni: boolean;
    };

export interface PredictionFormProps {
  onSubmit: (payload: PredictionFormPayload) => void;
  onReset?: () => void;
}

type SnbtInputMode = "subtests" | "average";
type EligibilityAnswer = "" | "yes" | "no";

interface FormErrors {
  ptn1?: string;
  prodi1?: string;
  prodi2?: string;
  snbtAverage?: string;
  snbtSubtests?: Record<number, string>;
  eligibility?: string;
  rapor?: string;
  mapel?: string;
}

const JALUR_TABS: readonly TabOption<Jalur>[] = [
  { value: "snbp", label: copy.form.jalur.snbp },
  { value: "snbt", label: copy.form.jalur.snbt },
];

const SNBT_MODE_TABS: readonly TabOption<SnbtInputMode>[] = [
  { value: "average", label: copy.form.snbt.modeAverage },
  { value: "subtests", label: copy.form.snbt.modeSubtests },
];

const AKREDITASI_OPTIONS: readonly TabOption<Akreditasi>[] = [
  { value: "A", label: copy.form.snbp.akreditasi.A },
  { value: "B", label: copy.form.snbp.akreditasi.B },
  { value: "C", label: copy.form.snbp.akreditasi.C },
];

const PRESTASI_OPTIONS: readonly SelectOption[] = [
  { value: "tidak_ada", label: copy.form.snbp.prestasi.tidak_ada },
  { value: "kabupaten", label: copy.form.snbp.prestasi.kabupaten },
  { value: "provinsi", label: copy.form.snbp.prestasi.provinsi },
  { value: "nasional", label: copy.form.snbp.prestasi.nasional },
];

const ALUMNI_OPTIONS: readonly TabOption<"ada" | "tidak">[] = [
  { value: "ada", label: copy.form.snbp.alumni.ada },
  { value: "tidak", label: copy.form.snbp.alumni.tidakAda },
];

const INITIAL_SUBTESTS = Array.from(
  { length: APP_CONFIG.inputBounds.snbt.subtestCount },
  () => ""
);

function parseNumberInRange(
  raw: string,
  min: number,
  max: number
): { value: number | null; error?: string } {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) {
    return { value: null, error: copy.form.validation.required };
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: copy.form.validation.notNumber };
  }
  if (parsed < min || parsed > max) {
    return { value: null, error: copy.form.validation.range(min, max) };
  }
  return { value: parsed };
}

export function PredictionForm({ onSubmit, onReset }: PredictionFormProps) {
  const [jalur, setJalur] = useState<Jalur>("snbt");

  // Pilihan 1 & 2
  const [ptn1, setPtn1] = useState<string>("");
  const [prodi1, setProdi1] = useState<string>("");
  const [ptn2, setPtn2] = useState<string>("");
  const [prodi2, setProdi2] = useState<string>("");

  // SNBT state
  const [snbtMode, setSnbtMode] = useState<SnbtInputMode>("average");
  const [snbtAverage, setSnbtAverage] = useState<string>("");
  const [snbtSubtests, setSnbtSubtests] = useState<string[]>(INITIAL_SUBTESTS);

  // SNBP state
  const [eligibility, setEligibility] = useState<EligibilityAnswer>("");
  const [rapor, setRapor] = useState<string>("");
  const [mapel, setMapel] = useState<string>("");
  const [akreditasi, setAkreditasi] = useState<Akreditasi>("A");
  const [prestasi, setPrestasi] = useState<PrestasiLevel>("tidak_ada");
  const [alumni1, setAlumni1] = useState<"ada" | "tidak">("tidak");
  const [alumni2, setAlumni2] = useState<"ada" | "tidak">("tidak");

  const [errors, setErrors] = useState<FormErrors>({});

  const ptnOptions: readonly SelectOption[] = useMemo(
    () =>
      getPtnList(jalur).map((p) => ({
        value: String(p.id_ptn),
        label: p.nama_ptn,
      })),
    [jalur]
  );

  const prodi1Options: readonly SelectOption[] = useMemo(() => {
    if (!ptn1) return [];
    return getProdiByJalur(jalur, Number(ptn1)).map((p) => ({
      value: p.kode_prodi,
      label: `${p.nama} (${p.jenjang})`,
      description: p.rumpun,
    }));
  }, [jalur, ptn1]);

  const prodi2Options: readonly SelectOption[] = useMemo(() => {
    if (!ptn2) return [];
    return getProdiByJalur(jalur, Number(ptn2)).map((p) => ({
      value: p.kode_prodi,
      label: `${p.nama} (${p.jenjang})`,
      description: p.rumpun,
    }));
  }, [jalur, ptn2]);

  const subtestAveragePreview = useMemo(() => {
    const { min, max } = APP_CONFIG.inputBounds.snbt;
    const nums: number[] = [];
    for (const raw of snbtSubtests) {
      const check = parseNumberInRange(raw, min, max);
      if (check.value === null) return null;
      nums.push(check.value);
    }
    return calculateSnbtUserScore({ mode: "subtests", subtests: nums });
  }, [snbtSubtests]);

  function handleJalurChange(nextJalur: Jalur) {
    setJalur(nextJalur);
    setErrors({});

    if (prodi1) {
      const item1 = findProdiByKode(prodi1);
      if (!item1 || !item1[nextJalur].tersedia) {
        setProdi1("");
      }
    }
    if (prodi2) {
      const item2 = findProdiByKode(prodi2);
      if (!item2 || !item2[nextJalur].tersedia) {
        setProdi2("");
      }
    }
  }

  function handleReset() {
    setPtn1("");
    setProdi1("");
    setPtn2("");
    setProdi2("");
    setSnbtAverage("");
    setSnbtSubtests(INITIAL_SUBTESTS);
    setEligibility("");
    setRapor("");
    setMapel("");
    setAkreditasi("A");
    setPrestasi("tidak_ada");
    setAlumni1("tidak");
    setAlumni2("tidak");
    setErrors({});
    onReset?.();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextErrors: FormErrors = {};

    // Validasi Pilihan 1
    if (!ptn1) {
      nextErrors.ptn1 = copy.form.validation.selectPtn;
    }
    const item1 = prodi1 ? findProdiByKode(prodi1) : undefined;
    if (!item1 || !item1[jalur].tersedia) {
      nextErrors.prodi1 = copy.form.validation.selectProdi;
    }

    // Validasi Pilihan 2 (opsional)
    let item2: ProdiIndexItem | null = null;
    if (ptn2 && !prodi2) {
      nextErrors.prodi2 = copy.form.validation.selectProdi;
    } else if (prodi2) {
      const found2 = findProdiByKode(prodi2);
      if (!found2 || !found2[jalur].tersedia) {
        nextErrors.prodi2 = copy.form.validation.selectProdi;
      } else if (item1 && found2.kode_prodi === item1.kode_prodi) {
        nextErrors.prodi2 = copy.form.validation.sameProdi;
      } else {
        item2 = found2;
      }
    }

    if (jalur === "snbt") {
      const { min, max } = APP_CONFIG.inputBounds.snbt;

      if (snbtMode === "average") {
        const res = parseNumberInRange(snbtAverage, min, max);
        if (res.error) nextErrors.snbtAverage = res.error;

        if (Object.keys(nextErrors).length > 0 || !item1 || res.value === null) {
          setErrors(nextErrors);
          return;
        }

        setErrors({});
        onSubmit({
          jalur: "snbt",
          pilihan1: item1,
          pilihan2: item2,
          snbtInput: { mode: "average", averageScore: res.value },
        });
        return;
      }

      const subErrors: Record<number, string> = {};
      const parsedSubtests: number[] = [];

      snbtSubtests.forEach((raw, idx) => {
        const res = parseNumberInRange(raw, min, max);
        if (res.error || res.value === null) {
          subErrors[idx] = res.error ?? copy.form.validation.required;
        } else {
          parsedSubtests.push(res.value);
        }
      });

      if (Object.keys(subErrors).length > 0) {
        nextErrors.snbtSubtests = subErrors;
      }

      if (Object.keys(nextErrors).length > 0 || !item1) {
        setErrors(nextErrors);
        return;
      }

      setErrors({});
      onSubmit({
        jalur: "snbt",
        pilihan1: item1,
        pilihan2: item2,
        snbtInput: { mode: "subtests", subtests: parsedSubtests },
      });
      return;
    }

    // Validasi SNBP
    if (!eligibility) {
      nextErrors.eligibility = copy.form.validation.eligibilityRequired;
    }

    const { min, max } = APP_CONFIG.inputBounds.snbp;
    const raporRes = parseNumberInRange(rapor, min, max);
    if (raporRes.error) nextErrors.rapor = raporRes.error;

    const mapelRes = parseNumberInRange(mapel, min, max);
    if (mapelRes.error) nextErrors.mapel = mapelRes.error;

    if (
      Object.keys(nextErrors).length > 0 ||
      !item1 ||
      raporRes.value === null ||
      mapelRes.value === null
    ) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit({
      jalur: "snbp",
      pilihan1: item1,
      pilihan2: item2,
      snbpProfile: {
        raporAverage: raporRes.value,
        mapelPendukungAverage: mapelRes.value,
        akreditasi,
        prestasi,
      },
      pilihan1HasAlumni: alumni1 === "ada",
      pilihan2HasAlumni: alumni2 === "ada",
    });
  }

  return (
    <Card title={copy.form.title}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Tab switcher SNBP / SNBT */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold tracking-wide text-fg uppercase">
            {copy.form.jalurLabel}
          </p>
          <Tabs
            options={JALUR_TABS}
            value={jalur}
            onChange={handleJalurChange}
            ariaLabel={copy.form.jalurLabel}
          />
        </div>

        {/* Cek eligibilitas SNBP */}
        {jalur === "snbp" && (
          <div className="space-y-2.5 rounded-control border-2 border-line bg-surface-warm p-3.5">
            <p className="text-sm font-bold text-fg">
              {copy.form.snbp.eligibility.question}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={eligibility === "yes"}
                onClick={() => {
                  setEligibility("yes");
                  setErrors((prev) => ({ ...prev, eligibility: undefined }));
                }}
                className={cn(
                  "min-h-11 rounded-control border-2 border-line px-3 text-sm font-bold transition-all motion-reduce:transition-none",
                  focusRing,
                  eligibility === "yes"
                    ? "bg-brand text-brand-fg shadow-pill"
                    : "bg-surface text-fg hover:bg-surface-muted"
                )}
              >
                {copy.form.snbp.eligibility.yes}
              </button>
              <button
                type="button"
                aria-pressed={eligibility === "no"}
                onClick={() => {
                  setEligibility("no");
                  setErrors((prev) => ({ ...prev, eligibility: undefined }));
                }}
                className={cn(
                  "min-h-11 rounded-control border-2 border-line px-3 text-sm font-bold transition-all motion-reduce:transition-none",
                  focusRing,
                  eligibility === "no"
                    ? "bg-brand text-brand-fg shadow-pill"
                    : "bg-surface text-fg hover:bg-surface-muted"
                )}
              >
                {copy.form.snbp.eligibility.no}
              </button>
            </div>
            {errors.eligibility && (
              <p role="alert" className="text-xs font-bold text-danger">
                {errors.eligibility}
              </p>
            )}
            {eligibility === "no" && (
              <Callout
                tone="warning"
                title={copy.form.snbp.eligibility.warningTitle}
              >
                <p>{copy.form.snbp.eligibility.warningBody}</p>
                <a
                  href={copy.form.snbp.eligibility.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "mt-2 inline-flex min-h-11 items-center font-bold underline",
                    focusRing
                  )}
                >
                  {copy.form.snbp.eligibility.officialLinkLabel}
                </a>
              </Callout>
            )}
          </div>
        )}

        {/* Pilihan 1 (wajib) */}
        <fieldset className="space-y-3 rounded-control border-2 border-line bg-surface-warm p-3.5">
          <legend className="rounded-md border-2 border-line bg-surface px-2 py-0.5 font-display text-xs font-bold tracking-wide text-brand uppercase">
            {copy.form.pilihan1} ({copy.common.required})
          </legend>
          <Select
            label={copy.form.ptnLabel}
            options={ptnOptions}
            value={ptn1}
            onChange={(val) => {
              setPtn1(val);
              setProdi1("");
              setErrors((prev) => ({
                ...prev,
                ptn1: undefined,
                prodi1: undefined,
              }));
            }}
            placeholder={copy.form.ptnPlaceholder}
            searchPlaceholder={copy.form.ptnSearch}
            error={errors.ptn1}
            required
          />
          <Select
            label={copy.form.prodiLabel}
            options={prodi1Options}
            value={prodi1}
            onChange={(val) => {
              setProdi1(val);
              setErrors((prev) => ({ ...prev, prodi1: undefined }));
            }}
            placeholder={copy.form.prodiPlaceholder}
            searchPlaceholder={copy.form.prodiSearch}
            helperText={!ptn1 ? copy.form.prodiDisabledHint : undefined}
            error={errors.prodi1}
            disabled={!ptn1}
            required
          />

          {jalur === "snbp" && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold tracking-wide text-fg uppercase">
                {copy.form.snbp.alumniLabel(copy.form.pilihan1)}
              </p>
              <Tabs
                options={ALUMNI_OPTIONS}
                value={alumni1}
                onChange={setAlumni1}
                ariaLabel={copy.form.snbp.alumniLabel(copy.form.pilihan1)}
              />
              <p className="text-xs font-medium text-fg-muted">
                {copy.form.snbp.alumniHelper}
              </p>
            </div>
          )}
        </fieldset>

        {/* Pilihan 2 (opsional) */}
        <fieldset className="space-y-3 rounded-control border-2 border-line bg-surface-warm p-3.5">
          <legend className="rounded-md border-2 border-line bg-surface px-2 py-0.5 font-display text-xs font-bold tracking-wide text-fg-muted uppercase">
            {copy.form.pilihan2} ({copy.common.optional})
          </legend>
          <p className="text-xs font-medium text-fg-muted">
            {copy.form.pilihan2OptionalHint}
          </p>
          <Select
            label={copy.form.ptnLabel}
            options={ptnOptions}
            value={ptn2}
            onChange={(val) => {
              setPtn2(val);
              setProdi2("");
              setErrors((prev) => ({ ...prev, prodi2: undefined }));
            }}
            placeholder={copy.form.ptnPlaceholder}
            searchPlaceholder={copy.form.ptnSearch}
            clearable
          />
          <Select
            label={copy.form.prodiLabel}
            options={prodi2Options}
            value={prodi2}
            onChange={(val) => {
              setProdi2(val);
              setErrors((prev) => ({ ...prev, prodi2: undefined }));
            }}
            placeholder={copy.form.prodiPlaceholder}
            searchPlaceholder={copy.form.prodiSearch}
            helperText={!ptn2 ? copy.form.prodiDisabledHint : undefined}
            error={errors.prodi2}
            disabled={!ptn2}
            clearable
          />

          {jalur === "snbp" && ptn2 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold tracking-wide text-fg uppercase">
                {copy.form.snbp.alumniLabel(copy.form.pilihan2)}
              </p>
              <Tabs
                options={ALUMNI_OPTIONS}
                value={alumni2}
                onChange={setAlumni2}
                ariaLabel={copy.form.snbp.alumniLabel(copy.form.pilihan2)}
              />
            </div>
          )}
        </fieldset>

        {/* Input Nilai SNBT */}
        {jalur === "snbt" ? (
          <div className="space-y-3.5">
            <p className="font-display text-sm font-bold tracking-wide text-fg uppercase">
              {copy.form.snbt.sectionTitle}
            </p>
            <Tabs
              options={SNBT_MODE_TABS}
              value={snbtMode}
              onChange={(mode) => {
                setSnbtMode(mode);
                setErrors((prev) => ({
                  ...prev,
                  snbtAverage: undefined,
                  snbtSubtests: undefined,
                }));
              }}
              ariaLabel={copy.form.snbt.sectionTitle}
            />

            {snbtMode === "average" ? (
              <Input
                label={copy.form.snbt.averageLabel}
                type="number"
                inputMode="decimal"
                step="0.1"
                min={APP_CONFIG.inputBounds.snbt.min}
                max={APP_CONFIG.inputBounds.snbt.max}
                placeholder="618"
                value={snbtAverage}
                onChange={(e) => {
                  setSnbtAverage(e.target.value);
                  setErrors((prev) => ({ ...prev, snbtAverage: undefined }));
                }}
                helperText={copy.form.snbt.averageHelper}
                error={errors.snbtAverage}
                className="font-display text-xl font-bold"
                required
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-fg-muted">
                  {copy.form.snbt.subtestsHelper}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {copy.form.snbt.subtests.map((subtestLabel, idx) => (
                    <Input
                      key={subtestLabel}
                      label={subtestLabel}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min={APP_CONFIG.inputBounds.snbt.min}
                      max={APP_CONFIG.inputBounds.snbt.max}
                      value={snbtSubtests[idx]}
                      onChange={(e) => {
                        const next = [...snbtSubtests];
                        next[idx] = e.target.value;
                        setSnbtSubtests(next);
                        if (errors.snbtSubtests?.[idx]) {
                          const nextSubErr = { ...errors.snbtSubtests };
                          delete nextSubErr[idx];
                          setErrors((prev) => ({
                            ...prev,
                            snbtSubtests: nextSubErr,
                          }));
                        }
                      }}
                      error={errors.snbtSubtests?.[idx]}
                      required
                    />
                  ))}
                </div>
                {subtestAveragePreview !== null && (
                  <p className="rounded-control border-2 border-line bg-ai-header px-3.5 py-2.5 font-display text-sm font-bold text-fg">
                    {copy.form.snbt.averagePreview(
                      String(subtestAveragePreview)
                    )}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs font-medium text-fg-muted">
              {copy.form.snbt.switchSnbpHint}
            </p>
          </div>
        ) : (
          /* Input Nilai SNBP */
          <div className="space-y-3.5">
            <p className="font-display text-sm font-bold tracking-wide text-fg uppercase">
              {copy.form.snbp.sectionTitle}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={copy.form.snbp.raporLabel}
                type="number"
                inputMode="decimal"
                step="0.01"
                min={APP_CONFIG.inputBounds.snbp.min}
                max={APP_CONFIG.inputBounds.snbp.max}
                placeholder="89.5"
                value={rapor}
                onChange={(e) => {
                  setRapor(e.target.value);
                  setErrors((prev) => ({ ...prev, rapor: undefined }));
                }}
                helperText={copy.form.snbp.raporHelper}
                error={errors.rapor}
                required
              />
              <Input
                label={copy.form.snbp.mapelLabel}
                type="number"
                inputMode="decimal"
                step="0.01"
                min={APP_CONFIG.inputBounds.snbp.min}
                max={APP_CONFIG.inputBounds.snbp.max}
                placeholder="90"
                value={mapel}
                onChange={(e) => {
                  setMapel(e.target.value);
                  setErrors((prev) => ({ ...prev, mapel: undefined }));
                }}
                helperText={copy.form.snbp.mapelHelper}
                error={errors.mapel}
                required
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-wide text-fg uppercase">
                {copy.form.snbp.akreditasiLabel}
              </p>
              <Tabs
                options={AKREDITASI_OPTIONS}
                value={akreditasi}
                onChange={setAkreditasi}
                ariaLabel={copy.form.snbp.akreditasiLabel}
              />
            </div>

            <Select
              label={copy.form.snbp.prestasiLabel}
              options={PRESTASI_OPTIONS}
              value={prestasi}
              onChange={(val) => setPrestasi(val as PrestasiLevel)}
            />
          </div>
        )}

        {/* Aksi Submit & Reset */}
        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
          <Button type="submit" size="lg" fullWidth>
            {copy.form.submit}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleReset}
            className="sm:w-auto"
          >
            {copy.form.reset}
          </Button>
        </div>
      </form>
    </Card>
  );
}
