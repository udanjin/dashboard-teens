// src/lib/validator.ts
import { parsePhoneNumberWithError } from "libphonenumber-js";
import type { Rule } from "antd/es/form";
import type { Dayjs } from "dayjs";

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

export const validateLogin = (username?: string, password?: string): string | null => {
    if (!username || !password) {
        return "Please enter both username and password.";
    }
    return null;
};

export interface RegistrationValidationData {
    roles: string[];
    username: string;
    dob: Dayjs | null;
    gender?: string;
    grade?: number;
    password?: string;
    confirmPassword?: string;
}

export const validateRegistration = (data: RegistrationValidationData): string | null => {
    if (!data.roles || !data.roles.length) {
        return "Please select at least one ministry role.";
    }
    if (!data.username || data.username.length < 4) {
        return "Username must be at least 4 characters long.";
    }
    if (data.username.includes(" ")) {
        return "Username cannot contain spaces.";
    }
    if (!data.dob) {
        return "Please select your date of birth.";
    }
    if (data.roles.includes("leader")) {
        if (!data.gender) {
            return "Gender is required for Leaders.";
        }
        if (!data.grade) {
            return "Grade is required for Leaders.";
        }
    }
    if (!data.password || data.password.length < 6) {
        return "Password must be at least 6 characters long.";
    }
    if (data.password !== data.confirmPassword) {
        return "Passwords do not match!";
    }
    return null;
};
