import sortSegments from './sortSegments';

export default function getSegmentForPosition({ order, segments, position, sort }) {
  if (!segments.size) {
    return null;
  }

  let _pos = 0;
  let sortedSegments;

  if (sort && order) {
    sortedSegments = sortSegments(segments, order);
  } else {
    sortedSegments = segments;
  }

  return sortedSegments.find((segment) => {
    const duration = segment.get('duration');

    if ((_pos + duration) > position) {
      return true;
    }

    _pos += duration;

    return false;
  });
}
