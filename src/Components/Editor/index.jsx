import { List, Map, OrderedSet, is } from 'immutable';
import React, { Component } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { EDITING, PREVIEWING } from '../../Constants/EditorConstants';
import ControlBarComponent from '../../Components/ControlBar';
import TimelineComponent from '../../Components/Timeline';
import PlayerComponent from '../../Components/Player';
import YouTubeAudioFactory from '../../Players/YouTubeAudioFactory';

import EditorOptionsComponent, {
  segmentTypeEditorOptions, segmentEditorOptions, audioEditorOptions,
  bumpEditorOptions
} from '../../Components/EditorOptions';

import {
  rebuildBump, getSegmentForPosition, round,
  bindAll, generateId, emptyBump
} from '../../Utils';

const AUDIO_KEYPATH = new OrderedSet(['audio']);

export default class EditorComponent extends Component {
  shouldComponentUpdate = shouldPureComponentUpdate;

  static propTypes = {
    bump: React.PropTypes.object,
    onChange: React.PropTypes.func
  };

  constructor(props, context) {
    super(props, context);

    bindAll(this, [
      '_setPlayerRef',
      '_setBump', '_setSegment', '_setAudio',
      '_addSegment', '_removeSegment', '_selectSegment',
      '_setPosition', '_startPreviewing', '_startEditing',
      '_toggleState', '_import', '_export', '_share', '_reset',
      '_onChangeTimelinePosition'
    ]);

    this._refs = {};
    this._youtubeAudioFatory = new YouTubeAudioFactory();
    this.state = {
      segmentId: null,
      position: 0,
      state: EDITING
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
        state: EDITING
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
        <a href="#" onClick={this._reset}>
          Start a new bump
        </a>
      </div>
    );
  }

  renderPreview() {
    return (
      <PlayerComponent
        key="player"
        ref={this._setPlayerRef}
        bump={this.props.bump}
        defaultPosition={this.state.position}
        playing={this.state.state === PREVIEWING}
        onFinished={this._startEditing}
        onChangePosition={this._setPosition}
        youtubeAudioFactory={this._youtubeAudioFatory}
      />
    );
  }

  renderSegmentEditor() {
    const { segmentId } = this.state;

    if (segmentId) {
      return this.renderSegmentSettings(segmentId);
    } else {
      return this.renderAudioSettings();
    }
  }

  renderControls() {
    return (
      <ControlBarComponent
        state={this.state.state}
        startPreviewing={this._startPreviewing}
        startEditing={this._startEditing}
        addSegment={this._addSegment}
        export={this._export}
        import={this._import}
        share={this._share}
        reset={this._reset}
      />
    );
  }

  renderTimeline() {
    return (
      <TimelineComponent
        key="timeline"
        addSegment={this._addSegment}
        bump={this.props.bump}
        onChangePosition={this._onChangeTimelinePosition}
        onChangeSegment={this._setSegment}
        onChangeAudio={this._setAudio}
        onChangeBump={this._setBump}
        onSelectSegment={this._selectSegment}
        position={this.state.position}
        removeSegment={this._removeSegment}
        selectedSegmentId={this.state.segmentId}
        toggleState={this._toggleState}
      />
    );
  }

  renderSegmentSettings(segmentId) {
    const segment = this.props.bump.getIn(['segments', segmentId]);
    const onChange = (typeof this.props.onChange === 'function') ? this._setSegment : null;
    const disabled = (this.state.state !== EDITING || onChange === null);
    const typeProps = segmentTypeEditorOptions[segment.get('type')];

    return (
      <div className="editor">
        <EditorOptionsComponent
          key="segment"
          title="Segment settings"
          map={segment}
          options={segmentEditorOptions}
          onChange={onChange}
        />
        {typeProps ? (
          <EditorOptionsComponent
            {...typeProps}
            key={segment.get('id')}
            map={segment}
            disabled={disabled}
            onChange={onChange}
          />
        ) : null}
        <div className="btn delete" onClick={this._removeSegment.bind(this, segmentId)}>
          Delete Segment
        </div>
      </div>
    );
  }

  renderAudioSettings() {
    return (
      <div className="editor">
        <EditorOptionsComponent
          title="Bump settings"
          map={this.props.bump}
          options={bumpEditorOptions}
          onChange={this._setBump}
        />
        <EditorOptionsComponent
          title="Audio settings"
          map={this.props.bump}
          keyPath={AUDIO_KEYPATH}
          options={audioEditorOptions}
          onChange={this._setAudio}
        />
      </div>
    );
  }

  _onChangeTimelinePosition(position) {
    this.setState({ position }, () => {
      this._refs.player.seek(position);
    });
  }

  _setPlayerRef(ref) {
    this._refs.player = ref;
  }

  _setBump(bump) {
    this.props.onChange(bump);
  }

  _setSegment(updated) {
    const bump = this.props.bump.setIn(['segments', updated.get('id')], updated);
    const duration = this._getDuration(bump);
    this._setBump(bump.set('duration', duration));
  }

  _setAudio(updated) {
    let bump = this.props.bump;
    let audio = updated.has('audio') ? updated.get('audio') : updated;

    if (!bump.getIn(['audio', 'url']) && audio.get('url')) {
      if (!audio.get('duration')) {
        audio = audio.set('duration', 10);
      }
    }

    bump = bump.set('audio', audio);
    bump = bump.set('duration', this._getDuration(bump));

    this._setBump(bump);
  }

  _addSegment(segment) {
    let id = segment.get('id');

    if (!id) {
      id = `seg${Date.now()}`;
      segment = segment.set('id', id);
    }

    if (!segment.get('label')) {
      const type = segment.get('type');
      const typeString = type[0] + type.substr(1).toLowerCase();
      segment = segment.set('label', typeString + ' seg');
    }

    if (!segment.has('duration')) {
      segment = segment.set('duration', 1);
    }

    let bump = this.props.bump;
    let segments = bump.get('segments');
    let order = bump.get('order');

    const position = this.state.position;

    if (position > 0) {
      const { segment: splitSegment, seek } = getSegmentForPosition({
        position, segments, order, sort: true
      }, true);

      const index = order.indexOf(splitSegment.get('id'));

      if (seek > 0) {
        // cutting
        const originalDuration = splitSegment.get('duration');
        const prefix = splitSegment.set('duration', seek);
        const suffixDuration = originalDuration - seek;
        const suffixId = generateId();

        let suffix = splitSegment.set('duration', suffixDuration);
        suffix = suffix.set('id', suffixId);

        order = order.splice(index + 1, 0, id, suffixId);
        segments = segments.set(suffixId, suffix);
        segments = segments.set(prefix.get('id'), prefix);
      } else {
        order = order.splice(index, 0, id);
      }
    } else {
      order = order.unshift(id);
    }

    segments = segments.set(id, segment);

    bump = bump.set('order', order);
    bump = bump.set('segments', segments);
    bump = bump.set('duration', this._getDuration(bump));

    this._setBump(bump);
  }

  _removeSegment(id) {
    let bump = this.props.bump;
    let order = bump.get('order');
    let segments = bump.get('segments');

    order = order.remove(order.indexOf(id));
    segments = segments.remove(id);

    bump = bump.set('order', order);
    bump = bump.set('segments', segments);
    bump = bump.set('duration', this._getDuration(bump));

    this._setBump(bump);
  }

  _selectSegment(segmentId) {
    this.setState({ segmentId });
  }

  _setPosition(position) {
    this.setState({ position });
  }

  _export() {
    window.alert(window.JSON.stringify(this.props.bump.toJS()));
  }

  _import() {
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

  _share() {
    const bump = window.encodeURIComponent(window.JSON.stringify(this.props.bump.toJS()));
    window.open(`../player/#${bump}`)
  }

  _reset() {
    if (window.confirm('Are you sure you want to reset? This will remove any changes you have made.')) {
      this.props.onChange(emptyBump());
    }
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
    if (this.state.state === EDITING) {
      let position = this.state.position;

      if (position >= this.props.bump.get('duration')) {
        position = 0;
      }

      this.setState({ state: PREVIEWING, position });
    }
  }

  _startEditing() {
    if (this.state.state === PREVIEWING) {
      this.setState({ state: EDITING });
    }
  }

  _toggleState() {
    if (this.state.state === PREVIEWING) {
      this._startEditing();
    } else {
      this._startPreviewing();
    }
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
}
