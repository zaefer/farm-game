import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

type BanTokenPayload = {
  userId: string;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.BAN_PAGE_SECRET;

  if (!secret) {
    throw new Error(
      "BAN_PAGE_SECRET is missing in .env.local"
    );
  }

  return secret;
}

function createSignature(value: string): string {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createBanToken(
  userId: string
): string {
  const payload: BanTokenPayload = {
    userId,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  const encoded = Buffer.from(
    JSON.stringify(payload),
    "utf8"
  ).toString("base64url");

  const signature = createSignature(encoded);

  return `${encoded}.${signature}`;
}

export function verifyBanToken(
  token: string
): BanTokenPayload | null {
  try {
    const [encoded, signature] =
      token.split(".");

    if (!encoded || !signature) {
      return null;
    }

    const expectedSignature =
      createSignature(encoded);

    const actualBuffer =
      Buffer.from(signature);

    const expectedBuffer =
      Buffer.from(expectedSignature);

    if (
      actualBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    if (
      !timingSafeEqual(
        actualBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(
        encoded,
        "base64url"
      ).toString("utf8")
    ) as BanTokenPayload;

    if (
      !payload.userId ||
      !payload.expiresAt
    ) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}