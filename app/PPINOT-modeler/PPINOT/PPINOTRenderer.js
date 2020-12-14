import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import BpmnRenderer from "bpmn-js/lib/draw/BpmnRenderer";

import {componentsToPath, createLine} from 'diagram-js/lib/util/RenderUtil';

import {query as domQuery} from 'min-dom';

import {append as svgAppend, attr as svgAttr, classes as svgClasses, create as svgCreate} from 'tiny-svg';
import {getFillColor, getSemantic, getStrokeColor} from "bpmn-js/lib/draw/BpmnRenderUtil";
import {assign} from "min-dash";
import Ids from 'ids';
import {getLabel, setLabel} from "./utils/LabelUtil"
import BaseElementFactory from "diagram-js/lib/core/ElementFactory";
import {isPPINOTConnection, isPPINOTShape, label} from "./Types";

import Svg from './svg';

// import * as svg from 'tiny-svg'

var RENDERER_IDS = new Ids();

var COLOR_GREEN = '#52B415',
    COLOR_RED = '#cc0000',
    COLOR_YELLOW = '#ffc800',
    BLACK = '#000';

/**
 * A renderer that knows how to render PPINOT elements.
 */
export default function PPINOTRenderer(eventBus, styles, canvas, textRenderer) {

  BaseRenderer.call(this, eventBus, 2000);

  var computeStyle = styles.computeStyle;

  var rendererId = RENDERER_IDS.next();

  var markers = {};

  

  function renderLabel(parentGfx, label, options) {
    options = assign({
      size: {
        width: 100
      }
    }, options);

    var text = textRenderer.createText(label || '', options);
    

    svgClasses(text).add('djs-label');

    svgAppend(parentGfx, text);

    return text;
  }


  function renderEmbeddedLabel(parentGfx, element, align) {
    var semantic = getSemantic(element);

    return renderLabel(parentGfx, semantic.text, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: element.color
      }
    });
  }

  function renderConnectionLabel(parentGfx, element, label) {
    
    return renderLabel(parentGfx, label, {
      
      fitBox: true,
      style: assign(
          {},
          textRenderer.getExternalStyle(),
          {
            fill: element.color
          }
      )
    });
  }

  // to include default labels into elements
  function renderEmbeddedDefaultLabel(parentGfx, element, align, label) {
    return renderLabel(parentGfx, label, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: element.color
      }
    });
  }

  function renderPPINOTLabel(parentGfx, element) {
  
    return renderLabel(parentGfx, getLabel(element), {
      box: {
        height: 30,
        width: element.width,
        align: 'center-middle'
      },
      style: {
        fill: element.color
      }
    });
  }
  

  function renderExternalLabel(parentGfx, element) {
    var box = {
      width: 90,
      height: 10,
      x: element.width / 2 + element.x,
      y: element.height /2 + element.y
    };
    return renderLabel(parentGfx, getLabel(element), {
      box: box,
      fitBox: true,
      style: assign(
          {},
          textRenderer.getExternalStyle(),
          {
            fill: element.color
          }
      )
    });
  }

  function createPathFromConnection(connection) {
    var waypoints = connection.waypoints;

    var pathData = 'm  ' + waypoints[0].x + ',' + waypoints[0].y;
    for (var i = 1; i < waypoints.length; i++) {
      pathData += 'L' + waypoints[i].x + ',' + waypoints[i].y + ' ';
    }
    return pathData;
  }

  function addMarker( id, options) {
    var attrs = assign({
      fill: 'black',
      strokeWidth: 1,
      strokeLinecap: 'round',
      strokeDasharray: 'none',
      labelContent: ''

    }, options.attrs);

    var ref = options.ref || { x: 0, y: 0 };
    var scale = options.scale || 1;

    // fix for safari / chrome / firefox bug not correctly
    // resetting stroke dash array
    if (attrs.strokeDasharray === 'none') {
      attrs.strokeDasharray = [10000, 1];
    }

    var marker = svgCreate('marker');
    svgAttr(options.element, attrs);
    svgAppend(marker, options.element);

    svgAttr(marker, {
      id: id,
      viewBox: '0 0 20 20',
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: 'auto'
    });

    var defs = domQuery('defs', canvas._svg);

    if (!defs) {
      defs = svgCreate('defs');
      svgAppend(canvas._svg, defs);
    }
    svgAppend(defs, marker);
    markers[id] = marker;
  }

  function colorEscape(str) {
    return str.replace(/[()\s,#]+/g, '_');
  }

  function marker(type, fill, stroke) {
    var id = type + '-' + colorEscape(fill) + '-' + colorEscape(stroke) + '-' + rendererId;

    if (!markers[id]) {
      createMarker(id, type, fill, stroke);
    }

    return 'url(#' + id + ')';
  }

  function createMarker(id, type, fill, stroke) {

    if (type === 'sequenceflow-end') {
      var sequenceflowEnd = svgCreate('path');
      svgAttr(sequenceflowEnd, { d: 'M 1 5 L 11 10 L 1 15 Z' });

      addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: stroke,
          stroke: stroke
        }
      });
    }

  

    if (type === 'timedistance-start') {
      var sequenceflowEnd = svgCreate('path');
      svgAttr(sequenceflowEnd, { d: 'M -10 -5 L 20 10 L -10 25 L 20 10  Z' });

      addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 5, y: 10 },
        scale: 0.8,
        attrs: {
          fill: '#fff',
          stroke: stroke,
          strokeWidth: 1.5,
          fillOpacity: 0
        }
      });
    }

    if (type === 'timedistance-end') {
      var sequenceflowEnd = svgCreate('path');
      svgAttr(sequenceflowEnd, { d: 'M 35 0 L 0 15 L 35 30 L 0 15  Z' });

      addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 14, y: 15 },
        scale: 0.8,
        attrs: {
          fill: '#fff',
          stroke: stroke,
          strokeWidth: 1.5,
          fillOpacity: 0
        }
      });
    }

    if (type === 'messageflow-start') {
      var messageflowStart = svgCreate('circle');
      svgAttr(messageflowStart, { cx: 6, cy: 6, r: 3.5 });

      addMarker(id, {
        element: messageflowStart,
        attrs: {
          fill: fill,
          stroke: stroke
        },
        ref: { x: 6, y: 6 }
      });
    }


    if (type === 'messageflow-end') {
      var messageflowEnd = svgCreate('path');
      svgAttr(messageflowEnd, { d: 'm 1 5 l 0 -3 l 7 3 l -7 3 z' });

     
      addMarker(id, {
        element: messageflowEnd,
        attrs: {
          fill: fill,
          stroke: stroke,
          strokeLinecap: 'butt'
        },
        ref: { x: 8.5, y: 5 }
      });
    }

    if (type === 'association-start') {
      var associationStart = svgCreate('path');
      svgAttr(associationStart, { d: 'M 11 5 L 1 10 L 11 15' });

      addMarker(id, {
        element: associationStart,
        attrs: {
          fill: 'none',
          stroke: stroke,
          strokeWidth: 1.5
        },
        ref: { x: 1, y: 10 },
        scale: 0.5
      });
    }

    if (type === 'association-end') {
      var associationEnd = svgCreate('path');
      svgAttr(associationEnd, { d: 'M 1 5 L 11 10 L 1 15' });

      addMarker(id, {
        element: associationEnd,
        attrs: {
          fill: 'none',
          stroke: stroke,
          strokeWidth: 1.5
        },
        ref: { x: 12, y: 10 },
        scale: 0.5
      });
    }

    if (type === 'conditional-flow-marker') {
      var conditionalflowMarker = svgCreate('path');
      svgAttr(conditionalflowMarker, { d: 'M 0 10 L 8 6 L 16 10 L 8 14 Z' });

      addMarker(id, {
        element: conditionalflowMarker,
        attrs: {
          fill: fill,
          stroke: stroke
        },
        ref: { x: -1, y: 10 },
        scale: 0.5
      });
    }

    if (type === 'conditional-default-flow-marker') {
      var conditionaldefaultflowMarker = svgCreate('path');
      svgAttr(conditionaldefaultflowMarker, { d: 'M 6 4 L 10 16' });

      addMarker(id, {
        element: conditionaldefaultflowMarker,
        attrs: {
          stroke: stroke
        },
        ref: { x: 0, y: 10 },
        scale: 0.5
      });
    }
  }

  function drawPath(parentGfx, d, attrs) {

    attrs = computeStyle(attrs, [ 'no-fill' ], {
      strokeWidth: 2,
      stroke: 'black'
    });

    var path = svgCreate('path');
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  function drawAvion(element){
    var avion = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLavion
    })
    return avion;
  };

  function drawBaseMeasure(element){
    var baseMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLbaseMeasure
    })
    return baseMeasure;
  };

  function drawTarget(element){
    var target = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLtarget
    })
    return target;
  };

  function drawScope(element){
    var scope = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLscope
    })
    return scope;
  };

  function drawAggregatedMeasure(element){
    var aggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLaggregatedMeasure
    })
    return aggregatedMeasure;
  };

  function drawTimeAggregatedMeasure(element){
    var timeAggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLtimeAggregatedMeasure
    })
    return timeAggregatedMeasure;
  };

  function drawCyclicTimeAggregatedMeasure(element){
    var cyclicTimeAggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLcyclicTimeAggregatedMeasure
    })
    return cyclicTimeAggregatedMeasure;
  };

  function drawCountAggregatedMeasure(element){
    var countAggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLcountAggregatedMeasure
    })
    return countAggregatedMeasure;
  };

  function drawCountMeasure(element){
    var countMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLcountMeasure
    })
    return countMeasure;
  };

  function drawTimeMeasure(element){
    var countMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLtimeMeasure
    })
    return countMeasure;
  };

  function drawCyclicTimeMeasure(element){
    var cyclicTime = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLcyclicTimeMeasure
    })
    return cyclicTime;
  };

  function drawDataAggregatedMeasure(element){
    var dataAggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLdataAggregatedMeasure
    })
    return dataAggregatedMeasure;
  };

  function drawDataMeasure(element){
    var dataMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLdataMeasure
    })
    return dataMeasure;
  };

  function drawDataPropertyConditionAggregatedMeasure(element){
    var dataPropertyConditionAggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLdataPropertyConditionAggregatedMeasure
    })
    return dataPropertyConditionAggregatedMeasure;
  };

  function drawDataPropertyConditionMeasure(element){
    var dataPropertyConditionMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLdataPropertyConditionMeasure
    })
    return dataPropertyConditionMeasure;
  };

  function drawDerivedMultiInstanceMeasure(element){
    var derivedMultiInstanceMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLderivedMultiInstanceMeasure
    })
    return derivedMultiInstanceMeasure;
  };

  function drawDerivedSingleInstanceMeasure(element){
    var derivedSingleInstanceMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLderivedSingleInstanceMeasure
    })
    return derivedSingleInstanceMeasure;
  };

  function drawPpi(element){
    var ppi = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLppi3
    })
    return ppi;
  };

  function drawStateConditionMeasure(element){
    var stateConditionMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLstateConditionMeasure
    })
    return stateConditionMeasure;
  };

  function drawStateConditionAggregatedMeasure(element){
    var stateConditionAggregatedMeasure = svgCreate('image', {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      href: Svg.dataURLstateConditionAggregatedMeasure
    })
    return stateConditionAggregatedMeasure;
  };

  function drawTimeSlot(width, height, color) {
    var attrs = computeStyle(attrs, {
      stroke: color || '#fff',
      strokeWidth: 2,
      fill: '#fff'
    });

    var polygon = svgCreate('rect');

    svgAttr(polygon, {
      width: width,
      height: height,
      rx: 20,
      ry: 20
    });

    svgAttr(polygon, attrs);

    return polygon
  }

  function drawTimeDistanceArc(p, element, options) {
    var pathData = createPathFromConnection(element);
    var attrs = {
      strokeLinejoin: 'round',
      stroke: element.color || BLACK,
      strokeWidth: 1.5
    };

    attrs = assign(attrs, options)

    return drawPath(p, pathData, attrs);
  }

  function drawMyConnection(p, element, options, label) {
    var pathData = createPathFromConnection(element);   
    var attrs = {
      strokeLinejoin: 'round',
      stroke: element.color || BLACK,
      strokeWidth: 1.5,
      label: renderConnectionLabel(p, element, label)
    };
    
    attrs = assign(attrs, options)
    return drawPath(p, pathData, attrs);
  }

  function renderer(type) {
    return renderers[type];
  }


  var renderers = this.renderers = {
    'PPINOT:TimeSlot': (p, element) => {
      let polygon = drawTimeSlot(element.width, element.height, element.color)

      svgAppend(p, polygon);
      renderEmbeddedLabel(p, element, 'center-middle');

      return polygon;
    },
    'PPINOT:Avion': (p, element) => {
      // let avion = drawAvion(element)
      // svgAppend(p, avion);
      // renderEmbeddedLabel(p, element, 'center-middle');

      // return avion;
    },
    'PPINOT:Target': (p, element) => {
      let target = drawTarget(element)
      svgAppend(p, target);
      renderEmbeddedLabel(p, element, 'center-middle');

      return target;
    },
    'PPINOT:Scope': (p, element) => {
      let scope = drawScope(element)
      svgAppend(p, scope);
      renderEmbeddedLabel(p, element, 'center-middle');

      return scope;
    },
    'PPINOT:AggregatedMeasure': (p, element) => {
      let aggregatedMeasure = drawAggregatedMeasure(element)
      svgAppend(p, aggregatedMeasure);
      
     
      return aggregatedMeasure;
    },
    'PPINOT:TimeAggregatedMeasure': (p, element) => {
      let timeAggregatedMeasure = drawTimeAggregatedMeasure(element)
      svgAppend(p, timeAggregatedMeasure);
      
     
      return timeAggregatedMeasure;
    },
    'PPINOT:CyclicTimeAggregatedMeasure': (p, element) => {
      let cyclicTimeAggregatedMeasure = drawCyclicTimeAggregatedMeasure(element)
      svgAppend(p, cyclicTimeAggregatedMeasure);
      
     
      return cyclicTimeAggregatedMeasure;
    },
    'PPINOT:CountAggregatedMeasure': (p, element) => {
      let countAggregatedMeasure = drawCountAggregatedMeasure(element)
      svgAppend(p, countAggregatedMeasure);
      //renderEmbeddedDefaultLabel(p, element, 'center-middle', 'Texto por defecto');
      //renderEmbeddedLabel(p, element, 'center-middle');
      
      return countAggregatedMeasure;
    },
    'PPINOT:CountMeasure': (p, element) => {
      let countMeasure = drawCountMeasure(element)
      svgAppend(p, countMeasure);
      //renderEmbeddedLabel(p, element, 'center-middle');
      

      return countMeasure;
      
    },
    'PPINOT:TimeMeasure': (p, element) => {
      let timeMeasure = drawTimeMeasure(element)
      svgAppend(p, timeMeasure);
      //renderEmbeddedLabel(p, element, 'center-middle');

      return timeMeasure;
    },
    'PPINOT:CyclicTimeMeasure': (p, element) => {
      let cyclicTime = drawCyclicTimeMeasure(element)
      svgAppend(p, cyclicTime);
      //renderEmbeddedLabel(p, element, 'center-middle');

      return cyclicTime;
    },
    'PPINOT:BaseMeasure': (p, element) => {
      let baseMeasure = drawBaseMeasure(element)
      svgAppend(p, baseMeasure);
      //renderEmbeddedLabel(p, element, 'center-middle');

      return baseMeasure;
    },
    'PPINOT:DataAggregatedMeasure': (p, element) => {
      let dataAggregatedMeasure = drawDataAggregatedMeasure(element)
      svgAppend(p, dataAggregatedMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');
      renderExternalLabel(p, element);
      return dataAggregatedMeasure;
    },
    'PPINOT:DataMeasure': (p, element) => {
      let dataMeasure = drawDataMeasure(element)
      svgAppend(p, dataMeasure);
      //renderEmbeddedLabel(p, element, 'center-middle');
      return dataMeasure;
    },
    'PPINOT:DataPropertyConditionAggregatedMeasure': (p, element) => {
      let dataPropertyConditionAggregatedMeasure = drawDataPropertyConditionAggregatedMeasure(element)
      svgAppend(p, dataPropertyConditionAggregatedMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');

      return dataPropertyConditionAggregatedMeasure;
    },
    'PPINOT:DataPropertyConditionMeasure': (p, element) => {
      let dataPropertyConditionMeasure = drawDataPropertyConditionMeasure(element)
      svgAppend(p, dataPropertyConditionMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');

      return dataPropertyConditionMeasure;
    },
    'PPINOT:DerivedMultiInstanceMeasure': (p, element) => {
      let derivedMultiInstanceMeasure = drawDerivedMultiInstanceMeasure(element)
      svgAppend(p, derivedMultiInstanceMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');

      return derivedMultiInstanceMeasure; 
    },
    'PPINOT:StateConditionMeasure': (p, element) => {
      let stateConditionMeasure = drawStateConditionMeasure(element)
      svgAppend(p, stateConditionMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');
      
      return stateConditionMeasure; 
    },
    'PPINOT:StateConditionAggregatedMeasure': (p, element) => {
      let stateConditionAggregatedMeasure = drawStateConditionAggregatedMeasure(element)
      svgAppend(p, stateConditionAggregatedMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');
     
      return stateConditionAggregatedMeasure; 
    },
    'PPINOT:Ppi': (p, element) => {
      let ppi = drawPpi(element)
      svgAppend(p, ppi);
      //renderEmbeddedLabel(p, element, 'center-middle');

      return ppi; 
    },
    'PPINOT:DerivedSingleInstanceMeasure': (p, element) => {
      let derivedSingleInstanceMeasure = drawDerivedSingleInstanceMeasure(element)
      svgAppend(p, derivedSingleInstanceMeasure);
      renderEmbeddedLabel(p, element, 'center-middle');

      return derivedSingleInstanceMeasure; 
    },
    'PPINOT:Resource': (p, element) => {
      var attrs = computeStyle(attrs, {
        stroke: element.color || BLACK,
        strokeWidth: 2,
        fill: '#fff'
      });

      var path = svgCreate('path');

      var d = [
        ['M', 30 , 8],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['M', 20 , 8],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['M', 20 , 17],
        ['h', 10 ],
        ['M', 35 , 25],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['z']
      ];

      svgAttr(path, {
        width: element.width,
        height: element.height,
        d: componentsToPath(d),
        id: 'Resource_' + rendererId
      });

      svgAttr(path, attrs);

      svgAppend(p, path);

      return path;
    },
    'PPINOT:ResourceAbsence': (p, element) => {
      var attrs = computeStyle(attrs, {
        stroke: element.color || BLACK,
        strokeWidth: 2,
        fill: '#fff'
      });

      var path = svgCreate('path');

      var d = [
        ['M', 30 , 8],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['M', 20 , 8],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['M', 20 , 17],
        ['h', 10 ],
        ['M', 35 , 25],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['M', -5 , -5],
        ['l', 60, 85],
        ['M', 55 , -5],
        ['l', -60, 85],
        ['z']
      ]

      svgAttr(path, {
        width: element.width,
        height: element.height,
        d: componentsToPath(d)
      });

      svgAttr(path, attrs);

      svgAppend(p, path);

      return path;
    },
    'PPINOT:Role': (p, element) => {

      var attrs = computeStyle(attrs, {
        stroke: element.color || BLACK,
        strokeWidth: 2,
        fill: '#fff'
      });

      var path = svgCreate('path');

      var d = [
        ['M', 54 , 78],
        ['v', -78],
        ['h', -54],
        ['v', 78],
        ['h', 54],
        ['v', -5],
        ['M', 32 , 11],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['m', -10 , 0],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['m', 0 , 9],
        ['h', 10 ],
        ['m', 5 , 8],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['z']
      ];

      svgAttr(path, {
        width: element.width,
        height: element.height,
        d: componentsToPath(d)
      });

      svgAttr(path, attrs);

      svgAppend(p, path);

      return path;
    },
    'PPINOT:RoleAbsence': (p, element) => {

      var attrs = computeStyle(attrs, {
        stroke: element.color || BLACK,
        strokeWidth: 2,
        fill: '#fff'
      });

      var path = svgCreate('path');

      var d = [
        ['M', 54 , 78],
        ['v', -78],
        ['h', -54],
        ['v', 78],
        ['h', 54],
        ['v', -5],
        ['M', 32 , 11],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['m', -10 , 0],
        ['a', 1, 1, 0, 1, 0, 0, 3],
        ['a', 1, 1, 0, 1, 0, 0, -3],
        ['m', 0 , 9],
        ['h', 10 ],
        ['m', 5 , 8],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['M', 0 , 0],
        ['l', 54, 78],
        ['M', 54 , 0],
        ['l', -54, 78],
        ['z']
      ]

      svgAttr(path, {
        width: element.width,
        height: element.height,
        d: componentsToPath(d)
      });

      svgAttr(path, attrs);

      svgAppend(p, path);

      return path;
    },
    'PPINOT:Group': (p, element, bool=false) => {
      var attrs = computeStyle(attrs, {
        stroke: element.color || BLACK,
        strokeWidth: 2,
        fill: '#fff'
      });
      var inner = svgCreate('svg')
      var path1 = svgCreate('path');
      var path2 = svgCreate('path');

      var d1 = [
        ['M', 42 , 26],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['z']
      ]

      var d2 = [
        ['M', 37 , 28],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['z']
      ]

      if(bool) {
        d2 = d2.concat([
          ['M', -5 , -5],
          ['l', 65, 90],
          ['M', 60 , -5],
          ['l', -65, 90],
        ])
      }
      svgAttr(inner, {
        width: element.width,
        height: element.height
      });
      svgAttr(path1, {
        width: element.width-5,
        height: element.height-2,
        d: componentsToPath(d1)
      });
      svgAttr(path2, {
        width: element.width-5,
        height: element.height-2,
        d: componentsToPath(d2)
      });

      svgAttr(path1, attrs);
      svgAttr(path2, attrs);

      svgAppend(inner, path1);
      svgAppend(inner, path2);

      svgAppend(p, inner);

      return inner;
    },
    'PPINOT:GroupAbsence': (p, element) => {
      return renderers['PPINOT:Group'](p, element, true)
    },


    // CONEXIÓN POR DEFECTO PARA PPINOT_ELEMENTS-BPMN_ELEMENTS - LÍNEA CONTINUA CON FLECHA
    'PPINOT:ResourceArc': (p, element) => {
      var attrs = computeStyle(attrs, {
        stroke: element.color || BLACK,
        strokeWidth: 1.5,
        markerEnd: marker('sequenceflow-end', 'white',BLACK),
      });

      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    // CONEXIÓN PRUEBA ENTRE PPINOT_ELEMENTS - LÍNEA CONTINUA ROJA CON FLECHA
    'PPINOT:MyConnection': (p, element) => {

    //   var attrs = {
    //     markerEnd: marker('sequenceflow-end', 'white', BLACK),
    //   };
    //   //renderEmbeddedLabel(p, element, 'center-middle')
    //   return drawMyConnection(p, element, attrs, 'Prueba conexión')
    // },
      var attrs = computeStyle(attrs, {
        stroke: BLACK, //COLOR
        strokeWidth: 1.5, //ANCHURA
        markerEnd: marker('sequenceflow-end', 'white',BLACK),
        // strokeLinecap: 'round', 'butt', 'square' //DEFINE EL PRINCIPIO Y FIN DE LA LÍNEA (REDONDEADO, ETC)
        //strokeDasharray: [10,7] //LÍNA DISCONTINUA
      });

      //renderConnectionLabel(p, element, 'Prueba 2')
      //renderLaneLabel(p, 'ohdueiwfuwfh', element)
      return svgAppend(p, createLine(element.waypoints, attrs));
    },
    'PPINOT:DashedLine': (p, element) => {
        var attrs = computeStyle(attrs, {
          stroke: BLACK, //COLOR
          strokeWidth: 1.5, //ANCHURA
          strokeDasharray: [10,7] //LÍNA DISCONTINUA
        });
        return svgAppend(p, createLine(element.waypoints, attrs));
    },
    'PPINOT:RFCStateConnection': (p, element) => {
      var attrs = computeStyle(attrs, {
        stroke: BLACK, //COLOR
        strokeWidth: 1.5, //ANCHURA
        strokeDasharray: [10,7] //LÍNA DISCONTINUA
      });
      return svgAppend(p, createLine(element.waypoints, attrs));
  },

    // CONEXIÓN PARA MEDIDA_AGREGADA-MEDIDA - LÍNEA CONTINUA CON ROMBO
    'PPINOT:AggregatedConnection': (p, element) => {
      var attrs = {
        //strokeLinejoin: 'round',
        // markerEnd: marker('sequenceflow-end', 'white', element.color),
        stroke: BLACK, 
        strokeWidth: 1.5, 
        //strokeDasharray: [8,5],
        markerStart: marker('conditional-flow-marker', 'white',BLACK),
      };
      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    // CONEXIÓN PARA MEDIDA_AGREGADA-DATO - LÍNEA DISCONTINUA CON ROMBO
    'PPINOT:GroupedBy': (p, element) => {
      var attrs = {
        stroke: BLACK, 
        strokeWidth: 1.5, 
        strokeDasharray: [8,5],
        markerStart: marker('conditional-flow-marker', 'white',BLACK),
        
      };

      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    'PPINOT:GroupedBy': (p, element) => {
      var attrs = {
        stroke: BLACK, 
        strokeWidth: 1.5, 
        strokeDasharray: [8,5],
        markerStart: marker('conditional-flow-marker', 'white',BLACK),
      };
      return svgAppend(p, createLine(element.waypoints, attrs));
    },


    // MODIFICAR RULES PARA ESTAS DOS CONEXIONES
    'PPINOT:ToConnection': (p, element) => {
      var attrs = {
        stroke: BLACK, 
        strokeWidth: 1.5, 
        strokeDasharray: [8,5],
        markerStart: marker('messageflow-start', 'black',BLACK),
        markerEnd: marker('messageflow-start', 'black',BLACK),
      };
      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    'PPINOT:FromConnection': (p, element) => {
      var attrs = {
        stroke: BLACK, 
        strokeWidth: 1.5, 
        strokeDasharray: [8,5],
        markerStart: marker('messageflow-start', 'white',BLACK),
        markerEnd: marker('messageflow-start', 'white',BLACK),
      };
      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    'PPINOT:EndConnection': (p, element) => {
      var attrs = {
        stroke: BLACK, 
        strokeWidth: 1.5, 
        strokeDasharray: [8,5],
        markerEnd: marker('messageflow-start', 'black',BLACK),
      };
      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    'PPINOT:StartConnection': (p, element) => {
      var attrs = {
        stroke: BLACK, 
        strokeWidth: 1.5, 
        strokeDasharray: [8,5],
        markerEnd: marker('messageflow-start', 'white',BLACK),
      };
      return svgAppend(p, createLine(element.waypoints, attrs));
    },

    'PPINOT:ConsequenceFlow': (p, element) => {
      var attrs = {
        strokeLinejoin: 'round',
        markerEnd: marker('sequenceflow-end', 'white', element.color),
        stroke: element.color || BLACK,
        strokeWidth: 1.5,
        strokeDasharray: [8,5]
      };

      return svgAppend(p, createLine(element.waypoints, attrs));
    },
    'PPINOT:TimeDistanceArcStart': (p, element) => {
      var attrs = {
        markerStart: marker('timedistance-start', 'white', element.color),
      };

      return drawTimeDistanceArc(p, element, attrs)

    },
    'PPINOT:TimeDistanceArcEnd': (p, element) => {
      var attrs = {
        markerEnd: marker('timedistance-end', 'white', element.color),
      };

      return drawTimeDistanceArc(p, element, attrs)

    },
    'label': (p, element) => {
      return renderExternalLabel(p, element);
    },
  };

  

  var paths = this.paths = {
    'PPINOT:TimeSlot': (shape) => {
      var x = shape.x,
          y = shape.y,
          width = shape.width,
          height = shape.height,
          borderRadius = 20;

      var roundRectPath = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(roundRectPath);
    },
    'PPINOT:Avion': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var d = [
        ['M', x , y],
        ['h', 50 ],
        ['v', 50 ],
        ['h', -50 ],
        ['v', -50 ],
        ['z']
      ]

      return componentsToPath(d);
    },
    'PPINOT:BaseMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:Target': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var d = [
        ['M', x , y],
        ['h', 50 ],
        ['v', 50 ],
        ['h', -50 ],
        ['v', -50 ],
        ['z']
      ]

      return componentsToPath(d);
    },

    'PPINOT:Scope': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var d = [
        ['M', x , y],
        ['h', 50 ],
        ['v', 50 ],
        ['h', -50 ],
        ['v', -50 ],
        ['z']
      ]

      return componentsToPath(d);
    },
    'PPINOT:AggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:TimeAggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:CyclicTimeAggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:CountAggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:RFCStateConnection': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:CountMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:TimeMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:CyclicTimeMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:DataAggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },

    'PPINOT:DataMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },

    'PPINOT:DerivedMultiInstanceMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },

    'PPINOT:DerivedSingleInstanceMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
          

      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },

    'PPINOT:Ppi': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
      
      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:DataPropertyConditionAggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
      
      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:StateConditionMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
      
      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    'PPINOT:StateConditionAggregatedMeasure': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;
      
      var borderRadius = 20;
         
      var d = [
        ['M', x + borderRadius, y],
        ['l', width - borderRadius * 2, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius],
        ['l', 0, height - borderRadius * 2],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, borderRadius],
        ['l', borderRadius * 2 - width, 0],
        ['a', borderRadius, borderRadius, 0, 0, 1, -borderRadius, -borderRadius],
        ['l', 0, borderRadius * 2 - height],
        ['a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -borderRadius],
        ['z']
      ];

      return componentsToPath(d);
    },
    
    'PPINOT:Resource': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;

      var resourcePath = [
        ['M', x+35 , y+25],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['z']
      ];

      return componentsToPath(resourcePath);
    },
    'PPINOT:ResourceAbsence': (element) => {
      return paths['PPINOT:Resource'](element)
    },
    'PPINOT:Role': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;


      var resourcePath = [
        ['M', x , y],
        ['v', 78],
        ['h', 54],
        ['v', -78],
        ['h', -54],
        ['z']
      ];

      return componentsToPath(resourcePath);
    },
    'PPINOT:RoleAbsence': (element) => {
      return paths['PPINOT:Role'](element)
    },
    'PPINOT:Group': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;

      var resourcePath = [
        ['M', x+42 , y+26],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['M', x+37 , y+28],
        ['a', 14, 14, 79, 0, 0, 5, -10],
        ['a', 6, 6, 79, 0, 0, -30, 0],
        ['a', 14, 14, 79, 0, 0, 5, 10],
        ['a', 60, 60, 0, 0, 0, -15, 50],
        ['h', 50 ],
        ['a', 60, 60, 0, 0, 0, -15, -50],
        ['z']
      ];

      return componentsToPath(resourcePath);
    },
    'PPINOT:GroupAbsence': (element) => {
      return paths['PPINOT:Group'](element)
    },
    'label': (element) => {
      var x = element.x,
          y = element.y,
          width = element.width,
          height = element.height;

      var rectPath = [
        ['M', x, y],
        ['l', width, 0],
        ['l', 0, height],
        ['l', -width, 0],
        ['z']
      ];

      return componentsToPath(rectPath);
    }
  }
}

inherits(PPINOTRenderer, BaseRenderer);

PPINOTRenderer.$inject = [ 'eventBus', 'styles', 'canvas', 'textRenderer' ];

PPINOTRenderer.prototype.canRender = function(element) {
  return /^PPINOT:/.test(element.type) || element.type === 'label';
};

PPINOTRenderer.prototype.drawShape = function(p, element) {
  var type = element.type;
  var h = this.renderers[type];
  
  if(element.color == null)
    element.color= "#000"

  /* jshint -W040 */
  return h(p, element);
};

PPINOTRenderer.prototype.getShapePath = function(shape) {
  var type = shape.type;
  var h = this.paths[type];

  /* jshint -W040 */
  return h(shape);
};

PPINOTRenderer.prototype.drawConnection = function(p, element) {
  var type = element.type;
  var h = this.renderers[type];
  if(element.color == null)
    element.color= "#000"

  /* jshint -W040 */
  return h(p, element);
};

PPINOTRenderer.prototype.getConnectionPath = function(connection) {
  // var type = connection.type;
  // var h = this.paths[type];
  //
  // /* jshint -W040 */
  // return h(connection);
  var waypoints = connection.waypoints.map(function(p) {
    return p.original || p;
  });

  var connectionPath = [
    ['M', waypoints[0].x, waypoints[0].y]
  ];

  waypoints.forEach(function(waypoint, index) {
    if (index !== 0) {
      connectionPath.push(['L', waypoint.x, waypoint.y]);
    }
  });

  return componentsToPath(connectionPath);

};
