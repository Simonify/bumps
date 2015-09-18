import React from 'react';
import { PlayerComponent, YouTubeAudioFactory, rebuildBump } from 'bumps';
import getBump from '../getBump';
import './scss/index.scss';

window.youtubeAudioFactory = new YouTubeAudioFactory();
window.rebuildBump = rebuildBump;
window.playing = true;
window.bump = null;

window.render = function render(props) {
  React.render(
    React.createElement(PlayerComponent, props),
    document.getElementById('root')
  );
};

window.setBump = (bump) => {
  window.bump = bump;
  window.rerender();
};

window.rerender = () => {
  const { bump, youtubeAudioFactory, playing } = window;
  render({ bump, youtubeAudioFactory, playing });
};

window.setBump(rebuildBump(getBump()));
