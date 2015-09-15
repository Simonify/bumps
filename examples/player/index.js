import React from 'react';
import { PlayerComponent, rebuildBump } from 'bumps';
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

const bump = rebuildBump(savedBump || exampleBump);

React.render(React.createElement(PlayerComponent, {
  bump,
  playing: true
}), document.getElementById('root'));
