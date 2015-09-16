import { List, Map } from 'immutable';
import { TEXT, NUMBER, RANGE } from 'bumps/Constants/EditorConstants';

export default new List([
  new Map({
    type: TEXT,
    label: 'YouTube URL',
    property: 'url'
  }),

  new Map({
    type: NUMBER,
    label: 'Seek',
    property: 'start'
  }),

  new Map({
    type: RANGE,
    min: 0,
    max: 100,
    defaultValue: 100,
    label: 'Volume',
    property: 'volume'
  })
]);
