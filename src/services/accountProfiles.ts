import {
  ensureProfileStorageSchema,
  opaqueProfileIdForUser,
  SIGNED_OUT_PROFILE_ID,
} from "./profileStorage";

export { SIGNED_OUT_PROFILE_ID } from "./profileStorage";

export async function profileUserId(activeUserId?: string) {
  if (activeUserId) {
    return opaqueProfileIdForUser(activeUserId);
  }

  await ensureProfileStorageSchema();
  return SIGNED_OUT_PROFILE_ID;
}
