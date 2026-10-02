export function angleParts(angle) {
  const total = ((Math.round(angle * 3600) % 1296000) + 1296000) % 1296000;
  const withinSign = total % 108000;
  return { sign: Math.floor(total / 108000), degrees: Math.floor(withinSign / 3600), minutes: Math.floor(withinSign % 3600 / 60), seconds: withinSign % 60 };
}
export function degreeLabel(angle) {
  const { degrees, minutes, seconds } = angleParts(angle);
  return `${degrees}° ${String(minutes).padStart(2, '0')}′ ${String(seconds).padStart(2, '0')}″`;
}
