import React from 'react';
import { PlayerComponent, YouTubeAudioFactory, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

window.youtubeAudioFactory = new YouTubeAudioFactory();
window.rebuildBump = rebuildBump;
window.bump = rebuildBump(getBump());
window.render = function render(props) {
  React.render(
    React.createElement(PlayerComponent, props),
    document.getElementById('root')
  );
};

render({ bump, youtubeAudioFactory, playing: true });
