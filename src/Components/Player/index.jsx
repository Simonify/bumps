import { is } from 'immutable';
import React, { Component, PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import * as TypeConstants from '../../Constants/TypeConstants';
import getSegmentForPosition from '../../Utils/getSegmentForPosition';
import sortSegments from '../../Utils/sortSegments';
import SegmentComponent from '../../Components/Segment';
import AudioPlayerComponent from './Audio';

let LOAD_IDS = 0;

export default class PlayerComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static defaultProps = {
    playing: false,
    preload: false,
    defaultPosition: 0
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
    volume: PropTypes.number,
    onFinished: PropTypes.func,
    onChangePosition: PropTypes.func
  };

  constructor(props, context) {
    super(props, context);
    this._loadId = 0;
    this._onChangePosition = ::this._onChangePosition;
    this._onAnimationFrame = ::this._onAnimationFrame;
    this._setAudioRef = ::this._setAudioRef;
    this._onAudioReady = ::this._onAudioReady;
    this._onAudioPlaying = ::this._onAudioPlaying;
    this._onVideoChanged = ::this._onVideoChanged;

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
      this._initializeBump(props);
      return;
    } else {
      const segments = props.bump.get('segments');
      let state;

      if (this.props.bump.get('segments') !== segments) {
        const sortedSegments = sortSegments(segments, props.bump.get('order'));
        const segment = getSegmentForPosition({
          segments: sortedSegments,
          position: this.state.position
        });

        state = { segment, sortedSegments };
      }

      if (this.props.playing !== props.playing && props.playing) {
        if (!state) {
          state = {};
        }

        state.position = this._getDefaultPosition(props);
      }

      if (state) {
        this.setState(state);
      }
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
    this._audioLoaded = null;
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

    return (
      <div className={className}>
        {segment}
        <AudioPlayerComponent
          key={this.props.bump.get('id') + 'audio'}
          ref={this._setAudioRef}
          volume={this.props.volume}
          playing={this.state.ready && this.props.playing}
          audio={this.props.bump.get('audio')}
          onReady={this._onAudioReady}
          onPlay={this._onAudioPlaying}
          onError={this._onAudioError}
          onVideoChanged={this._onVideoChanged}
          defaultPosition={this.state.position}
          onChangePosition={this._onChangePosition}
        />
      </div>
    );
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

      return this._audioRef.seek(position);
    }
  }

  _getDefaultPosition(props = this.props) {
    if (typeof props.defaultPosition === 'function') {
      return props.defaultPosition();
    }

    return props.defaultPosition;
  }

  _initializeBump({ preload, bump }) {
    /** Reset state **/
    const loadId = this._loadId = ++LOAD_IDS;
    const sortedSegments = sortSegments(bump.get('segments'), bump.get('order'));

    this._preLoaded = false;
    this._audioReady = false;
    this.setState({ ready: false, segment: null, sortedSegments });

    const promises = [];
    const loaded = {};

    bump.get('segments').forEach((segment) => {
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

    if (this.props.preload) {
      Promise.all(promises).then(this._onAssetsLoaded.bind(this, loadId));
    } else {
      this._onAssetsLoaded(loadId);
    }
  }

  _setAudioRef(ref) {
    this._audioRef = ref;

    if (!ref) {
      this.setState({ ready: false });
      this._audioReady = false;
    }
  }

  _onAssetsLoaded(loadId) {
    if (loadId === this._loadId) {
      this._assetsLoaded = true;

      if (this._audioReady) {
        this._isReady();
      }
    }
  }

  _onAudioReady(ref) {
    if (ref === this._audioRef) {
      this._audioReady = true;

      if (this._assetsLoaded) {
        this._isReady();
      }
    }
  }

  _onVideoChanged() {
    this.setState({ ready: false });
    this._audioReady = false;
  }

  _isReady() {
    this.setState({ ready: true });

    if (!this.props.playing) {
      this.seek();
    }
  }

  _onAudioPlaying(position) {
    if (this._seeking) {
      this._seeking = false;
    }

    if (this.state.ready) {
      if (typeof position === 'number') {
        this.setState({ position });
      }

      this._ts = Date.now();

      window.requestAnimationFrame(this._onAnimationFrame);
    }
  }

  _onChangePosition(position) {
    const segments = this.state.sortedSegments;
    const segment = getSegmentForPosition({ segments, position });
    this.setState({ position, segment });
    this.props.onChangePosition && this.props.onChangePosition(position);
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

        if (this._audioRef.playing) {
          this._audioRef.pause();
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
}
