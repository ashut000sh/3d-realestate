// Month calendar for picking a short stay: check-in, then check-out. No library.
// Two months side by side on wide screens, one on phones.
//
// <StayCalendar
//   blocked={[{ start: "2026-12-20", end: "2026-12-23" }]}  // nights start..end-1 are taken
//   checkIn="2026-12-10" checkOut={null}
//   maxDate="2027-11-26"                                    // last day that can be picked
//   onChange={({ checkIn, checkOut }) => ...}
// />
//
// Rules: past days and booked nights can't be picked. A booked day can still be the CHECK-OUT
// when it's the first booked day after your check-in (the next guest arrives as you leave).
// A stay that would cross a booked night is refused with a message.
import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  localToday,
  monthGrid,
  monthLabel,
  shortDate,
  startOfMonth,
} from "../utils/dates.js";
import Icon from "./Icon.jsx";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function StayCalendar({ blocked = [], checkIn, checkOut, maxDate, onChange }) {
  const today = localToday();
  const [month, setMonth] = useState(() => startOfMonth(checkIn || today));
  const [hovered, setHovered] = useState(null);
  const [notice, setNotice] = useState("");

  // Every booked night, for quick lookups
  const bookedNights = useMemo(() => {
    const nights = new Set();
    blocked.forEach(({ start, end }) => {
      for (let d = start; d < end; d = addDays(d, 1)) nights.add(d);
    });
    return nights;
  }, [blocked]);

  const pickingCheckOut = Boolean(checkIn && !checkOut);
  // First booked night on or after check-in: the latest possible check-out
  const firstBooked = useMemo(() => {
    if (!checkIn) return null;
    return [...bookedNights].filter((d) => d >= checkIn).sort()[0] ?? null;
  }, [bookedNights, checkIn]);

  const isPast = (d) => d < today;
  const isBooked = (d) => bookedNights.has(d);
  const isCheckoutOnly = (d) => pickingCheckOut && d > checkIn && d === firstBooked;
  const isDisabled = (d) =>
    isPast(d) || (maxDate && d > maxDate) || (isBooked(d) && !isCheckoutOnly(d));

  function handleClick(d) {
    setNotice("");
    if (!pickingCheckOut || d <= checkIn) {
      onChange({ checkIn: d, checkOut: null });
      return;
    }
    if (firstBooked && d > firstBooked) {
      setNotice(
        `Your stay can't include booked nights. ${shortDate(firstBooked)} is taken, so check out ` +
          `on or before ${shortDate(firstBooked)}, or choose other dates.`,
      );
      return;
    }
    onChange({ checkIn, checkOut: d });
  }

  // Range to paint: the chosen stay, or a preview while hovering a check-out
  const rangeEnd = checkOut || (pickingCheckOut && hovered > checkIn ? hovered : null);
  const previewBlocked = !checkOut && rangeEnd && firstBooked && rangeEnd > firstBooked;

  const firstMonth = startOfMonth(today);
  const lastMonth = maxDate ? startOfMonth(maxDate) : addMonths(today, 12);

  function renderMonth(monthStart, className = "") {
    return (
      <div className={className}>
        <p className="mb-3 text-center font-semibold text-ink">{monthLabel(monthStart)}</p>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1">
              {w}
            </span>
          ))}
        </div>
        <div role="grid" aria-label={monthLabel(monthStart)} className="mt-1 space-y-1">
          {monthGrid(monthStart).map((week, i) => (
            <div key={i} role="row" className="grid grid-cols-7">
              {week.map((d, j) => {
                if (!d) return <span key={j} role="gridcell" />;
                const disabled = isDisabled(d);
                const booked = isBooked(d) && !isCheckoutOnly(d);
                const isStart = d === checkIn;
                const isEnd = d === rangeEnd;
                const inRange = checkIn && rangeEnd && d > checkIn && d < rangeEnd;
                const label =
                  `${shortDate(d, true)}` +
                  (booked ? ", booked" : "") +
                  (isCheckoutOnly(d) ? ", check-out only" : "") +
                  (isStart ? ", check-in" : "") +
                  (d === checkOut ? ", check-out" : "");
                return (
                  <div
                    key={d}
                    role="gridcell"
                    className={`relative ${
                      inRange
                        ? previewBlocked
                          ? "bg-danger-soft"
                          : "bg-primary-soft"
                        : (isStart && rangeEnd) || (isEnd && checkIn)
                          ? `${previewBlocked ? "from-danger-soft" : "from-primary-soft"} ${
                              isStart ? "bg-gradient-to-l" : "bg-gradient-to-r"
                            } via-transparent via-50% to-transparent`
                          : ""
                    }`}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={label}
                      aria-pressed={isStart || d === checkOut}
                      title={
                        booked
                          ? "Booked"
                          : isCheckoutOnly(d)
                            ? "Check-out only: the next guest arrives this day"
                            : undefined
                      }
                      onClick={() => handleClick(d)}
                      onMouseEnter={() => setHovered(d)}
                      onMouseLeave={() => setHovered(null)}
                      className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition sm:h-11 sm:w-11 ${
                        isStart || (isEnd && checkIn)
                          ? "bg-primary font-semibold text-white"
                          : booked
                            ? "cursor-not-allowed bg-sand text-muted/60 line-through"
                            : disabled
                              ? "cursor-not-allowed text-muted/35"
                              : "font-medium text-ink hover:bg-primary-soft hover:ring-1 hover:ring-primary/40"
                      } ${d === today && !isStart ? "ring-1 ring-accent" : ""}`}
                    >
                      {Number(d.slice(8))}
                      {isCheckoutOnly(d) && !isEnd && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          {!checkIn
            ? "Choose your check-in date"
            : pickingCheckOut
              ? `Check-in ${shortDate(checkIn)} · now choose check-out`
              : `${shortDate(checkIn)} → ${shortDate(checkOut)}`}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={month <= firstMonth}
            onClick={() => setMonth(addMonths(month, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition hover:bg-sand disabled:opacity-35"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={month >= lastMonth}
            onClick={() => setMonth(addMonths(month, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink transition hover:bg-sand disabled:opacity-35"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-8 md:grid-cols-2" onMouseLeave={() => setHovered(null)}>
        {renderMonth(month)}
        {renderMonth(addMonths(month, 1), "hidden md:block")}
      </div>

      <div aria-live="polite">
        {notice && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            <Icon name="alert" className="mt-0.5 h-4 w-4" /> {notice}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-primary" /> Your dates
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-sand ring-1 ring-border" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Check-out only
        </span>
        {checkIn && (
          <button
            type="button"
            onClick={() => {
              setNotice("");
              onChange({ checkIn: null, checkOut: null });
            }}
            className="ml-auto font-semibold text-primary hover:underline"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
