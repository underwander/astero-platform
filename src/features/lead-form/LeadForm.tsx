"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { CountryCode } from "libphonenumber-js";
import { LoaderCircle, Send } from "lucide-react";
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { formContent } from "@/content";
import type { CountryOption } from "./countries";
import { leadSchema, type LeadValues } from "./schema";

const defaults: LeadValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  telegram: "",
  country: "",
  message: "",
  consent: false,
  website: "",
};

const LeadSuccessMotion = lazy(() => import("./LeadSuccessMotion"));

type PhoneTools = typeof import("libphonenumber-js");

function formatPhone(value: string, country?: string, phoneTools?: PhoneTools) {
  const sanitized = value
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "")
    .slice(0, 18);
  if (!sanitized) return "";
  if (!phoneTools) return sanitized;

  try {
    const internationalValue =
      country && !sanitized.startsWith("+")
        ? `+${phoneTools.getCountryCallingCode(country as CountryCode)}${sanitized}`
        : sanitized;
    return new phoneTools.AsYouType(country ? (country as CountryCode) : undefined).input(internationalValue);
  } catch {
    return sanitized;
  }
}

export function LeadForm() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const started = useRef(false);
  const phoneTools = useRef<PhoneTools | null>(null);
  const countriesLoading = useRef<Promise<void> | null>(null);
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadValues>({ resolver: zodResolver(leadSchema), defaultValues: defaults, mode: "onBlur" });
  const selectedCountry = watch("country");

  const loadInputTools = useCallback(() => {
    void import("libphonenumber-js").then((module) => {
      phoneTools.current = module;
    });

    if (!countriesLoading.current) {
      countriesLoading.current = import("./countries").then(({ getCountryOptions }) => {
        setCountries(getCountryOptions("ru"));
      });
    }
  }, []);

  const start = () => {
    if (started.current) return;
    started.current = true;
    loadInputTools();
    window.dispatchEvent(new CustomEvent("analytics-event", { detail: { name: "form_start" } }));
  };

  const submit = async (values: LeadValues) => {
    setSubmitError(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || formContent.errors.submit);
      setSent(true);
      window.dispatchEvent(
        new CustomEvent("analytics-event", { detail: { name: "form_submit", country: values.country } }),
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : formContent.errors.submit);
    }
  };

  if (sent) {
    return (
      <Suspense
        fallback={
          <div role="status" aria-live="polite" className="lead-form-panel p-8 text-center text-white sm:p-10">
            {formContent.successTitle}
          </div>
        }
      >
        <LeadSuccessMotion />
      </Suspense>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      onFocus={start}
      onPointerDownCapture={loadInputTools}
      noValidate
      className="lead-form-panel p-5 sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={formContent.fields.firstName} error={errors.firstName?.message} id="lead-first-name">
          <input
            id="lead-first-name"
            autoComplete="given-name"
            className="form-control"
            aria-required="true"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "lead-first-name-error" : undefined}
            {...register("firstName")}
          />
        </Field>
        <Field label={formContent.fields.lastName} error={errors.lastName?.message} id="lead-last-name">
          <input
            id="lead-last-name"
            autoComplete="family-name"
            className="form-control"
            aria-required="true"
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lead-last-name-error" : undefined}
            {...register("lastName")}
          />
        </Field>
        <Field label={formContent.fields.email} error={errors.email?.message} id="lead-email">
          <input
            id="lead-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="form-control"
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "lead-email-error" : undefined}
            {...register("email")}
          />
        </Field>
        <Field label={formContent.fields.country} error={errors.country?.message} id="lead-country">
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="lead-country"
                autoComplete="country"
                className="form-control"
                aria-required="true"
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? "lead-country-error" : undefined}
                onFocus={loadInputTools}
                onChange={(event) => {
                  const country = event.target.value as CountryCode;
                  field.onChange(country);
                  if (!getValues("phone").trim() && country) {
                    const callingCode = countries.find((option) => option.code === country)?.callingCode;
                    if (callingCode) setValue("phone", `+${callingCode} `, { shouldValidate: false });
                  }
                }}
              >
                <option value="">{formContent.countryPlaceholder}</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label} (+{country.callingCode})
                  </option>
                ))}
              </select>
            )}
          />
        </Field>
        <Field label={formContent.fields.phone} error={errors.phone?.message} id="lead-phone">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="lead-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+380 00 000 00 00"
                className="form-control"
                aria-required="true"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "lead-phone-error" : "lead-phone-hint"}
                onFocus={loadInputTools}
                onChange={(event) =>
                  field.onChange(formatPhone(event.target.value, selectedCountry, phoneTools.current || undefined))
                }
              />
            )}
          />
          {!errors.phone ? (
            <p id="lead-phone-hint" className="mt-2 text-xs leading-5 text-white/55">
              {formContent.phoneHint}
            </p>
          ) : null}
        </Field>
        <Field
          label={`${formContent.fields.telegram} — ${formContent.telegramOptional}`}
          error={errors.telegram?.message}
          id="lead-telegram"
        >
          <input
            id="lead-telegram"
            inputMode="text"
            autoComplete="off"
            placeholder="@username"
            className="form-control"
            aria-invalid={Boolean(errors.telegram)}
            aria-describedby={errors.telegram ? "lead-telegram-error" : undefined}
            {...register("telegram")}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label={formContent.fields.message} error={errors.message?.message} id="lead-message">
          <textarea
            id="lead-message"
            rows={4}
            className="form-control resize-y"
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "lead-message-error" : "lead-message-hint"}
            {...register("message")}
          />
        </Field>
        <p id="lead-message-hint" className="mt-2 text-xs leading-5 text-white/60">
          {formContent.privacy}
        </p>
      </div>

      <div className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="lead-website">{formContent.fields.website}</label>
        <input id="lead-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="mt-4">
        <label className="flex items-start gap-3 text-sm leading-6 text-white/68">
          <input
            type="checkbox"
            className="border-gold-500/50 mt-1 size-4 shrink-0 rounded border bg-transparent accent-[#c8a467]"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "lead-consent-error" : undefined}
            {...register("consent")}
          />
          <span>
            {formContent.fields.consent}{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className="text-gold-300 underline underline-offset-4">
              {formContent.privacyLink}
            </a>
          </span>
        </label>
        {errors.consent ? (
          <p id="lead-consent-error" role="alert" className="mt-2 text-xs text-red-300">
            {errors.consent.message}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-300/25 bg-red-300/10 p-4 text-sm text-red-100">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="from-gold-300 via-gold-500 to-gold-600 text-ink-950 mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-br px-6 py-3 text-sm font-bold shadow-lg transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        ) : (
          <Send aria-hidden="true" size={18} />
        )}
        {isSubmitting ? formContent.submitting : formContent.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  id,
  children,
}: {
  label: string;
  error?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold tracking-[.02em] text-white/72">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
