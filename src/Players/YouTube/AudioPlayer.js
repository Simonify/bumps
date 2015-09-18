import * as PlayerConstants from '../../Constants/PlayerConstants';

export default class YouTubeAudioPlayer {
  constructor(props) {
    this._onStateChange = ::this._onStateChange;
    this._YT = props.YT;
    this._player = props.player;
    this._videoId = props.videoId;
    this._state = PlayerConstants.IDLE;
    this._onSeekUpdate = props.onSeekUpdate;
    this._position = props.seek || props.position || 0;
    this._volume = null;
    this._waitingForStatus = {};
    this._bindToPlayer();
    this.setVolume(props.volume);
  }

  initialize(playing) {
    return new Promise((resolve, reject) => {
      this._load(this._videoId).then(() => {
        if (this._state === PlayerConstants.CUED) {
          if (playing) {
            this._waitForStatus(this._YT.PlayerState.PLAYING, resolve);
            this.seek(this._position);
            return;
          } else {
            this.pause();
          }
        }

        resolve();
      }, reject);
    });
  }

  _bindToPlayer() {
    this._player.addEventListener('onStateChange', this._onStateChange, false);
  }

  _unbindFromPlayer() {
    this._player.removeEventListener('onStateChange', this._onStateChange, false);
  }

  _load(id) {
    this._state = PlayerConstants.LOADING;

    return new Promise((resolve, reject) => {
      this._waitForStatus(this._YT.PlayerState.CUED, () => {
        if (this._state === PlayerConstants.LOADING) {
          this._state = PlayerConstants.CUED;
        }

        resolve();
      });

      this._player.cueVideoById(id);
    });
  }

  setSeek(seek) {
    this._position = seek;
    this.seek();
  }

  seek(position = this._position) {
    const RESUMABLE_STATES = [PlayerConstants.CUED, PlayerConstants.PLAYING, PlayerConstants.PAUSED];

    if (RESUMABLE_STATES.indexOf(this._state) > -1) {
      const seek = typeof position === 'function' ? position() : position;
      this._player.seekTo(seek);

      if (this._state === PlayerConstants.PAUSED) {
        this._player.playVideo();
      }

      return Promise.resolve();
    } else if (this._state === PlayerConstants.LOADING) {
      this._position = position;
      return Promise.resolve();
    } else {
      console.error('Trying to seek player in an invalid state');
    }
  }

  play(seek) {
    if (this._state === PlayerConstants.PAUSED) {
      if (seek) {
        this.setSeek(seek);
        return;
      }
      
      this.seek();
    } else {
      console.error('Tried to play when not paused.');
    }
  }

  pause() {
    if (this._state === PlayerConstants.CUED || this._state === PlayerConstants.PLAYING) {
      this._state = PlayerConstants.PAUSED;
      this._player.pauseVideo();
      return Promise.resolve();
    }

    this._state = PlayerConstants.PAUSED;
  }

  setVolume(volume) {
    if (this._volume !== volume) {
      this._volume = volume;
      this._player.setVolume(volume);
    }
  }

  destroy() {
    this._player.stopVideo();
    this._state = PlayerConstants.IDLE;
    this._unbindFromPlayer();
    this._YT = null;
    this._player = null;
    this._videoId = null;
    this._position = null;
    this._waitingForStatus = null;
  }

  _waitForStatus(status, callback) {
    if (!this._waitingForStatus[status]) {
      this._waitingForStatus[status] = [];
    }

    this._waitingForStatus[status].push(callback);
  }

  _onStateChange(event) {
    if (this._waitingForStatus) {
      if (this._waitingForStatus[event.data]) {
        for (let i = 0; i < this._waitingForStatus[event.data].length; i++) {
          this._waitingForStatus[event.data][i]();
        }

        delete this._waitingForStatus[event.data];
      }
    }

    if (event.data === window.YT.PlayerState.PLAYING) {
      this._state = PlayerConstants.PLAYING;
      this._onSeekUpdate && this._onSeekUpdate(this._player.getCurrentTime());
    }
  }

  _destroy() {
    this._yt = null;

    if (this._player) {
      this._player.destroy();
      this._player = null;
    }

    if (this._playerPromise) {
      this._playerPromise.cancel();
      this._playerPromise = null;
    }

    this._destroyDOMNode();
  }
}
