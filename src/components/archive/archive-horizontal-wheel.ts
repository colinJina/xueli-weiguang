export function resolveHorizontalWheelDelta({
  deltaX,
  deltaY,
}: {
  deltaX: number;
  deltaY: number;
}) {
  return deltaX !== 0 ? deltaX : deltaY;
}
