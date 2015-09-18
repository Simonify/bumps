import { is } from 'immutable';
import React, { Component, PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import * as TypeConstants from '../../Constants/TypeConstants';
import getSegmentForPosition from '../../Utils/getSegmentForPosition';
import getVideoIdFromAudio from '../../Utils/getVideoIdFromAudio';
import sortSegments from '../../Utils/sortSegments';
import YouTubeAudioFactory from '../../Players/YouTubeAudioFactory';
import SegmentComponent from '../../Components/Segment';

let LOAD_IDS = 0;

export default class PlayerComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static defaultProps = {
    playing: false,
    preload: false,
    volume: 100,
    defaultPosition: 0,
    persistYoutubePlayer: false
  };

  static propTypes = {
    bump: PropTypes.object.isRequired,
    preload: PropTypes.bool.isRequired,
    playing: PropTypes.bool.isRequired,
    defaultPosition: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.func
    ]).isRequired,
    className: PropTypes.string,
    onReady: PropTypes.func,
    onFinished: PropTypes.func,
    onChangePosition: PropTypes.func,
    volume: PropTypes.number,
    youtubeAudioFactory: PropTypes.func
  };

  constructor(props, context) {
    super(props, context);
    this._loadId = 0;
    this._audioPlayer = null;
    this._onAnimationFrame = ::this._onAnimationFrame;
    this._onBumpReady = ::this._onBumpReady;

    this._getAudioSeek = ::this._getAudioSeek;
    this._onAudioSeekUpdate = ::this._onAudioSeekUpdate;

    this.state = {
      ready: false,
      position: this._getDefaultPosition(props),
      segment: null,
      sortedSegments: null
    };
  }

  componentDidMount() {
    this._initializeBump(this.props);
  }

  componentWillReceiveProps(props) {
    const oldId = this.props.bump && this.props.bump.get('id');
    const newId = props.bump && props.bump.get('id');

    if (oldId !== newId) {
      this._initializeBump(props, this.props);
      return;
    } else {
      const segments = props.bump.get('segments');
      const state = {};

      if (this.props.bump.get('segments') !== segments) {
        state.sortedSegments = sortSegments(segments, props.bump.get('order'));
        state.segment = getSegmentForPosition({
          segments: sortedSegments,
          position: this.state.position
        });
      }

      let audioChanged = !is(this.props.bump.get('audio'), props.bump.get('audio'));

      if (audioChanged) {
        const oldUrl = this.props.bump.getIn(['audio', 'url']);
        const newUrl = props.bump.getIn(['audio', 'url']);
        audioChanged = (newUrl !== oldUrl);

        if (audioChanged) {
          state.ready = false;

          this._audioPlayer && this._audioPlayer.pause();
          this._loadAudio(props, ++this._loadId).then(this._onBumpReady);
        }
      }

      if (this.props.playing !== props.playing) {
        if (props.playing) {
          state.position = this._getDefaultPosition(props);
        }

        if (!audioChanged && this._audioPlayer) {
          if (props.playing) {
            this._audioPlayer && this._audioPlayer.play(this._getAudioSeek(props));
          } else {
            this._audioPlayer && this._audioPlayer.pause();
          }
        }
      } else if (!audioChanged && this.props.playing) {
        const oldStart = this.props.bump.getIn(['audio', 'start']);
        const newStart = props.bump.getIn(['audio', 'start']);

        if (oldStart !== newStart) {
          this._audioPlayer.setSeek(this._getAudioSeek(props));
        }
      }

      if (state) {
        this.setState(state);
      }
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
    this._destroyAudioPlayer();
    this._destroyAudioFactory();
  }

  render() {
    let className = 'player-component';
    let segment;

    if (this.props.playing) {
      className += ' is-playing';
    }

    if (this.state.ready) {
      className += ' is-ready';

      if (this.state.segment) {
        segment = this.renderSegment(this.state.segment);
      }
    } else {
      className += ' is-loading';
      segment = (<div className="loader" />);
    }

    if (this.props.className) {
      className += ` ${this.props.className}`;
    }

    return (<div className={className}>{segment}</div>);
  }

  renderSegment(segment) {
    return <SegmentComponent key={segment.get('id')} segment={segment} />;
  }

  seek(position) {
    if (this.state.ready) {
      const position = this._getDefaultPosition();
      const segments = this.state.sortedSegments;
      const segment = getSegmentForPosition({ segments, position });

      this._seeking = true;
      this.setState({ position, segment });

      if (this._audioPlayer && this.props.playing) {
        this._audioPlayer.setSeek(this._getAudioSeek(this.props));
      }
    }
  }

  _initializeBump(props, oldProps) {
    const { preload, bump } = props;
    const loadId = this._loadId = ++LOAD_IDS;
    const sortedSegments = sortSegments(bump.get('segments'), bump.get('order'));

    this.setState({ ready: false, segment: null, sortedSegments });

    const preloadAssets = this._preloadSegmentAssets(sortedSegments);
    const promises = [
      this._loadAudio(props, loadId)
    ];

    if (this.props.preload) {
      promises.push(preloadAssets);
    }

    Promise.all(promises).then(this._onBumpReady.bind(this, loadId));
  }

  _onBumpReady() {
    const position = this._getDefaultPosition();
    const segments = this.state.sortedSegments;
    const segment = getSegmentForPosition({ segments, position });
    this.setState({ ready: true, segment });

    if (this.props.playing) {
      this._ts = Date.now();
      window.requestAnimationFrame(this._onAnimationFrame);
    }
  }

  _getDefaultPosition(props = this.props) {
    if (typeof props.defaultPosition === 'function') {
      return props.defaultPosition();
    }

    return props.defaultPosition;
  }

  _loadAudio(props, loadId) {
    const bump = props.bump;
    const audio = bump.get('audio');
    const videoId = getVideoIdFromAudio(audio);

    if (videoId) {
      return new Promise((resolve, reject) => {
        const seek = this._getAudioSeek;
        const volume = this._getAudioVolume(props);
        const onSeekUpdate = this._onAudioSeekUpdate;
        const getPlayer = this._getYouTubePlayer({
          videoId, seek, volume, onSeekUpdate
        });

        getPlayer.then((youtubeAudioPlayer) => {
          if (loadId === this._loadId) {
            this._audioPlayer = youtubeAudioPlayer;
            this._audioPlayer.initialize(this.props.playing).then(resolve, reject);
          }
        }, () => {
          if (loadId === this._loadId) {
            reject();
          }
        });
      });
    } else if (this._audioPlayer) {
      this._destroyAudioPlayer();
    }

    return Promise.resolve();
  }

  _getAudioSeek(props = this.props) {
    const position = this._getDefaultPosition(props);
    const start = props.bump.getIn(['audio', 'start']) || 0;
    return start + position;
  }

  _getAudioVolume(props) {
    let sourceVolume = props.bump.getIn(['audio', 'volume']);

    if (sourceVolume === 0) {
      return 0;
    }

    if (typeof sourceVolume !== 'number') {
      sourceVolume = 100;
    }

    return (props.volume / 100) * sourceVolume;
  }

  _onAudioSeekUpdate(seek) {
    this._seeking = false;

    const start = this.props.bump.getIn(['audio', 'start']) || 0;
    const position = seek - start;
    const segments = this.state.sortedSegments;
    const segment = getSegmentForPosition({ segments, position });
    this.setState({ position, segment });
    this.props.onChangePosition && this.props.onChangePosition(position);

    if (this.props.playing && !this._ts) {
      this._ts = Date.now();
      window.requestAnimationFrame(this._onAnimationFrame);
    }
  }

  _getYouTubePlayer(props) {
    if (this.props.youtubeAudioFactory) {
      return this.props.youtubeAudioFactory(props);
    }

    if (!this._youtubeAudioFactory) {
      this._youtubeAudioFactory = new YouTubeAudioFactory();
    }

    return this._youtubeAudioFactory(props);
  }

  _preloadSegmentAssets(segments) {
    const loaded = {};
    const promises = [];

    segments.forEach((segment) => {
      switch (segment.get('type')) {
        default:
          break;
        case TypeConstants.IMAGE:
          const url = segment.get('url');

          if (url) {
            if (!loaded[url]) {
              loaded[url] = true;

              promises.push(new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = resolve;
                image.onerror = resolve;
                image.src = segment.get('url');
              }));
            }
          }
          break;

        case TypeConstants.LOGO:
          if (!loaded.logo) {
            loaded.logo = true;

            promises.push(new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = resolve;
              image.onerror = reject;
              image.src = 'http://i.imgur.com/tmemlQd.png';
            }));
          }
          break;
      }
    });

    return Promise.all(promises);
  }

  _onAnimationFrame() {
    if (this._unmounted) {
      return;
    }

    if (!this._seeking && this.state.ready && this.props.playing) {
      const duration = this.props.bump.get('duration');
      const now = Date.now();
      const diff = (now - this._ts) / 1000;
      this._ts = now;

      const position = Math.min(this.state.position + diff, duration);

      if (position >= this.props.bump.getIn(['audio', 'duration'])) {
        // Pause the audio ASAP.

        if (this._audioPlayer) {
          this._audioPlayer.pause();
        }
      }

      const segments = this.state.sortedSegments;
      const segment = getSegmentForPosition({ segments, position });

      if (position < duration) {
        const state = { position };

        if (segment !== this.state.segment) {
          state.segment = segment;
        }

        this.setState(state);
        this.props.onChangePosition && this.props.onChangePosition(position);
        window.requestAnimationFrame(this._onAnimationFrame);

        return;
      } else {
        this.setState({ position, segment: null });
        this.props.onChangePosition && this.props.onChangePosition(position);
        this.props.onFinished && this.props.onFinished();
      }
    }

    this._ts = null;
  }

  _destroyAudioPlayer() {
    if (this._audioPlayer) {
      this._audioPlayer.destroy();
      this._audioPlayer = null;
    }
  }

  _destroyAudioFactory() {
    if (this._youtubeAudioFactory) {
      this._youtubeAudioFactory.destroy();
      this._youtubeAudioFactory = null;
    }
  }
}
