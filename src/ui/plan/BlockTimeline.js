import { renderScheduleTimeline, formatTimeShort } from "./ScheduleTimeline.js";

export { formatTimeShort };

export function renderBlockTimeline(blocks, ctx) {
  const planMode = ctx.mode === "date" ? "date" : "template";
  return renderScheduleTimeline(blocks, {
    ...ctx,
    mode: "edit",
    planMode,
    scrollable: false,
    onEmpty: ctx.onEmpty || "No blocks yet.",
  });
}
