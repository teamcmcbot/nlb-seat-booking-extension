export const COLLECTOR_VERSION = 1;

export function validateExportProvenance(metadata, repositoryVersion) {
  if (!["catalog", "targeted-discovery"].includes(metadata?.mode)) {
    throw new Error("Catalog lacks recognized sanitized-export provenance.");
  }
  if (metadata.source === "anonymous-browser") {
    if (metadata.collectorVersion !== COLLECTOR_VERSION || metadata.anonymous !== true ||
        typeof metadata.repositoryVersion !== "string" || !metadata.repositoryVersion ||
        !/^[a-f0-9]{40}$/.test(metadata.sourceRevision ?? "") ||
        typeof metadata.sourceDirty !== "boolean") {
      throw new Error("Catalog lacks recognized anonymous collector provenance.");
    }
    if (repositoryVersion && metadata.repositoryVersion !== repositoryVersion) {
      throw new Error("Collector repository version does not match this worktree.");
    }
  } else {
    if (metadata.source !== undefined || typeof metadata.extensionVersion !== "string" || !metadata.extensionVersion ||
        (repositoryVersion && metadata.extensionVersion !== repositoryVersion)) {
      throw new Error("Catalog extension version does not match this worktree. Reload the maintenance build and export again.");
    }
  }
}
