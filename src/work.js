import { DAY_NAMES, blocksFor, dayType, uid } from "./schedule.js";
import { parseDateKey } from "./dates.js";

export function workBlocksForShift(dateKey, start = "10:00 AM", end = "7:30 PM") {
  const suffix = dateKey.replaceAll("-", "");
  return [
    {
      id: `ov-wake-${suffix}`,
      time: "7:30 - 8:30 AM",
      label: "Wake, self-care, real breakfast",
      details: "",
      tags: ["work-day"],
    },
    {
      id: `ov-commute-${suffix}`,
      time: "8:30 - 9:45 AM",
      label: "Commute / buffer",
      details: "",
      tags: ["work-day"],
    },
    {
      id: `ov-tesla-${suffix}`,
      time: `${start} - ${end}`,
      label: "Tesla shift (laptop in the bag)",
      details: "Model 3 RWD · FSD Supervised on slow floor stretches = homework/side project, not scrolling.",
      tags: ["work", "tesla"],
    },
    {
      id: `ov-dog-${suffix}`,
      time: "After shift · ~1hr",
      label: "Dog walk, decompress",
      details: "",
      tags: ["work-day"],
    },
    {
      id: `ov-dinner-${suffix}`,
      time: "Dinner window",
      label: "Dinner",
      details: "",
      tags: ["work-day"],
    },
    {
      id: `ov-uber-${suffix}`,
      time: "9:30 - 11:30 PM",
      label: "Uber block or side project",
      details: "Pick 2 nights/week max. Track miles. Soft target.",
      soft: true,
      tags: ["soft", "uber"],
    },
    {
      id: `ov-me-${suffix}`,
      time: "11:30 PM - 1:00 AM",
      label: "Me time / wait",
      details: "",
      soft: true,
      tags: ["soft"],
    },
  ];
}

export function offDayBlocks(dateKey) {
  const suffix = dateKey.replaceAll("-", "");
  return [
    {
      id: `off-wake-${suffix}`,
      time: "8:30 - 9:30 AM",
      label: "Wake, self-care",
      details: "Off-day rhythm. Protect the workout if scheduled with a coworker.",
      tags: ["off"],
    },
    {
      id: `off-workout-${suffix}`,
      time: "9:30 - 11:00 AM",
      label: "Workout",
      details: "",
      tags: ["off", "fitness"],
    },
    {
      id: `off-focus-${suffix}`,
      time: "11:00 AM - 4:00 PM",
      label: "Deep focus / school / freelance",
      details: "Use the open day. Do not treat off as wasted.",
      tags: ["off"],
    },
    {
      id: `off-dog-${suffix}`,
      time: "4:00 - 5:00 PM",
      label: "Dog walk",
      details: "",
      tags: ["off"],
    },
    {
      id: `off-evening-${suffix}`,
      time: "5:00 - 9:30 PM",
      label: "Dinner + evening blocks",
      details: "",
      tags: ["off"],
    },
    {
      id: `off-me-${suffix}`,
      time: "9:30 PM - 1:00 AM",
      label: "Me time",
      details: "",
      soft: true,
      tags: ["soft", "off"],
    },
  ];
}

/** Resolve blocks for a concrete calendar date. */
export function resolveBlocksForDate(state, dateKey) {
  if (state.dateSchedules?.[dateKey]?.length) {
    return state.dateSchedules[dateKey];
  }

  const override = state.workOverrides?.[dateKey];
  if (override?.type === "work") {
    return workBlocksForShift(dateKey, override.start || "10:00 AM", override.end || "7:30 PM");
  }
  if (override?.type === "off") {
    return offDayBlocks(dateKey);
  }

  const dow = parseDateKey(dateKey).getDay();
  return blocksFor(state, dow).map((b) => ({
    ...b,
    details: b.details || "",
    tags: b.tags || (b.soft ? ["soft"] : []),
  }));
}

export function upcomingEvents(state, fromKey, days = 45) {
  const events = state.events || [];
  const start = parseDateKey(fromKey);
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const md = key.slice(5);
    for (const ev of events) {
      const match = ev.recurYearly ? ev.date.slice(5) === md : ev.date === key;
      if (match) out.push({ ...ev, occursOn: key });
    }
    const ov = state.workOverrides?.[key];
    if (ov) {
      out.push({
        id: `work-${key}`,
        type: "shift",
        title:
          ov.type === "work"
            ? `Work ${ov.start || "10:00 AM"} to ${ov.end || "7:30 PM"}`
            : "Day off",
        occursOn: key,
      });
    }
  }
  return out;
}

export function describeOverride(override) {
  if (!override) return null;
  if (override.type === "off") return "Off day override";
  return `Work ${override.start || "10:00 AM"} to ${override.end || "7:30 PM"}`;
}

export function weekdayLabel(dateKey) {
  return DAY_NAMES[parseDateKey(dateKey).getDay()];
}

export function createEmptyBlock() {
  return {
    id: uid("custom"),
    label: "",
    time: "",
    details: "",
    soft: false,
    tags: [],
  };
}
