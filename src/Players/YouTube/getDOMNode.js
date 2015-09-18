let YOUTUBE_NODE_ID = 0;

export default function getDOMNode(debug) {
  const domNode = document.createElement('div');
  domNode.id = `AUDIO_NODE_${++YOUTUBE_NODE_ID}`;
  domNode.style.position = 'absolute';

  if (debug) {
    domNode.style.width = '350px';
    domNode.style.height = '350px';
    domNode.style.top = '0px';
    domNode.style.right = '0px';
  } else {
    domNode.style.width = '0px';
    domNode.style.height = '0px';
    domNode.style.top = '-100px';
    domNode.style.right = '-100px';
  }

  document.body.appendChild(domNode);

  return domNode;
}

export function releaseDOMNode(node) {
  node.parentNode.removeChild(node);
}
