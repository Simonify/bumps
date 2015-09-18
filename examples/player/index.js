import React from 'react';
import { PlayerComponent, YouTubeAudioFactory, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

const youtubeAudioFactory = window.a = new YouTubeAudioFactory();

// *
window.rebuildBump = rebuildBump;
window.render = function render(props) {
  React.render(
    React.createElement(PlayerComponent, props),
    document.getElementById('root')
  );
};

const bump = rebuildBump(getBump());

render({ bump, youtubeAudioFactory, playing: true });
// */
