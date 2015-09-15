import React, { Component, PropTypes } from 'react';
import { Map, List, is } from 'immutable';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd/modules/backends/HTML5';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as TypeConstants from 'bumps/Constants/EditorConstants';
import * as ItemTypeConstants from 'bumps/Constants/ItemTypeConstants';
import TimelineSegmentComponent from './Segment';

const timelineTarget = {
  drop() {
  }
};

@DragDropContext(HTML5Backend)
@DropTarget(ItemTypeConstants.TIMELINE_SEGMENT, timelineTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
export default class TimelineComponent extends Component {
  static propTypes = {
    bump: PropTypes.object.isRequired,
    position: PropTypes.number.isRequired,
    selectedSegmentId: PropTypes.string,
    toggleState: PropTypes.func,
    removeSegment: React.PropTypes.func,
    onSelectSegment: PropTypes.func,
    onChangeSegment: PropTypes.func,
    onChangePosition: PropTypes.func,
    onChangeBump: React.PropTypes.func,

    connectDropTarget: PropTypes.func.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this._onClick = ::this._onClick;
    this._onKeyDown = ::this._onKeyDown;
    this._stopTracker = ::this._stopTracker;
    this.renderSegment = ::this.renderSegment;
    this._startTracker = ::this._startTracker;
    this._onMoveTracker = ::this._onMoveTracker;
    this._getWidthForDuration = ::this._getWidthForDuration;
    this._findIndex = ::this._findIndex;
    this._moveSegment = ::this._moveSegment;
    this.state = { zoom: 1 };
  }

  componentDidMount() {
    window.addEventListener('keydown', this._onKeyDown, this);
  }

  shouldComponentUpdate

  componentWillUnmount() {
    window.removeEventListener('keydown', this._onKeyDown, this);
  }

  render() {
    const segments = this.props.bump.get('order').map(this.renderSegment);
    const className = `timeline-component${this.state.tracking ? ' is-tracking' : ''}`;

    return this.props.connectDropTarget(
      <div className={className} onMouseDown={this._onClick}>
        {this.renderPositionTrack()}
        <div className="video-segments">{segments}</div>
        <div className="audio-segment">
          {this.renderAudioSegment()}
        </div>
      </div>
    );
  }

  renderPositionTrack() {
    const left = this._getWidthForDuration(this.props.position) + 'px';
    const style = { transform: `translateX(${left})` };

    return (
      <div
        className="position-track"
        onMouseDown={this._startTracker}
        style={style}
      />
    );
  }

  renderSegment(id) {
    const segment = this.props.bump.getIn(['segments', id]);

    return (
      <TimelineSegmentComponent
        key={id}
        segment={segment}
        findIndex={this._findIndex}
        getWidth={this._getWidthForDuration}
        move={this._moveSegment}
        onClick={this.props.onSelectSegment}
        onChange={this.props.onChangeSegment}
        selected={this.props.selectedSegmentId === id}
      />
    );
  }

  renderAudioSegment() {
    if (this.props.bump.has('audio')) {
      const audio = this.props.bump.get('audio');

      if (audio.get('url')) {
        let duration = audio.get('duration');

        if (typeof duration !== 'number') {
          number = this.props.bump.get('duration');
        }

        const width = this._getWidthForDuration(duration);

        return (
          <TimelineSegmentComponent
            key={audio.get('id')}
            getWidth={this._getWidthForDuration}
            segment={audio}
            onChange={this.props.onChangeAudio}
          />
        );
      }
    }
  }

  _getWidthForDuration(duration) {
    return ((duration * this.state.zoom) * 100);
  }

  _moveSegment(id, atIndex) {
    const index = this._findIndex(id);
    const order = this.props.bump.get('order').splice(index, 1).splice(atIndex, 0, id);
    this.props.onChangeBump(this.props.bump.set('order', order));
  }

  _onClick(event) {
    if (!this._trackingMouse && event.target === event.currentTarget) {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const first = target.querySelector('.segment');
      const padding = first ? first.offsetLeft : 0;
      const x = (event.clientX + target.scrollLeft - padding - rect.left) / 100;
      const position = Math.max(0, Math.min(x, this.props.bump.get('duration')));

      this.props.onChangePosition(position);
      this.props.onSelectSegment(null);
      this._startTracker(event);
    }
  }

  _startTracker(event) {
    this.setState({ tracking: true });
    this._tooFar = null;
    this._trackingMouse = true;
    this._mouseX = event.clientX;

    document.body.addEventListener('mousemove', this._onMoveTracker, false);
    window.addEventListener('mouseup', this._stopTracker, false);
  }

  _onMoveTracker(event) {
    const diff = event.clientX - this._mouseX;
    const movedPosition = Math.max((this.props.position + (diff / 100)), 0);
    const position = Math.min(movedPosition, this.props.bump.get('duration'));
    this._mouseX = event.clientX;
    this.props.onChangePosition(position);
  }

  _stopTracker(event) {
    event.preventDefault();
    this._trackingMouse = false;
    this._mouseX = null;
    document.body.removeEventListener('mousemove', this._onMoveTracker, false);
    window.removeEventListener('mouseup', this._stopTracker, false);
    this.setState({ tracking: false });
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
          this.props.removeSegment(this.props.selectedSegmentId);
          break;
      }

      event.preventDefault();
    }
  }

  _findIndex(id) {
    return this.props.bump.get('order').indexOf(id);
  }
}
