import React, { Component, PropTypes } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as ItemTypeConstants from 'bumps/Constants/ItemTypeConstants';
import round from 'bumps/Utils/round';

const segmentSource = {
  canDrag(props) {
    return typeof props.move === 'function';
  },

  beginDrag(props) {
    const id = props.segment.get('id');
    const originalIndex = props.findIndex(id);

    return { id, originalIndex };
  },

  endDrag(props, monitor) {
    const { id: droppedId, originalIndex } = monitor.getItem();
    const didDrop = monitor.didDrop();

    if (!didDrop) {
      props.move(droppedId, originalIndex);
    }
  }
};

const segmentTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor) {
    const { id: draggedId, originalIndex } = monitor.getItem();
    const overId = props.segment.get('id');

    if (draggedId !== overId) {
      console.log(draggedId, overId);
      const newIndex = props.findIndex(overId);

      if (originalIndex !== newIndex) {
        props.move(draggedId, newIndex);
      }
    }
  }
};

@DropTarget(ItemTypeConstants.TIMELINE_SEGMENT, segmentTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource(ItemTypeConstants.TIMELINE_SEGMENT, segmentSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
export default class TimelineSegmentComponent extends Component {
  static propTypes = {
    width: PropTypes.string.isRequired,
    segment: PropTypes.object.isRequired,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    move: React.PropTypes.func.isRequired,

    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this._onClick = ::this._onClick;
    this._startResize = ::this._startResize;
    this._onResize = ::this._onResize;
    this._stopResize = ::this._stopResize;
  }

  shouldComponentUpdate

  render() {
    const { width, segment, isDragging, connectDragSource, connectDropTarget } = this.props;
    const style = { width };
    let className = `segment is-${segment.get('type').toLowerCase()}`;

    if (this.props.selected) {
      className += ' is-selected';
    }

    if (isDragging) {
      className += ' is-dragging';
    }

    const onClick = typeof this.props.onClick === 'function' ? this._onClick : null;

    return connectDragSource(connectDropTarget(
      <div data-id={segment.get('id')} className={className} style={style} onClick={onClick}>
        <div className="drag-left" onMouseDown={this._startResize.bind(this, true)} />
        <span className="type">
          {segment.get('type')}
        </span>
        <span className="label">
          {segment.get('label')}
        </span>
        <div className="drag-right" onMouseDown={this._startResize.bind(this, false)} />
      </div>
    ));
  }

  _onClick(event) {
    event.preventDefault();
    this.props.onClick(this.props.segment.get('id'));
  }

  _startResize(reverse, event) {
    event.preventDefault();
    event.stopPropagation();

    this._trackingMouse = true;
    this._mouseX = event.clientX;
    this._reverse = reverse;

    document.body.addEventListener('mousemove', this._onResize, false);
    window.addEventListener('mouseup', this._stopResize, false);
  }

  _onResize() {
    let diff = event.clientX - this._mouseX;

    if (this._reverse) {
      diff = diff * -1;
    }

    const duration = this.props.segment.get('duration');
    const newDuration = round(Math.max(duration + (diff / 100), 0.2), 2); // minimum duration

    this._mouseX = event.clientX;
    this.props.onChange(this.props.segment.set('duration', newDuration));
  }

  _stopResize() {
    event.preventDefault();

    this._trackingMouse = false;
    this._mouseX = null;

    document.body.removeEventListener('mousemove', this._onResize, false);
    window.removeEventListener('mouseup', this._stopResize, false);
  }
}
