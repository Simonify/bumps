import { is } from 'immutable';
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as TypeConstants from 'bumps/Constants/TypeConstants';
import getSegmentForPosition from 'bumps/Utils/getSegmentForPosition';
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
    this._setAudioRef = ::this._setAudioRef;
    this._onAudioReady = ::this._onAudioReady;
    this._onChangePosition = ::this._onChangePosition;
    this._onAnimationFrame = ::this._onAnimationFrame;
    this.state = {
      ready: false,
      position: props.defaultPosition,
      segment: null
    };
  }

  componentDidMount() {
    this._preload(this.props);
  }

  componentWillReceiveProps(props) {
    const oldId = this.props.bump && this.props.bump.get('id');
    const newId = props.bump && props.bump.get('id');

    if (oldId !== newId) {
      this._preload(props);
      return;
    } else if (this.state.segment) {
      if (!is(this.props.bump.get('segments'), props.bump.get('segments'))) {
        const segment = getSegmentForPosition(props.bump, this.state.position);

        if (
          !segment ||
          segment.get('id') !== this.state.segment.get('id') ||
          !is(this.state.segment, segment)
        ) {
          this.setState({ segment });
        }
      }
    }

    if (this.props.playing !== props.playing) {
      if (props.playing) {
        this._play(props);
      } else {
        this._pause(props);
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
      segment = (
        <div>Loading...</div>
      )
    }

    return (
      <div className={className}>
        {segment}
        <AudioPlayerComponent
          key={this.props.bump.get('id') + 'audio'}
          ref={this._setAudioRef}
          volume={this.props.volume}
          audio={this.props.bump.get('audio')}
          onReady={this._onAudioReady}
          onError={this._onAudioError}
          defaultPosition={this.state.position}
          onChangePosition={this._onChangePosition}
        />
      </div>
    );
  }

  renderSegment(segment) {
    return <SegmentComponent segment={segment} />;
  }

  _preload({ preload, bump }) {
    this._loadId = ++LOAD_IDS;

    const promises = [];
    const loaded = {};

    bump.get('segments').forEach((segment) => {
      switch (segment.get('type')) {
        default:
          break;
        case TypeConstants.IMAGE:
          if (segment.get('url')) {
            promises.push(new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = resolve;
              image.onerror = resolve;
              image.src = segment.get('url');
            }));
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

    const onLoaded = () => {
      this._preLoaded = true;

      if (this._audioReady) {
        this._isReady();
      }
    };

    if (!preload) {
      onLoaded();
      return null;
    }

    this.setState({ ready: false });
    this._preLoaded = false;

    const promise = Promise.all(promises);
    promise.then(onLoaded);

    return promise;
  }

  _onAudioReady() {
    this._audioReady = true;

    const loadId = this._loadId;

    if (this._preLoaded) {
      this._isReady();
    }
  }

  _isReady() {
    this.setState({ ready: true });
    /** Audio track is ready **/
    if (this.props.playing) {
      this._play();
    } else {
      this._seek();
    }
  }

  _play(props = this.props) {
    if (this.state.ready && !this._playing) {
      this._playing = true;

      this.setState({ position: props.defaultPosition }, () => {
        this._audioRef.play().then(() => {
          this._start = Date.now();
          this._ts = Date.now();
          window.requestAnimationFrame(this._onAnimationFrame);
        });
      });
    }
  }

  _seek() {
    if (this.state.ready) {
      const position = this.props.defaultPosition;
      const segment = getSegmentForPosition(this.props.bump, position);

      this.setState({ position, segment });
      return this._audioRef.seek();
    }
  }

  _pause(props = this.props) {
    if (this.state.ready) {
      if (this._playing) {
        this._playing = false;
        return this._audioRef.pause();
      } else {
        return Promise.resolve();
      }
    }
  }

  _setAudioRef(ref) {
    if (!ref) {
      this._audioReady = false;
    }

    this._audioRef = ref;
  }

  _onChangePosition(position) {
    const segment = getSegmentForPosition(this.props.bump, position);
    this.setState({ position, segment });
    this.props.onChangePosition && this.props.onChangePosition(position);
  }

  _onAnimationFrame() {
    if (this.props.playing) {
      const duration = this.props.bump.get('duration');
      const now = Date.now();
      const diff = (now - this._ts) / 1000;
      this._ts = now;

      const position = Math.min(this.state.position + diff, duration);

      if (position >= this.props.bump.getIn(['audio', 'duration'])) {
        if (this._audioRef.playing) {
          this._audioRef.pause();
        }
      }

      const segment = getSegmentForPosition(this.props.bump, position);

      this.setState({ position, segment });
      this.props.onChangePosition && this.props.onChangePosition(position);

      if (position < duration) {
        window.requestAnimationFrame(this._onAnimationFrame);
      } else {
        this.props.onFinished && this.props.onFinished();
      }
    }
  }
}
