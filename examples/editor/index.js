import React from 'react';
import { EditorComponent, rebuildBump } from 'bumps';
import exampleBump from '../example';
import './scss/index.scss';

let bump = rebuildBump(exampleBump);
let onChange;

function render() {
  React.render(React.createElement(EditorComponent, {
    bump, onChange
  }), document.getElementById('root'));
}

onChange = (_bump) => {
  bump = _bump;
  render();
};

render();
