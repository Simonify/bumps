import React from 'react';
import { EditorComponent, rebuildBump } from 'bumps';
import exampleBump from '../example';
import './scss/index.scss';

let savedBump = window.localStorage.getItem('bump');

if (typeof savedBump === 'string') {
  try {
    savedBump = JSON.parse(savedBump);
  } catch (e) {
    savedBump = null;
  }
}

let bump = rebuildBump(savedBump || exampleBump);
let onChange;

function render() {
  React.render(React.createElement(EditorComponent, {
    bump, onChange
  }), document.getElementById('root'));
}

onChange = (_bump) => {
  bump = _bump;
  window.localStorage.setItem('bump', JSON.stringify(bump.toJS()));
  render();
};

render();
