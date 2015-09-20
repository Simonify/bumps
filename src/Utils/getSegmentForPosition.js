import sortSegments from './sortSegments';
import round from './round';

export default function getSegmentForPosition({ order, segments, position, sort }, returnSeek) {
  if (!segments.size) {
    return null;
  }

  let _pos = 0;
  let sortedSegments;
  let seek;

  if (sort && order) {
    sortedSegments = sortSegments(segments, order);
  } else {
    sortedSegments = segments;
  }

  const segment = sortedSegments.find((segment) => {
    const duration = segment.get('duration');
    const segmentStart = _pos;
    const segmentEnd = segmentStart + duration;

    if (segmentEnd > position) {
      seek = position - segmentStart;

      if (seek < 0) {
        seek = position;
      }

      return true;
    }

    _pos = segmentEnd;

    return false;
  });

  if (returnSeek) {
    return { segment, seek };
  }

  return segment;
}
