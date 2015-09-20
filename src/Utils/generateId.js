let IDS = 0;

export default function generateId() {
  return '' + (++IDS) + Date.now();
}
