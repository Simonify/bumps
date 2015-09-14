export default function round(num, places) {
  return +(Math.round(num + `e+${places}`) + `e-${places}`);
}
