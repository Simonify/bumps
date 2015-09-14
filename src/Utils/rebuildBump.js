import { fromJS } from 'immutable';

export default fromJS;

// let bumps = 0;
//
// export default function rebuildBump(json) {
//   let segments = new Map();
//   let order = new List();
//   let duration = 0;
//   let audio;
//
//   for (let i = 0; i < json.order.length; i++) {
//     const segment = json.segments[json.order[i]];
//     order = order.push(segment.id);
//     segments = segments.set(segment. id, new Map(segment));
//     duration += segment.duration;
//   }
//
//   if (_audio) {
//     audio = new Map({
//       type: TypeConstants.YOUTUBE,
//       ..._audio
//     });
//   }
//
//   return new Map({ id, name, order, segments, duration, audio });
// }
