import { is } from 'immutable';
import React, { Component } from 'react';
import * as TypeConstants from 'bumps/Constants/TypeConstants';
import getYT from 'bumps/Utils/Youtube';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
let AUDIO_NODE;

function getAudioNode() {
  if (!AUDIO_NODE) {
    AUDIO_NODE = document.createElement('div');
    AUDIO_NODE.id = 'AUDIO_NODE';
    AUDIO_NODE.style.position = 'absolute';
    AUDIO_NODE.style.width = '0px';
    AUDIO_NODE.style.height = '0px';
    AUDIO_NODE.style.top = '-10px';
    AUDIO_NODE.style.right = '-10px';
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
  static propTypes = {
    onReady: React.PropTypes.func.isRequired,
    onError: React.PropTypes.func.isRequired,
    defaultPosition: React.PropTypes.number.isRequired,
    audio: React.PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
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
    this._load(this.state);
  }

  componentWillReceiveProps(props) {
    if (!is(this.props.audio, props.audio)) {
      const state = this._getStateFromProps(props);

      if (this.state.videoId !== state.videoId || !is(this.state.video, state.video)) {
        this._load(state);
      }
    }
  }

  componentWillUnmount() {
    this._destroy();
  }

  render() {
    return <span className="audio-player-component" />;
  }

  play() {
    const start = this.props.audio.get('start');
    const duration = this.props.audio.get('duration');

    if (typeof duration === 'number') {
      if (this.props.defaultPosition > duration) {
        return Promise.resolve();
      }
    }

    this.playing = true;

    return new Promise((resolve, reject) => {
      if (this.state.videoId) {
        this._playPromise = { resolve, reject };

        if (this._loaded) {
          this._audioPlayer.playVideo();
          this._audioPlayer.seekTo(this.props.audio.get('start') + this.props.defaultPosition);
        }
      } else {
        resolve();
      }
    });
  }

  seek() {
    if (this.state.videoId && this._loaded && this.playing) {
      this._audioPlayer.seekTo(this.props.audio.get('start') + this.props.defaultPosition);
    }

    return Promise.resolve();
  }

  pause() {
    if (this.playing) {
      this.playing = false;

      if (this.state.videoId) {
        if (this._loaded) {
          this._audioPlayer.pauseVideo();
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

  _load({ videoId, audio }) {
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
              controls: 0,
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
      this._startTracking();
    } else if (event.data === 0) {
      this._onFinished();
    }
  }

  _startTracking() {
    if (this._playPromise) {
      this._playPromise.resolve();
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
    this._loaded = true;
    this.props.onReady(this);
  }

  _onError(err) {
    this.props.onError(err);
  }

  _onFinished() {
    /* hrm */
  }

  _destroy() {
    this._loaded = false;

    if (this._audioPlayer) {
      this._audioPlayer.destroy();
    }
  }
}
