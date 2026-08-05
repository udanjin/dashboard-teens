// src/lib/validators.ts
import { parsePhoneNumberWithError } from "libphonenumber-js";
import type { Rule } from "antd/es/form";

export const phoneValidator: Rule = () => ({
    validator(_, value: string) {
        if (!value) return Promise.resolve();

        try {
            let sanitized = value.replace(/[\s-]/g, '');

            // Standarisasi awalan 62 untuk Indonesia
            if (sanitized.startsWith('62')) {
                sanitized = '+' + sanitized;
            }

            const phoneNumber = parsePhoneNumberWithError(sanitized, 'ID');

            if (phoneNumber.isValid()) {
                return Promise.resolve();
            }
            return Promise.reject(new Error("Invalid phone number!"));
        } catch (error) {
            return Promise.reject(new Error("Invalid phone number!"));
        }
    },
});
