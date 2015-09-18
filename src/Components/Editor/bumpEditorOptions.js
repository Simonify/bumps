import { List, Map } from 'immutable';
import { TEXT, NUMBER } from '../../Constants/EditorConstants';

export default new List([
  new Map({
    type: TEXT,
    label: 'Name',
    property: 'name'
  }),

  new Map({
    type: TEXT,
    label: 'Created by',
    property: 'creator'
  }),

  new Map({
    type: NUMBER,
    disabled: true,
    label: 'Duration',
    property: 'duration'
  })
])
