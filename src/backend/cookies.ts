import { sign, verify } from "hono/jwt";
import type { SignatureAlgorithm } from "hono/utils/jwt/jwa";
import type { CookieOptions } from "hono/utils/cookie";
import { env } from "./env";
import { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

const JWT_SECRET = env.JWT_SECRET;
const SIG_ALGORITHM: SignatureAlgorithm = "HS256"
const TOKEN_LIFE = 1 * 60 * 60 // hr * min * sec (in seconds)

type TokenPayload = {
  sub: number, // subject
  iat: number, // issued at
  exp: number, // expiration
}

export const tokenOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV == "production",
  sameSite: "Lax",
  path: "/",
  maxAge: TOKEN_LIFE,
}

export function setToken(c: Context, token: string) {
  setCookie(c, "AUTH_TOKEN", token, tokenOptions);
}

export async function getToken(c: Context) {
  return getCookie(c, "AUTH_TOKEN")
}

export async function deleteToken(c: Context) {
  return deleteCookie(c, "AUTH_TOKEN");
}

export async function generateToken(userId: number) {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: userId, // subject
    iat: now, // issued at
    exp: now + TOKEN_LIFE // expiration
  };
  return await sign(payload, JWT_SECRET, SIG_ALGORITHM);
}

export async function getPayloadFromToken(token: string) {
  try {
    const payload = await verify(token, JWT_SECRET, SIG_ALGORITHM) as TokenPayload;
    return payload;
  } catch (error) {
    console.error(error);
    return;
  }
}

export async function getUserIdFromToken(token: string) {
  const payload = await getPayloadFromToken(token);
  return payload?.sub;
}
