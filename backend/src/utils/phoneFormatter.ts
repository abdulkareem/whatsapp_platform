const digitsOnly = (value: string): string => value.replace(/[^0-9]/g, '');

export const normalizePhone = (mobile: string, countryCode?: string): string => {
  const normalizedMobile = digitsOnly(mobile);
  const normalizedCountryCode = countryCode ? digitsOnly(countryCode) : '';
  const hasExplicitInternationalPrefix = mobile.trim().startsWith('+');

  if (!normalizedCountryCode || hasExplicitInternationalPrefix) {
    return normalizedMobile;
  }

  if (normalizedMobile.startsWith(normalizedCountryCode)) {
    return normalizedMobile;
  }

  return `${normalizedCountryCode}${normalizedMobile.replace(/^0+/, '')}`;
};
