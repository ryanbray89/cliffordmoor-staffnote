import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { signOfficeToken, verifyOfficeToken } from "@/lib/office-cookie";
import { getStore } from "@/lib/store";
import type { Staff } from "@/lib/types";

export const STAFF_COOKIE = "cmf_staff";
export const OFFICE_COOKIE = "cmf_office";

const STAFF_MAX_AGE = 60 * 60 * 24 * 180;
const OFFICE_MAX_AGE = 60 * 60 * 24 * 14;

function pin(): string {
  return process.env.ADMIN_PIN ?? "";
}

export function adminConfigured(): boolean {
  return pin().trim().length >= 4;
}

export function usingStarterPin(): boolean {
  return pin() === "2468";
}

export function checkPin(input: string): boolean {
  const expected = pin();
  const given = Buffer.from(input);
  const actual = Buffer.from(expected);
  if (expected.trim().length < 4 || given.length !== actual.length) {
    timingSafeEqual(actual, actual);
    return false;
  }
  return timingSafeEqual(given, actual);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function setOfficeCookie(): Promise<void> {
  const jar = await cookies();
  const exp = Date.now() + OFFICE_MAX_AGE * 1000;
  jar.set(OFFICE_COOKIE, await signOfficeToken(pin(), exp), cookieOptions(OFFICE_MAX_AGE));
}

export async function clearOfficeCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(OFFICE_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(OFFICE_COOKIE)?.value;
  return verifyOfficeToken(pin(), raw);
}

export async function getCurrentStaff(): Promise<Staff | null> {
  const id = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!id) return null;
  const staff = await getStore().getStaff(id);
  if (!staff?.active) return null;
  return staff;
}

export async function rememberStaff(id: string): Promise<void> {
  const jar = await cookies();
  jar.set(STAFF_COOKIE, id, cookieOptions(STAFF_MAX_AGE));
}

export async function forgetStaff(): Promise<void> {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE);
}
