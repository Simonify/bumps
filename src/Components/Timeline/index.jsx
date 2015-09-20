import { Map, List, is } from 'immutable';
import React, { Component, PropTypes } from 'react';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd/modules/backends/HTML5';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { TIMELINE_SEGMENT } from '../../Constants/ItemTypeConstants';
import round from '../../Utils/round';
import bindAll from '../../Utils/bindAll';
import TimelineSegmentComponent from './Segment';

@DragDropContext(HTML5Backend)
@DropTarget(TIMELINE_SEGMENT, { drop() {} }, connect => ({
  connectDropTarget: connect.dropTarget()
}))
export default class TimelineComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static propTypes = {
    bump: PropTypes.object.isRequired,
    position: PropTypes.number.isRequired,
    selectedSegmentId: PropTypes.string,
    toggleState: PropTypes.func,
    addSegment: React.PropTypes.func,
    removeSegment: React.PropTypes.func,
    onSelectSegment: PropTypes.func,
    onChangeSegment: PropTypes.func,
    onChangePosition: PropTypes.func,
    onChangeBump: React.PropTypes.func,
    connectDropTarget: PropTypes.func.isRequired
  };

  constructor(props, context) {
    super(props, context);

    bindAll(this, [
      '_onClick', '_onKeyDown', '_onChangeZoom',
      '_startTracker', '_onMoveTracker', '_stopTracker',
      '_moveSegment', '_findIndex', '_rebuildSize',
      '_setContentsRef', '_setVideoSegmentsRef',
      '_getWidthForDuration', 'renderSegment'
    ]);

    this._segmentRef = {};
    this.state = { zoom: 1 };
  }

  componentDidMount() {
    window.addEventListener('keydown', this._onKeyDown, false);
  }

  componentDidUpdate(oldProps, oldState) {
    const position = this._getWidthForDuration(this.props.position);
    const node = React.findDOMNode(this._contentsRef);

    if (position > this._size.width + node.scrollLeft) {
      node.scrollLeft = position;
    } else if (position < node.scrollLeft) {
      node.scrollLeft = position;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this._onKeyDown, this);
  }

  render() {
    const segments = this.props.bump.get('order').map(this.renderSegment);
    const className = `timeline-component${this.state.tracking ? ' is-tracking' : ''}`;

    return this.props.connectDropTarget(
      <div className={className}>
        <div ref={this._setContentsRef} className="timeline-contents" onMouseDown={this._onClick}>
          {this.renderPositionTrack()}
          {this.renderTimeHints()}
          <div className="video-segments" ref={this._setVideoSegmentsRef}>
            {segments}
          </div>
          <div className="audio-segment">
            {this.renderAudioSegment()}
          </div>
        </div>
        <div className="timeline-controls">
          <div className="position">
            {this._secondsToTimecode(this.props.position)}
          </div>
          <div className="zoom">
            <span className="string">
              {this.state.zoom}x
            </span>
            <input
              className="scale"
              type="range"
              min={0.05}
              max={5}
              step={0.05}
              value={this.state.zoom}
              onChange={this._onChangeZoom}
            />
          </div>
        </div>
      </div>
    );
  }

  renderPositionTrack() {
    const left = this._getWidthForDuration(this.props.position) + 'px';
    const style = { transform: `translateX(${left})` };

    return (
      <div
        key="track"
        className="position-track"
        onMouseDown={this._startTracker}
        style={style}
      />
    );
  }

  renderTimeHints() {
    const durationSegmentDuration = this.state.zoom;
    const durationSegmentWidth = this._getWidthForDuration(durationSegmentDuration);
    const durationSegmentsCount = Math.ceil(this.props.bump.get('duration') / durationSegmentDuration);
    const durationSegmentPeaksWidth = durationSegmentWidth / 10;
    const hasText = durationSegmentWidth > 40;
    const hints = [];
    const bumps = [];

    for (let i = 0; i < 10; i++) {
      bumps.push((
        <div
          key={i}
          className={`bump ` + ( i % 2 === 0 ? 'odd' : 'even')}
          style={{ width: `${durationSegmentPeaksWidth}px` }}
        />
      ));
    }

    for (let i = 0; i < durationSegmentsCount; i++) {
      const position = durationSegmentDuration * i;

      hints.push(
        <div key={i} className="hint" style={{ width: `${durationSegmentWidth}px` }}>
          {hasText ? (
            <div className="text">
              {this._secondsToTimecode(position)}
            </div>
          ) : null}
          <div className="bumps" children={bumps} />
        </div>
      )
    }

    return (<div className="time-hints" children={hints} />);
  }

  renderSegment(id) {
    const segment = this.props.bump.getIn(['segments', id]);

    return (
      <TimelineSegmentComponent
        key={id}
        ref={this._setSegmentRef.bind(this, id)}
        segment={segment}
        findIndex={this._findIndex}
        getWidth={this._getWidthForDuration}
        move={this._moveSegment}
        onClick={this.props.onSelectSegment}
        onChange={this.props.onChangeSegment}
        selected={this.props.selectedSegmentId === id}
        zoom={this.state.zoom}
      />
    );
  }

  renderAudioSegment() {
    if (this.props.bump.has('audio')) {
      const audio = this.props.bump.get('audio');

      if (audio.get('url')) {
        return (
          <TimelineSegmentComponent
            key={audio.get('id')}
            getWidth={this._getWidthForDuration}
            segment={audio}
            onChange={this.props.onChangeAudio}
            zoom={this.state.zoom}
          />
        );
      }
    }
  }

  _setSegmentRef(id, ref) {
    this._segmentRef[id] = ref;
  }

  _setVideoSegmentsRef(ref) {
    this._videoSegmentsRef = ref;
  }

  _setContentsRef(ref) {
    this._contentsRef = ref;

    if (ref) {
      this._rebuildSize();
      window.addEventListener('resize', this._rebuildSize, false);
    } else {
      window.removeEventListener('resize', this._rebuildSize, false);
    }
  }

  _onClick(event) {
    if (!this._trackingMouse && event.target === event.currentTarget) {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const first = target.querySelector('.segment');
      const padding = first ? first.offsetLeft : 0;
      const x = (event.clientX + target.scrollLeft - padding - rect.left) / (this.state.zoom * 100);
      const position = Math.max(0, Math.min(x, this.props.bump.get('duration')));

      this.props.onChangePosition(position);
      this.props.onSelectSegment(null);
      this._startTracker(event);
    }
  }

  _startTracker(event) {
    event.preventDefault();
    event.stopPropagation();

    this.setState({ tracking: true });
    this._tooFar = null;
    this._trackingMouse = true;
    this._mouseX = event.clientX;

    document.body.addEventListener('mousemove', this._onMoveTracker, false);
    window.addEventListener('mouseup', this._stopTracker, false);
  }

  _onMoveTracker(event) {
    const node = React.findDOMNode(this._contentsRef);
    const diff = event.clientX - this._mouseX;
    const segmentsContainer = React.findDOMNode(this._videoSegmentsRef);
    const left = (event.clientX - segmentsContainer.offsetLeft - this._size.left + node.scrollLeft);
    const newLeft = this._snapNearestEdge(left, diff);
    const newPosition = this._getDurationFromWidth(newLeft);
    const movedPosition = Math.max(newPosition, 0);
    const position = Math.min(movedPosition, this.props.bump.get('duration'));

    this._mouseX = event.clientX;
    this.props.onChangePosition(position);
  }

  _snapNearestEdge(left, direction) {
    if (direction === 0) {
      return left;
    }

    const order = this.props.bump.get('order').toArray();
    const SNAP_DIFF = 20;

    let paddingLeft = null;

    for (let i = 0; i < order.length; i++) {
      const node = React.findDOMNode(this._segmentRef[order[i]]);

      if (node) {
        let offsetLeft = node.offsetLeft;

        if (paddingLeft === null) {
          paddingLeft = offsetLeft;
        }

        offsetLeft -= paddingLeft;

        if (direction > 0) {
          // going right
          if (offsetLeft > left) {
            // node is further away than the pos
            if (offsetLeft - left <= SNAP_DIFF) {
              return offsetLeft;
            }
          }
        } else if (direction < 0) {
          // going left
          if (offsetLeft < left) {
            if (left - offsetLeft <= SNAP_DIFF) {
              return offsetLeft - (i > 0 ? 1 : 0);
            }
          }
        }
      } else {
        return left;
      }
    }

    return left;
  }

  _stopTracker(event) {
    event.preventDefault();
    this._trackingMouse = false;
    this._mouseX = null;
    document.body.removeEventListener('mousemove', this._onMoveTracker, false);
    window.removeEventListener('mouseup', this._stopTracker, false);
    this.setState({ tracking: false });
  }

  _onChangeZoom(event) {
    this.setState({ zoom: event.target.value });
  }

  _onKeyDown(event) {
    if (event.target === document.body) {
      switch (event.keyCode) {
        default:
          return;
        case 32:
          this.props.toggleState();
          break;
        case 8:
          if (this.props.selectedSegmentId) {
            this.props.removeSegment(this.props.selectedSegmentId);
          }
          break;
        case 219:
          if (event.altKey) {
            this._trimSegment(this.props.selectedSegmentId, true);
          }
          break;
        case 221:
          if (event.altKey) {
            this._trimSegment(this.props.selectedSegmentId);
          }
          break;
        case 67:
          if (event.metaKey) {
            this._copiedSegment = this.props.bump.getIn(['segments', this.props.selectedSegmentId]);
          }
          break;
        case 86:
          if (event.metaKey) {
            if (this._copiedSegment) {
              this.props.addSegment(this._copiedSegment.set('id', null));
            }
          }
          break;
        case 189:
          if (event.metaKey) {
            this._setZoom(this.state.zoom - 0.05);
          }
          break;
        case 187:
          if (event.metaKey) {
            this._setZoom(this.state.zoom + 0.05);
          }
          break;
      }

      event.preventDefault();
    }
  }

  _secondsToTimecode(seconds) {
    const m = '' + Math.floor((seconds * 1000 / (1000 * 60)) % 60);
    const s = '' + Math.floor(seconds % 60);
    const ms = ('' + Math.floor((seconds * 1000) % 1000)).slice(0,2);
    const string = [];

    string.push('00'.substring(m.length) + m);
    string.push('00'.substring(s.length) + s);
    string.push('00'.substring(ms.length) + ms);

    return string.join(':');
  }

  _getWidthForDuration(duration) {
    if (!duration) {
      return 0;
    }

    return ((duration * this.state.zoom) * 100);
  }

  _getDurationFromWidth(width) {
    if (!width) {
      return 0;
    }

    return round((width / this.state.zoom) / 100, 3);
  }

  _moveSegment(id, atIndex) {
    const index = this._findIndex(id);
    const order = this.props.bump.get('order').splice(index, 1).splice(atIndex, 0, id);
    this.props.onChangeBump(this.props.bump.set('order', order));
  }

  _trimSegment(id, fromStart) {
    const segment = this.props.bump.getIn(['segments', id]);

    if (segment) {
      const node = this._segmentRef[id] && React.findDOMNode(this._segmentRef[id]);

      if (node) {
        const duration = segment.get('duration');
        const position = this.props.position;
        const trackerPosition = this._getWidthForDuration(position);
        const segmentLeft = node.offsetLeft - 1 - node.parentNode.offsetLeft;

        if (trackerPosition > segmentLeft) {
          const diff = (trackerPosition - segmentLeft);
          let newDuration = round(this._getDurationFromWidth(diff), 3);
          let durationDiff;

          if (fromStart) {
            newDuration = duration - newDuration;
            durationDiff = duration - newDuration;
          }


          if (newDuration !== duration) {
            if (fromStart) {
              this.props.onChangePosition(position - durationDiff);
            }

            this.props.onChangeSegment(segment.set('duration', newDuration));
          }
        }
      }
    }
  }

  _findIndex(id) {
    return this.props.bump.get('order').indexOf(id);
  }

  _setZoom(zoom) {
    this.setState({
      zoom: round(Math.max(0.05, Math.min(zoom, 5)), 3)
    });
  }

  _rebuildSize() {
    const node = React.findDOMNode(this._contentsRef);

    this._size = {
      width: node.offsetWidth,
      left: node.offsetLeft
    };
  }
}
