import getAPI from './YouTube/getAPI';
import getDOMNode, { releaseDOMNode } from './YouTube/getDOMNode';
import AudioPlayer from './YouTube/AudioPlayer';

const DEBUG_YOUTUBE = false;
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

  function getPlayer(YT) {
    if (PLAYER) {
      return Promise.resolve(PLAYER);
    }

    if (!PLAYER_PROMISE) {
      PLAYER_PROMISE = new Promise((resolve, reject) => {
        const _player = new YT.Player(_getDOMNode(), {
          height, width, playerVars,
          events: {
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

  return function getYouTubePlayer(props) {
    if (DESTROYED) {
      throw new Error('YouTubeAudioFactory was already destroyed');
    }

    this.destroy = () => {
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

    return new Promise((resolve, reject) => {
      getAPI().then((YT) => {
        getPlayer(YT).then((player) => {
          resolve(new AudioPlayer({ ...props, YT, player }));
        }, reject);
      }, reject);
    });
  }
}