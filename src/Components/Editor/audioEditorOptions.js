import { List, Map } from 'immutable';
import { TEXT, NUMBER, RANGE } from '../../Constants/EditorConstants';

export default new List([
  new Map({
    type: TEXT,
    label: 'YouTube URL',
    property: 'url'
  }),

  new Map({
    type: NUMBER,
    defaultValue: 0,
    label: 'Seek',
    property: 'start'
  }),

  new Map({
    type: NUMBER,
    defaultValue: 0,
    label: 'Duration',
    property: 'duration',
    validator(oldVal, newVal, map) {
      if (map.get('url')) {
        return newVal;
      }

      return 0;
    }
  }),

  new Map({
    type: RANGE,
    min: 0,
    max: 100,
    defaultValue: 100,
    unit: '%',
    label: 'Volume',
    property: 'volume'
  })
]);
