import React from 'react';
import { PlayerComponent, YouTubeAudioFactory, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

window.youtubeAudioFactory = new YouTubeAudioFactory();
window.rebuildBump = rebuildBump;
window.bump = null;

window.render = function render(props) {
  React.render(
    React.createElement(PlayerComponent, props),
    document.getElementById('root')
  );
};

window.setBump = (bump) => {
  window.bump = bump;
  render({ bump, youtubeAudioFactory, playing: true });
};

window.setBump(rebuildBump(getBump()));
