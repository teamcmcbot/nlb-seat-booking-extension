import {
  ensureProfileStorageSchema,
  opaqueProfileIdForUser,
  SIGNED_OUT_PROFILE_ID,
} from "./profileStorage";

export { SIGNED_OUT_PROFILE_ID } from "./profileStorage";

export function maskedAccountIdentifier(rawUserId: string) {
  const value = rawUserId.trim();
  if (value.length <= 1) {
    return "*";
  }
  if (value.length === 2) {
    return `${value[0]}*`;
  }

  return `${value[0]}${"*".repeat(value.length - 2)}${value.at(-1)}`;
}

export async function profileUserId(activeUserId?: string) {
  if (activeUserId) {
    return opaqueProfileIdForUser(activeUserId);
  }

  await ensureProfileStorageSchema();
  return SIGNED_OUT_PROFILE_ID;
}
