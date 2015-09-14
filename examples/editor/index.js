import React from 'react';
import { Map, List } from 'immutable';
import { EditorComponent, rebuildBump } from 'bumps';
import * as TypeConstants from 'bumps/Constants/TypeConstants';
import './scss/index.scss';

let bump;
let onChange;

function render() {
  React.render(React.createElement(EditorComponent, {
    bump, onChange
  }), document.getElementById('root'));
}

bump = rebuildBump({"id":"bump1","name":"PSA","order":["segment-1","segment-2","segment-3","segment-pepe","segment-4","segment-5"],"segments":{"segment-1":{"id":"segment-1","type":"TEXT","duration":2.29,"label":"Text 1","text":"Attention."},"segment-2":{"id":"segment-2","type":"TEXT","duration":2.9,"label":"Text 2","text":"We have an important PSA."},"segment-3":{"id":"segment-3","type":"TEXT","duration":1.05,"label":"Text 3","text":"Go check your oven"},"segment-pepe":{"id":"segment-pepe","type":"IMAGE","duration":1.82,"label":"Rare Pepe","url":"https://i.imgur.com/pEMGBhR.jpg"},"segment-4":{"id":"segment-4","type":"TEXT","duration":2.83,"label":"Text 4","text":"It should be done preheating."},"segment-5":{"id":"segment-5","type":"LOGO","duration":2.09,"label":"Logo"}},"duration":12.99,"audio":{"id":"youtube-audio","type":"YOUTUBE","url":"http://youtube.com/watch?v=sHKsFM6wxmI","start":74,"duration":5,label:"Audio"}});

onChange = (_bump) => {
  bump = _bump;
  render();
};

render();
