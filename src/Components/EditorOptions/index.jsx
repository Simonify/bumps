import { Map, List } from 'immutable';
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as EditorConstants from 'bumps/Constants/EditorConstants';

export default class EditorOptionsComponent extends Component {
  static defaultProps = {
    disabled: false
  };

  static propTypes = {
    title: React.PropTypes.string.isRequired,
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
        <div className="title">{this.props.title}</div>
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

    let value = this.props.map.getIn(path);

    if (typeof value === 'undefined') {
      value = option.get('defaultValue');
    }

    let control;

    switch (option.get('type')) {
      default:
        break;
      case EditorConstants.NUMBER:
        control = (
          <input
            type="number"
            className="value-option number-option"
            disabled={disabled}
            value={value}
            min={option.get('min')}
            step="any"
            onChange={this._onChangeOption.bind(this, option)}
          />
        );
        break;
      case EditorConstants.RANGE:
        control = [
          <input
            type="range"
            className="value-option range-option"
            disabled={disabled}
            value={value}
            min={option.get('min')}
            max={option.get('max')}
            onChange={this._onChangeOption.bind(this, option)}
          />,
          <span className="value-hint">
            {value}%
          </span>
        ];
        break;
      case EditorConstants.TEXT:
        control = (
          <input
            type="text"
            className="value-option text-option"
            disabled={disabled}
            value={value}
            onChange={this._onChangeOption.bind(this, option)}
          />
        );
        break;
      case EditorConstants.BOOLEAN:
        console.log(value);
        control = (
          <input
            type="checkbox"
            className="value-option boolean-option"
            disabled={disabled}
            checked={value === true}
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
          <span className="value" children={control} />
        </label>
      </div>
    );
  }

  _onChangeOption(option, event) {
    const property = option.get('property');
    let mutated = this.props.map;
    let path = [];
    let value;

    if (this.props.keyPath) {
      path = path.concat(this.props.keyPath);
    }

    switch (option.get('type')) {
      default:
        break;
      case EditorConstants.NUMBER:
      case EditorConstants.RANGE:
        value = window.parseFloat(event.currentTarget.value, 10);
        break;
      case EditorConstants.TEXT:
        value = event.currentTarget.value;
        break;
      case EditorConstants.BOOLEAN:
        value = event.currentTarget.checked;
        break;
    }

    const valuePath = path.concat([property]);
    const oldValue = this.props.map.getIn(valuePath);

    if (option.has('validator')) {
      value = option.get('validator')(oldValue, value, this.props.map.getIn(path));
    }

    if (value !== oldValue) {
      mutated = mutated.setIn(valuePath, value);
      this.props.onChange(mutated);
    }
  }
}
