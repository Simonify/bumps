import { List, Map } from 'immutable';
import { TEXT, LOGO, IMAGE } from '../../Constants/TypeConstants';
import * as EditorConstants from '../../Constants/EditorConstants';
import EditorOptionsComponent from './index';

export default {
  [TEXT]: {
    title: 'Text settings',
    options: new List([
      new Map({
        label: 'Text',
        type: EditorConstants.TEXT,
        property: 'text'
      }),
      new Map({
        label: 'Letter spacing',
        type: EditorConstants.RANGE,
        defaultValue: 0,
        min: -5,
        max: 100,
        unit: 'px',
        property: 'letter_spacing'
      })
    ])
  },

  [LOGO]: {
    title: 'Logo settings',
    options: new List([
      new Map({
        label: 'Small logo',
        type: EditorConstants.BOOLEAN,
        property: 'small'
      })
    ])
  },

  [IMAGE]: {
    title: 'Image settings',
    options: new List([
      new Map({
        label: 'URL',
        type: EditorConstants.TEXT,
        property: 'url'
      }),
      new Map({
        label: 'Cover',
        type: EditorConstants.BOOLEAN,
        property: 'cover'
      }),
      new Map({
        label: 'Scale',
        min: 0,
        max: 250,
        defaultValue: 100,
        type: EditorConstants.RANGE,
        unit: '%',
        property: 'scale',
        disabled(map) {
          return (map.get('cover') === true);
        }
      })
    ])
  }
};
