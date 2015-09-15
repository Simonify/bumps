import React from 'react';
import { PlayerComponent, rebuildBump } from 'bumps';
import exampleBump from '../example';
import './scss/index.scss';

const bump = rebuildBump(exampleBump);

React.render(React.createElement(PlayerComponent, {
  bump,
  playing: true
}), document.getElementById('root'));
