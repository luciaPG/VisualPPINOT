import inherits from 'inherits';

import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

import {is} from "bpmn-js/lib/util/ModelUtil";

import {
  isAny
} from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

import {
  assign,
  bind
} from 'min-dash';
import {isLabel} from "./utils/LabelUtil";

import {resourceArcElements, myConnectionElements, aggreagatedElements} from "./Types";


export default function CustomContextPadProvider(config, injector, elementFactory, connect, create, translate) {

    injector.invoke(ContextPadProvider, this);

    var cached = bind(this.getContextPadEntries, this);

    let autoPlace = config.autoPlace
    if (autoPlace !== false) {
        autoPlace = injector.get('autoPlace', false);
    }

    function appendAction(type, className, title, options) {
        if (typeof title !== 'string') {
            options = title;
            title = translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
        }

        function appendStart(event, element) {
            var shape = elementFactory.createShape(assign({ type: type }, options));
            create.start(event, shape, {
                source: element
            });
        }

        function append(event, element) {
            var shape = elementFactory.createShape(assign({ type: type }, options));

            autoPlace.append(element, shape);
        }


        return {
            group: 'model',
            className: className,
            title: title,
            action: {
                dragstart: appendStart,
                click: autoPlace ? append : appendStart
            }
        };
    }

    function appendConnectAction(type, className, title) {
        if (typeof title !== 'string') {
            title = translate('Append {type}', { type: type.replace(/^custom:/, '') });
        }

        function connectStart(event, element, autoActivate) {
            connect.customStart(event, element, type, elementFactory, autoActivate);
        }


        return {
            group: 'connect',
            className: className,
            title: title,
            action: {
                dragstart: connectStart,
                click: connectStart
            }
        };
    }

    this.getContextPadEntries = function(element) {
    var actions = cached(element);
    var businessObject = element.businessObject;

    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
    }

    function startConnectConsequence(event, element, autoActivate) {
      connect.customStart(event, element, 'custom:ConsequenceFlow', autoActivate);
    }

    function startConnectConsequenceTimed(event, element, autoActivate) {
      connect.customStart2(event, element, 'custom:ConsequenceTimedFlow', elementFactory, autoActivate);
    }

    function startConnectTimeDistance(event, element, autoActivate) {
        connect.customStart2(event, element, 'custom:ConsequenceTimedFlow', elementFactory, autoActivate);
    }

    if (isAny(businessObject, resourceArcElements) && element.type !== 'label') {
        assign(actions, {
          'connect': {
              group: 'connect',
              className: 'bpmn-icon-connection-multi',
              title: translate('Connect using custom connection'),
              action: {
                  click: startConnect,
                  dragstart: startConnect
              }
          }
        });
    }

    // if (isAny(businessObject, aggreagatedElements) && element.type !== 'label') {
    //     assign(actions, {
    //       'connect': {
    //           group: 'connect',
    //           className: 'bpmn-icon-conditional-flow', // MAL
    //           title: translate('Aggregated connection'),
    //           action: {
    //               click: startConnect,
    //               dragstart: startConnect
    //           }
    //       }
    //     });
    // }

    if(isAny(businessObject, aggreagatedElements) && element.type !== 'label') {
        assign(actions, {
            'connect1': appendConnectAction(
                'custom:AggregatedConnection',
                'bpmn-icon-conditional-flow',
                'Aggregated connection'
            ),
            // 'connect2': appendConnectAction(
            //     'custom:Groupedby',
            //     'bpmn-icon-conditional-flow',
            //     'isGroupedBy'
            // ),
        });
    }

    // ESTO CREO QUE HAY QUE MODIFICAR PARA VARIAS CONEXIONES
    
    if(is(businessObject, 'bpmn:BaseElement') && element.type !== 'label') {
        assign(actions, {
            'connect1': appendConnectAction(
                'custom:ConsequenceFlow',
                'bpmn-icon-connection-multi',
                'Connect using custom connection'
            ),
            'connect2': appendConnectAction(
                'custom:ConsequenceTimedFlow',
                'bpmn-icon-connection-multi',
                'Connection'
            ),
            'connect3': appendConnectAction(
                'custom:TimeDistance',
                'bpmn-icon-connection-multi',
                'Connect using custom connection'
            ),
        });
    }

    if(is(businessObject, 'custom:TimeMeasure') && element.type !== 'label') {
        assign(actions, {
            'connect1': appendConnectAction(
                'custom:ToConnection',
                'bpmn-icon-connection-multi',
                'Connect using To connection'
            ),
            'connect2': appendConnectAction(
                'custom:FromConnection',
                'bpmn-icon-connection-multi',
                'Connect using From connection'
            ),
        });
    }

    if(isAny(businessObject, myConnectionElements) && element.type !== 'label') {
        assign(actions, {
            'connect1': appendConnectAction(
                'custom:ResourceArc',
                'bpmn-icon-connection-multi',
                'Connect using custom connection'
            ),
            'connect2': appendConnectAction(
                'custom:MyConnection',
                'bpmn-icon-connection-multi',
                // 'bpmn-icon-lane-divide-two', -- mirar ContextPadProvider
                'My connection'
            ),
        });
    }

    return actions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
    'config',
    'injector',
    'elementFactory',
    'connect',
    'create',
    'translate'
];