import { Map, List } from 'immutable';
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as TypeConstants from 'bumps/Constants/TypeConstants';

export default class SegmentComponent extends Component {
  static propTypes = {
    segment: React.PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props, context);
  }

  shouldComponentUpdate

  render() {
    const { segment } = this.props;

    return (
      <div className="segment-component">
        {this.renderSegment(segment)}
      </div>
    );
  }

  renderSegment(segment) {
    switch (segment.get('type')) {
      default:
        return null;
      case TypeConstants.TEXT:
        return (
          <div className="segment-type segment-text">
            <span className="text">{segment.get('text')}</span>
          </div>
        );
      case TypeConstants.LOGO:
        if (segment.get('small') === true) {
          return (
            <div className="segment-type segment-logo segment-logo-small">
              <img src="http://i.imgur.com/zwx39CO.png" className="image" />
            </div>
          );
        }

        return (
          <div className="segment-type segment-logo">
            <img src="http://i.imgur.com/tmemlQd.png" className="image" />
          </div>
        );
      case TypeConstants.IMAGE:
        const url = segment.get('url');

        if (url && url.match(/^https?:\/\/.*\..*\/.+/)) {
          let className = 'segment-type segment-image';

          if (segment.get('cover')) {
            className += ' segment-image-cover';
          }

          return (
            <div className={className}>
              <img src={segment.get('url')} className="image" />
            </div>
          );
        } else {
          return (
            <div className="segment-type segment-error">
              <span className="error">Invalid image URL.</span>
            </div>
          );
        }
    }
  }
}
