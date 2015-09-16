import { is } from 'immutable';
import React, { Component, PropTypes } from 'react';
import * as TypeConstants from 'bumps/Constants/TypeConstants';
import getYT from 'bumps/Utils/Youtube';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
const DEBUG_YOUTUBE = false;
let AUDIO_NODE;

function getAudioNode() {
  if (!AUDIO_NODE) {
    AUDIO_NODE = document.createElement('div');
    AUDIO_NODE.id = 'AUDIO_NODE';
    AUDIO_NODE.style.position = 'absolute';

    if (DEBUG_YOUTUBE) {
      AUDIO_NODE.style.width = '350px';
      AUDIO_NODE.style.height = '350px';
      AUDIO_NODE.style.top = '0px';
      AUDIO_NODE.style.right = '0px';
    } else {
      AUDIO_NODE.style.width = '0px';
      AUDIO_NODE.style.height = '0px';
      AUDIO_NODE.style.top = '-100px';
      AUDIO_NODE.style.right = '-100px';
    }

    document.body.appendChild(AUDIO_NODE);
  }

  return AUDIO_NODE;
}

function releaseAudioNode() {
  if (AUDIO_NODE) {
    AUDIO_NODE.innerHTML = '';
  }
}

export default class AudioPlayerComponent extends Component {
  static defaultProps = {
    volume: 100
  };

  static propTypes = {
    defaultPosition: PropTypes.number.isRequired,
    onChangePosition: React.PropTypes.func.isRequired,
    onReady: PropTypes.func.isRequired,
    onVideoChanged: PropTypes.func.isRequired,
    volume: React.PropTypes.number.isRequired,
    audio: PropTypes.object,
    onError: PropTypes.func
  };

  constructor(props, context) {
    super(props, context);
    this.load = ::this.load;
    this._onReady = ::this._onReady;
    this._onVideoStateChange = ::this._onVideoStateChange;
    this._audioPlayer = null;
    this._loaded = false;
    this.playing = false;
    this.state = this._getStateFromProps(props);
  }

  shouldComponentUpdate(props, state) {
    return (!is(this.props.audio, props.audio));
  }

  componentDidMount() {
    window.setTimeout(this.load, 0);
  }

  componentWillReceiveProps(props) {
    let audioVolumeChanged = false;

    if (!is(this.props.audio, props.audio)) {
      const oldUrl = this.props.audio && this.props.audio.get('url');
      const newUrl = props.audio && props.audio.get('url');

      if (newUrl !== oldUrl){
        const state = this._getStateFromProps(props);

        if (this.state.videoId !== state.videoId) {
          this.props.onVideoChanged();
          this.setState(state, this.load);
        }
      }

      if (
        !this.props.audio && props.audio ||
        !props.audio && this.props.audio ||
        this.props.audio.get('volume') !== props.audio.get('volume')
      ) {
        audioVolumeChanged = true;
      }
    }

    if (audioVolumeChanged || this.props.volume !== props.volume) {
      const volume = this._getVolume(props);
      this._setYouTubeVolume(volume);
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
    this._destroy();
  }

  render() {
    return <span className="audio-player-component" />;
  }

  play() {
    if (!this.props.audio) {
      return Promise.resolve();
    }

    const start = this.props.audio.get('start') || 0;
    const duration = this.props.audio.get('duration');

    if (typeof duration === 'number') {
      if (this.props.defaultPosition > duration) {
        return Promise.resolve();
      }
    }

    if (this.playing) {
      return Promise.resolve();
    }

    this.playing = true;

    return new Promise((resolve, reject) => {
      if (this.state.videoId) {
        this._playPromise = { resolve, reject };

        if (this._loaded) {
          if (this._hasPausedOnce) {
            this._playYouTube();
          }

          this._seekYouTube(
            (this.props.audio.get('start') || 0) + this.props.defaultPosition
          );
        }
      } else {
        resolve();
      }
    });
  }

  seek() {
    if (this.state.videoId && this._loaded && this.playing) {
      this._seekYouTube(
        (this.props.audio.get('start') || 0) + this.props.defaultPosition
      );
    }

    return Promise.resolve();
  }

  pause() {
    if (this.playing) {
      this.playing = false;

      if (this.state.videoId) {
        if (this._loaded) {
          this._hasPausedOnce = true;
          this._pauseYouTube();
        }
      }
    }

    return Promise.resolve();
  }

  _getStateFromProps({ audio }) {
    if (audio) {
      const videoId = this._getVideoId(audio);

      if (videoId) {
        return { videoId, audio };
      }
    }

    return { videoId: null, audio: null };
  }

  load({ videoId, audio } = this.state) {
    this._destroy();

    if (!videoId) {
      this._onReady();
      return;
    }

    const onReady = this._onReady;
    const onStateChange = this._onVideoStateChange;

    switch (audio.get('type')) {
      case TypeConstants.YOUTUBE:
        getYT().then((YT) => {
          this._audioPlayer = new YT.Player(getAudioNode(), {
            videoId,
            height: '100%',
            width: '100%',
            playerVars: {
              fs: 0,
              rel: 0,
              controls: DEBUG_YOUTUBE ? 1 : 0,
              showinfo: 0,
              autoplay: 0,
              modestbranding: 1,
              iv_load_policy: 3
            },
            events: { onReady, onStateChange }
          });
        }, this._onError);
        break;
      default:
        this._onError(new Error('unknown audio type'));
        break;
    }
  }

  _onVideoStateChange(event) {
    if (event.data === window.YT.PlayerState.PLAYING) {
      const position = this._audioPlayer.getCurrentTime() - (this.props.audio.get('start') || 0);
      this._startTracking(position);
    } else if (event.data === 0) {
      this._onFinished();
    }
  }

  _startTracking(position) {
    if (this._playPromise) {
      this._playPromise.resolve(position);
      this._playPromise = null;
    }
  }

  _getVideoId(audio) {
    if (audio) {
      const url = audio.get('url');

      if (url) {
        const match = url.match(YOUTUBE_REGEX);

        if (match) {
          return match[1];
        }
      }
    }

    return false;
  }

  _onReady() {
    if (!this._unmounted) {
      this._loaded = true;

      if (this.state.videoId) {
        this._setYouTubeVolume(this._getVolume(this.props));
      }

      this.props.onReady(this);
    }
  }

  _onError(err) {
    if (this.props.onError) {
      this.props.onError(err);
    } else {
      this.props.onReady(this); // just pretend nothing went wrong. bliss.
    }
  }

  _onFinished() {
    /* hrm */
  }

  _getVolume(props) {
    let sourceVolume = props.audio.get('volume');

    if (sourceVolume === 0) {
      return 0;
    }

    if (typeof sourceVolume !== 'number') {
      sourceVolume = 100;
    }

    return (props.volume / 100) * sourceVolume;
  }

  _destroy() {
    if (this._loaded) {
      this._loaded = false;

      if (this._audioPlayer) {
        this._audioPlayer.destroy();
        this._audioPlayer = null;
      }
    }
  }

  /* YouTube mutators */

  _setYouTubeVolume(volume) {
    if (this._audioPlayer) {
      console.trace('#_setYouTubeVolume', volume);
      this._audioPlayer.setVolume(volume);
    } else {
      console.error('#_setYouTubeVolume', 'Tried to set YT volume when no player exists.');
    }
  }

  _playYouTube() {
    if (this._audioPlayer) {
      console.trace('#_playYouTube');
      this._audioPlayer.playVideo();
    } else {
      console.error('#_playYouTube', 'Tried to play YT when no player exists.');
    }
  }

  _pauseYouTube() {
    if (this._audioPlayer) {
      console.trace('#_pauseYouTube');
      this._audioPlayer.pauseVideo();
    } else {
      console.error('#_pauseYouTube', 'Tried to pause YT when no player exists.');
    }
  }

  _seekYouTube(seek) {
    if (this._audioPlayer) {
      console.trace('#_seekYouTube', seek);
      this._audioPlayer.seekTo(seek);
    } else {
      console.error('#_seekYouTube', 'Tried to seek YT when no player exists.');
    }
  }
}
