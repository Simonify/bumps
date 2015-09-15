import { Map, List } from 'immutable';
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as EditorConstants from 'bumps/Constants/EditorConstants';

export default class EditorOptionsComponent extends Component {
  static defaultProps = {
    disabled: false
  };

  static propTypes = {
    map: React.PropTypes.object.isRequired,
    options: React.PropTypes.object.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    keyPath: React.PropTypes.array,
    onChange: React.PropTypes.func
  };

  constructor(props, context) {
    super(props, context);
    this.renderOption = ::this.renderOption;
  }

  shouldComponentUpdate

  render() {
    const options = this.props.options.map(this.renderOption);

    return (
      <div className="options-component">
        {options}
      </div>
    );
  }

  renderOption(option, index) {
    const disabled = this.props.disabled || option.get('disabled');
    let path = [option.get('property')];

    if (this.props.keyPath) {
      path = [].concat(this.props.keyPath).concat(path);
    }

    const value = this.props.map.getIn(path);

    let control;

    switch (option.get('type')) {
      default:
        break;
      case EditorConstants.NUMBER:
        control = (
          <input
            type="number"
            className="number-option"
            disabled={disabled}
            value={value}
            min={option.get('minimum')}
            step="any"
            onChange={this._onChangeOption.bind(this, option)}
          />
        );
        break;
      case EditorConstants.TEXT:
        control = (
          <input
            type="text"
            className="text-option"
            disabled={disabled}
            value={value}
            onChange={this._onChangeOption.bind(this, option)}
          />
        );
        break;
    }

    return (
      <div key={index} className={`option${disabled ? ' is-disabled' : ''}`}>
        <label className="wrapper">
          <span className="label">
            {option.get('label')}
          </span>
          <span className="value">
            {control}
          </span>
        </label>
      </div>
    );
  }

  _onChangeOption(option, event) {
    const property = option.get('property');
    let path = [property];
    let mutated = this.props.map;
    let value;

    if (this.props.keyPath) {
      path = [].concat(this.props.keyPath).concat(path);
    }

    switch (option.get('type')) {
      default:
        break;
      case EditorConstants.NUMBER:
        value = window.parseFloat(event.currentTarget.value, 10);
        break;
      case EditorConstants.TEXT:
        value = event.currentTarget.value;
        break;
    }

    if (option.has('validator')) {
      value = option.get('validator')(this.props.map.getIn(path), value);
    }

    mutated = mutated.setIn(path, value);

    this.props.onChange(mutated);
  }
}
