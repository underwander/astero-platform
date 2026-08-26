import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

export const countryCodes = getCountries();

export type CountryOption = {
  code: CountryCode;
  label: string;
  callingCode: string;
};

export function getCountryOptions(locale = "ru"): CountryOption[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const collator = new Intl.Collator(locale);

  return countryCodes
    .map((code) => ({
      code,
      label: names.of(code) || code,
      callingCode: getCountryCallingCode(code),
    }))
    .sort((first, second) => collator.compare(first.label, second.label));
}
