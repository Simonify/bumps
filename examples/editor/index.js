import React from 'react';
import { EditorComponent, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

let bump = rebuildBump(getBump());
let onChange;

function render() {
  React.render(
    React.createElement(EditorComponent, { bump, onChange }),
    document.getElementById('root')
  );
}

onChange = (_bump) => {
  bump = _bump;
  window.localStorage.setItem('bump', JSON.stringify(bump.toJS()));
  render();
};

render();
