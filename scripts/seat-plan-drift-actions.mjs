function normalizeName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/\bpublic\b/g, "")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

function branchIdentity(change) {
  const entity = change.branch ?? change.area ?? {};
  return {
    branchId: String(entity.branchId ?? String(change.key).split(":")[0] ?? ""),
    branchName: entity.branchName,
  };
}

export function findOperationalContext(change, inventory = {}) {
  const identity = branchIdentity(change);
  const wantedName = normalizeName(identity.branchName);
  const branch = (inventory.branches ?? []).find((entry) => {
    if (entry.branchId && String(entry.branchId) === identity.branchId) {
      return true;
    }
    if (!wantedName) {
      return false;
    }
    return [entry.branchName, ...(entry.aliases ?? [])]
      .map(normalizeName)
      .includes(wantedName);
  });
  if (!branch) {
    return undefined;
  }
  const sourcesById = new Map(
    (inventory.sources ?? []).map((source) => [source.id, source]),
  );
  return {
    ...branch,
    sources: (branch.sourceIds ?? [])
      .map((sourceId) => sourcesById.get(sourceId))
      .filter(Boolean),
  };
}

export function actionPlanFor(change, operationalContext) {
  const contextReview = operationalContext
    ? [
        `Re-check the ${operationalContext.branchName} notice against its linked sources; the stored status is point-in-time evidence, not live API authority.`,
      ]
    : [];
  const commonCatalogChecks = [
    "Confirm the sanitized export is a complete routine GetAccountInfo catalog with recognized provenance and plausible global counts.",
    "Do not update reviewed state from an availability-scoped response, failed map lookup, or a single malformed/partial catalog.",
  ];

  switch (change.type) {
    case "branch-removed":
      return {
        title: "Investigate and resolve removed branch",
        dispositions: ["rejected", "suspended", "retired"],
        investigation: [...commonCatalogChecks, ...contextReview],
        resolution: [
          "If the disappearance is not confirmed, keep the baseline unchanged and retain drift status until a later independent audit resolves it.",
          "If the removal is accepted, reconcile definitions and retirement evidence, then update the baseline with `npm run seat-plans:capture -- --catalog <sanitized-export.json> --accept-catalog` so the next identical audit is clean.",
          `Before retiring active annotations, generate an archive proposal with \`npm run seat-plans:archive-proposal -- --report <drift.json> --branch ${change.key}\` and review the preserved areas, seats, map metadata, fingerprints, and hotspots.`,
          "For a temporary closure, suspend the definitions outside the runtime index; for a long rebuild, retire them and remove their active fingerprints, generated inventory rows, aggregate counts, and active tests.",
          "Update branch-inventory.md and the retirement ledger with the dated evidence, decision, expected reopening window, and reactivation policy.",
          "Rerun seat-plans:verify, the complete test suite, typecheck, build, and a fresh audit. Clean must mean the accepted baseline matches the raw catalog without suppression.",
        ],
      };
    case "branch-added":
      return {
        title: "Investigate and onboard added branch",
        dispositions: ["rejected", "accepted-pending-annotation", "accepted"],
        investigation: [...commonCatalogChecks, ...contextReview],
        resolution: [
          "Confirm the stable branch ID, branch code, official name, opening status, returned areas, and complete seat totals from fresh catalog evidence.",
          "If accepted, add the branch and all returned areas with `npm run seat-plans:capture -- --catalog <sanitized-export.json> --accept-catalog`; annotation coverage may remain explicitly pending.",
          "Use targeted map discovery only when a new area lacks an exact reviewed map association or the routine evidence conflicts with a known path.",
          "Create independent expected-seat fixtures and reviewed definitions for each clickable area; do not reuse retired hotspots solely because a branch name or ID matches.",
          "Regenerate fingerprints and inventory, update branch-inventory.md, then run verification, tests, typecheck, build, and a fresh audit.",
        ],
      };
    case "area-removed":
      return {
        title: "Investigate and resolve removed area",
        dispositions: ["rejected", "suspended", "retired"],
        investigation: [...commonCatalogChecks, ...contextReview],
        resolution: [
          "Confirm the parent branch is still present and that the area is absent from the complete catalog, not merely unavailable for one date or interval.",
          "If accepted, archive its seat identities, map evidence, fingerprint, and hotspot definition, reconcile active references, then update the baseline with `--accept-catalog`.",
          "Suspend short-lived closures; retire areas expected to be rebuilt. Update inventory documentation and rerun all seat-plan verification.",
        ],
      };
    case "area-added":
      return {
        title: "Investigate and onboard added area",
        dispositions: ["rejected", "accepted-pending-annotation", "accepted"],
        investigation: [...commonCatalogChecks, ...contextReview],
        resolution: [
          "Confirm the area ID, name, floor, complete seats, and parent branch from fresh catalog evidence.",
          "Accept the area into the catalog baseline with `--accept-catalog` even when clickable annotation remains pending; do not invent hotspots or map associations.",
          "Discover an exact-area map only when needed, then create a reviewed definition, independent seat fixture, fingerprint, and inventory entry.",
        ],
      };
    case "seat-added":
      return {
        title: "Review added seat",
        dispositions: ["rejected", "accepted-pending-annotation", "accepted"],
        investigation: commonCatalogChecks,
        resolution: [
          "Confirm the complete area catalog and inspect the current map for an explicit matching label.",
          "Keep complete clickable coverage failed closed until the new seat has reviewed geometry or the area is deliberately reclassified as partial coverage.",
          "Update the catalog baseline, hotspot definition, independent expected-seat fixture, inventory, and fingerprint evidence as applicable.",
        ],
      };
    case "seat-removed":
      return {
        title: "Review removed seat",
        dispositions: ["rejected", "accepted"],
        investigation: commonCatalogChecks,
        resolution: [
          "Confirm the seat is absent rather than present with disabled=true, and verify the complete area catalog.",
          "If accepted, preserve the old seat identity and hotspot in lifecycle history, remove the active hotspot, and update the catalog baseline and independent fixture.",
          "Review the current map even when its dimensions are unchanged; do not assume neighboring hotspot geometry remains valid.",
        ],
      };
    case "seat-name":
      return {
        title: "Review seat rename",
        dispositions: ["rejected", "accepted"],
        investigation: [
          "Use the stable seat ID and printed map label to confirm this is a rename rather than a removed seat plus a new seat.",
        ],
        resolution: [
          "If confirmed, update the hotspot seatName, catalog baseline, and independent fixture while preserving the expected stable ID.",
        ],
      };
    case "seat-id":
      return {
        title: "Review seat identity change",
        dispositions: ["rejected", "accepted"],
        investigation: [
          "Confirm the same printed seat name consistently resolves to the new stable ID in complete catalog evidence.",
        ],
        resolution: [
          "Update expectedSeatId and baseline only after continuity is confirmed; otherwise treat the event as seat removal plus addition.",
        ],
      };
    case "seat-disabled":
      return {
        title: "Review disabled-seat state",
        dispositions: ["rejected", "accepted"],
        investigation: [
          "Confirm the disabled flag in a complete catalog and distinguish it from structural seat removal.",
        ],
        resolution: [
          "Update catalog metadata after confirmation. Keep geometry only if runtime selection remains disabled for that seat.",
        ],
      };
    case "seat-code":
      return {
        title: "Review informational seat code",
        dispositions: ["informational"],
        investigation: [
          "Determine whether the code came from availability-scoped discovery; such codes are not stable catalog identity.",
        ],
        resolution: [
          "Do not change geometry or identity solely because an availability-scoped code appeared, disappeared, or changed.",
        ],
      };
    case "map-urls":
    case "map-path":
      return {
        title: "Review map association",
        dispositions: ["rejected", "accepted"],
        investigation: [
          "Require exact-area association evidence; routine URL omission and generic booking mapUrls are not removals.",
          "Compare path, dimensions, exact SHA-256, and visible artwork before changing the reviewed definition.",
        ],
        resolution: [
          "If the path changed but bytes are identical, update the path and baseline after review.",
          "If bytes differ, keep clickable seats failed closed and follow the image-change review workflow.",
        ],
      };
    case "image-width":
    case "image-height":
      return {
        title: "Rebuild annotation for resized map",
        dispositions: ["rejected", "accepted-after-annotation-review"],
        investigation: [
          "Confirm the exact current map association and inspect the old and new images at source resolution.",
        ],
        resolution: [
          "Treat automatic scaling as a proposal only; re-project or recreate hotspots and manually inspect every coordinate and seat label.",
          "Accept the new fingerprint and dimensions only after the complete annotation review passes.",
        ],
      };
    case "image-sha256":
      return {
        title: "Review changed map artwork",
        dispositions: ["rejected", "accepted-after-annotation-review"],
        investigation: [
          "Unchanged dimensions do not prove unchanged artwork. Compare exact images and every hotspot at source resolution.",
        ],
        resolution: [
          "Keep the clickable layer disabled until every label, rectangle, range direction, and coverage rule is re-verified.",
          "Update the fingerprint only as the final result of reviewed evidence, never merely to make verification pass.",
        ],
      };
    case "branch-name":
    case "branch-code":
    case "area-name":
    case "area-floor":
      return {
        title: "Review catalog metadata change",
        dispositions: ["rejected", "accepted"],
        investigation: [
          "Match by stable branch and area IDs and confirm the metadata change in a complete catalog.",
        ],
        resolution: [
          "Update catalog metadata after confirmation; review annotations only when map, seat, or identity evidence also changed.",
        ],
      };
    default:
      return {
        title: "Review reported drift",
        dispositions: ["rejected", "accepted"],
        investigation: commonCatalogChecks,
        resolution: [
          "Document the decision, update only the affected reviewed artifacts, and rerun the full verification workflow.",
        ],
      };
  }
}

export function enrichChange(change, inventory) {
  const operationalContext = findOperationalContext(change, inventory);
  return {
    ...change,
    operationalContext,
    actionPlan: actionPlanFor(change, operationalContext),
  };
}
