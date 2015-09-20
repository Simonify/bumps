import { Map } from 'immutable';
import React, { Component, PropTypes } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { TEXT, IMAGE, LOGO } from '../../Constants/TypeConstants';
import { EDITING, PREVIEWING } from '../../Constants/EditorConstants';
import bindAll from '../../Utils/bindAll';

export default class ControlBarComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static propTypes = {
    startPreviewing: PropTypes.func.isRequired,
    startEditing: PropTypes.func.isRequired,
    state: PropTypes.string.isRequired,
    import: PropTypes.func.isRequired,
    export: PropTypes.func.isRequired,
    share: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired
  }

  constructor(props, context) {
    super(props, context);
    bindAll(this, [
      '_onClickStartPreviewing', '_onClickStartEditing',
      '_onClickImport', '_onClickExport', '_onClickShare',
      '_onClickReset', '_addText', '_addImage', '_addLogo'
    ]);
  }

  render() {
    let control;

    if (this.props.state === EDITING) {
      control = (
        <a
          href="#"
          className="control-option"
          onClick={this._onClickStartPreviewing}
          children="Preview"
        />
      );
    } else if (this.props.state === PREVIEWING) {
      control = (
        <a
          href="#"
          className="control-option"
          onClick={this._onClickStartEditing}
          children="Pause"
        />
      );
    }

    return (
      <div className="control-bar">
        <div className="state">
          <span className="label">State</span>
          <span className="value">
            {this.props.state}
          </span>
        </div>
        {control}
        <a href="#" className="control-option is-text" onClick={this._addText}>
          Add text
        </a>
        <a href="#" className="control-option is-image" onClick={this._addImage}>
          Add image
        </a>
        <a href="#" className="control-option is-logo" onClick={this._addLogo}>
          Add logo
        </a>
        <a href="#" className="control-option" onClick={this._onClickExport}>
          Export
        </a>
        <a href="#" className="control-option" onClick={this._onClickImport}>
          Import
        </a>
        <a href="#" className="control-option" onClick={this._onClickShare}>
          Share
        </a>
        <a href="#" className="control-option" onClick={this._onClickReset}>
          Reset
        </a>
      </div>
    );
  }

  _onClickStartPreviewing(event) {
    event.preventDefault();
    this.props.startPreviewing();
    this._ensureDocumentFocused();
  }

  _onClickStartEditing(event) {
    event.preventDefault();
    this.props.startEditing();
    this._ensureDocumentFocused();
  }

  _addText(event) {
    event.preventDefault();
    this._addSegment(TEXT);
  }

  _addImage(event) {
    event.preventDefault();
    this._addSegment(IMAGE);
  }

  _addLogo( event) {
    event.preventDefault();
    this._addSegment(LOGO);
  }

  _addSegment(type) {
    this.props.addSegment(new Map({ type }));
    this._ensureDocumentFocused();
  }

  _onClickImport(event) {
    event.preventDefault();
    this.props.import();
    this._ensureDocumentFocused();
  }

  _onClickExport(event) {
    event.preventDefault();
    this.props.export();
    this._ensureDocumentFocused();
  }

  _onClickShare(event) {
    event.preventDefault();
    this.props.share();
    this._ensureDocumentFocused();
  }

  _onClickReset(event) {
    event.preventDefault();
    this.props.reset();
    this._ensureDocumentFocused();
  }

  _ensureDocumentFocused() {
    window.setTimeout(() => {
      document.activeElement.blur();
    }, 10);
  }
}
