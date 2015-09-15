import React from 'react';
import { PlayerComponent, rebuildBump } from 'bumps';
import './scss/index.scss';

function render(bump) {
  React.render(React.createElement(PlayerComponent, {
    bump,
    playing: true
  }), document.getElementById('root'));
}

const bump = rebuildBump({"id":"bump1","name":"PSA","order":["segment-1","segment-2","segment-3","segment-pepe","segment-4","segment-5"],"segments":{"segment-1":{"id":"segment-1","type":"TEXT","duration":2.29,"label":"Text 1","text":"Attention."},"segment-2":{"id":"segment-2","type":"TEXT","duration":2.9,"label":"Text 2","text":"We have an important PSA."},"segment-3":{"id":"segment-3","type":"TEXT","duration":1.05,"label":"Text 3","text":"We have a rare pepe for sale"},"segment-pepe":{"id":"segment-pepe","type":"IMAGE","duration":1.82,"label":"Rare Pepe","url":"https://i.imgur.com/pEMGBhR.jpg"},"segment-4":{"id":"segment-4","type":"TEXT","duration":2.8,"label":"Text 4","text":"Bidding starts at $50"},"segment-5":{"id":"segment-5","type":"LOGO","duration":2,"label":"Logo"}},"duration":12.88,"audio":{"id":"youtube-audio","type":"YOUTUBE","url":"http://youtube.com/watch?v=sHKsFM6wxmI","start":74,"duration":12.88,"label":"Audio"}});

render(bump);
