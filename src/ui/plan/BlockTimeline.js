import { renderScheduleTimeline, formatTimeShort } from "./ScheduleTimeline.js";

export { formatTimeShort };

export function renderBlockTimeline(blocks, ctx) {
  return renderScheduleTimeline(blocks, {
    ...ctx,
    mode: "edit",
    scrollable: false,
    onEmpty: ctx.onEmpty || "No blocks yet.",
  });
}
