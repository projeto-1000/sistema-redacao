import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY_CODE = "55";

export interface PhoneCountryCodeOption {
  value: string;
  display: string;
  label: string;
  countryCodes: CountryCode[];
}

export function getPhoneCountryCodeOptions(
  locale = "pt-BR"
): PhoneCountryCodeOption[] {
  const displayNames =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([locale], { type: "region" })
      : null;

  const groupedByCallingCode = new Map<string, CountryCode[]>();

  for (const countryCode of getCountries()) {
    const callingCode = getCountryCallingCode(countryCode);
    const existingCountries = groupedByCallingCode.get(callingCode) ?? [];

    groupedByCallingCode.set(callingCode, [...existingCountries, countryCode]);
  }

  const options = Array.from(groupedByCallingCode.entries()).map(
    ([callingCode, countryCodes]) => {
      const countryNames = countryCodes
        .map((countryCode) => getCountryLabel(countryCode, displayNames))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, locale));

      return {
        value: callingCode,
        display: `+${callingCode}`,
        label: countryNames.join(" / "),
        countryCodes,
      };
    }
  );

  return options.sort((a, b) => {
    if (a.value === DEFAULT_PHONE_COUNTRY_CODE) return -1;
    if (b.value === DEFAULT_PHONE_COUNTRY_CODE) return 1;

    return a.label.localeCompare(b.label, locale);
  });
}

function getCountryLabel(
  countryCode: CountryCode,
  displayNames: Intl.DisplayNames | null
) {
  try {
    return displayNames?.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}