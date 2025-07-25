import inherits from 'inherits';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

import {connections, isRalphConnection} from "./Types";

import OrderingProvider from 'diagram-js/lib/features/ordering/OrderingProvider';


/**
 * a simple ordering provider that ensures that RALph
 * connections are always rendered on top.
 */
export default function RALphOrderingProvider(eventBus, canvas) {

  OrderingProvider.call(this, eventBus);

  this.getOrdering = function(element, newParent) {

    // render labels always on top
    if (element.labelTarget) {
      return {
        parent: canvas.getRootElement(),
        index: -1
      };
    }

    else if (isRalphConnection(element.type)) {

      // always move to end of root element
      // to display always on top
      return {
        parent: canvas.getRootElement(),
        index: -1
      };
    }
  };
}

RALphOrderingProvider.$inject = [ 'eventBus', 'canvas' ];

inherits(RALphOrderingProvider, OrderingProvider);