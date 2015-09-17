import React from 'react';
import { PlayerComponent, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

window.rebuildBump = rebuildBump;
window.render = function render(props) {
  React.render(
    React.createElement(PlayerComponent, props),
    document.getElementById('root')
  );
};

const bump = rebuildBump(getBump());
render({ bump, playing: true, persistYoutubePlayer: true });
