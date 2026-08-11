import { useEffect, useMemo, useState } from "react";
import type { Area, Seat } from "../models/catalog";
import { resolveSeatPlan } from "../services/seatPlanAnnotations";

interface ClickableSeatPlanProps {
  area: Area;
  imageUrl: string;
  mapPath: string;
  favouriteIds: ReadonlySet<string>;
  onToggleFavourite: (seat: Seat) => void | Promise<void>;
}

interface ImageSize {
  width: number;
  height: number;
}

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
  onToggleFavourite,
}: ClickableSeatPlanProps) {
  const [imageSize, setImageSize] = useState<ImageSize>();
  const [imageFailed, setImageFailed] = useState(false);
  const initialResolution = useMemo(
    () => resolveSeatPlan(area, mapPath),
    [area, mapPath],
  );

  useEffect(() => {
    setImageSize(undefined);
    setImageFailed(false);

    if (initialResolution.status !== "pending") {
      return undefined;
    }

    let active = true;
    const image = new Image();
    image.onload = () => {
      if (active) {
        setImageSize({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };
    image.onerror = () => {
      if (active) {
        setImageFailed(true);
      }
    };
    image.src = imageUrl;

    return () => {
      active = false;
    };
  }, [imageUrl, initialResolution.status]);

  const resolution = useMemo(
    () => resolveSeatPlan(area, mapPath, imageSize),
    [area, imageSize, mapPath],
  );
  const definition =
    resolution.status === "unmapped" ? undefined : resolution.definition;

  return (
    <>
      {definition ? (
        <svg
          className="nlb-seat-helper__interactive-map"
          viewBox={`0 0 ${definition.imageWidth} ${definition.imageHeight}`}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label={`${area.name} seat plan`}
        >
          <title>{`${area.name} seat plan with favourite-seat controls`}</title>
          <image
            href={imageUrl}
            width={definition.imageWidth}
            height={definition.imageHeight}
          />
          {resolution.status === "ready" &&
            resolution.hotspots.map(({ seat, bounds }) => {
              const favourite = favouriteIds.has(seat.id);
              const action = favourite ? "Remove" : "Add";
              const toggle = () => void onToggleFavourite(seat);
              const starFontSize = Math.max(
                10,
                Math.min(bounds.width, bounds.height) * 0.62,
              );

              return (
                <g
                  key={seat.id}
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
                    x={bounds.x}
                    y={bounds.y}
                    width={bounds.width}
                    height={bounds.height}
                    rx={8}
                    vectorEffect="non-scaling-stroke"
                  />
                  {favourite && (
                    <text
                      x={bounds.x + bounds.width / 2}
                      y={bounds.y + bounds.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={starFontSize}
                      strokeWidth={Math.max(2, starFontSize * 0.12)}
                      aria-hidden="true"
                    >
                      ★
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      ) : (
        <img src={imageUrl} alt={`${area.name} full seat plan`} />
      )}
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
              : "Clickable seats are unavailable because this plan could not be verified. Use seat-number search."
        }
      </p>
    </>
  );
}
