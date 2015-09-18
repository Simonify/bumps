import { Map, List } from 'immutable';
import React, { Component } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import * as TypeConstants from '../../Constants/TypeConstants';

export default class SegmentComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static propTypes = {
    segment: React.PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this._setImageRef = ::this._setImageRef;
    this._onImageLoaded = ::this._onImageLoaded;
    this._onImageError = ::this._onImageError;
    this.state = { loading: true };
  }


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
        const style = {};

        if (segment.has('letter_spacing')) {
          style.letterSpacing = segment.get('letter_spacing');
        }

        return (
          <div className="segment-type segment-text">
            <span className="text" style={style}>{segment.get('text')}</span>
          </div>
        );
      case TypeConstants.LOGO:
        if (segment.get('small') === true) {
          return (
            <div className="segment-type segment-logo segment-logo-small">
              <div className="logo-wrapper">
                <img key="logo-small" src="http://i.imgur.com/zwx39CO.png" className="image" />
              </div>
            </div>
          );
        }

        return (
          <div className="segment-type segment-logo">
            <div className="logo-wrapper">
              <img key="logo-big" src="http://i.imgur.com/tmemlQd.png" className="image" />
            </div>
          </div>
        );
      case TypeConstants.IMAGE:
        const url = segment.get('url');

        if (!this.state.error && url && url.match(/^https?:\/\/.*\..*\/.+/)) {
          let className = 'segment-type segment-image';
          let width;
          let height;

          if (segment.get('cover')) {
            className += ' segment-image-cover';
          } else if (this._imageRef && this.state.loaded) {
            const scale = segment.get('scale');

            if (typeof scale === 'number') {
              const percent = scale / 100;
              width = this._imageRef.naturalWidth * percent;
              height = this._imageRef.naturalHeight * percent;
            }
          }

          return (
            <div className={className}>
              <img
                ref={this._setImageRef}
                key={url}
                src={url}
                width={width}
                height={height}
                className="image"
                onLoad={this._onImageLoaded}
                onError={this._onImageError}
              />
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

  _setImageRef(ref) {
    if (ref) {
      this._imageRef = React.findDOMNode(ref);
    } else {
      this._imageRef = null;
    }
  }

  _onImageLoaded(event) {
    this.setState({ loaded: true, error: null });
  }

  _onImageError(event) {
    this.setState({ loaded: false, error: event.error || true });
  }
}
