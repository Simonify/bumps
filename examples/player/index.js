import React from 'react';
import { PlayerComponent, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

const bump = rebuildBump(getBump());

React.render(
  React.createElement(PlayerComponent, { bump, playing: true }),
  document.getElementById('root')
);
