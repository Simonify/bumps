import { Map, List } from 'immutable';
import { YOUTUBE } from '../../Constants/TypeConstants';
import generateId from './generateId';

const emptyBump = () => {
  return new Map({
    id: generateId(),
    name: 'Untitled bump',
    order: new List(),
    segments: new Map(),
    duration: 0,
    audio: new Map({
      type: YOUTUBE,
      start: 0,
      duration: 0
    })
  });
};
