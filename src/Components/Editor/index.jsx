import { List, Map, is } from 'immutable';
import React, { Component } from 'react';
import { shouldComponentUpdate } from 'react-immutable-render-mixin';
import * as TypeConstants from 'bumps/Constants/TypeConstants';
import * as EditorConstants from 'bumps/Constants/EditorConstants';
import round from 'bumps/Utils/round';
import rebuildBump from 'bumps/Utils/rebuildBump';
import getSegmentForPosition from 'bumps/Utils/getSegmentForPosition';
import TimelineComponent from 'bumps/Components/Timeline';
import EditorOptionsComponent from 'bumps/Components/EditorOptions';
import PlayerComponent from 'bumps/Components/Player';
import audioEditorOptions from './AudioEditorOptions';
import bumpEditorOptions from './BumpEditorOptions';

let bumps = 0;

const emptyBump = () => {
  return new Map({
    id: `bump-${++bumps}`,
    name: 'Untitled bump',
    duration: 0,
    order: new List(),
    segments: new Map(),
    audio: new Map({ type: TypeConstants.YOUTUBE, start: 0, duration: 0 })
  });
};

export default class EditorComponent extends Component {
  static propTypes = {
    bump: React.PropTypes.object,
    onChange: React.PropTypes.func
  };

  constructor(props, context) {
    super(props, context);
    this._refs = {};
    this._setPlayerRef = ::this._setPlayerRef;
    this._onChangeBump = ::this._onChangeBump;
    this._onChangeAudio = ::this._onChangeAudio;
    this._onChangeSegment = ::this._onChangeSegment;
    this._onChangePosition = ::this._onChangePosition;
    this._onRemoveSegment = ::this._onRemoveSegment;
    this._onSelectSegment = ::this._onSelectSegment;
    this._onClickReset = ::this._onClickReset;
    this._startPreviewing = ::this._startPreviewing;
    this._startEditing = ::this._startEditing;
    this._toggleState = ::this._toggleState;
    this._onClickExport = ::this._onClickExport;
    this._onClickImport = ::this._onClickImport;
    this._onClickShare = ::this._onClickShare;
    this._onClickReset = ::this._onClickReset;
    this._onChangeTimelinePosition = ::this._onChangeTimelinePosition;
    this.state = {
      position: 0,
      segmentId: null,
      state: EditorConstants.EDITING
    };
  }

  componentWillReceiveProps(props) {
    let differentBump = !is(this.props.bump, props.bump);

    if (differentBump) {
      if (this.props.bump.get && props.bump.get) {
        differentBump = this.props.bump.get('id') !== props.bump.get('id');
      }
    }

    if (differentBump) {
      this.setState({
        position: 0,
        segmentId: null,
        state: EditorConstants.EDITING
      });
    } else {
      const state = {};

      if (this.state.segmentId) {
        if (!props.bump.hasIn(['segments', this.state.segmentId])) {
          state.segmentId = null;
        }
      }

      if (this.state.position >= props.bump.get('duration')) {
        state.position = props.bump.get('duration');
      }

      if (Object.keys(state).length) {
        this.setState(state);
      }
    }
  }

  shouldComponentUpdate

  render() {
    let inner;

    if (!this.props.bump) {
      inner = this.renderEmptyState();
    } else {
      inner = [
        <div className="selection">
          <div className="editor-preview">
            {this.renderPreview()}
          </div>
          {this.renderSegmentEditor()}
        </div>,
        <div className="bottom">
          {this.renderControls()}
          {this.renderTimeline()}
        </div>
      ];
    }

    return (
      <div
        className="editor-component"
        children={inner}
      />
    );
  }

  renderEmptyState() {
    return (
      <div className="empty-state">
        <a href="#" onClick={this._onClickReset}>Start a new bump</a>
      </div>
    );
  }

  renderPreview() {
    return (
      <PlayerComponent
        ref={this._setPlayerRef}
        bump={this.props.bump}
        defaultPosition={this.state.position}
        playing={this.state.state === EditorConstants.PREVIEWING}
        onFinished={this._startEditing}
        onChangePosition={this._onChangePosition}
      />
    );
  }

  renderSegmentEditor() {
    const { segmentId } = this.state;

    if (segmentId) {
      return (
        <div className="editor">
          {this.renderSegmentEditorOptions(segmentId)}
          <div className="btn delete" onClick={this._onRemoveSegment.bind(this, segmentId)}>
            Delete Segment
          </div>
        </div>
      );
    } else {
      return (
        <div className="editor">
          <EditorOptionsComponent
            title="Bump settings"
            map={this.props.bump}
            options={bumpEditorOptions}
            onChange={this._onChangeBump}
          />
          <EditorOptionsComponent
            title="Audio settings"
            map={this.props.bump}
            keyPath={['audio']}
            options={audioEditorOptions}
            onChange={this._onChangeAudio}
          />
        </div>
      );
    }
  }

  renderSegmentEditorOptions(segmentId) {
    const segment = this.props.bump.getIn(['segments', segmentId]);

    let options = new List([
      new Map({
        label: 'Label',
        type: EditorConstants.TEXT,
        property: 'label'
      }),

      new Map({
        label: 'Duration',
        type: EditorConstants.NUMBER,
        property: 'duration',
        min: 0.2,
        validate(number) {
          return round(number, 1);
        }
      })
    ]);

    switch (segment.get('type')) {
      default:
        break;
      case TypeConstants.TEXT:
        options = options.push(new Map({
          label: 'Text',
          type: EditorConstants.TEXT,
          property: 'text'
        }));
        break;
      case TypeConstants.LOGO:
        options = options.push(new Map({
          label: 'Small logo',
          type: EditorConstants.BOOLEAN,
          property: 'small'
        }));
        break;
      case TypeConstants.IMAGE:
        options = options.push(new Map({
          label: 'URL',
          type: EditorConstants.TEXT,
          property: 'url'
        }));

        options = options.push(new Map({
          label: 'Cover',
          type: EditorConstants.BOOLEAN,
          property: 'cover'
        }));
        break;
    }

    const onChange = (typeof this.props.onChange === 'function') ? this._onChangeSegment : null;

    return (
      <EditorOptionsComponent
        title="Segment options"
        map={segment}
        options={options}
        disabled={this.state.state !== EditorConstants.EDITING || onChange === null}
        onChange={onChange}
      />
    );
  }

  renderControls() {
    let control;

    switch (this.state.state) {
      case EditorConstants.EDITING:
        control = (
          <a
            href="#"
            className="control-option"
            onClick={this._startPreviewing}
            children="Preview"
          />
        );
        break;
      case EditorConstants.PREVIEWING:
        control = (
          <a
            href="#"
            className="control-option"
            onClick={this._startEditing}
            children="Pause"
          />
        );
        break;
      default:
        break;
    }

    return (
      <div className="control-bar">
        <div className="state">
          <span className="label">State</span>
          <span className="value">
            {this.state.state}
          </span>
        </div>
        {control}
        <a href="#" className="control-option" onClick={this._onClickAddSegment.bind(this, TypeConstants.TEXT)}>
          Add text
        </a>
        <a href="#" className="control-option" onClick={this._onClickAddSegment.bind(this, TypeConstants.IMAGE)}>
          Add image
        </a>
        <a href="#" className="control-option" onClick={this._onClickAddSegment.bind(this, TypeConstants.LOGO)}>
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

  renderTimeline() {
    return (
      <TimelineComponent
        bump={this.props.bump}
        position={this.state.position}
        selectedSegmentId={this.state.segmentId}
        toggleState={this._toggleState}
        onSelectSegment={this._onSelectSegment}
        onChangeSegment={this._onChangeSegment}
        onChangeAudio={this._onChangeAudio}
        onChangePosition={this._onChangeTimelinePosition}
        onChangeBump={this._onChangeBump}
        removeSegment={this._onRemoveSegment}
      />
    );
  }

  _setPosition(position) {
    this.setState({
      position,
      segment: getSegmentForPosition({
        segments: this.props.bump.get('segments'),
        order: this.props.bump.get('order'),
        position
      })
    });
  }

  _startPreviewing() {
    if (this.state.state === EditorConstants.EDITING) {
      let position = this.state.position;

      if (position >= this.props.bump.get('duration')) {
        position = 0;
      }

      this.setState({ state: EditorConstants.PREVIEWING, position });
    }
  }

  _startEditing() {
    if (this.state.state === EditorConstants.PREVIEWING) {
      this.setState({ state: EditorConstants.EDITING });
    }
  }

  _toggleState() {
    if (this.state.state === EditorConstants.PREVIEWING) {
      this._startEditing();
    } else {
      this._startPreviewing();
    }
  }

  _setPlayerRef(ref) {
    this._refs.player = ref;
  }

  _onClickReset(event) {
    event.preventDefault();
    this.props.onChange(emptyBump());
  }

  _onChangeBump(bump) {
    this.props.onChange(bump);
  }

  _getSegmentsDuration(segments) {
    return round(segments.reduce((value, segment) => {
      return value + segment.get('duration');
    }, 0), 1);
  }

  _getDuration(bump) {
    const segmentsDuration = this._getSegmentsDuration(bump.get('segments'));
    const audioDuration = bump.getIn(['audio', 'duration']) || 0;
    return Math.max(segmentsDuration, audioDuration);
  }

  _onChangeSegment(updated) {
    const bump = this.props.bump.setIn(['segments', updated.get('id')], updated);
    const duration = this._getDuration(bump);
    this._onChangeBump(bump.set('duration', duration));
  }

  _onChangeAudio(updated) {
    let bump = this.props.bump;
    let audio = updated.has('audio') ? updated.get('audio') : updated;

    if (!bump.getIn(['audio', 'url']) && audio.get('url')) {
      if (!audio.get('duration')) {
        audio = audio.set('duration', 10);
      }
    }

    bump = bump.set('audio', audio);
    bump = bump.set('duration', this._getDuration(bump));

    this._onChangeBump(bump);
  }

  _onRemoveSegment(id) {
    let bump = this.props.bump;
    let order = bump.get('order');
    let segments = bump.get('segments');

    order = order.remove(order.indexOf(id));
    segments = segments.remove(id);

    bump = bump.set('order', order);
    bump = bump.set('segments', segments);
    bump = bump.set('duration', this._getDuration(bump));

    this._onChangeBump(bump);
  }

  _onSelectSegment(segmentId) {
    this.setState({ segmentId });
  }

  _onChangePosition(position) {
    this.setState({ position });
  }

  _onChangeTimelinePosition(position) {
    this.setState({ position }, () => {
      this._refs.player._seek();
    });
  }

  _onClickAddSegment(type, event) {
    event.preventDefault();
    const id = `seg${Date.now()}`;
    let bump = this.props.bump;
    let order = bump.get('order');
    let segments = bump.get('segments');
    let label = type + ' seg';

    order = order.push(id);
    segments = segments.set(id, new Map({ id, type, label, duration: 1 }));

    bump = bump.set('order', order);
    bump = bump.set('segments', segments);
    bump = bump.set('duration', this._getDuration(bump));

    this._onChangeBump(bump);
  }

  _onClickExport(event) {
    event.preventDefault();
    window.alert(window.JSON.stringify(this.props.bump.toJS()));
  }

  _onClickImport(event) {
    event.preventDefault();
    const json = window.prompt('Please provide the Bump JSON:');

    if (json) {
      let fromJSON;

      try {
        fromJSON = window.JSON.parse(json);
      } catch (e) {}

      if (fromJSON) {
        this.props.onChange(rebuildBump(fromJSON));
        return;
      }

      window.alert('Invalid JSON.');
    }
  }

  _onClickShare(event) {
    event.preventDefault();
    const bump = window.encodeURIComponent(window.JSON.stringify(this.props.bump.toJS()));
    window.open(`http://simonify.github.io/bumps/examples/player/#${bump}`)
  }

  _onClickReset(event) {
    event.preventDefault();

    if (window.confirm('Are you sure you want to reset? This will remove any changes you have made.')) {
      this.props.onChange(emptyBump());
    }
  }
}
