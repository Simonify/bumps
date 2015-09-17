import { List, Map } from 'immutable';
import { TEXT, NUMBER } from 'bumps/Constants/EditorConstants';

export default new List([
  new Map({
    label: 'Label',
    type: TEXT,
    property: 'label'
  }),

  new Map({
    label: 'Duration',
    type: NUMBER,
    property: 'duration',
    min: 0.1,
    validate(number) {
      return round(number, 3);
    }
  })
]);
