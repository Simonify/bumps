import { is } from 'immutable';
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as TypeConstants from 'bumps/Constants/TypeConstants';
import getSegmentForPosition from 'bumps/Utils/getSegmentForPosition';
import sortSegments from 'bumps/Utils/sortSegments';
import SegmentComponent from 'bumps/Components/Segment';
import AudioPlayerComponent from './Audio';

let LOAD_IDS = 0;

export default class PlayerComponent extends Component {
  static defaultProps = {
    playing: false,
    preload: false,
    defaultPosition: 0
  };

  static propTypes = {
    bump: React.PropTypes.object.isRequired,
    preload: React.PropTypes.bool.isRequired,
    playing: React.PropTypes.bool.isRequired,
    defaultPosition: React.PropTypes.number.isRequired,
    volume: React.PropTypes.number,
    onFinished: React.PropTypes.func,
    onChangePosition: React.PropTypes.func
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
      position: props.defaultPosition,
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

      if (this.props.bump.get('segments') !== segments) {
        const sortedSegments = sortSegments(segments, props.bump.get('order'));
        const segment = getSegmentForPosition({ segments: sortedSegments });
        this.setState({ segment, sortedSegments });
      }
    }
  }

  shouldComponentUpdate

  componentWillUnmount() {
    releaseAudioNode();
    this._audioLoaded = null;
  }

  render() {
    let className = 'player-component';
    let segment;

    if (this.state.ready) {
      className += ' is-ready';

      if (this.state.segment) {
        segment = this.renderSegment(this.state.segment);
      }
    } else {
      className += ' is-loading';
      segment = (<div className="loader" />);
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
    return <SegmentComponent segment={segment} />;
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
      console.log('#audioReady', false);
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
    console.log('#_onAudioReady');
    if (ref === this._audioRef) {
      console.log('#audioReady', true);
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
      this._seek();
    }
  }

  _onAudioPlaying(position) {
    if (this.state.ready) {
      if (typeof position === 'number') {
        this.setState({ position });
      }

      this._start = Date.now();
      this._ts = Date.now();

      window.requestAnimationFrame(this._onAnimationFrame);
    }
  }

  _seek() {
    if (this.state.ready) {
      const position = this.props.defaultPosition;
      const segments = this.state.sortedSegments;
      const segment = getSegmentForPosition({ segments, position });

      this.setState({ position, segment });
      return this._audioRef.seek();
    }
  }

  _onChangePosition(position) {
    const segments = this.state.sortedSegments;
    const segment = getSegmentForPosition({ segments, position });
    this.setState({ position, segment });
    this.props.onChangePosition && this.props.onChangePosition(position);
  }

  _onAnimationFrame() {
    if (this.state.ready && this.props.playing) {
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
        this.setState({ position, segment });
        this.props.onChangePosition && this.props.onChangePosition(position);
        window.requestAnimationFrame(this._onAnimationFrame);
      } else {
        this.setState({ position, segment: null });
        this.props.onChangePosition && this.props.onChangePosition(position);
        this.props.onFinished && this.props.onFinished();
      }
    }
  }
}
