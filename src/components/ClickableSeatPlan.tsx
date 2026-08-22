import { useEffect, useMemo, useRef, useState } from "react";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanImageEvidence } from "../models/seatPlan";
import { resolveSeatPlan } from "../services/seatPlanAnnotations";

interface ClickableSeatPlanProps {
  area: Area;
  imageUrl: string;
  mapPath: string;
  favouriteIds: ReadonlySet<string>;
  focusSeatId?: string;
  onToggleFavourite: (seat: Seat) => void | Promise<void>;
}

interface ImageSize {
  width: number;
  height: number;
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

interface ScrollMetrics {
  horizontal: boolean;
  vertical: boolean;
  horizontalThumb: number;
  horizontalOffset: number;
  verticalThumb: number;
  verticalOffset: number;
}

const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2] as const;

function toggleOnKeyboard(
  event: React.KeyboardEvent<SVGGElement>,
  toggle: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  toggle();
}

export function ClickableSeatPlan({
  area,
  imageUrl,
  mapPath,
  favouriteIds,
  focusSeatId,
  onToggleFavourite,
}: ClickableSeatPlanProps) {
  const [imageEvidence, setImageEvidence] = useState<SeatPlanImageEvidence>();
  const [verifiedImageUrl, setVerifiedImageUrl] = useState<string>();
  const [imageFailed, setImageFailed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [viewportSize, setViewportSize] = useState<ImageSize>();
  const [isPanning, setIsPanning] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({
    horizontal: false,
    vertical: false,
    horizontalThumb: 100,
    horizontalOffset: 0,
    verticalThumb: 100,
    verticalOffset: 0,
  });
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const hotspotRefs = useRef(new Map<string, SVGGElement>());
  const panRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  }>();
  const initialResolution = useMemo(
    () => resolveSeatPlan(area, mapPath),
    [area, mapPath],
  );

  useEffect(() => {
    setImageEvidence(undefined);
    setVerifiedImageUrl(undefined);
    setImageFailed(false);

    if (initialResolution.status !== "pending") {
      return undefined;
    }

    let active = true;
    let objectUrl: string | undefined;
    const load = async () => {
      try {
        const response = await fetch(imageUrl, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Seat plan returned ${response.status}.`);
        }
        const bytes = await response.arrayBuffer();
        const sha256 = await sha256Hex(bytes);
        const imageBlob = new Blob([bytes], {
          type: response.headers.get("content-type") ?? "image/png",
        });
        objectUrl = URL.createObjectURL(imageBlob);
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Seat plan image could not be decoded."));
          image.src = objectUrl ?? "";
        });
        if (active) {
          setVerifiedImageUrl(objectUrl);
          setImageEvidence({
            width: image.naturalWidth,
            height: image.naturalHeight,
            sha256,
          });
        } else {
          URL.revokeObjectURL(objectUrl);
          objectUrl = undefined;
        }
      } catch {
        if (active) {
          setImageFailed(true);
        }
      }
    };
    void load();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl, initialResolution.status]);

  const resolution = useMemo(
    () => resolveSeatPlan(area, mapPath, imageEvidence),
    [area, imageEvidence, mapPath],
  );
  const definition =
    resolution.status === "unmapped" ? undefined : resolution.definition;
  const zoom = ZOOM_LEVELS[zoomIndex];
  const viewportWidth = Math.max(0, (viewportSize?.width ?? 0) - 24);
  const viewportHeight = Math.max(0, (viewportSize?.height ?? 0) - 24);
  const fitScale = definition && viewportWidth > 0 && viewportHeight > 0
    ? Math.min(
        viewportWidth / definition.imageWidth,
        viewportHeight / definition.imageHeight,
      )
    : 1;
  const renderedWidth = definition
    ? Math.max(1, Math.round(definition.imageWidth * fitScale * zoom))
    : 0;
  const renderedHeight = definition
    ? Math.max(1, Math.round(definition.imageHeight * fitScale * zoom))
    : 0;
  const canvasWidth = Math.max(viewportWidth, renderedWidth);
  const canvasHeight = Math.max(viewportHeight, renderedHeight);

  useEffect(() => {
    setZoomIndex(0);
  }, [area.id, mapPath]);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const updateSize = () =>
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [definition?.imageHeight, definition?.imageWidth]);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const updateScrollMetrics = () => {
      const horizontalOverflow = viewport.scrollWidth > viewport.clientWidth;
      const verticalOverflow = viewport.scrollHeight > viewport.clientHeight;
      const horizontalThumb = horizontalOverflow
        ? Math.max(16, (viewport.clientWidth / viewport.scrollWidth) * 100)
        : 100;
      const verticalThumb = verticalOverflow
        ? Math.max(16, (viewport.clientHeight / viewport.scrollHeight) * 100)
        : 100;

      setScrollMetrics({
        horizontal: horizontalOverflow,
        vertical: verticalOverflow,
        horizontalThumb,
        horizontalOffset: horizontalOverflow
          ? (viewport.scrollLeft /
              (viewport.scrollWidth - viewport.clientWidth)) *
            (100 - horizontalThumb)
          : 0,
        verticalThumb,
        verticalOffset: verticalOverflow
          ? (viewport.scrollTop /
              (viewport.scrollHeight - viewport.clientHeight)) *
            (100 - verticalThumb)
          : 0,
      });
    };

    updateScrollMetrics();
    viewport.addEventListener("scroll", updateScrollMetrics, {
      passive: true,
    });
    const observer = new ResizeObserver(updateScrollMetrics);
    observer.observe(viewport);
    return () => {
      viewport.removeEventListener("scroll", updateScrollMetrics);
      observer.disconnect();
    };
  }, [canvasHeight, canvasWidth, renderedHeight, renderedWidth]);

  useEffect(() => {
    if (!focusSeatId || resolution.status !== "ready") {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const viewport = mapViewportRef.current;
      const hotspot = hotspotRefs.current.get(focusSeatId);
      if (!viewport || !hotspot) {
        return;
      }

      const viewportBounds = viewport.getBoundingClientRect();
      const hotspotBounds = hotspot.getBoundingClientRect();
      viewport.scrollBy({
        left:
          hotspotBounds.left -
          viewportBounds.left -
          (viewport.clientWidth - hotspotBounds.width) / 2,
        top:
          hotspotBounds.top -
          viewportBounds.top -
          (viewport.clientHeight - hotspotBounds.height) / 2,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focusSeatId, renderedHeight, renderedWidth, resolution.status]);

  const mapContent = definition ? (
    <div
      className="nlb-seat-helper__interactive-map-canvas"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      <svg
        className="nlb-seat-helper__interactive-map"
        style={{ width: `${renderedWidth}px`, height: `${renderedHeight}px` }}
        viewBox={`0 0 ${definition.imageWidth} ${definition.imageHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={`${area.name} seat plan`}
      >
        <title>{`${area.name} seat plan with favourite-seat controls`}</title>
        {verifiedImageUrl && (
          <image
            href={verifiedImageUrl}
            width={definition.imageWidth}
            height={definition.imageHeight}
          />
        )}
        {resolution.status === "ready" && (
          <>
            {resolution.hotspots.map(({ seat, bounds }) => {
              const favourite = favouriteIds.has(seat.id);
              const action = favourite ? "Remove" : "Add";
              const toggle = () => void onToggleFavourite(seat);
              const cornerRadius =
                Math.min(bounds.width, bounds.height) <= 20 ? 2 : 8;

              return (
                <g
                  key={seat.id}
                  ref={(node) => {
                    if (node) {
                      hotspotRefs.current.set(seat.id, node);
                    } else {
                      hotspotRefs.current.delete(seat.id);
                    }
                  }}
                  className={`nlb-seat-helper__seat-hotspot${
                    favourite ? " is-favourite" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${action} ${seat.name} ${
                    favourite ? "from" : "to"
                  } favourites`}
                  aria-pressed={favourite}
                  onClick={(event) => {
                    toggle();
                    event.currentTarget.blur();
                  }}
                  onKeyDown={(event) =>
                    toggleOnKeyboard(event, toggle)
                  }
                >
                  <title>{`${seat.name}${
                    favourite ? " — favourite" : ""
                  }`}</title>
                  <rect
                    className="nlb-seat-helper__seat-hitbox"
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    rx={cornerRadius}
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    className="nlb-seat-helper__seat-hover-layer nlb-seat-helper__seat-hover-layer--outer"
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    rx={cornerRadius}
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    className="nlb-seat-helper__seat-hover-layer nlb-seat-helper__seat-hover-layer--inner"
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    rx={cornerRadius}
                    vectorEffect="non-scaling-stroke"
                  />
                  {favourite && (
                    <>
                      <rect
                        className="nlb-seat-helper__seat-selection-layer nlb-seat-helper__seat-selection-layer--outer"
                        x={bounds.x}
                        y={bounds.y}
                        width={bounds.width}
                        height={bounds.height}
                        rx={cornerRadius}
                        vectorEffect="non-scaling-stroke"
                      />
                      <rect
                        className="nlb-seat-helper__seat-selection-layer nlb-seat-helper__seat-selection-layer--green"
                        x={bounds.x}
                        y={bounds.y}
                        width={bounds.width}
                        height={bounds.height}
                        rx={cornerRadius}
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  )}
                </g>
              );
            })}
            <g
              className="nlb-seat-helper__favourite-stars"
              aria-hidden="true"
            >
              {resolution.hotspots.map(({ seat, bounds }) => {
                if (!favouriteIds.has(seat.id)) {
                  return null;
                }

                const starFontSize = Math.max(
                  8,
                  Math.min(bounds.width, bounds.height) * 0.5,
                );
                const starY =
                  bounds.y >= starFontSize + 2
                    ? bounds.y - starFontSize * 0.5
                    : bounds.y + starFontSize * 0.5;

                return (
                  <text
                    key={seat.id}
                    className="nlb-seat-helper__favourite-star"
                    x={bounds.x + bounds.width / 2}
                    y={starY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={starFontSize}
                    strokeWidth={Math.max(2, starFontSize * 0.12)}
                  >
                    ★
                  </text>
                );
              })}
            </g>
          </>
        )}
      </svg>
    </div>
  ) : (
    <img
      className="nlb-seat-helper__interactive-map-image"
      src={verifiedImageUrl ?? imageUrl}
      alt={`${area.name} full seat plan`}
    />
  );

  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId !== event.pointerId) {
      return;
    }

    mapViewportRef.current?.releasePointerCapture(event.pointerId);
    panRef.current = undefined;
    setIsPanning(false);
  }

  function handlePanStart(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as Element;
    if (target.closest(".nlb-seat-helper__seat-hotspot")) {
      return;
    }

    mapViewportRef.current?.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setIsPanning(true);
    event.preventDefault();
  }

  function handlePanMove(event: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    const viewport = mapViewportRef.current;
    if (!pan || pan.pointerId !== event.pointerId || !viewport) {
      return;
    }

    viewport.scrollLeft -= event.clientX - pan.x;
    viewport.scrollTop -= event.clientY - pan.y;
    pan.x = event.clientX;
    pan.y = event.clientY;
    event.preventDefault();
  }

  return (
    <div className="nlb-seat-helper__interactive-map-shell">
      <div
        className="nlb-seat-helper__interactive-map-toolbar"
        role="toolbar"
        aria-label="Seat plan zoom controls"
      >
        <button
          type="button"
          onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
          disabled={!definition || zoomIndex === 0}
          aria-label="Zoom out"
        >
          −
        </button>
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() =>
            setZoomIndex((current) =>
              Math.min(ZOOM_LEVELS.length - 1, current + 1),
            )
          }
          disabled={!definition || zoomIndex === ZOOM_LEVELS.length - 1}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="nlb-seat-helper__interactive-map-reset"
          onClick={() => setZoomIndex(0)}
          disabled={!definition || zoomIndex === 0}
        >
          Reset
        </button>
        {definition && <small>Drag the map or use the scrollbars to move</small>}
      </div>
      <div
        className={`nlb-seat-helper__interactive-map-frame${
          scrollMetrics.horizontal ? " has-horizontal-scroll" : ""
        }${scrollMetrics.vertical ? " has-vertical-scroll" : ""}`}
      >
        <div
          ref={mapViewportRef}
          className={`nlb-seat-helper__interactive-map-viewport${
            isPanning ? " is-panning" : ""
          }`}
          onPointerDown={handlePanStart}
          onPointerMove={handlePanMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          onLostPointerCapture={() => {
            panRef.current = undefined;
            setIsPanning(false);
          }}
        >
          {mapContent}
        </div>
        {scrollMetrics.horizontal && (
          <div
            className="nlb-seat-helper__interactive-map-scrollbar is-horizontal"
            aria-hidden="true"
          >
            <span
              style={{
                width: `${scrollMetrics.horizontalThumb}%`,
                left: `${scrollMetrics.horizontalOffset}%`,
              }}
            />
          </div>
        )}
        {scrollMetrics.vertical && (
          <div
            className="nlb-seat-helper__interactive-map-scrollbar is-vertical"
            aria-hidden="true"
          >
            <span
              style={{
                height: `${scrollMetrics.verticalThumb}%`,
                top: `${scrollMetrics.verticalOffset}%`,
              }}
            />
          </div>
        )}
      </div>
      <p
        className={`nlb-seat-helper__interactive-map-status${
          resolution.status === "ready" ? " is-ready" : ""
        }`}
        aria-live="polite"
      >
        {resolution.status === "ready"
          ? definition?.mappingBasis
            ? "Seat positions follow the numbered range order shown on this plan. Select a seat or use seat-number search."
            : "Select a labelled seat on the plan or use seat-number search."
          : resolution.status === "pending" && !imageFailed
            ? "Loading clickable seats…"
            : resolution.status === "unmapped"
              ? "Clickable seats are not mapped for this plan yet. Use seat-number search."
              : resolution.status === "invalid" &&
                  resolution.reason === "image-fingerprint-mismatch"
                ? "This seat-plan image has changed since its annotation was reviewed. Use seat-number search until the map is re-verified."
                : resolution.status === "invalid" &&
                    resolution.reason === "image-fingerprint-missing"
                  ? "This plan has no verified image fingerprint. Use seat-number search until it is reviewed."
                  : resolution.status === "invalid" &&
                      resolution.reason === "image-size-mismatch"
                    ? "This seat-plan layout has changed size since its annotation was reviewed. Use seat-number search until the map is re-verified."
                    : "Clickable seats are unavailable because the current map or seat catalog no longer matches its annotation. Use seat-number search."
        }
      </p>
    </div>
  );
}
