import {
  getBusinessObject,
  is
} from "bpmn-js/lib/util/ModelUtil";

import {
  isEventSubProcess,
  isExpanded
} from "bpmn-js/lib/util/DiUtil";

import {
  isDifferentType
} from "bpmn-js/lib/features/popup-menu/util/TypeUtil"; 

import {
  forEach,
  filter
} from 'min-dash';

import * as replaceOptions from './PPINOTReplaceOptions';
import { isPPINOTShape } from "./Types";

/**
 * This module is an element agnostic replace menu provider for the popup menu.
 */
export default function ReplaceMenuProvider(
  popupMenu, modeling, moddle,
  bpmnReplace, rules, translate, replace) {

this._popupMenu = popupMenu;
this._modeling = modeling;
this._moddle = moddle;
this._bpmnReplace = bpmnReplace;
this._rules = rules;
this._translate = translate;
this._replace = replace;

this.register();
}

ReplaceMenuProvider.$inject = [
'popupMenu',
'modeling',
'moddle',
'bpmnReplace',
'rules',
'translate',
'replace'
];


/**
* Register replace menu provider in the popup menu
*/
ReplaceMenuProvider.prototype.register = function() {
this._popupMenu.registerProvider('bpmn-replace', this);
};


/**
* Get all entries from replaceOptions for the given element and apply filters
* on them. Get for example only elements, which are different from the current one.
*
* @param {djs.model.Base} element
*
* @return {Array<Object>} a list of menu entry items
*/


ReplaceMenuProvider.prototype.getEntries = function(element) {

var businessObject = element.businessObject;

var rules = this._rules;

var entries;

if (!rules.allowed('shape.replace', { element: element })) {
  return [];
}

var differentType = isDifferentType(element);


const boType = businessObject.$type || businessObject.type;

if (boType === 'PPINOT:Ppi') {
  return [];
}


// Make sure this part looks exactly like this:

// You can also change the labels directly in the simplified version:

if (boType === 'PPINOT:Target' || boType === 'PPINOT:Scope') {
  const targetType = boType === 'PPINOT:Target' ? 'PPINOT:Scope' : 'PPINOT:Target';
  const label = boType === 'PPINOT:Target' ? '\xa0\xa0\xa0Scope' : '\xa0\xa0\xa0Target';
  const className = boType === 'PPINOT:Target' ? 'icon-scope-mini' : 'icon-target-mini';
  
  return this._createEntries(element, [{
    label: label,
    actionName: `replace-with-${label.toLowerCase()}`,
    className: className,
    target: {
      type: targetType
    }
  }]);
}


// Robust check for all PPINOT function variants (SUM, MAX, MIN, AVG)
if (/^PPINOT:.*(SUM|MAX|MIN|AVG)$/.test(businessObject.$type || businessObject.type)) {
  entries = filter(replaceOptions.AGGREGATED_MEASURE, differentType);
  return this._createEntries(element, entries);
}

// Robust check for all DataAggregatedMeasure variants
if (/^PPINOT:DataAggregatedMeasure/.test(businessObject.$type || businessObject.type)) {
  entries = filter(replaceOptions.AGGREGATED_MEASURE, differentType);
  return this._createEntries(element, entries);
}

// In this case, if the element is one of these, the options of MEASURE will appear in the popup menu
// of these elements
if (is(businessObject, 'PPINOT:BaseMeasure') 
|| is(businessObject, 'PPINOT:CountMeasure') 
|| is(businessObject, 'PPINOT:TimeMeasure') 
|| is(businessObject, 'PPINOT:CyclicTimeMeasure') 
||  is(businessObject, 'PPINOT:CyclicTimeMeasureSUM') 
||  is(businessObject, 'PPINOT:CyclicTimeMeasureMIN')
||  is(businessObject, 'PPINOT:CyclicTimeMeasureMAX')
||  is(businessObject, 'PPINOT:CyclicTimeMeasureAVG')
|| is(businessObject, 'PPINOT:StateConditionMeasure')
|| is(businessObject, 'PPINOT:DerivedSingleInstanceMeasure')
|| is(businessObject, 'PPINOT:DataMeasure')) {
  entries = filter(replaceOptions.MEASURE, differentType);
  return this._createEntries(element, entries);
}

if (is(businessObject, 'PPINOT:CountAggregatedMeasure') 
|| is(businessObject, 'PPINOT:CountAggregatedMeasureSUM')
|| is(businessObject, 'PPINOT:CountAggregatedMeasureMIN')
|| is(businessObject, 'PPINOT:CountAggregatedMeasureMAX')
|| is(businessObject, 'PPINOT:CountAggregatedMeasureAVG')
|| is(businessObject, 'PPINOT:AggregatedMeasure') 
|| is(businessObject, 'PPINOT:AggregatedMeasureSUM')
|| is(businessObject, 'PPINOT:AggregatedMeasureMIN')
|| is(businessObject, 'PPINOT:AggregatedMeasureMAX')
|| is(businessObject, 'PPINOT:AggregatedMeasureAVG')
|| is(businessObject, 'PPINOT:TimeAggregatedMeasure') 
|| is(businessObject, 'PPINOT:TimeAggregatedMeasureSUM')
|| is(businessObject, 'PPINOT:TimeAggregatedMeasureMIN')
|| is(businessObject, 'PPINOT:TimeAggregatedMeasureMAX')
|| is(businessObject, 'PPINOT:TimeAggregatedMeasureAVG')
|| is(businessObject, 'PPINOT:CyclicTimeAggregatedMeasure')
|| is(businessObject, 'PPINOT:CyclicTimeAggregatedMeasureSUM')
|| is(businessObject, 'PPINOT:CyclicTimeAggregatedMeasureMAX')
|| is(businessObject, 'PPINOT:CyclicTimeAggregatedMeasureMIN')
|| is(businessObject, 'PPINOT:CyclicTimeAggregatedMeasureAVG')
|| is(businessObject, 'PPINOT:StateConditionAggregatedMeasure') 
|| is(businessObject, 'PPINOT:StateCondAggMeasureNumber') 
|| is(businessObject, 'PPINOT:StateCondAggMeasurePercentage') 
|| is(businessObject, 'PPINOT:StateCondAggMeasureAtLeastOne') 
|| is(businessObject, 'PPINOT:StateCondAggMeasureAll') 
|| is(businessObject, 'PPINOT:StateCondAggMeasureNo')){
  entries = filter(replaceOptions.AGGREGATED_MEASURE, differentType);
  return this._createEntries(element, entries);
}

// Add support for DerivedMultiInstanceMeasure, PPITarget, PPIScope, and PPI (robust type check)
if (
  boType === 'PPINOT:DerivedMultiInstanceMeasure' ||
  boType === 'PPINOT:PPITarget' ||
  boType === 'PPINOT:PPIScope' ||
  boType === 'PPINOT:PPI'
) {
  entries = filter(replaceOptions.MEASURE, differentType);
  return this._createEntries(element, entries);
}

// start events outside event sub processes
if (is(businessObject, 'bpmn:StartEvent') && !isEventSubProcess(businessObject.$parent)) {

  entries = filter(replaceOptions.START_EVENT, differentType);

  return this._createEntries(element, entries);
}


// expanded/collapsed pools
if (is(businessObject, 'bpmn:Participant')) {

  entries = filter(replaceOptions.PARTICIPANT, function(entry) {
    return isExpanded(businessObject) !== entry.target.isExpanded;
  });

  return this._createEntries(element, entries);
}

// start events inside event sub processes
if (is(businessObject, 'bpmn:StartEvent') && isEventSubProcess(businessObject.$parent)) {

  entries = filter(replaceOptions.EVENT_SUB_PROCESS_START_EVENT, function(entry) {

    var target = entry.target;

    var isInterrupting = target.isInterrupting !== false;

    var isInterruptingEqual = getBusinessObject(element).isInterrupting === isInterrupting;

    // filters elements which types and event definition are equal but have have different interrupting types
    return differentType(entry) || !differentType(entry) && !isInterruptingEqual;

  });

  return this._createEntries(element, entries);
}

// end events
if (is(businessObject, 'bpmn:EndEvent')) {

  entries = filter(replaceOptions.END_EVENT, function(entry) {
    var target = entry.target;

    // hide cancel end events outside transactions
    if (target.eventDefinitionType == 'bpmn:CancelEventDefinition' && !is(businessObject.$parent, 'bpmn:Transaction')) {
      return false;
    }

    return differentType(entry);
  });

  return this._createEntries(element, entries);
}

// boundary events
if (is(businessObject, 'bpmn:BoundaryEvent')) {

  entries = filter(replaceOptions.BOUNDARY_EVENT, function(entry) {

    var target = entry.target;

    if (target.eventDefinition == 'bpmn:CancelEventDefinition' &&
       !is(businessObject.attachedToRef, 'bpmn:Transaction')) {
      return false;
    }
    var cancelActivity = target.cancelActivity !== false;

    var isCancelActivityEqual = businessObject.cancelActivity == cancelActivity;

    return differentType(entry) || !differentType(entry) && !isCancelActivityEqual;
  });

  return this._createEntries(element, entries);
}

// intermediate events
if (is(businessObject, 'bpmn:IntermediateCatchEvent') ||
    is(businessObject, 'bpmn:IntermediateThrowEvent')) {

  entries = filter(replaceOptions.INTERMEDIATE_EVENT, differentType);

  return this._createEntries(element, entries);
}

// gateways
if (is(businessObject, 'bpmn:Gateway')) {

  entries = filter(replaceOptions.GATEWAY, differentType);

  return this._createEntries(element, entries);
}

// transactions
if (is(businessObject, 'bpmn:Transaction')) {

  entries = filter(replaceOptions.TRANSACTION, differentType);

  return this._createEntries(element, entries);
}

// expanded event sub processes
if (isEventSubProcess(businessObject) && isExpanded(element)) {

  entries = filter(replaceOptions.EVENT_SUB_PROCESS, differentType);

  return this._createEntries(element, entries);
}

// expanded sub processes
if (is(businessObject, 'bpmn:SubProcess') && isExpanded(element)) {

  entries = filter(replaceOptions.SUBPROCESS_EXPANDED, differentType);

  return this._createEntries(element, entries);
}

// collapsed ad hoc sub processes
if (is(businessObject, 'bpmn:AdHocSubProcess') && !isExpanded(element)) {

  entries = filter(replaceOptions.TASK, function(entry) {

    var target = entry.target;

    var isTargetSubProcess = target.type === 'bpmn:SubProcess';

    var isTargetExpanded = target.isExpanded === true;

    return isDifferentType(element, target) && (!isTargetSubProcess || isTargetExpanded);
  });

  return this._createEntries(element, entries);
}

// sequence flows
if (is(businessObject, 'bpmn:SequenceFlow')) {
  return this._createSequenceFlowEntries(element, replaceOptions.SEQUENCE_FLOW);
}

// flow nodes
if (is(businessObject, 'bpmn:FlowNode')) {
  entries = filter(replaceOptions.TASK, differentType);

  // collapsed SubProcess can not be replaced with itself
  if (is(businessObject, 'bpmn:SubProcess') && !isExpanded(element)) {
    entries = filter(entries, function(entry) {
      return entry.label !== 'Sub Process (collapsed)';
    });
  }

  return this._createEntries(element, entries);
}

return [];
};


/**
* Get a list of header items for the given element. This includes buttons
* for multi instance markers and for the ad hoc marker.
*
* @param {djs.model.Base} element
*
* @return {Array<Object>} a list of menu entry items
*/
ReplaceMenuProvider.prototype.getHeaderEntries = function(element) {

var headerEntries = [];

// 
if (is(element, 'PPINOT:TimeMeasure')) {
  headerEntries = headerEntries.concat(this._getCyclicTimeMeasure(element));
}

// The elements which are defined here will have a header menu options in the popup menu

// In this case, if the element is one of these, the options of _getFunctionsTimeAgg will appear in the
// header of the popup menu of these elements.
if (is(element, 'PPINOT:TimeAggregatedMeasure')
|| is(element, 'PPINOT:TimeAggregatedMeasureSUM')
|| is(element, 'PPINOT:TimeAggregatedMeasureMIN')
|| is(element, 'PPINOT:TimeAggregatedMeasureMAX')
|| is(element, 'PPINOT:TimeAggregatedMeasureAVG')){
  headerEntries = headerEntries.concat(this._getFunctionsTimeAgg(element));
}

if (is(element, 'PPINOT:AggregatedMeasure')
|| is(element, 'PPINOT:AggregatedMeasureSUM')
|| is(element, 'PPINOT:AggregatedMeasureMIN')
|| is(element, 'PPINOT:AggregatedMeasureMAX')
|| is(element, 'PPINOT:AggregatedMeasureAVG')){
  headerEntries = headerEntries.concat(this._getFunctionsAgg(element));
}

if (is(element, 'PPINOT:CountAggregatedMeasure')
|| is(element, 'PPINOT:CountAggregatedMeasureSUM')
|| is(element, 'PPINOT:CountAggregatedMeasureMIN')
|| is(element, 'PPINOT:CountAggregatedMeasureMAX')
|| is(element, 'PPINOT:CountAggregatedMeasureAVG')){
  headerEntries = headerEntries.concat(this._getFunctionsCountAgg(element));
}

if (is(element, 'PPINOT:DataAggregatedMeasure')
|| is(element, 'PPINOT:DataAggregatedMeasureSUM')
|| is(element, 'PPINOT:DataAggregatedMeasureMIN')
|| is(element, 'PPINOT:DataAggregatedMeasureMAX')
|| is(element, 'PPINOT:DataAggregatedMeasureAVG')){
  headerEntries = headerEntries.concat(this._getFunctionsDataAgg(element));
}

if (is(element, 'PPINOT:CyclicTimeMeasure')
|| is(element, 'PPINOT:CyclicTimeMeasureSUM')
|| is(element, 'PPINOT:CyclicTimeMeasureMIN')
|| is(element, 'PPINOT:CyclicTimeMeasureMAX')
|| is(element, 'PPINOT:CyclicTimeMeasureAVG')){
  headerEntries = headerEntries.concat(this._getFunctionsCyclicTimeMeasure(element));
}

if (is(element, 'PPINOT:CyclicTimeAggregatedMeasure')
|| is(element, 'PPINOT:CyclicTimeAggregatedMeasureSUM')
|| is(element, 'PPINOT:CyclicTimeAggregatedMeasureMIN')
|| is(element, 'PPINOT:CyclicTimeAggregatedMeasureMAX')
|| is(element, 'PPINOT:CyclicTimeAggregatedMeasureAVG')){
  headerEntries = headerEntries.concat(this._getFunctionsCyclicTimeAggregatedMeasure(element));
}

if (is(element, 'PPINOT:StateConditionAggregatedMeasure')
|| is(element, 'PPINOT:StateCondAggMeasureNumber') 
|| is(element, 'PPINOT:StateCondAggMeasurePercentage') 
|| is(element, 'PPINOT:StateCondAggMeasureAtLeastOne') 
|| is(element, 'PPINOT:StateCondAggMeasureAll') 
|| is(element, 'PPINOT:StateCondAggMeasureNo')){
  headerEntries = headerEntries.concat(this._getFunctionsStateCondition(element));
}

if (is(element, 'bpmn:Activity') && !isEventSubProcess(element)) {
  headerEntries = headerEntries.concat(this._getLoopEntries(element));
}

if (is(element, 'bpmn:SubProcess') &&
    !is(element, 'bpmn:Transaction') &&
    !isEventSubProcess(element)) {
  headerEntries.push(this._getAdHocEntry(element));
}

// De-duplicate by id
const seen = new Set();
headerEntries = headerEntries.filter(entry => {
  if (seen.has(entry.id)) return false;
  seen.add(entry.id);
  return true;
});

return headerEntries;
};


/**
* Creates an array of menu entry objects for a given element and filters the replaceOptions
* according to a filter function.
*
* @param  {djs.model.Base} element
* @param  {Object} replaceOptions
*
* @return {Array<Object>} a list of menu items
*/
ReplaceMenuProvider.prototype._createEntries = function(element, replaceOptions) {
var menuEntries = [];

var self = this;

forEach(replaceOptions, function(definition) {
  var entry = self._createMenuEntry(definition, element);

  menuEntries.push(entry);
});

return menuEntries;
};

/**
* Creates an array of menu entry objects for a given sequence flow.
*
* @param  {djs.model.Base} element
* @param  {Object} replaceOptions

* @return {Array<Object>} a list of menu items
*/
ReplaceMenuProvider.prototype._createSequenceFlowEntries = function(element, replaceOptions) {

var businessObject = getBusinessObject(element);

var menuEntries = [];

var modeling = this._modeling,
    moddle = this._moddle;

var self = this;

forEach(replaceOptions, function(entry) {

  switch (entry.actionName) {
  
  case 'replace-with-default-flow':
    if (businessObject.sourceRef.default !== businessObject &&
          (is(businessObject.sourceRef, 'bpmn:ExclusiveGateway') ||
           is(businessObject.sourceRef, 'bpmn:InclusiveGateway') ||
           is(businessObject.sourceRef, 'bpmn:ComplexGateway') ||
           is(businessObject.sourceRef, 'bpmn:Activity'))) {

      menuEntries.push(self._createMenuEntry(entry, element, function() {
        modeling.updateProperties(element.source, { default: businessObject });
      }));
    }
    break;
  case 'replace-with-conditional-flow':
    if (!businessObject.conditionExpression && is(businessObject.sourceRef, 'bpmn:Activity')) {

      menuEntries.push(self._createMenuEntry(entry, element, function() {
        var conditionExpression = moddle.create('bpmn:FormalExpression', { body: '' });

        modeling.updateProperties(element, { conditionExpression: conditionExpression });
      }));
    }
    break;
    
  default:
    
    // default flows
    if (is(businessObject.sourceRef, 'bpmn:Activity') && businessObject.conditionExpression) {
      return menuEntries.push(self._createMenuEntry(entry, element, function() {
        modeling.updateProperties(element, { conditionExpression: undefined });
      }));
    }


    // conditional flows
    if ((is(businessObject.sourceRef, 'bpmn:ExclusiveGateway') ||
         is(businessObject.sourceRef, 'bpmn:InclusiveGateway') ||
         is(businessObject.sourceRef, 'bpmn:ComplexGateway') ||
         is(businessObject.sourceRef, 'bpmn:Activity')) &&
         businessObject.sourceRef.default === businessObject) {

      return menuEntries.push(self._createMenuEntry(entry, element, function() {
        modeling.updateProperties(element.source, { default: undefined });
      }));
    }

  }
});

return menuEntries;
};


/**
* Creates and returns a single menu entry item.
*
* @param  {Object} definition a single replace options definition object
* @param  {djs.model.Base} element
* @param  {Function} [action] an action callback function which gets called when
*                             the menu entry is being triggered.
*
* @return {Object} menu entry item
*/


//This function defines the replacement logic for popup menu options

ReplaceMenuProvider.prototype._createMenuEntry = function(definition, element, action) {
var translate = this._translate;
var replaceElement = this._bpmnReplace.replaceElement;
var replace = this._replace;

var replaceAction = function() {
  return replaceElement(element, definition.target);
};

if(isPPINOTShape(element)){
  replaceAction = function() {
    return replace.replaceElement(element, definition.target);
  };
}

action = action || replaceAction;

var menuEntry = {
  label: translate(definition.label),
  className: definition.className,
  id: definition.actionName,
  action: action
};

return menuEntry;
};


/**
* Get a list of menu items containing buttons for multi instance markers
*
* @param  {djs.model.Base} element
*
* @return {Array<Object>} a list of menu items
*/
ReplaceMenuProvider.prototype._getLoopEntries = function(element) {

var self = this;
var translate = this._translate;

function toggleLoopEntry(event, entry) {
  var loopCharacteristics;

  if (entry.active) {
    loopCharacteristics = undefined;
  } else {
    loopCharacteristics = self._moddle.create(entry.options.loopCharacteristics);

    if (entry.options.isSequential) {
      loopCharacteristics.isSequential = entry.options.isSequential;
    }
  }
  self._modeling.updateProperties(element, { loopCharacteristics: loopCharacteristics });
}

var businessObject = getBusinessObject(element),
    loopCharacteristics = businessObject.loopCharacteristics;

var isSequential,
    isLoop,
    isParallel;

if (loopCharacteristics) {
  isSequential = loopCharacteristics.isSequential;
  isLoop = loopCharacteristics.isSequential === undefined;
  isParallel = loopCharacteristics.isSequential !== undefined && !loopCharacteristics.isSequential;
}


var loopEntries = [
  {
    id: 'toggle-parallel-mi',
    className: 'bpmn-icon-parallel-mi-marker',
    title: translate('Parallel Multi Instance'),
    active: isParallel,
    action: toggleLoopEntry,
    options: {
      loopCharacteristics: 'bpmn:MultiInstanceLoopCharacteristics',
      isSequential: false
    }
  },
  {
    id: 'toggle-sequential-mi',
    className: 'bpmn-icon-sequential-mi-marker',
    title: translate('Sequential Multi Instance'),
    active: isSequential,
    action: toggleLoopEntry,
    options: {
      loopCharacteristics: 'bpmn:MultiInstanceLoopCharacteristics',
      isSequential: true
    }
  },
  {
    id: 'toggle-loop',
    className: 'bpmn-icon-loop-marker',
    title: translate('Loop'),
    active: isLoop,
    action: toggleLoopEntry,
    options: {
      loopCharacteristics: 'bpmn:StandardLoopCharacteristics'
    }
  },
];
return loopEntries;
};


// This functions defines the replacement for header popup menu options

ReplaceMenuProvider.prototype._getCyclicTimeMeasure = function(element) {

var translate = this._translate;
var replace = this._replace;
var replaceAction = function() {
  return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeMeasure' });
};

var timeEntry = {
  id: 'replace-with-cyclic-time-measure',
  className: 'icon-cyclic-time-menu',
  label: translate('\xa0\xa0\xa0\xa0\xa0\xa0\xa0' + 'Cyclic'),
  action: replaceAction
};

return timeEntry;
};


ReplaceMenuProvider.prototype._getFunctionsTimeAgg = function(element) {
  var translate = this._translate;
  var replace = this._replace;
  var modeling = this._modeling;

  function replacePreservingConnections(element, newType) {

    var incoming = element.incoming ? element.incoming.slice() : [];
    var outgoing = element.outgoing ? element.outgoing.slice() : [];
    
    console.log('Preserving connections for', element.id, 'type:', element.type);
    console.log('Incoming connections:', incoming.length, 'Outgoing:', outgoing.length);
    
    var incomingData = incoming.map(function(connection) {
      return {
        source: connection.source,
        target: element,
        type: connection.type,
        waypoints: connection.waypoints ? connection.waypoints.slice() : undefined
      };
    });
    
    var outgoingData = outgoing.map(function(connection) {
      return {
        source: element,
        target: connection.target,
        type: connection.type,
        waypoints: connection.waypoints ? connection.waypoints.slice() : undefined
      };
    });
    
  
    var newElement = replace.replaceElement(element, { type: newType });
    

    incomingData.forEach(function(data) {
      try {
       
        if (data.source && newElement) {
          console.log('Recreating incoming connection from', data.source.id, 'to', newElement.id);
          
          var connectionData = { type: data.type };
          if (data.waypoints) {
            connectionData.waypoints = data.waypoints;
          }
          
          modeling.connect(data.source, newElement, connectionData);
        } else {
          console.warn('Invalid source or target for incoming connection');
        }
      } catch (error) {
        console.error('Error recreating incoming connection:', error);
      }
    });
    

    outgoingData.forEach(function(data) {
      try {
      
        if (newElement && data.target) {
          console.log('Recreating outgoing connection from', newElement.id, 'to', data.target.id);
          
          var connectionData = { type: data.type };
          if (data.waypoints) {
            connectionData.waypoints = data.waypoints;
          }
          
          modeling.connect(newElement, data.target, connectionData);
        } else {
          console.warn('Invalid source or target for outgoing connection');
        }
      } catch (error) {
        console.error('Error recreating outgoing connection:', error);
      }
    });
    
    return newElement;
  }
  

  var replaceActionCyclic = function() {
    return replacePreservingConnections(element, 'PPINOT:CyclicTimeAggregatedMeasure');
  };
  var replaceActionSUM = function() {
    return replacePreservingConnections(element, 'PPINOT:TimeAggregatedMeasureSUM');
  };
  var replaceActionMAX = function() {
    return replacePreservingConnections(element, 'PPINOT:TimeAggregatedMeasureMAX');
  };
  var replaceActionMIN = function() {
    return replacePreservingConnections(element, 'PPINOT:TimeAggregatedMeasureMIN');
  };
  var replaceActionAVG = function() {
    return replacePreservingConnections(element, 'PPINOT:TimeAggregatedMeasureAVG');
  };
  
  var timeEntry = [
    {
      id: 'replace-with-cyclic-time-agg',
      className: 'icon-cyclic-time-menu',
      label: translate('\xa0\xa0\xa0\xa0\xa0' + 'Cyclic'),
      action: replaceActionCyclic
    },
    {
      id: 'replace-with-time-agg-sum',
      label: translate('SUM'),
      action: replaceActionSUM
    },
    {
      id: 'replace-with-time-agg-max',
      label: translate('MAX'),
      action: replaceActionMAX
    },
    {
      id: 'replace-with-time-agg-min',
      label: translate('MIN'),
      action: replaceActionMIN
    },
    {
      id: 'replace-with-time-agg-avg',
      label: translate('AVG'),
      action: replaceActionAVG
    }
  ];
  
  return timeEntry;
};

  ReplaceMenuProvider.prototype._getFunctionsAgg = function(element) {

    var translate = this._translate;
    var replace = this._replace;

    var replaceActionSUM = function() {
      return replace.replaceElement(element, { type: 'PPINOT:AggregatedMeasureSUM' });
    };
    var replaceActionMAX = function() {
      return replace.replaceElement(element, { type: 'PPINOT:AggregatedMeasureMAX' });
    };
    var replaceActionMIN = function() {
      return replace.replaceElement(element, { type: 'PPINOT:AggregatedMeasureMIN' });
    };
    var replaceActionAVG = function() {
      return replace.replaceElement(element, { type: 'PPINOT:AggregatedMeasureAVG' });
    };
    
    var timeEntry = [
    
      {
        id: 'replace-with-agg-sum',
        label: translate('SUM'),
        action: replaceActionSUM
      },
      {
        id: 'replace-with-agg-max',
        label: translate('MAX'),
        action: replaceActionMAX
      },
      {
        id: 'replace-with-agg-min',
        label: translate('MIN'),
        action: replaceActionMIN
      },
      {
        id: 'replace-with-agg-avg',
        label: translate('AVG'),
        action: replaceActionAVG
      }
    ];
    
    return timeEntry;
    };


  ReplaceMenuProvider.prototype._getFunctionsCyclicTimeMeasure = function(element) {

    var translate = this._translate;
    var replace = this._replace;
    var replaceActionSUM = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeMeasureSUM' });
    };
    var replaceActionMAX = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeMeasureMAX' });
    };
    var replaceActionMIN = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeMeasureMIN' });
    };
    var replaceActionAVG = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeMeasureAVG' });
    };
    
    var timeEntry = [
      {
        id: 'replace-with-time-sum',
        label: translate('SUM'),
        action: replaceActionSUM
      },
      {
        id: 'replace-with-time-max',
        label: translate('MAX'),
        action: replaceActionMAX
      },
      {
        id: 'replace-with-time-min',
        label: translate('MIN'),
        action: replaceActionMIN
      },
      {
        id: 'replace-with-time-avg',
        label: translate('AVG'),
        action: replaceActionAVG
      }
    ];
    
    return timeEntry;
  };
  

  ReplaceMenuProvider.prototype._getFunctionsCountAgg = function(element) {

  var translate = this._translate;
  var replace = this._replace;
  var replaceActionSUM = function() {
    return replace.replaceElement(element, { type: 'PPINOT:CountAggregatedMeasureSUM' });
  };
  var replaceActionMAX = function() {
    return replace.replaceElement(element, { type: 'PPINOT:CountAggregatedMeasureMAX' });
  };
  var replaceActionMIN = function() {
    return replace.replaceElement(element, { type: 'PPINOT:CountAggregatedMeasureMIN' });
  };
  var replaceActionAVG = function() {
    return replace.replaceElement(element, { type: 'PPINOT:CountAggregatedMeasureAVG' });
  };
  
  var timeEntry = [
    {
      id: 'replace-with-count-agg-sum',
      label: translate('SUM'),
      action: replaceActionSUM
    },
    {
      id: 'replace-with-count-agg-max',
      label: translate('MAX'),
      action: replaceActionMAX
    },
    {
      id: 'replace-with-count-agg-min',
      label: translate('MIN'),
      action: replaceActionMIN
    },
    {
      id: 'replace-with-count-agg-avg',
      label: translate('AVG'),
      action: replaceActionAVG
    }
  ];
  
  return timeEntry;
  };

ReplaceMenuProvider.prototype._getFunctionsDataAgg = function(element) {

  var translate = this._translate;
  var replace = this._replace;
  var replaceActionSUM = function() {
    return replace.replaceElement(element, { type: 'PPINOT:DataAggregatedMeasureSUM' });
  };
  var replaceActionMAX = function() {
    return replace.replaceElement(element, { type: 'PPINOT:DataAggregatedMeasureMAX' });
  };
  var replaceActionMIN = function() {
    return replace.replaceElement(element, { type: 'PPINOT:DataAggregatedMeasureMIN' });
  };
  var replaceActionAVG = function() {
    return replace.replaceElement(element, { type: 'PPINOT:DataAggregatedMeasureAVG' });
  };
  
  var timeEntry = [
    {
      id: 'replace-with-data-agg-sum',
      label: translate('SUM'),
      action: replaceActionSUM
    },
    {
      id: 'replace-with-data-agg-max',
      label: translate('MAX'),
      action: replaceActionMAX
    },
    {
      id: 'replace-with-data-agg-min',
      label: translate('MIN'),
      action: replaceActionMIN
    },
    {
      id: 'replace-with-data-agg-avg',
      label: translate('AVG'),
      action: replaceActionAVG
    }
  ];
  
  return timeEntry;
  };


  ReplaceMenuProvider.prototype._getFunctionsCyclicTimeAggregatedMeasure = function(element) {

    var translate = this._translate;
    var replace = this._replace;
    var replaceActionSUM = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeAggregatedMeasureSUM' });
    };
    var replaceActionMAX = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeAggregatedMeasureMAX' });
    };
    var replaceActionMIN = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeAggregatedMeasureMIN' });
    };
    var replaceActionAVG = function() {
      return replace.replaceElement(element, { type: 'PPINOT:CyclicTimeAggregatedMeasureAVG' });
    };
    
    var timeEntry = [
      {
        id: 'replace-with-cyclic-time-agg-sum',
        label: translate('SUM'),
        action: replaceActionSUM
      },
      {
        id: 'replace-with-cyclic-time-agg-max',
        label: translate('MAX'),
        action: replaceActionMAX
      },
      {
        id: 'replace-with-cyclic-time-agg-min',
        label: translate('MIN'),
        action: replaceActionMIN
      },
      {
        id: 'replace-with-cyclic-time-agg-avg',
        label: translate('AVG'),
        action: replaceActionAVG
      }
    ];
    
    return timeEntry;
  };


ReplaceMenuProvider.prototype._getFunctionsStateCondition = function(element) {

    var translate = this._translate;
    var replace = this._replace;
    var replaceActionNumber = function() {
      return replace.replaceElement(element, { type: 'PPINOT:StateCondAggMeasureNumber' });
    };
    var replaceActionPercentage = function() {
      return replace.replaceElement(element, { type: 'PPINOT:StateCondAggMeasurePercentage' });
    };
    var replaceActionAll = function() {
      return replace.replaceElement(element, { type: 'PPINOT:StateCondAggMeasureAll' });
    };
    var replaceActionAtLeastOne = function() {
      return replace.replaceElement(element, { type: 'PPINOT:StateCondAggMeasureAtLeastOne' });
    };
    var replaceActionNo = function() {
      return replace.replaceElement(element, { type: 'PPINOT:StateCondAggMeasureNo' });
    };
    
    var timeEntry = [
      {
        id: 'replace-with-state-number',
        label: translate('#'),
        action: replaceActionNumber
      },
      {
        id: 'replace-with-state-percentage',
        label: translate('%'),
        action: replaceActionPercentage
      },
      {
        id: 'replace-with-state-all',
        label: translate('∀'),
        action: replaceActionAll
      },
      {
        id: 'replace-with-state-atLeastOne',
        label: translate('∃'),
        action: replaceActionAtLeastOne
      },
      {
        id: 'replace-with-state-no',
        label: translate('∄'),
        action: replaceActionNo
      }
    ];
    
    return timeEntry;
  };


/**
* Get the menu items containing a button for the ad hoc marker 
*
* @param  {djs.model.Base} element
*
* @return {Object} a menu item
*/
ReplaceMenuProvider.prototype._getAdHocEntry = function(element) {
var translate = this._translate;
var businessObject = getBusinessObject(element);

var isAdHoc = is(businessObject, 'bpmn:AdHocSubProcess');

var replaceElement = this._bpmnReplace.replaceElement;

var adHocEntry = {
  id: 'toggle-adhoc',
  className: 'bpmn-icon-ad-hoc-marker',
  title: translate('Ad-hoc'),
  active: isAdHoc,
  action: function() {
    if (isAdHoc) {
      return replaceElement(element, { type: 'bpmn:SubProcess' });
    } else {
      return replaceElement(element, { type: 'bpmn:AdHocSubProcess' });
    }
  }
};

return adHocEntry;
};
