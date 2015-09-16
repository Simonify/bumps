export default function (segments, order) {
  const indexes = {};

  return segments.sort((a, b) => {
    const aId = a.get('id');
    const bId = b.get('id');

    if (!indexes[aId]) {
      indexes[aId] = order.indexOf(aId);
    }

    if (!indexes[bId]) {
      indexes[bId] = order.indexOf(bId);
    }

    if (indexes[aId] > indexes[bId]) {
      return 1;
    } else if (indexes[aId] < indexes[bId]) {
      return -1;
    }

    return 0;
  });
};
