import { Response } from "express";

const COOKIE_NAME = "authToken";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

export function setCookieToken(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearCookieToken(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}
