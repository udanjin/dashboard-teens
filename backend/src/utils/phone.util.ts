import { parsePhoneNumberWithError } from "libphonenumber-js";

export function normalizePhoneNumber(phoneNumber: string, defaultCountry: any = 'ID'): string | null {
    let sanitized = phoneNumber.replace(/[\s-]/g, '');
    if (sanitized.startsWith('62') && defaultCountry === 'ID') {
        sanitized = '+' + sanitized;
    }
    try {
        const parsedNumber = parsePhoneNumberWithError(sanitized, defaultCountry);
        if (parsedNumber.isValid()) {
            return parsedNumber.format('E.164');

        }
        return null;
    } catch (error) {
        return null;
    }

}