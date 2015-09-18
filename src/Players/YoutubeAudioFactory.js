import getAPI from './YouTube/getAPI';
import getDOMNode, { releaseDOMNode } from './YouTube/getDOMNode';
import AudioPlayer from './YouTube/AudioPlayer';

const DEBUG_YOUTUBE = window.DEBUG_YOUTUBE || false;
const width = '100%';
const height = '100%';
const playerVars = {
  fs: 0,
  rel: 0,
  controls: DEBUG_YOUTUBE ? 1 : 0,
  showinfo: 0,
  autoplay: 0,
  modestbranding: 1,
  iv_load_policy: 3
};

export default function YoutubeAudioFactory() {
  const STATE_CHANGE_HANDLERS = [];
  let DESTROYED = false;
  let PLAYER;
  let PLAYER_PROMISE;
  let DOM_NODE;

  function _getDOMNode() {
    if (!DOM_NODE) {
      DOM_NODE = getDOMNode(DEBUG_YOUTUBE);
    }

    return DOM_NODE;
  }

  function onStateChange(event) {
    for (let i = 0; i < STATE_CHANGE_HANDLERS.length; i++) {
      STATE_CHANGE_HANDLERS[i](event);
    }
  }

  function createStateChangeHandler(fn) {
    STATE_CHANGE_HANDLERS.push(fn);
  }

  function releaseStateChangeHandler(fn) {
    const index = STATE_CHANGE_HANDLERS.indexOf(fn);

    if (index > -1) {
      STATE_CHANGE_HANDLERS.splice(index, 1);
    }
  }

  function getPlayer(YT) {
    if (PLAYER) {
      return Promise.resolve(PLAYER);
    }

    if (!PLAYER_PROMISE) {
      PLAYER_PROMISE = new Promise((resolve, reject) => {
        const _player = new YT.Player(_getDOMNode(), {
          height, width, playerVars,
          events: {
            onStateChange,
            onReady() {
              PLAYER = _player;
              resolve(PLAYER);
            }
          }
        });
      });
    }

    return PLAYER_PROMISE;
  }

  const getYouTubePlayer = (props) => {
    if (DESTROYED) {
      throw new Error('YouTubeAudioFactory was already destroyed');
    }

    let cancelled = false;

    const promise = new Promise((resolve, reject) => {
      getAPI().then((YT) => {
        getPlayer(YT).then((player) => {
          if (!DESTROYED && !cancelled) {
            resolve(new AudioPlayer(props, {
              YT, player,
              createStateChangeHandler, releaseStateChangeHandler
            }));
          }
        }, reject);
      }, reject);
    });

    promise.cancel = () => {
      cancelled = true;
    };

    return promise;
  };

  getYouTubePlayer.destroy = () => {
    DESTROYED = true;
    PLAYER_PROMISE = null;

    if (PLAYER) {
      PLAYER.destroy();
      PLAYER = null;
    }

    if (DOM_NODE) {
      releaseDOMNode(DOM_NODE);
      DOM_NODE = null;
    }
  };

  return getYouTubePlayer;
}
