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
    getWidth: PropTypes.func.isRequired,
    segment: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    selected: PropTypes.bool,
    onClick: PropTypes.func,
    move: React.PropTypes.func,
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this._onClick = ::this._onClick;
    this._onResize = ::this._onResize;
    this._stopResize = ::this._stopResize;
    this._startResize = ::this._startResize;
    this._dragDuration = null;
  }

  componentDidMount() {
    this._node = React.findDOMNode(this);
  }

  componentWillReceiveProps(props) {
    if (!this._resizing) {
      const duration = this._dragDuration;

      if (duration !== null && duration !== props.segment.get('duration')) {
        this._dragDuration = props.segment.get('duration');
      }
    }
  }

  componentWillUnmount() {
    this._node = null;
  }

  shouldComponentUpdate

  render() {
    const { getWidth, segment, isDragging, connectDragSource, connectDropTarget } = this.props;
    const duration = this._getDuration();
    const style = { width: getWidth(duration) + 'px' };
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

  _getDuration() {
    if (this._dragDuration !== null) {
      return this._dragDuration;
    }

    return this.props.segment.get('duration');
  }

  _onClick(event) {
    event.preventDefault();
    this.props.onClick(this.props.segment.get('id'));
  }

  _startResize(reverse, event) {
    event.preventDefault();
    event.stopPropagation();

    this._resizing = true;
    this._mouseX = event.clientX;
    this._reverse = reverse;
    this._dragDuration = this.props.segment.get('duration');

    window.addEventListener('mousemove', this._onResize, false);
    window.addEventListener('mouseup', this._stopResize, false);
  }

  _onResize(event) {
    let diff = event.clientX - this._mouseX;

    if (this._reverse) {
      diff = diff * -1;
    }

    const duration = this._dragDuration;
    const newDuration = Math.max(duration + (diff / 100), 0.2) // minimum duration

    this._dragDuration = newDuration;
    this._mouseX = event.clientX;

    const width = this.props.getWidth(newDuration);
    this._node.style.width = `${width}px`;

    const parentNode = this._node.parentNode.parentNode // more efficient but gross?
    const nodeLeft = this._node.offsetLeft;
    const farEdge = nodeLeft + width;
    const farViewport = parentNode.scrollLeft + parentNode.offsetWidth;

    if (this._reverse) {
      parentNode.scrollLeft += diff;
    } else if (farEdge > farViewport) {
      parentNode.scrollLeft = farEdge;
    }
  }

  _stopResize(event) {
    event.preventDefault();

    if (this._dragDuration !== this.props.duration) {
      this.props.onChange(
        this.props.segment.set('duration', round(this._dragDuration, 1))
      );
    }

    this._dragDuration = null;
    this._resizing = false;
    this._mouseX = null;

    window.removeEventListener('mousemove', this._onResize, false);
    window.removeEventListener('mouseup', this._stopResize, false);
  }
}
