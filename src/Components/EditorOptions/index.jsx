import { Map, List } from 'immutable';
import React, { Component } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { NUMBER, TEXT, RANGE, BOOLEAN } from '../../Constants/EditorConstants';
import segmentTypeEditorOptions from './segmentTypeEditorOptions';
import segmentEditorOptions from './segmentEditorOptions';
import audioEditorOptions from './audioEditorOptions';
import bumpEditorOptions from './bumpEditorOptions';

export default class EditorOptionsComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

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
    let disabled = this.props.disabled;
    let path = [];

    if (this.props.keyPath) {
      path = path.concat(this.props.keyPath);
    }

    if (!disabled) {
      const disabledProp = option.get('disabled');

      if (typeof disabledProp === 'function') {
        if (disabledProp(this.props.map.getIn(path))) {
          disabled = true;
        }
      } else if (disabledProp === true) {
        disabled = true;
      }
    }

    let value = this.props.map.getIn(path.concat([option.get('property')]));

    if (typeof value === 'undefined') {
      value = option.get('defaultValue');
    }

    let control;

    switch (option.get('type')) {
      case NUMBER:
        control = (
          <input
            id={index + '-input'}
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
      case RANGE:
        control = [
          <input
            id={index + '-input'}
            type="range"
            className="value-option range-option"
            disabled={disabled}
            value={value}
            min={option.get('min')}
            max={option.get('max')}
            onChange={this._onChangeOption.bind(this, option)}
          />,
          <span className="value-hint">
            {('' + value + option.get('unit'))}
          </span>
        ];
        break;
      case TEXT:
        control = (
          <input
            id={index + '-input'}
            type="text"
            className="value-option text-option"
            disabled={disabled}
            value={value}
            onChange={this._onChangeOption.bind(this, option)}
          />
        );
        break;
      case BOOLEAN:
        control = (
          <input
            id={index + '-input'}
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
        <div className="wrapper">
          <label htmlFor={index + '-input'} className="label">
            {option.get('label')}
          </label>
          <span className="value" children={control} />
        </div>
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
      case NUMBER:
      case RANGE:
        value = window.parseFloat(event.currentTarget.value, 10);
        break;
      case TEXT:
        value = event.currentTarget.value;
        break;
      case BOOLEAN:
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
};

export {
  segmentTypeEditorOptions,
  segmentEditorOptions,
  audioEditorOptions,
  bumpEditorOptions
};
