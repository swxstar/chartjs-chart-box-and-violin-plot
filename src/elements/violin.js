'use strict';

import * as Chart from 'chart.js';
import ArrayElementBase, {defaults} from './base';


Chart.defaults.global.elements.violin = Object.assign({
  points: 100
}, defaults);

const Violin = Chart.elements.Violin = ArrayElementBase.extend({
  draw() {
    const ctx = this._chart.ctx;
    const vm = this._view;

    const violin = vm.violin;
    const vert = this.isVertical();

    // @STAR_CHANGES
    // Use min/maxStats of whiskerMin/Max if they are defined for this dataset
    let chartMin = violin.min;
    let chartMax = violin.max;
    const index = violin.boxplotData.index;
    const axes = this._chart.options.yAxes[index];
    if (violin.boxplotData && axes && axes.ticks) {
      if (axes.ticks.maxStats === 'whiskerMax') {
        chartMax = violin.boxplotData.whiskerMaxPx;
      }
      if (axes.ticks.minStats === 'whiskerMin') {
        chartMin = violin.boxplotData.whiskerMinPx;
      }
    }

    this._drawItems(vm, violin, ctx, vert);

    ctx.save();

    ctx.fillStyle = vm.backgroundColor;
    ctx.strokeStyle = vm.borderColor;
    ctx.lineWidth = vm.borderWidth;
    // @STAR_CHANGES
    // Filter out coordinates that aren't in the min/max range and sort by value
    //
    // The filter checks for (<= min and >= max) rather than (>= min and <= max)
    // because the coordinates have been translated to pixel positions and for a
    // canvas the top-left corner is (0, 0), thus the smaller the value, the higher
    // its y-coordinate
    const coords = violin.coords.filter(c => c.v <= chartMin && c.v >= chartMax)
      .sort((c1, c2) => +c2.v - +c1.v);

    Chart.canvasHelpers.drawPoint(ctx, 'rectRot', 5, vm.x, vm.y);
    ctx.stroke();

    ctx.beginPath();
    if (vert) {
      const x = vm.x;
      const width = vm.width;
      const factor = (width / 2) / violin.maxEstimate;
      ctx.moveTo(x, chartMin);
      coords.forEach(({v, estimate}) => {
        ctx.lineTo(x - estimate * factor, v);
      });
      ctx.lineTo(x, chartMax);
      ctx.moveTo(x, chartMin);
      coords.forEach(({v, estimate}) => {
        ctx.lineTo(x + estimate * factor, v);
      });
      ctx.lineTo(x, chartMax);
    } else {
      const y = vm.y;
      const height = vm.height;
      const factor = (height / 2) / violin.maxEstimate;
      ctx.moveTo(chartMin, y);
      coords.forEach(({v, estimate}) => {
        ctx.lineTo(v, y - estimate * factor);
      });
      ctx.lineTo(chartMax, y);
      ctx.moveTo(chartMin, y);
      coords.forEach(({v, estimate}) => {
        ctx.lineTo(v, y + estimate * factor);
      });
      ctx.lineTo(chartMax, y);
    }
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    this._drawOutliers(vm, violin, ctx, vert);

    ctx.restore();
  },
  _getBounds() {
    const vm = this._view;

    const vert = this.isVertical();
    const violin = vm.violin;

    if (vert) {
      const {x, width} = vm;
      const x0 = x - width / 2;
      return {
        left: x0,
        top: violin.max,
        right: x0 + width,
        bottom: violin.min
      };
    }
    const {y, height} = vm;
    const y0 = y - height / 2;
    return {
      left: violin.min,
      top: y0,
      right: violin.max,
      bottom: y0 + height
    };
  },
  height() {
    const vm = this._view;
    return vm.base - Math.min(vm.violin.min, vm.violin.max);
  },
  getArea() {
    const vm = this._view;
    const iqr = Math.abs(vm.violin.max - vm.violin.min);
    if (this.isVertical()) {
      return iqr * vm.width;
    }
    return iqr * vm.height;
  }
});

export default Violin;
