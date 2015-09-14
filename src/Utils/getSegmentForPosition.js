export default function getSegmentForPosition(bump, position) {
  const order = bump.get('order');
  const segments = bump.get('segments');

  if (!segments.size) {
    return null;
  }

  let _pos = 0;

  return segments.sort((a, b) => {
    const aSort = order.indexOf(a.get('id'));
    const bSort = order.indexOf(b.get('id'));

    if (aSort > bSort) {
      return 1;
    } else if (aSort < bSort) {
      return -1;
    }

    return 0;
  }).find((segment) => {
    const duration = segment.get('duration');

    if ((_pos + duration) > position) {
      return true;
    }

    _pos += duration;

    return false;
  });
}
