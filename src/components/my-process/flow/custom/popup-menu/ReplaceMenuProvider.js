import {
  getBusinessObject,
  is
} from '../util/ModelUtil';

import {
  isEventSubProcess,
  isExpanded
} from '../util/DiUtil';

import {
  isDifferentType
} from '../util/TypeUtil';

import {
  forEach,
  filter
} from 'min-dash';

import * as replaceOptions from './ReplaceOptions';

export default function ReplaceMenuProvider(
    bpmnFactory, popupMenu, modeling, moddle,
    bpmnReplace, rules, translate) {

  this._bpmnFactory = bpmnFactory;
  this._popupMenu = popupMenu;
  this._modeling = modeling;
  this._moddle = moddle;
  this._bpmnReplace = bpmnReplace;
  this._rules = rules;
  this._translate = translate;

  popupMenu.registerProvider('bpmn-replace', this);
}

ReplaceMenuProvider.$inject = [
  'bpmnFactory',
  'popupMenu',
  'modeling',
  'moddle',
  'bpmnReplace',
  'rules',
  'translate'
];

ReplaceMenuProvider.prototype.getEntries = function(element) {

  var businessObject = element.businessObject;

  var rules = this._rules;

  var entries;

  if (!rules.allowed('shape.replace', { element: element })) {
    return [];
  }

  var differentType = isDifferentType(element);

  if (is(businessObject, 'bpmn:DataObjectReference')) {
    return this._createEntries(element, replaceOptions.DATA_OBJECT_REFERENCE);
  }

  if (is(businessObject, 'bpmn:DataStoreReference') && !is(element.parent, 'bpmn:Collaboration')) {
    return this._createEntries(element, replaceOptions.DATA_STORE_REFERENCE);
  }

  // start events outside sub processes
  if (is(businessObject, 'bpmn:StartEvent') && !is(businessObject.$parent, 'bpmn:SubProcess')) {

    entries = filter(replaceOptions.START_EVENT, differentType);

    return this._createEntries(element, entries);
  }

  // expanded/collapsed pools
  if (is(businessObject, 'bpmn:Participant')) {

    entries = filter(replaceOptions.PARTICIPANT, function(entry) {
      return isExpanded(element) !== entry.target.isExpanded;
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

  // start events inside sub processes
  if (is(businessObject, 'bpmn:StartEvent') && !isEventSubProcess(businessObject.$parent)
      && is(businessObject.$parent, 'bpmn:SubProcess')) {
    entries = filter(replaceOptions.START_EVENT_SUB_PROCESS, differentType);

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

      if (target.eventDefinitionType == 'bpmn:CancelEventDefinition' &&
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

ReplaceMenuProvider.prototype.getHeaderEntries = function(element) {
  return [];
};

ReplaceMenuProvider.prototype._createEntries = function(element, replaceOptions) {
  var menuEntries = [];

  var self = this;

  forEach(replaceOptions, function(definition) {
    var entry = self._createMenuEntry(definition, element);

    menuEntries.push(entry);
  });

  return menuEntries;
};

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

ReplaceMenuProvider.prototype._createMenuEntry = function(definition, element, action) {
  var translate = this._translate;
  var replaceElement = this._bpmnReplace.replaceElement;

  var replaceAction = function() {
    return replaceElement(element, definition.target);
  };

  var label = definition.label;
  if (label && typeof label === 'function') {
    label = label(element);
  }

  action = action || replaceAction;

  var menuEntry = {
    label: translate(label),
    className: definition.className,
    id: definition.actionName,
    action: action
  };

  return menuEntry;
};
