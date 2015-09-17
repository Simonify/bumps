import React from 'react';
import { EditorComponent, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

const state = window._state = {
  history: [],
  redo: [],
  bump: rebuildBump(getBump())
};

function render(bump) {
  const props = { bump, onChange };
  const component = React.createElement(EditorComponent, props);
  React.render(component, document.getElementById('root'));
}

function setBump(bump) {
  state.bump = bump;
  window.localStorage.setItem('bump', JSON.stringify(bump.toJS()));
  render(state.bump);
}

function onChange(bump) {
  window.console.log('Bump mutated', bump.toJS());

  state.redo = [];
  state.history.unshift(state.bump);

  if (state.history.length > 100) {
    state.history.length = 100;
  }

  setBump(bump);
}

window.addEventListener('keydown', (event) => {
  if (event.target === document.body && event.metaKey) {
    if (event.keyCode === 90) {
      event.preventDefault();

      if (event.shiftKey) {
        if (state.redo.length) {
          const bump = state.redo[0];
          state.history.unshift(state.bump);
          state.redo = state.redo.slice(1);
          setBump(bump);
        }
      } else {
        if (state.history.length) {
          state.redo.unshift(state.bump);
          const bump = state.history[0];
          state.history = state.history.splice(1);
          setBump(bump);
        }
      }
    }
  }
});

render(state.bump);
