define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__) { return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// Documentation
	 
	// References
	// - https://www.tradingview.com/lightweight-charts/
	// - https://github.com/tradingview/lightweight-charts/

	// TODO a future version could allow changing time periods on the fly (without using formatting menu. also buttons to allow changing chart type)
	// TODO a future version might allow for the non-time series data

	// TODO Check that when updating realtime data, teh chart auto scrolls in zoomed mode
	// turn on debug mode
	// clicking markers should set tokens or drill down
	// check that formatter matches vis source
	// TODO markers should be clickable

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(1),
	    __webpack_require__(2),
	    __webpack_require__(3),
	    __webpack_require__(4),
	    __webpack_require__(5)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(
	    $,
	    SplunkVisualizationBase,
	    vizUtils,
	    tinycolor,
	    undefined
	) {

	    var vizObj = {
	        initialize: function() {
	            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
	            var viz = this;
	            viz.instance_id = "financial_chart_viz_" + Math.round(Math.random() * 1000000);
	            viz.$container_wrap = $(viz.el);
	            viz.$container_wrap.addClass("financial_chart_viz-container");
	        },

	        formatData: function(data) {
	            return data;
	        },

	        updateView: function(data, config) {
	            var viz = this;
	            viz.config = {
	                type: "candles", 
	                legend: "show",
	                tooltip: "crosshair",
	                time_axis: "show",
	                last_value: "show",
	                value_axis: "right",
	                value_axis_scale: "linear",
	                value_prefix: "",
	                precision: "",
	                background_mode: "auto",
	                background_color: "#ffffff",
	                line_mode: "auto",
	                line_color: "#0078ff",
	                area_top_mode: "auto",
	                area_top_color: "#0078ff",
	                area_style: "light",
	                
	            };
	            
	            // Override defaults with selected items from the UI
	            for (var opt in config) {
	                if (config.hasOwnProperty(opt)) {
	                    viz.config[ opt.replace(viz.getPropertyNamespaceInfo().propertyNamespace,'') ] = config[opt];
	                }
	            }

	            var theme = 'light'; 
	            viz.lineColors = ["rgb(106,92,158)","rgb(49,163,95)","rgb(30,147,198)","rgb(242,184,39)","rgb(214,86,60)"];
	            viz.base_bg_color = "#ffffff";
	            if (typeof vizUtils.getCurrentTheme === "function") {
	                theme = vizUtils.getCurrentTheme();
	            }
	            if (theme === "dark") {
	                viz.base_bg_color = "#31373e";
	            }
	            if (viz.config.background_mode !== "auto") {
	                viz.base_bg_color = viz.config.background_color;
	            }
	            if (tinycolor(viz.base_bg_color).isDark()) {
	                viz.base_fg_color = "#D9D9D9";
	            } else {
	                viz.base_fg_color = "#191919";
	            } 

	            if (viz.config.line_mode !== "auto") {
	                viz.lineColors.unshift(viz.config.line_color);
	            }

	            if (viz.config.area_top_mode === "auto") {
	                viz.config.area_top_color = viz.lineColors[0];
	            }

	            viz.indata = data;
	            viz.scheduleDraw();
	        },

	        // debounce the draw
	        scheduleDraw: function(){
	            var viz = this;
	            clearTimeout(viz.drawtimeout);
	            viz.drawtimeout = setTimeout(function(){
	                viz.doDraw();
	            }, 300);
	        },

	        doDraw: function(){
	            var viz = this;
	            // Dont draw unless this is a real element under body
	            if (! viz.$container_wrap.parents().is("body")) {
	                return;
	            }
	            // Container can have no height if it is in a panel that isnt yet visible on the dashboard.
	            // I believe the container might also have no size in other situations too
	            if (viz.$container_wrap.height() <= 0) {
	                //console.log("not drawing becuase container has no height");
	                if (!viz.hasOwnProperty("resizeWatcher")) {
	                    viz.resizeWatcher = setInterval(function(){
	                        if (viz.$container_wrap.height() > 0) {
	                            clearInterval(viz.resizeWatcher);
	                            delete viz.resizeWatcher;
	                            viz.scheduleDraw();
	                        }
	                    }, 1000);
	                }
	                return;
	            }
	            if (viz.hasOwnProperty("resizeWatcher")) {
	                clearInterval(viz.resizeWatcher);
	                delete viz.resizeWatcher;
	            }

	            viz.$container_chart = $("<div class='financial_chart_viz-chart'></div>");
	            viz.$container_wrap.empty().append(viz.$container_chart);
	            if (viz.config.background_mode === "auto") {
	                viz.$container_wrap.css("background-color","");
	            } else {
	                viz.$container_wrap.css("background-color", viz.config.background_color);
	            }


	            var gridlines_color = tinycolor(viz.base_fg_color).setAlpha(0.15).toString();
	            var border_color = tinycolor(viz.base_fg_color).setAlpha(0.6).toString();
	            var chartOpts = { 
	                width: viz.$container_wrap.width() - 20, 
	                height: viz.$container_wrap.height() - 20,
	                localization: {
	                    //timeFormatter: function(businessDayOrTimestamp) {
	                    //    return Date(businessDayOrTimestamp); //or whatever JS formatting you want here
	                    //},
	                },
	                timeScale: {
	                    borderColor: border_color,
	                    timeVisible: true,
	                },
	                leftPriceScale: {
	                    borderColor: border_color,
	                },
	                rightPriceScale: {
	                    borderColor: border_color,
	                },
	                layout: {
	                    backgroundColor: 'transparent',
	                    textColor: viz.base_fg_color,
	                },
	                crosshair: {
	                    mode: LightweightCharts.CrosshairMode.Normal,
	                    color: gridlines_color,
	                    vertLine: {},
	                    horzLine: {},
	                },
	                grid: {
	                    vertLines: {
	                        color: gridlines_color,
	                        visible: false,
	                    },
	                    horzLines: {
	                        color: gridlines_color,
	                    },
	                },
	                handleScale: {},
	                handleScroll: {}
	            };

	            if (viz.config.tooltip === "crosshair") {
	                chartOpts.crosshair.vertLine.visible = true;
	                chartOpts.crosshair.horzLine.visible = true;
	                chartOpts.crosshair.vertLine.labelVisible = true;
	                chartOpts.crosshair.horzLine.labelVisible = true;
	                
	            } else {
	                chartOpts.crosshair.vertLine.visible = false;
	                chartOpts.crosshair.horzLine.visible = false;
	                chartOpts.crosshair.vertLine.labelVisible = false;
	                chartOpts.crosshair.horzLine.labelVisible = false;
	            }

	            if (viz.config.panzoom === "off") {
	                chartOpts.handleScale.mouseWheel = false;
	                chartOpts.handleScale.pinch = false;
	                chartOpts.handleScroll.mouseWheel = false;
	                chartOpts.handleScroll.pressedMouseMove = false;
	                chartOpts.handleScroll.horzTouchDrag = false;
	                chartOpts.handleScroll.vertTouchDrag = false;
	            }

	            if (viz.config.value_axis === "hide") {
	                chartOpts.leftPriceScale.visible = false;
	                chartOpts.rightPriceScale.visible = false;
	            } else if (viz.config.value_axis === "left") {
	                chartOpts.leftPriceScale.visible = true;
	                chartOpts.rightPriceScale.visible = false;
	            } else {
	                chartOpts.leftPriceScale.visible = false;
	                chartOpts.rightPriceScale.visible = true;
	            }

	            if (viz.config.time_axis === "hide") {
	                chartOpts.timeScale.visible = false;
	            } else {
	                chartOpts.timeScale.visible = true;
	            }

	            if (viz.config.value_axis_scale === "log") {
	                if (chartOpts.rightPriceScale.visible) {
	                   chartOpts.rightPriceScale.mode = LightweightCharts.PriceScaleMode.Logarithmic;
	                } else if (chartOpts.leftPriceScale.visible) {
	                   chartOpts.leftPriceScale.mode = LightweightCharts.PriceScaleMode.Logarithmic;
	                }
	            } else if (viz.config.value_axis_scale === "percentage") {
	                if (chartOpts.rightPriceScale.visible) {
	                   chartOpts.rightPriceScale.mode = LightweightCharts.PriceScaleMode.Percentage;
	                } else if (chartOpts.leftPriceScale.visible) {
	                   chartOpts.leftPriceScale.mode = LightweightCharts.PriceScaleMode.Percentage;
	                }
	            }
	            

	            chartOpts.localization.priceFormatter = function(val){ 
	                return viz.formatVal(val);
	            }

	            viz.chart = LightweightCharts.createChart(viz.$container_chart[0], chartOpts);

	            //tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
	            //console.log(viz.indata);
	            var i;
	            var timedata = [];
	            viz.timedataMap = {};
	            
	            for (i = 0; i < viz.indata.fields.length; i++) {
	                if (viz.indata.fields[i].name === "_time") {
	                    for (j = 0; j < viz.indata.columns[i].length; j++) {
	                        // convert times to local time zone
	                        var d = new Date(viz.indata.columns[i][j]);
	                        timedata[j] = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;
	                        viz.timedataMap[ timedata[j].toString() ] = j;
	                    }
	                    // quit look once we have found the _time field
	                    break;
	                }
	            }

	            if (timedata.length === 0) {
	                // TODO: show error message with links to doco
	                viz.$container_wrap.empty().append("<div class='financial_chart_viz-bad_data'>Invalid Data, there should be a column called '_time'.<br /><a href='/app/financial_chart_viz/documentation' target='_blank'>Click here for examples and documentation</a></div>");
	                return;
	            }
	            viz.data = [];
	            var space_seperated_re = /([a-z]\w*)=((?:[^"]|"[^"]+")+?)(?= \s*[a-z]\w*=|$)/g
	            for (i = 0; i < viz.indata.fields.length; i++) {
	                if (viz.indata.fields[i].name.substring(0, 1) === "_") {
	                    continue;
	                }
	                var series = {
	                    name: viz.indata.fields[i].name,
	                    data1: [],
	                    data2: [],
	                    type: viz.config.type,
	                    markers: [],
	                };
	                viz.data.push(series);
	                // for subsequent data series, force to line display
	                if (viz.data.length > 1) {
	                    series.type = "line";
	                    if (viz.data.length === 2 && viz.data[0].type != "line") {
	                        viz.lineColors.unshift("rgba(0,150,136,0.8)")
	                    }
	                }

	                var last = null;
	                for (j = 0; j < viz.indata.columns[i].length; j++) {
	                    if (viz.indata.columns[i][j] === null) {
	                        series.data1.push({time: timedata[j]});
	                        continue;
	                    }
	                    var parts = viz.indata.columns[i][j].split("|");
	                    // its not possible for the marker text to include a pipe
	                    // Remove the  final pipe if it has no content
	                    if ($.trim(parts[parts.length - 1]) === ""){
	                        parts.pop();
	                    }
	                    // if the last value looks like a marker
	                    if ($.trim(parts[parts.length - 1]).substr(0,7) === "marker="){
	                        var marker_str = parts.pop();
	                        var marker = {
	                            time: timedata[j], 
	                            position: 'aboveBar', 
	                            shape: 'circle', 
	                            color: viz.base_fg_color
	                        };
	                        
	                        let m;
	                        while ((m = space_seperated_re.exec(marker_str)) !== null) {
	                            m[2] = m[2].replace(/"/g, '');
	                            if (m[1] === "marker") {
	                                marker.text = m[2];
	                            } else if (m[1] === "size") {
	                                marker.size = +m[2];
	                            } else {
	                                marker[m[1]] = m[2];
	                            }
	                        }
	                        series.markers.push(marker);
	                    }
	                    for (var k = 0; k < parts.length; k++) {
	                        if (k < 5) {
	                            // convert to numbers
	                            parts[k] = +parts[k];
	                        } else {
	                            // string trim the 5th
	                            parts[k] = $.trim(parts[k]);
	                        }
	                    }
	                    var entry = {time: timedata[j] };
	                    if (parts.length > 4) { // open,high,low,close,volume,marker
	                        if (series.type === "line" || series.type === "area") {
	                            entry.value = parts[3];
	                        } else {
	                            entry.open = parts[0];
	                            entry.high = parts[1];
	                            entry.low = parts[2];
	                            entry.close = parts[3];
	                        }
	                        entry.volume = parts[4];


	                    } else if (parts.length === 4) { // open,high,low,close
	                        if (series.type === "line" || series.type === "area") {
	                            entry.value = parts[3];
	                        } else {
	                            entry.open = parts[0];
	                            entry.high = parts[1];
	                            entry.low = parts[2];
	                            entry.close = parts[3];
	                        }

	                    } else if (parts.length === 2) { // close,volume
	                        if (series.type === "line" || series.type === "area") {
	                            entry.value = parts[0];
	                        } else {
	                            entry.open = last;
	                            entry.close = parts[0];
	                        }
	                        entry.volume = parts[1];

	                    } else if (parts.length === 1) { // close
	                        if (series.type === "line" || series.type === "area") {
	                            entry.value = parts[0];
	                        } else {
	                            entry.open = last;
	                            entry.close = parts[0];
	                        }
	                    }

	                    // When the data is supplied as "value" (without open/close, then we compute it from the the previous data point. However this can be null on the first item.)
	                    if (entry.hasOwnProperty("open")) {
	                        if (entry.open === null) {
	                            entry.open = entry.close;
	                        }

	                        if (! entry.hasOwnProperty("high")) {
	                            entry.high = Math.max(entry.open, entry.close);
	                            entry.low = Math.min(entry.open, entry.close);
	                            entry.derived = true;
	                        }
	                        if (series.type === "candles" || series.type === "bar") {
	                            if (entry.open < entry.close) {
	                                entry.color = 'rgba(0,150,136,0.8)';
	                            } else {
	                                entry.color = 'rgba(255,82,82,0.8)';
	                            }
	                        }

	                    } else {
	                        if (series.type === "candles" || series.type === "bar") {
	                            if (entry.value < last) {
	                                entry.color = 'rgba(0,150,136,0.8)';
	                            } else {
	                                entry.color = 'rgba(255,82,82,0.8)';
	                            }
	                        }
	                    }
	                    // when using area chart, it makes it hard to see line series underneath
	                    series.data1.push(entry);

	                    // Add the volume data item (only allow volume on the first data source)
	                    if (viz.data.length === 1 && entry.hasOwnProperty("volume")) {
	                        series.data2.push({time: entry.time, color: entry.color, value: entry.volume});
	                    }

	                    if (entry.hasOwnProperty("value")) {
	                        last = entry.value;
	                    } else {
	                        last = entry.close;
	                    }
	                }

	                if (series.data2.length) {
	                    series.comp2 = viz.chart.addHistogramSeries({
	                        color: '#26a69a',
	                        priceFormat: {
	                            type: 'volume',
	                        },
	                        priceScaleId: '',
	                        scaleMargins: {
	                            top: 0.8,
	                            bottom: 0,
	                        },
	                    });
	                    series.comp2.setData(series.data2);
	                    series.comp2.applyOptions({
	                        priceLineVisible: false,
	                        lastValueVisible: false,
	                    });
	                }

	                series.pcolor = viz.lineColors[(viz.data.length - 1) % viz.lineColors.length];
	                if (series.type === "line") {
	                    series.comp1 = viz.chart.addLineSeries({
	                        color: series.pcolor,
	                    	lineWidth: 2,
	                    });

	                } else if (series.type === "bar") {
	                    series.comp1 = viz.chart.addBarSeries();

	                } else if (series.type === "candles") {
	                    series.comp1 = viz.chart.addCandlestickSeries();

	                } else { // area
	                    series.pcolor = viz.config.area_top_color;
	                    var seriesOpts = {
	                        topColor: tinycolor(viz.config.area_top_color).setAlpha(0.8).toString(),
	                        lineWidth: 2,
	                        lineColor: series.pcolor,
	                    };
	                    if (viz.config.area_style === "light") {
	                        seriesOpts.bottomColor = tinycolor(viz.base_bg_color).setAlpha(0.2).toString();
	                    } else if (viz.config.area_style === "dark") {
	                        seriesOpts.bottomColor = tinycolor(viz.base_bg_color).setAlpha(0.8).toString();
	                    } else {
	                        seriesOpts.bottomColor = seriesOpts.topColor;
	                    }
	                    series.comp1 = viz.chart.addAreaSeries(seriesOpts);
	                }

	                series.comp1.setData(series.data1);
	                if (series.markers.length) {
	                    series.comp1.setMarkers(series.markers);
	                }

	                if (viz.config.last_value === "show") {
	                    series.comp1.applyOptions({
	                        priceLineVisible: true,
	                        lastValueVisible: true,
	                    });
	                } else {
	                    series.comp1.applyOptions({
	                        priceLineVisible: false,
	                        lastValueVisible: false,
	                    });
	                }
	            }

	            viz.chart.timeScale().fitContent();

	            viz.$legend = $('<div class="financial_chart_viz-legend" style="display:' + (viz.config.legend === "hide" ? 'none' : 'block') +  '; left:' + (chartOpts.leftPriceScale.visible ? "80px" : "30px") +'; text-shadow:0 0 8px ' + viz.base_bg_color +', 0 0 5px ' + viz.base_bg_color +', 0 0 1px ' + viz.base_bg_color +'; background-color:' + tinycolor(viz.base_bg_color).setAlpha(0.8).toString() +'"></div>').appendTo(viz.$container_wrap);
	            for (i = 0; i < viz.data.length; i++) {
	                var legendItem = $("<div style='color:" + viz.base_fg_color + ";'><span class='financial_chart_viz-legend-label'></span><span class='financial_chart_viz-legend-val'></span></div>");
	                legendItem.find(".financial_chart_viz-legend-label").text(viz.data[i].name);
	                viz.data[i].legend = legendItem.find(".financial_chart_viz-legend-val");
	                viz.$legend.append(legendItem);
	            }
	            viz.chart.subscribeCrosshairMove(function(param) {
	                if (param.time && viz.timedataMap.hasOwnProperty(param.time)) {
	                    // for each data series
	                    for (i = 0; i < viz.data.length; i++) {
	                        // get the timedataMap position
	                        var o = viz.data[i].data1[viz.timedataMap[param.time]];
	                        if (o) {
	                            var vol = "";
	                            if (o.hasOwnProperty("volume")) {
	                                vol = "<span style='opacity:0.8;color: " + viz.base_fg_color + ";margin-left:6px;'>Volume:"+ viz.formatVal(o.volume, false) +"</span>"
	                            }
	                            if (o.hasOwnProperty("open")) {
	                                if (o.hasOwnProperty("derived")) {
	                                    viz.data[i].legend.html(viz.formatVal(o.close) + vol);
	                                } else {
	                                    var color = o.open === o.close ? viz.base_fg_color : o.open > o.close ? 'rgba(255,82,82,0.8)' : 'rgba(0,150,136,0.8)';
	                                    viz.data[i].legend.html("O:<span style='color: " + color + "'>"+ viz.formatVal(o.open) +"</span> H:<span style='color: " + color + "'>"+ viz.formatVal(o.high) +"</span> L:<span style='color: " + color + "'>"+ viz.formatVal(o.low) +"</span> C:<span style='color: " + color + "'>"+ viz.formatVal(o.close) +"</span>" + vol);
	                                }
	                            } else if (o.hasOwnProperty("value")) {
	                                viz.data[i].legend.css("color",viz.data[i].pcolor).html(viz.formatVal(o.value) + vol);
	                            } else {
	                                // mousing over a null value
	                                viz.data[i].legend.text("");
	                            }
	                        }
	                    }
	                } else {
	                    // mousing over a section with no time
	                }
	            });
	        },

	        formatVal: function(val, addPrefix) {
	            var viz = this;
	            if (typeof addPrefix === "undefined") {
	                addPrefix = true;
	            }
	            var retval = val;
	            if (typeof val === "number") {
	                // If precision field is blank, we use a sensible precision depending on how many digits the number is
	                if (viz.config.precision === "") {
	                    if (Math.abs(val) >= 1000) {
	                        retval = Math.round(val)
	                    } else if (Math.abs(val) >= 100) {
	                        retval = Math.round(val * 10) / 10;
	                    } else if (Math.abs(val) >= 10) {
	                        retval = Math.round(val * 100) / 100;
	                    } else if (Math.abs(val) >= 1) {
	                        retval = Math.round(val * 1000) / 1000;
	                    } else {
	                        retval = Math.round(val * 10000) / 10000;
	                    }
	                } else {
	                    retval = val.toFixed(viz.config.precision);
	                }
	            }
	            if (isNaN(retval)) {
	                return "";
	            }
	            return addPrefix ? (viz.config.value_prefix + retval.toLocaleString()) : retval.toLocaleString();
	        },


	        // Override to respond to re-sizing events
	        reflow: function() {
	            this.scheduleDraw();
	        },

	        // Search data params
	        getInitialDataParams: function() {
	            return ({
	                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
	                count: 10000
	            });
	        },
	    };

	    return SplunkVisualizationBase.extend(vizObj);
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * jQuery JavaScript Library v3.6.0
	 * https://jquery.com/
	 *
	 * Includes Sizzle.js
	 * https://sizzlejs.com/
	 *
	 * Copyright OpenJS Foundation and other contributors
	 * Released under the MIT license
	 * https://jquery.org/license
	 *
	 * Date: 2021-03-02T17:08Z
	 */
	( function( global, factory ) {

		"use strict";

		if ( typeof module === "object" && typeof module.exports === "object" ) {

			// For CommonJS and CommonJS-like environments where a proper `window`
			// is present, execute the factory and get jQuery.
			// For environments that do not have a `window` with a `document`
			// (such as Node.js), expose a factory as module.exports.
			// This accentuates the need for the creation of a real `window`.
			// e.g. var jQuery = require("jquery")(window);
			// See ticket #14549 for more info.
			module.exports = global.document ?
				factory( global, true ) :
				function( w ) {
					if ( !w.document ) {
						throw new Error( "jQuery requires a window with a document" );
					}
					return factory( w );
				};
		} else {
			factory( global );
		}

	// Pass this if window is not defined yet
	} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

	// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
	// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
	// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
	// enough that all such attempts are guarded in a try block.
	"use strict";

	var arr = [];

	var getProto = Object.getPrototypeOf;

	var slice = arr.slice;

	var flat = arr.flat ? function( array ) {
		return arr.flat.call( array );
	} : function( array ) {
		return arr.concat.apply( [], array );
	};


	var push = arr.push;

	var indexOf = arr.indexOf;

	var class2type = {};

	var toString = class2type.toString;

	var hasOwn = class2type.hasOwnProperty;

	var fnToString = hasOwn.toString;

	var ObjectFunctionString = fnToString.call( Object );

	var support = {};

	var isFunction = function isFunction( obj ) {

			// Support: Chrome <=57, Firefox <=52
			// In some browsers, typeof returns "function" for HTML <object> elements
			// (i.e., `typeof document.createElement( "object" ) === "function"`).
			// We don't want to classify *any* DOM node as a function.
			// Support: QtWeb <=3.8.5, WebKit <=534.34, wkhtmltopdf tool <=0.12.5
			// Plus for old WebKit, typeof returns "function" for HTML collections
			// (e.g., `typeof document.getElementsByTagName("div") === "function"`). (gh-4756)
			return typeof obj === "function" && typeof obj.nodeType !== "number" &&
				typeof obj.item !== "function";
		};


	var isWindow = function isWindow( obj ) {
			return obj != null && obj === obj.window;
		};


	var document = window.document;



		var preservedScriptAttributes = {
			type: true,
			src: true,
			nonce: true,
			noModule: true
		};

		function DOMEval( code, node, doc ) {
			doc = doc || document;

			var i, val,
				script = doc.createElement( "script" );

			script.text = code;
			if ( node ) {
				for ( i in preservedScriptAttributes ) {

					// Support: Firefox 64+, Edge 18+
					// Some browsers don't support the "nonce" property on scripts.
					// On the other hand, just using `getAttribute` is not enough as
					// the `nonce` attribute is reset to an empty string whenever it
					// becomes browsing-context connected.
					// See https://github.com/whatwg/html/issues/2369
					// See https://html.spec.whatwg.org/#nonce-attributes
					// The `node.getAttribute` check was added for the sake of
					// `jQuery.globalEval` so that it can fake a nonce-containing node
					// via an object.
					val = node[ i ] || node.getAttribute && node.getAttribute( i );
					if ( val ) {
						script.setAttribute( i, val );
					}
				}
			}
			doc.head.appendChild( script ).parentNode.removeChild( script );
		}


	function toType( obj ) {
		if ( obj == null ) {
			return obj + "";
		}

		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	}
	/* global Symbol */
	// Defining this global in .eslintrc.json would create a danger of using the global
	// unguarded in another place, it seems safer to define global only for this module



	var
		version = "3.6.0",

		// Define a local copy of jQuery
		jQuery = function( selector, context ) {

			// The jQuery object is actually just the init constructor 'enhanced'
			// Need init if jQuery is called (just allow error to be thrown if not included)
			return new jQuery.fn.init( selector, context );
		};

	jQuery.fn = jQuery.prototype = {

		// The current version of jQuery being used
		jquery: version,

		constructor: jQuery,

		// The default length of a jQuery object is 0
		length: 0,

		toArray: function() {
			return slice.call( this );
		},

		// Get the Nth element in the matched element set OR
		// Get the whole matched element set as a clean array
		get: function( num ) {

			// Return all the elements in a clean array
			if ( num == null ) {
				return slice.call( this );
			}

			// Return just the one element from the set
			return num < 0 ? this[ num + this.length ] : this[ num ];
		},

		// Take an array of elements and push it onto the stack
		// (returning the new matched element set)
		pushStack: function( elems ) {

			// Build a new jQuery matched element set
			var ret = jQuery.merge( this.constructor(), elems );

			// Add the old object onto the stack (as a reference)
			ret.prevObject = this;

			// Return the newly-formed element set
			return ret;
		},

		// Execute a callback for every element in the matched set.
		each: function( callback ) {
			return jQuery.each( this, callback );
		},

		map: function( callback ) {
			return this.pushStack( jQuery.map( this, function( elem, i ) {
				return callback.call( elem, i, elem );
			} ) );
		},

		slice: function() {
			return this.pushStack( slice.apply( this, arguments ) );
		},

		first: function() {
			return this.eq( 0 );
		},

		last: function() {
			return this.eq( -1 );
		},

		even: function() {
			return this.pushStack( jQuery.grep( this, function( _elem, i ) {
				return ( i + 1 ) % 2;
			} ) );
		},

		odd: function() {
			return this.pushStack( jQuery.grep( this, function( _elem, i ) {
				return i % 2;
			} ) );
		},

		eq: function( i ) {
			var len = this.length,
				j = +i + ( i < 0 ? len : 0 );
			return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
		},

		end: function() {
			return this.prevObject || this.constructor();
		},

		// For internal use only.
		// Behaves like an Array's method, not like a jQuery method.
		push: push,
		sort: arr.sort,
		splice: arr.splice
	};

	jQuery.extend = jQuery.fn.extend = function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[ 0 ] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;

			// Skip the boolean and the target
			target = arguments[ i ] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !isFunction( target ) ) {
			target = {};
		}

		// Extend jQuery itself if only one argument is passed
		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			// Only deal with non-null/undefined values
			if ( ( options = arguments[ i ] ) != null ) {

				// Extend the base object
				for ( name in options ) {
					copy = options[ name ];

					// Prevent Object.prototype pollution
					// Prevent never-ending loop
					if ( name === "__proto__" || target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
						( copyIsArray = Array.isArray( copy ) ) ) ) {
						src = target[ name ];

						// Ensure proper type for the source value
						if ( copyIsArray && !Array.isArray( src ) ) {
							clone = [];
						} else if ( !copyIsArray && !jQuery.isPlainObject( src ) ) {
							clone = {};
						} else {
							clone = src;
						}
						copyIsArray = false;

						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	jQuery.extend( {

		// Unique for each copy of jQuery on the page
		expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

		// Assume jQuery is ready without the ready module
		isReady: true,

		error: function( msg ) {
			throw new Error( msg );
		},

		noop: function() {},

		isPlainObject: function( obj ) {
			var proto, Ctor;

			// Detect obvious negatives
			// Use toString instead of jQuery.type to catch host objects
			if ( !obj || toString.call( obj ) !== "[object Object]" ) {
				return false;
			}

			proto = getProto( obj );

			// Objects with no prototype (e.g., `Object.create( null )`) are plain
			if ( !proto ) {
				return true;
			}

			// Objects with prototype are plain iff they were constructed by a global Object function
			Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
			return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
		},

		isEmptyObject: function( obj ) {
			var name;

			for ( name in obj ) {
				return false;
			}
			return true;
		},

		// Evaluates a script in a provided context; falls back to the global one
		// if not specified.
		globalEval: function( code, options, doc ) {
			DOMEval( code, { nonce: options && options.nonce }, doc );
		},

		each: function( obj, callback ) {
			var length, i = 0;

			if ( isArrayLike( obj ) ) {
				length = obj.length;
				for ( ; i < length; i++ ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			}

			return obj;
		},

		// results is for internal usage only
		makeArray: function( arr, results ) {
			var ret = results || [];

			if ( arr != null ) {
				if ( isArrayLike( Object( arr ) ) ) {
					jQuery.merge( ret,
						typeof arr === "string" ?
							[ arr ] : arr
					);
				} else {
					push.call( ret, arr );
				}
			}

			return ret;
		},

		inArray: function( elem, arr, i ) {
			return arr == null ? -1 : indexOf.call( arr, elem, i );
		},

		// Support: Android <=4.0 only, PhantomJS 1 only
		// push.apply(_, arraylike) throws on ancient WebKit
		merge: function( first, second ) {
			var len = +second.length,
				j = 0,
				i = first.length;

			for ( ; j < len; j++ ) {
				first[ i++ ] = second[ j ];
			}

			first.length = i;

			return first;
		},

		grep: function( elems, callback, invert ) {
			var callbackInverse,
				matches = [],
				i = 0,
				length = elems.length,
				callbackExpect = !invert;

			// Go through the array, only saving the items
			// that pass the validator function
			for ( ; i < length; i++ ) {
				callbackInverse = !callback( elems[ i ], i );
				if ( callbackInverse !== callbackExpect ) {
					matches.push( elems[ i ] );
				}
			}

			return matches;
		},

		// arg is for internal usage only
		map: function( elems, callback, arg ) {
			var length, value,
				i = 0,
				ret = [];

			// Go through the array, translating each of the items to their new values
			if ( isArrayLike( elems ) ) {
				length = elems.length;
				for ( ; i < length; i++ ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}

			// Go through every key on the object,
			} else {
				for ( i in elems ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}
			}

			// Flatten any nested arrays
			return flat( ret );
		},

		// A global GUID counter for objects
		guid: 1,

		// jQuery.support is not used in Core but other projects attach their
		// properties to it so it needs to exist.
		support: support
	} );

	if ( typeof Symbol === "function" ) {
		jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
	}

	// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
		function( _i, name ) {
			class2type[ "[object " + name + "]" ] = name.toLowerCase();
		} );

	function isArrayLike( obj ) {

		// Support: real iOS 8.2 only (not reproducible in simulator)
		// `in` check used to prevent JIT error (gh-2145)
		// hasOwn isn't used here due to false negatives
		// regarding Nodelist length in IE
		var length = !!obj && "length" in obj && obj.length,
			type = toType( obj );

		if ( isFunction( obj ) || isWindow( obj ) ) {
			return false;
		}

		return type === "array" || length === 0 ||
			typeof length === "number" && length > 0 && ( length - 1 ) in obj;
	}
	var Sizzle =
	/*!
	 * Sizzle CSS Selector Engine v2.3.6
	 * https://sizzlejs.com/
	 *
	 * Copyright JS Foundation and other contributors
	 * Released under the MIT license
	 * https://js.foundation/
	 *
	 * Date: 2021-02-16
	 */
	( function( window ) {
	var i,
		support,
		Expr,
		getText,
		isXML,
		tokenize,
		compile,
		select,
		outermostContext,
		sortInput,
		hasDuplicate,

		// Local document vars
		setDocument,
		document,
		docElem,
		documentIsHTML,
		rbuggyQSA,
		rbuggyMatches,
		matches,
		contains,

		// Instance-specific data
		expando = "sizzle" + 1 * new Date(),
		preferredDoc = window.document,
		dirruns = 0,
		done = 0,
		classCache = createCache(),
		tokenCache = createCache(),
		compilerCache = createCache(),
		nonnativeSelectorCache = createCache(),
		sortOrder = function( a, b ) {
			if ( a === b ) {
				hasDuplicate = true;
			}
			return 0;
		},

		// Instance methods
		hasOwn = ( {} ).hasOwnProperty,
		arr = [],
		pop = arr.pop,
		pushNative = arr.push,
		push = arr.push,
		slice = arr.slice,

		// Use a stripped-down indexOf as it's faster than native
		// https://jsperf.com/thor-indexof-vs-for/5
		indexOf = function( list, elem ) {
			var i = 0,
				len = list.length;
			for ( ; i < len; i++ ) {
				if ( list[ i ] === elem ) {
					return i;
				}
			}
			return -1;
		},

		booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|" +
			"ismap|loop|multiple|open|readonly|required|scoped",

		// Regular expressions

		// http://www.w3.org/TR/css3-selectors/#whitespace
		whitespace = "[\\x20\\t\\r\\n\\f]",

		// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
		identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace +
			"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",

		// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
		attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +

			// Operator (capture 2)
			"*([*^$|!~]?=)" + whitespace +

			// "Attribute values must be CSS identifiers [capture 5]
			// or strings [capture 3 or capture 4]"
			"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" +
			whitespace + "*\\]",

		pseudos = ":(" + identifier + ")(?:\\((" +

			// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
			// 1. quoted (capture 3; capture 4 or capture 5)
			"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +

			// 2. simple (capture 6)
			"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +

			// 3. anything else (capture 2)
			".*" +
			")\\)|)",

		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		rwhitespace = new RegExp( whitespace + "+", "g" ),
		rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" +
			whitespace + "+$", "g" ),

		rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
		rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace +
			"*" ),
		rdescend = new RegExp( whitespace + "|>" ),

		rpseudo = new RegExp( pseudos ),
		ridentifier = new RegExp( "^" + identifier + "$" ),

		matchExpr = {
			"ID": new RegExp( "^#(" + identifier + ")" ),
			"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
			"TAG": new RegExp( "^(" + identifier + "|[*])" ),
			"ATTR": new RegExp( "^" + attributes ),
			"PSEUDO": new RegExp( "^" + pseudos ),
			"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
				whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" +
				whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
			"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),

			// For use in libraries implementing .is()
			// We use this for POS matching in `select`
			"needsContext": new RegExp( "^" + whitespace +
				"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
				"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
		},

		rhtml = /HTML$/i,
		rinputs = /^(?:input|select|textarea|button)$/i,
		rheader = /^h\d$/i,

		rnative = /^[^{]+\{\s*\[native \w/,

		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

		rsibling = /[+~]/,

		// CSS escapes
		// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
		runescape = new RegExp( "\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g" ),
		funescape = function( escape, nonHex ) {
			var high = "0x" + escape.slice( 1 ) - 0x10000;

			return nonHex ?

				// Strip the backslash prefix from a non-hex escape sequence
				nonHex :

				// Replace a hexadecimal escape sequence with the encoded Unicode code point
				// Support: IE <=11+
				// For values outside the Basic Multilingual Plane (BMP), manually construct a
				// surrogate pair
				high < 0 ?
					String.fromCharCode( high + 0x10000 ) :
					String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
		},

		// CSS string/identifier serialization
		// https://drafts.csswg.org/cssom/#common-serializing-idioms
		rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
		fcssescape = function( ch, asCodePoint ) {
			if ( asCodePoint ) {

				// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
				if ( ch === "\0" ) {
					return "\uFFFD";
				}

				// Control characters and (dependent upon position) numbers get escaped as code points
				return ch.slice( 0, -1 ) + "\\" +
					ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
			}

			// Other potentially-special ASCII characters get backslash-escaped
			return "\\" + ch;
		},

		// Used for iframes
		// See setDocument()
		// Removing the function wrapper causes a "Permission Denied"
		// error in IE
		unloadHandler = function() {
			setDocument();
		},

		inDisabledFieldset = addCombinator(
			function( elem ) {
				return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
			},
			{ dir: "parentNode", next: "legend" }
		);

	// Optimize for push.apply( _, NodeList )
	try {
		push.apply(
			( arr = slice.call( preferredDoc.childNodes ) ),
			preferredDoc.childNodes
		);

		// Support: Android<4.0
		// Detect silently failing push.apply
		// eslint-disable-next-line no-unused-expressions
		arr[ preferredDoc.childNodes.length ].nodeType;
	} catch ( e ) {
		push = { apply: arr.length ?

			// Leverage slice if possible
			function( target, els ) {
				pushNative.apply( target, slice.call( els ) );
			} :

			// Support: IE<9
			// Otherwise append directly
			function( target, els ) {
				var j = target.length,
					i = 0;

				// Can't trust NodeList.length
				while ( ( target[ j++ ] = els[ i++ ] ) ) {}
				target.length = j - 1;
			}
		};
	}

	function Sizzle( selector, context, results, seed ) {
		var m, i, elem, nid, match, groups, newSelector,
			newContext = context && context.ownerDocument,

			// nodeType defaults to 9, since context defaults to document
			nodeType = context ? context.nodeType : 9;

		results = results || [];

		// Return early from calls with invalid selector or context
		if ( typeof selector !== "string" || !selector ||
			nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

			return results;
		}

		// Try to shortcut find operations (as opposed to filters) in HTML documents
		if ( !seed ) {
			setDocument( context );
			context = context || document;

			if ( documentIsHTML ) {

				// If the selector is sufficiently simple, try using a "get*By*" DOM method
				// (excepting DocumentFragment context, where the methods don't exist)
				if ( nodeType !== 11 && ( match = rquickExpr.exec( selector ) ) ) {

					// ID selector
					if ( ( m = match[ 1 ] ) ) {

						// Document context
						if ( nodeType === 9 ) {
							if ( ( elem = context.getElementById( m ) ) ) {

								// Support: IE, Opera, Webkit
								// TODO: identify versions
								// getElementById can match elements by name instead of ID
								if ( elem.id === m ) {
									results.push( elem );
									return results;
								}
							} else {
								return results;
							}

						// Element context
						} else {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( newContext && ( elem = newContext.getElementById( m ) ) &&
								contains( context, elem ) &&
								elem.id === m ) {

								results.push( elem );
								return results;
							}
						}

					// Type selector
					} else if ( match[ 2 ] ) {
						push.apply( results, context.getElementsByTagName( selector ) );
						return results;

					// Class selector
					} else if ( ( m = match[ 3 ] ) && support.getElementsByClassName &&
						context.getElementsByClassName ) {

						push.apply( results, context.getElementsByClassName( m ) );
						return results;
					}
				}

				// Take advantage of querySelectorAll
				if ( support.qsa &&
					!nonnativeSelectorCache[ selector + " " ] &&
					( !rbuggyQSA || !rbuggyQSA.test( selector ) ) &&

					// Support: IE 8 only
					// Exclude object elements
					( nodeType !== 1 || context.nodeName.toLowerCase() !== "object" ) ) {

					newSelector = selector;
					newContext = context;

					// qSA considers elements outside a scoping root when evaluating child or
					// descendant combinators, which is not what we want.
					// In such cases, we work around the behavior by prefixing every selector in the
					// list with an ID selector referencing the scope context.
					// The technique has to be used as well when a leading combinator is used
					// as such selectors are not recognized by querySelectorAll.
					// Thanks to Andrew Dupont for this technique.
					if ( nodeType === 1 &&
						( rdescend.test( selector ) || rcombinators.test( selector ) ) ) {

						// Expand context for sibling selectors
						newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
							context;

						// We can use :scope instead of the ID hack if the browser
						// supports it & if we're not changing the context.
						if ( newContext !== context || !support.scope ) {

							// Capture the context ID, setting it first if necessary
							if ( ( nid = context.getAttribute( "id" ) ) ) {
								nid = nid.replace( rcssescape, fcssescape );
							} else {
								context.setAttribute( "id", ( nid = expando ) );
							}
						}

						// Prefix every selector in the list
						groups = tokenize( selector );
						i = groups.length;
						while ( i-- ) {
							groups[ i ] = ( nid ? "#" + nid : ":scope" ) + " " +
								toSelector( groups[ i ] );
						}
						newSelector = groups.join( "," );
					}

					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
						nonnativeSelectorCache( selector, true );
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}

		// All others
		return select( selector.replace( rtrim, "$1" ), context, results, seed );
	}

	/**
	 * Create key-value caches of limited size
	 * @returns {function(string, object)} Returns the Object data after storing it on itself with
	 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
	 *	deleting the oldest entry
	 */
	function createCache() {
		var keys = [];

		function cache( key, value ) {

			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			if ( keys.push( key + " " ) > Expr.cacheLength ) {

				// Only keep the most recent entries
				delete cache[ keys.shift() ];
			}
			return ( cache[ key + " " ] = value );
		}
		return cache;
	}

	/**
	 * Mark a function for special use by Sizzle
	 * @param {Function} fn The function to mark
	 */
	function markFunction( fn ) {
		fn[ expando ] = true;
		return fn;
	}

	/**
	 * Support testing using an element
	 * @param {Function} fn Passed the created element and returns a boolean result
	 */
	function assert( fn ) {
		var el = document.createElement( "fieldset" );

		try {
			return !!fn( el );
		} catch ( e ) {
			return false;
		} finally {

			// Remove from its parent by default
			if ( el.parentNode ) {
				el.parentNode.removeChild( el );
			}

			// release memory in IE
			el = null;
		}
	}

	/**
	 * Adds the same handler for all of the specified attrs
	 * @param {String} attrs Pipe-separated list of attributes
	 * @param {Function} handler The method that will be applied
	 */
	function addHandle( attrs, handler ) {
		var arr = attrs.split( "|" ),
			i = arr.length;

		while ( i-- ) {
			Expr.attrHandle[ arr[ i ] ] = handler;
		}
	}

	/**
	 * Checks document order of two siblings
	 * @param {Element} a
	 * @param {Element} b
	 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
	 */
	function siblingCheck( a, b ) {
		var cur = b && a,
			diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				a.sourceIndex - b.sourceIndex;

		// Use IE sourceIndex if available on both nodes
		if ( diff ) {
			return diff;
		}

		// Check if b follows a
		if ( cur ) {
			while ( ( cur = cur.nextSibling ) ) {
				if ( cur === b ) {
					return -1;
				}
			}
		}

		return a ? 1 : -1;
	}

	/**
	 * Returns a function to use in pseudos for input types
	 * @param {String} type
	 */
	function createInputPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for buttons
	 * @param {String} type
	 */
	function createButtonPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return ( name === "input" || name === "button" ) && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for :enabled/:disabled
	 * @param {Boolean} disabled true for :disabled; false for :enabled
	 */
	function createDisabledPseudo( disabled ) {

		// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
		return function( elem ) {

			// Only certain elements can match :enabled or :disabled
			// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
			// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
			if ( "form" in elem ) {

				// Check for inherited disabledness on relevant non-disabled elements:
				// * listed form-associated elements in a disabled fieldset
				//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
				//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
				// * option elements in a disabled optgroup
				//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
				// All such elements have a "form" property.
				if ( elem.parentNode && elem.disabled === false ) {

					// Option elements defer to a parent optgroup if present
					if ( "label" in elem ) {
						if ( "label" in elem.parentNode ) {
							return elem.parentNode.disabled === disabled;
						} else {
							return elem.disabled === disabled;
						}
					}

					// Support: IE 6 - 11
					// Use the isDisabled shortcut property to check for disabled fieldset ancestors
					return elem.isDisabled === disabled ||

						// Where there is no isDisabled, check manually
						/* jshint -W018 */
						elem.isDisabled !== !disabled &&
						inDisabledFieldset( elem ) === disabled;
				}

				return elem.disabled === disabled;

			// Try to winnow out elements that can't be disabled before trusting the disabled property.
			// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
			// even exist on them, let alone have a boolean value.
			} else if ( "label" in elem ) {
				return elem.disabled === disabled;
			}

			// Remaining elements are neither :enabled nor :disabled
			return false;
		};
	}

	/**
	 * Returns a function to use in pseudos for positionals
	 * @param {Function} fn
	 */
	function createPositionalPseudo( fn ) {
		return markFunction( function( argument ) {
			argument = +argument;
			return markFunction( function( seed, matches ) {
				var j,
					matchIndexes = fn( [], seed.length, argument ),
					i = matchIndexes.length;

				// Match elements found at the specified indexes
				while ( i-- ) {
					if ( seed[ ( j = matchIndexes[ i ] ) ] ) {
						seed[ j ] = !( matches[ j ] = seed[ j ] );
					}
				}
			} );
		} );
	}

	/**
	 * Checks a node for validity as a Sizzle context
	 * @param {Element|Object=} context
	 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
	 */
	function testContext( context ) {
		return context && typeof context.getElementsByTagName !== "undefined" && context;
	}

	// Expose support vars for convenience
	support = Sizzle.support = {};

	/**
	 * Detects XML nodes
	 * @param {Element|Object} elem An element or a document
	 * @returns {Boolean} True iff elem is a non-HTML XML node
	 */
	isXML = Sizzle.isXML = function( elem ) {
		var namespace = elem && elem.namespaceURI,
			docElem = elem && ( elem.ownerDocument || elem ).documentElement;

		// Support: IE <=8
		// Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
		// https://bugs.jquery.com/ticket/4833
		return !rhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
	};

	/**
	 * Sets document-related variables once based on the current document
	 * @param {Element|Object} [doc] An element or document object to use to set the document
	 * @returns {Object} Returns the current document
	 */
	setDocument = Sizzle.setDocument = function( node ) {
		var hasCompare, subWindow,
			doc = node ? node.ownerDocument || node : preferredDoc;

		// Return early if doc is invalid or already selected
		// Support: IE 11+, Edge 17 - 18+
		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
		// two documents; shallow comparisons work.
		// eslint-disable-next-line eqeqeq
		if ( doc == document || doc.nodeType !== 9 || !doc.documentElement ) {
			return document;
		}

		// Update global variables
		document = doc;
		docElem = document.documentElement;
		documentIsHTML = !isXML( document );

		// Support: IE 9 - 11+, Edge 12 - 18+
		// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
		// Support: IE 11+, Edge 17 - 18+
		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
		// two documents; shallow comparisons work.
		// eslint-disable-next-line eqeqeq
		if ( preferredDoc != document &&
			( subWindow = document.defaultView ) && subWindow.top !== subWindow ) {

			// Support: IE 11, Edge
			if ( subWindow.addEventListener ) {
				subWindow.addEventListener( "unload", unloadHandler, false );

			// Support: IE 9 - 10 only
			} else if ( subWindow.attachEvent ) {
				subWindow.attachEvent( "onunload", unloadHandler );
			}
		}

		// Support: IE 8 - 11+, Edge 12 - 18+, Chrome <=16 - 25 only, Firefox <=3.6 - 31 only,
		// Safari 4 - 5 only, Opera <=11.6 - 12.x only
		// IE/Edge & older browsers don't support the :scope pseudo-class.
		// Support: Safari 6.0 only
		// Safari 6.0 supports :scope but it's an alias of :root there.
		support.scope = assert( function( el ) {
			docElem.appendChild( el ).appendChild( document.createElement( "div" ) );
			return typeof el.querySelectorAll !== "undefined" &&
				!el.querySelectorAll( ":scope fieldset div" ).length;
		} );

		/* Attributes
		---------------------------------------------------------------------- */

		// Support: IE<8
		// Verify that getAttribute really returns attributes and not properties
		// (excepting IE8 booleans)
		support.attributes = assert( function( el ) {
			el.className = "i";
			return !el.getAttribute( "className" );
		} );

		/* getElement(s)By*
		---------------------------------------------------------------------- */

		// Check if getElementsByTagName("*") returns only elements
		support.getElementsByTagName = assert( function( el ) {
			el.appendChild( document.createComment( "" ) );
			return !el.getElementsByTagName( "*" ).length;
		} );

		// Support: IE<9
		support.getElementsByClassName = rnative.test( document.getElementsByClassName );

		// Support: IE<10
		// Check if getElementById returns elements by name
		// The broken getElementById methods don't pick up programmatically-set names,
		// so use a roundabout getElementsByName test
		support.getById = assert( function( el ) {
			docElem.appendChild( el ).id = expando;
			return !document.getElementsByName || !document.getElementsByName( expando ).length;
		} );

		// ID filter and find
		if ( support.getById ) {
			Expr.filter[ "ID" ] = function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					return elem.getAttribute( "id" ) === attrId;
				};
			};
			Expr.find[ "ID" ] = function( id, context ) {
				if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
					var elem = context.getElementById( id );
					return elem ? [ elem ] : [];
				}
			};
		} else {
			Expr.filter[ "ID" ] =  function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					var node = typeof elem.getAttributeNode !== "undefined" &&
						elem.getAttributeNode( "id" );
					return node && node.value === attrId;
				};
			};

			// Support: IE 6 - 7 only
			// getElementById is not reliable as a find shortcut
			Expr.find[ "ID" ] = function( id, context ) {
				if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
					var node, i, elems,
						elem = context.getElementById( id );

					if ( elem ) {

						// Verify the id attribute
						node = elem.getAttributeNode( "id" );
						if ( node && node.value === id ) {
							return [ elem ];
						}

						// Fall back on getElementsByName
						elems = context.getElementsByName( id );
						i = 0;
						while ( ( elem = elems[ i++ ] ) ) {
							node = elem.getAttributeNode( "id" );
							if ( node && node.value === id ) {
								return [ elem ];
							}
						}
					}

					return [];
				}
			};
		}

		// Tag
		Expr.find[ "TAG" ] = support.getElementsByTagName ?
			function( tag, context ) {
				if ( typeof context.getElementsByTagName !== "undefined" ) {
					return context.getElementsByTagName( tag );

				// DocumentFragment nodes don't have gEBTN
				} else if ( support.qsa ) {
					return context.querySelectorAll( tag );
				}
			} :

			function( tag, context ) {
				var elem,
					tmp = [],
					i = 0,

					// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
					results = context.getElementsByTagName( tag );

				// Filter out possible comments
				if ( tag === "*" ) {
					while ( ( elem = results[ i++ ] ) ) {
						if ( elem.nodeType === 1 ) {
							tmp.push( elem );
						}
					}

					return tmp;
				}
				return results;
			};

		// Class
		Expr.find[ "CLASS" ] = support.getElementsByClassName && function( className, context ) {
			if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
				return context.getElementsByClassName( className );
			}
		};

		/* QSA/matchesSelector
		---------------------------------------------------------------------- */

		// QSA and matchesSelector support

		// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
		rbuggyMatches = [];

		// qSa(:focus) reports false when true (Chrome 21)
		// We allow this because of a bug in IE8/9 that throws an error
		// whenever `document.activeElement` is accessed on an iframe
		// So, we allow :focus to pass through QSA all the time to avoid the IE error
		// See https://bugs.jquery.com/ticket/13378
		rbuggyQSA = [];

		if ( ( support.qsa = rnative.test( document.querySelectorAll ) ) ) {

			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert( function( el ) {

				var input;

				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explicitly
				// setting a boolean content attribute,
				// since its presence should be enough
				// https://bugs.jquery.com/ticket/12359
				docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
					"<select id='" + expando + "-\r\\' msallowcapture=''>" +
					"<option selected=''></option></select>";

				// Support: IE8, Opera 11-12.16
				// Nothing should be selected when empty strings follow ^= or $= or *=
				// The test attribute must be unknown in Opera but "safe" for WinRT
				// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
				if ( el.querySelectorAll( "[msallowcapture^='']" ).length ) {
					rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
				}

				// Support: IE8
				// Boolean attributes and "value" are not treated correctly
				if ( !el.querySelectorAll( "[selected]" ).length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
				}

				// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
				if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
					rbuggyQSA.push( "~=" );
				}

				// Support: IE 11+, Edge 15 - 18+
				// IE 11/Edge don't find elements on a `[name='']` query in some cases.
				// Adding a temporary attribute to the document before the selection works
				// around the issue.
				// Interestingly, IE 10 & older don't seem to have the issue.
				input = document.createElement( "input" );
				input.setAttribute( "name", "" );
				el.appendChild( input );
				if ( !el.querySelectorAll( "[name='']" ).length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*name" + whitespace + "*=" +
						whitespace + "*(?:''|\"\")" );
				}

				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				if ( !el.querySelectorAll( ":checked" ).length ) {
					rbuggyQSA.push( ":checked" );
				}

				// Support: Safari 8+, iOS 8+
				// https://bugs.webkit.org/show_bug.cgi?id=136851
				// In-page `selector#id sibling-combinator selector` fails
				if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
					rbuggyQSA.push( ".#.+[+~]" );
				}

				// Support: Firefox <=3.6 - 5 only
				// Old Firefox doesn't throw on a badly-escaped identifier.
				el.querySelectorAll( "\\\f" );
				rbuggyQSA.push( "[\\r\\n\\f]" );
			} );

			assert( function( el ) {
				el.innerHTML = "<a href='' disabled='disabled'></a>" +
					"<select disabled='disabled'><option/></select>";

				// Support: Windows 8 Native Apps
				// The type and name attributes are restricted during .innerHTML assignment
				var input = document.createElement( "input" );
				input.setAttribute( "type", "hidden" );
				el.appendChild( input ).setAttribute( "name", "D" );

				// Support: IE8
				// Enforce case-sensitivity of name attribute
				if ( el.querySelectorAll( "[name=d]" ).length ) {
					rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
				}

				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				if ( el.querySelectorAll( ":enabled" ).length !== 2 ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}

				// Support: IE9-11+
				// IE's :disabled selector does not pick up the children of disabled fieldsets
				docElem.appendChild( el ).disabled = true;
				if ( el.querySelectorAll( ":disabled" ).length !== 2 ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}

				// Support: Opera 10 - 11 only
				// Opera 10-11 does not throw on post-comma invalid pseudos
				el.querySelectorAll( "*,:x" );
				rbuggyQSA.push( ",.*:" );
			} );
		}

		if ( ( support.matchesSelector = rnative.test( ( matches = docElem.matches ||
			docElem.webkitMatchesSelector ||
			docElem.mozMatchesSelector ||
			docElem.oMatchesSelector ||
			docElem.msMatchesSelector ) ) ) ) {

			assert( function( el ) {

				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				support.disconnectedMatch = matches.call( el, "*" );

				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call( el, "[s!='']:x" );
				rbuggyMatches.push( "!=", pseudos );
			} );
		}

		rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join( "|" ) );
		rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join( "|" ) );

		/* Contains
		---------------------------------------------------------------------- */
		hasCompare = rnative.test( docElem.compareDocumentPosition );

		// Element contains another
		// Purposefully self-exclusive
		// As in, an element does not contain itself
		contains = hasCompare || rnative.test( docElem.contains ) ?
			function( a, b ) {
				var adown = a.nodeType === 9 ? a.documentElement : a,
					bup = b && b.parentNode;
				return a === bup || !!( bup && bup.nodeType === 1 && (
					adown.contains ?
						adown.contains( bup ) :
						a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
				) );
			} :
			function( a, b ) {
				if ( b ) {
					while ( ( b = b.parentNode ) ) {
						if ( b === a ) {
							return true;
						}
					}
				}
				return false;
			};

		/* Sorting
		---------------------------------------------------------------------- */

		// Document order sorting
		sortOrder = hasCompare ?
		function( a, b ) {

			// Flag for duplicate removal
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			// Sort on method existence if only one input has compareDocumentPosition
			var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
			if ( compare ) {
				return compare;
			}

			// Calculate position if both inputs belong to the same document
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			compare = ( a.ownerDocument || a ) == ( b.ownerDocument || b ) ?
				a.compareDocumentPosition( b ) :

				// Otherwise we know they are disconnected
				1;

			// Disconnected nodes
			if ( compare & 1 ||
				( !support.sortDetached && b.compareDocumentPosition( a ) === compare ) ) {

				// Choose the first element that is related to our preferred document
				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				// eslint-disable-next-line eqeqeq
				if ( a == document || a.ownerDocument == preferredDoc &&
					contains( preferredDoc, a ) ) {
					return -1;
				}

				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				// eslint-disable-next-line eqeqeq
				if ( b == document || b.ownerDocument == preferredDoc &&
					contains( preferredDoc, b ) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		} :
		function( a, b ) {

			// Exit early if the nodes are identical
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			var cur,
				i = 0,
				aup = a.parentNode,
				bup = b.parentNode,
				ap = [ a ],
				bp = [ b ];

			// Parentless nodes are either documents or disconnected
			if ( !aup || !bup ) {

				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				/* eslint-disable eqeqeq */
				return a == document ? -1 :
					b == document ? 1 :
					/* eslint-enable eqeqeq */
					aup ? -1 :
					bup ? 1 :
					sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;

			// If the nodes are siblings, we can do a quick check
			} else if ( aup === bup ) {
				return siblingCheck( a, b );
			}

			// Otherwise we need full lists of their ancestors for comparison
			cur = a;
			while ( ( cur = cur.parentNode ) ) {
				ap.unshift( cur );
			}
			cur = b;
			while ( ( cur = cur.parentNode ) ) {
				bp.unshift( cur );
			}

			// Walk down the tree looking for a discrepancy
			while ( ap[ i ] === bp[ i ] ) {
				i++;
			}

			return i ?

				// Do a sibling check if the nodes have a common ancestor
				siblingCheck( ap[ i ], bp[ i ] ) :

				// Otherwise nodes in our document sort first
				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				/* eslint-disable eqeqeq */
				ap[ i ] == preferredDoc ? -1 :
				bp[ i ] == preferredDoc ? 1 :
				/* eslint-enable eqeqeq */
				0;
		};

		return document;
	};

	Sizzle.matches = function( expr, elements ) {
		return Sizzle( expr, null, null, elements );
	};

	Sizzle.matchesSelector = function( elem, expr ) {
		setDocument( elem );

		if ( support.matchesSelector && documentIsHTML &&
			!nonnativeSelectorCache[ expr + " " ] &&
			( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
			( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

			try {
				var ret = matches.call( elem, expr );

				// IE 9's matchesSelector returns false on disconnected nodes
				if ( ret || support.disconnectedMatch ||

					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
					return ret;
				}
			} catch ( e ) {
				nonnativeSelectorCache( expr, true );
			}
		}

		return Sizzle( expr, document, null, [ elem ] ).length > 0;
	};

	Sizzle.contains = function( context, elem ) {

		// Set document vars if needed
		// Support: IE 11+, Edge 17 - 18+
		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
		// two documents; shallow comparisons work.
		// eslint-disable-next-line eqeqeq
		if ( ( context.ownerDocument || context ) != document ) {
			setDocument( context );
		}
		return contains( context, elem );
	};

	Sizzle.attr = function( elem, name ) {

		// Set document vars if needed
		// Support: IE 11+, Edge 17 - 18+
		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
		// two documents; shallow comparisons work.
		// eslint-disable-next-line eqeqeq
		if ( ( elem.ownerDocument || elem ) != document ) {
			setDocument( elem );
		}

		var fn = Expr.attrHandle[ name.toLowerCase() ],

			// Don't get fooled by Object.prototype properties (jQuery #13807)
			val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
				fn( elem, name, !documentIsHTML ) :
				undefined;

		return val !== undefined ?
			val :
			support.attributes || !documentIsHTML ?
				elem.getAttribute( name ) :
				( val = elem.getAttributeNode( name ) ) && val.specified ?
					val.value :
					null;
	};

	Sizzle.escape = function( sel ) {
		return ( sel + "" ).replace( rcssescape, fcssescape );
	};

	Sizzle.error = function( msg ) {
		throw new Error( "Syntax error, unrecognized expression: " + msg );
	};

	/**
	 * Document sorting and removing duplicates
	 * @param {ArrayLike} results
	 */
	Sizzle.uniqueSort = function( results ) {
		var elem,
			duplicates = [],
			j = 0,
			i = 0;

		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice( 0 );
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			while ( ( elem = results[ i++ ] ) ) {
				if ( elem === results[ i ] ) {
					j = duplicates.push( i );
				}
			}
			while ( j-- ) {
				results.splice( duplicates[ j ], 1 );
			}
		}

		// Clear input after sorting to release objects
		// See https://github.com/jquery/sizzle/pull/225
		sortInput = null;

		return results;
	};

	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	getText = Sizzle.getText = function( elem ) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if ( !nodeType ) {

			// If no nodeType, this is expected to be an array
			while ( ( node = elem[ i++ ] ) ) {

				// Do not traverse comment nodes
				ret += getText( node );
			}
		} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {

			// Use textContent for elements
			// innerText usage removed for consistency of new lines (jQuery #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {

				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}

		// Do not include comment or processing instruction nodes

		return ret;
	};

	Expr = Sizzle.selectors = {

		// Can be adjusted by the user
		cacheLength: 50,

		createPseudo: markFunction,

		match: matchExpr,

		attrHandle: {},

		find: {},

		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			"ATTR": function( match ) {
				match[ 1 ] = match[ 1 ].replace( runescape, funescape );

				// Move the given value to match[3] whether quoted or unquoted
				match[ 3 ] = ( match[ 3 ] || match[ 4 ] ||
					match[ 5 ] || "" ).replace( runescape, funescape );

				if ( match[ 2 ] === "~=" ) {
					match[ 3 ] = " " + match[ 3 ] + " ";
				}

				return match.slice( 0, 4 );
			},

			"CHILD": function( match ) {

				/* matches from matchExpr["CHILD"]
					1 type (only|nth|...)
					2 what (child|of-type)
					3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
					4 xn-component of xn+y argument ([+-]?\d*n|)
					5 sign of xn-component
					6 x of xn-component
					7 sign of y-component
					8 y of y-component
				*/
				match[ 1 ] = match[ 1 ].toLowerCase();

				if ( match[ 1 ].slice( 0, 3 ) === "nth" ) {

					// nth-* requires argument
					if ( !match[ 3 ] ) {
						Sizzle.error( match[ 0 ] );
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[ 4 ] = +( match[ 4 ] ?
						match[ 5 ] + ( match[ 6 ] || 1 ) :
						2 * ( match[ 3 ] === "even" || match[ 3 ] === "odd" ) );
					match[ 5 ] = +( ( match[ 7 ] + match[ 8 ] ) || match[ 3 ] === "odd" );

					// other types prohibit arguments
				} else if ( match[ 3 ] ) {
					Sizzle.error( match[ 0 ] );
				}

				return match;
			},

			"PSEUDO": function( match ) {
				var excess,
					unquoted = !match[ 6 ] && match[ 2 ];

				if ( matchExpr[ "CHILD" ].test( match[ 0 ] ) ) {
					return null;
				}

				// Accept quoted arguments as-is
				if ( match[ 3 ] ) {
					match[ 2 ] = match[ 4 ] || match[ 5 ] || "";

				// Strip excess characters from unquoted arguments
				} else if ( unquoted && rpseudo.test( unquoted ) &&

					// Get excess from tokenize (recursively)
					( excess = tokenize( unquoted, true ) ) &&

					// advance to the next closing parenthesis
					( excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length ) ) {

					// excess is a negative index
					match[ 0 ] = match[ 0 ].slice( 0, excess );
					match[ 2 ] = unquoted.slice( 0, excess );
				}

				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice( 0, 3 );
			}
		},

		filter: {

			"TAG": function( nodeNameSelector ) {
				var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
				return nodeNameSelector === "*" ?
					function() {
						return true;
					} :
					function( elem ) {
						return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
					};
			},

			"CLASS": function( className ) {
				var pattern = classCache[ className + " " ];

				return pattern ||
					( pattern = new RegExp( "(^|" + whitespace +
						")" + className + "(" + whitespace + "|$)" ) ) && classCache(
							className, function( elem ) {
								return pattern.test(
									typeof elem.className === "string" && elem.className ||
									typeof elem.getAttribute !== "undefined" &&
										elem.getAttribute( "class" ) ||
									""
								);
					} );
			},

			"ATTR": function( name, operator, check ) {
				return function( elem ) {
					var result = Sizzle.attr( elem, name );

					if ( result == null ) {
						return operator === "!=";
					}
					if ( !operator ) {
						return true;
					}

					result += "";

					/* eslint-disable max-len */

					return operator === "=" ? result === check :
						operator === "!=" ? result !== check :
						operator === "^=" ? check && result.indexOf( check ) === 0 :
						operator === "*=" ? check && result.indexOf( check ) > -1 :
						operator === "$=" ? check && result.slice( -check.length ) === check :
						operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
						operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
						false;
					/* eslint-enable max-len */

				};
			},

			"CHILD": function( type, what, _argument, first, last ) {
				var simple = type.slice( 0, 3 ) !== "nth",
					forward = type.slice( -4 ) !== "last",
					ofType = what === "of-type";

				return first === 1 && last === 0 ?

					// Shortcut for :nth-*(n)
					function( elem ) {
						return !!elem.parentNode;
					} :

					function( elem, _context, xml ) {
						var cache, uniqueCache, outerCache, node, nodeIndex, start,
							dir = simple !== forward ? "nextSibling" : "previousSibling",
							parent = elem.parentNode,
							name = ofType && elem.nodeName.toLowerCase(),
							useCache = !xml && !ofType,
							diff = false;

						if ( parent ) {

							// :(first|last|only)-(child|of-type)
							if ( simple ) {
								while ( dir ) {
									node = elem;
									while ( ( node = node[ dir ] ) ) {
										if ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) {

											return false;
										}
									}

									// Reverse direction for :only-* (if we haven't yet done so)
									start = dir = type === "only" && !start && "nextSibling";
								}
								return true;
							}

							start = [ forward ? parent.firstChild : parent.lastChild ];

							// non-xml :nth-child(...) stores cache data on `parent`
							if ( forward && useCache ) {

								// Seek `elem` from a previously-cached index

								// ...in a gzip-friendly way
								node = parent;
								outerCache = node[ expando ] || ( node[ expando ] = {} );

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									( outerCache[ node.uniqueID ] = {} );

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex && cache[ 2 ];
								node = nodeIndex && parent.childNodes[ nodeIndex ];

								while ( ( node = ++nodeIndex && node && node[ dir ] ||

									// Fallback to seeking `elem` from the start
									( diff = nodeIndex = 0 ) || start.pop() ) ) {

									// When found, cache indexes on `parent` and break
									if ( node.nodeType === 1 && ++diff && node === elem ) {
										uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
										break;
									}
								}

							} else {

								// Use previously-cached element index if available
								if ( useCache ) {

									// ...in a gzip-friendly way
									node = elem;
									outerCache = node[ expando ] || ( node[ expando ] = {} );

									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[ node.uniqueID ] ||
										( outerCache[ node.uniqueID ] = {} );

									cache = uniqueCache[ type ] || [];
									nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
									diff = nodeIndex;
								}

								// xml :nth-child(...)
								// or :nth-last-child(...) or :nth(-last)?-of-type(...)
								if ( diff === false ) {

									// Use the same loop as above to seek `elem` from the start
									while ( ( node = ++nodeIndex && node && node[ dir ] ||
										( diff = nodeIndex = 0 ) || start.pop() ) ) {

										if ( ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) &&
											++diff ) {

											// Cache the index of each encountered element
											if ( useCache ) {
												outerCache = node[ expando ] ||
													( node[ expando ] = {} );

												// Support: IE <9 only
												// Defend against cloned attroperties (jQuery gh-1709)
												uniqueCache = outerCache[ node.uniqueID ] ||
													( outerCache[ node.uniqueID ] = {} );

												uniqueCache[ type ] = [ dirruns, diff ];
											}

											if ( node === elem ) {
												break;
											}
										}
									}
								}
							}

							// Incorporate the offset, then check against cycle size
							diff -= last;
							return diff === first || ( diff % first === 0 && diff / first >= 0 );
						}
					};
			},

			"PSEUDO": function( pseudo, argument ) {

				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
					fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
						Sizzle.error( "unsupported pseudo: " + pseudo );

				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if ( fn[ expando ] ) {
					return fn( argument );
				}

				// But maintain support for old signatures
				if ( fn.length > 1 ) {
					args = [ pseudo, pseudo, "", argument ];
					return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
						markFunction( function( seed, matches ) {
							var idx,
								matched = fn( seed, argument ),
								i = matched.length;
							while ( i-- ) {
								idx = indexOf( seed, matched[ i ] );
								seed[ idx ] = !( matches[ idx ] = matched[ i ] );
							}
						} ) :
						function( elem ) {
							return fn( elem, 0, args );
						};
				}

				return fn;
			}
		},

		pseudos: {

			// Potentially complex pseudos
			"not": markFunction( function( selector ) {

				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
					results = [],
					matcher = compile( selector.replace( rtrim, "$1" ) );

				return matcher[ expando ] ?
					markFunction( function( seed, matches, _context, xml ) {
						var elem,
							unmatched = matcher( seed, null, xml, [] ),
							i = seed.length;

						// Match elements unmatched by `matcher`
						while ( i-- ) {
							if ( ( elem = unmatched[ i ] ) ) {
								seed[ i ] = !( matches[ i ] = elem );
							}
						}
					} ) :
					function( elem, _context, xml ) {
						input[ 0 ] = elem;
						matcher( input, null, xml, results );

						// Don't keep the element (issue #299)
						input[ 0 ] = null;
						return !results.pop();
					};
			} ),

			"has": markFunction( function( selector ) {
				return function( elem ) {
					return Sizzle( selector, elem ).length > 0;
				};
			} ),

			"contains": markFunction( function( text ) {
				text = text.replace( runescape, funescape );
				return function( elem ) {
					return ( elem.textContent || getText( elem ) ).indexOf( text ) > -1;
				};
			} ),

			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction( function( lang ) {

				// lang value must be a valid identifier
				if ( !ridentifier.test( lang || "" ) ) {
					Sizzle.error( "unsupported lang: " + lang );
				}
				lang = lang.replace( runescape, funescape ).toLowerCase();
				return function( elem ) {
					var elemLang;
					do {
						if ( ( elemLang = documentIsHTML ?
							elem.lang :
							elem.getAttribute( "xml:lang" ) || elem.getAttribute( "lang" ) ) ) {

							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
						}
					} while ( ( elem = elem.parentNode ) && elem.nodeType === 1 );
					return false;
				};
			} ),

			// Miscellaneous
			"target": function( elem ) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice( 1 ) === elem.id;
			},

			"root": function( elem ) {
				return elem === docElem;
			},

			"focus": function( elem ) {
				return elem === document.activeElement &&
					( !document.hasFocus || document.hasFocus() ) &&
					!!( elem.type || elem.href || ~elem.tabIndex );
			},

			// Boolean properties
			"enabled": createDisabledPseudo( false ),
			"disabled": createDisabledPseudo( true ),

			"checked": function( elem ) {

				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return ( nodeName === "input" && !!elem.checked ) ||
					( nodeName === "option" && !!elem.selected );
			},

			"selected": function( elem ) {

				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					// eslint-disable-next-line no-unused-expressions
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			// Contents
			"empty": function( elem ) {

				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
				//   but not by others (comment: 8; processing instruction: 7; etc.)
				// nodeType < 6 works because attributes (2) do not appear as children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					if ( elem.nodeType < 6 ) {
						return false;
					}
				}
				return true;
			},

			"parent": function( elem ) {
				return !Expr.pseudos[ "empty" ]( elem );
			},

			// Element/input types
			"header": function( elem ) {
				return rheader.test( elem.nodeName );
			},

			"input": function( elem ) {
				return rinputs.test( elem.nodeName );
			},

			"button": function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"text": function( elem ) {
				var attr;
				return elem.nodeName.toLowerCase() === "input" &&
					elem.type === "text" &&

					// Support: IE<8
					// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
					( ( attr = elem.getAttribute( "type" ) ) == null ||
						attr.toLowerCase() === "text" );
			},

			// Position-in-collection
			"first": createPositionalPseudo( function() {
				return [ 0 ];
			} ),

			"last": createPositionalPseudo( function( _matchIndexes, length ) {
				return [ length - 1 ];
			} ),

			"eq": createPositionalPseudo( function( _matchIndexes, length, argument ) {
				return [ argument < 0 ? argument + length : argument ];
			} ),

			"even": createPositionalPseudo( function( matchIndexes, length ) {
				var i = 0;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			} ),

			"odd": createPositionalPseudo( function( matchIndexes, length ) {
				var i = 1;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			} ),

			"lt": createPositionalPseudo( function( matchIndexes, length, argument ) {
				var i = argument < 0 ?
					argument + length :
					argument > length ?
						length :
						argument;
				for ( ; --i >= 0; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			} ),

			"gt": createPositionalPseudo( function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; ++i < length; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			} )
		}
	};

	Expr.pseudos[ "nth" ] = Expr.pseudos[ "eq" ];

	// Add button/input type pseudos
	for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
		Expr.pseudos[ i ] = createInputPseudo( i );
	}
	for ( i in { submit: true, reset: true } ) {
		Expr.pseudos[ i ] = createButtonPseudo( i );
	}

	// Easy API for creating new setFilters
	function setFilters() {}
	setFilters.prototype = Expr.filters = Expr.pseudos;
	Expr.setFilters = new setFilters();

	tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
		var matched, match, tokens, type,
			soFar, groups, preFilters,
			cached = tokenCache[ selector + " " ];

		if ( cached ) {
			return parseOnly ? 0 : cached.slice( 0 );
		}

		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;

		while ( soFar ) {

			// Comma and first run
			if ( !matched || ( match = rcomma.exec( soFar ) ) ) {
				if ( match ) {

					// Don't consume trailing commas as valid
					soFar = soFar.slice( match[ 0 ].length ) || soFar;
				}
				groups.push( ( tokens = [] ) );
			}

			matched = false;

			// Combinators
			if ( ( match = rcombinators.exec( soFar ) ) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,

					// Cast descendant combinators to space
					type: match[ 0 ].replace( rtrim, " " )
				} );
				soFar = soFar.slice( matched.length );
			}

			// Filters
			for ( type in Expr.filter ) {
				if ( ( match = matchExpr[ type ].exec( soFar ) ) && ( !preFilters[ type ] ||
					( match = preFilters[ type ]( match ) ) ) ) {
					matched = match.shift();
					tokens.push( {
						value: matched,
						type: type,
						matches: match
					} );
					soFar = soFar.slice( matched.length );
				}
			}

			if ( !matched ) {
				break;
			}
		}

		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		return parseOnly ?
			soFar.length :
			soFar ?
				Sizzle.error( selector ) :

				// Cache the tokens
				tokenCache( selector, groups ).slice( 0 );
	};

	function toSelector( tokens ) {
		var i = 0,
			len = tokens.length,
			selector = "";
		for ( ; i < len; i++ ) {
			selector += tokens[ i ].value;
		}
		return selector;
	}

	function addCombinator( matcher, combinator, base ) {
		var dir = combinator.dir,
			skip = combinator.next,
			key = skip || dir,
			checkNonElements = base && key === "parentNode",
			doneName = done++;

		return combinator.first ?

			// Check against closest ancestor/preceding element
			function( elem, context, xml ) {
				while ( ( elem = elem[ dir ] ) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						return matcher( elem, context, xml );
					}
				}
				return false;
			} :

			// Check against all ancestor/preceding elements
			function( elem, context, xml ) {
				var oldCache, uniqueCache, outerCache,
					newCache = [ dirruns, doneName ];

				// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
				if ( xml ) {
					while ( ( elem = elem[ dir ] ) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							if ( matcher( elem, context, xml ) ) {
								return true;
							}
						}
					}
				} else {
					while ( ( elem = elem[ dir ] ) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							outerCache = elem[ expando ] || ( elem[ expando ] = {} );

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ elem.uniqueID ] ||
								( outerCache[ elem.uniqueID ] = {} );

							if ( skip && skip === elem.nodeName.toLowerCase() ) {
								elem = elem[ dir ] || elem;
							} else if ( ( oldCache = uniqueCache[ key ] ) &&
								oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

								// Assign to newCache so results back-propagate to previous elements
								return ( newCache[ 2 ] = oldCache[ 2 ] );
							} else {

								// Reuse newcache so results back-propagate to previous elements
								uniqueCache[ key ] = newCache;

								// A match means we're done; a fail means we have to keep checking
								if ( ( newCache[ 2 ] = matcher( elem, context, xml ) ) ) {
									return true;
								}
							}
						}
					}
				}
				return false;
			};
	}

	function elementMatcher( matchers ) {
		return matchers.length > 1 ?
			function( elem, context, xml ) {
				var i = matchers.length;
				while ( i-- ) {
					if ( !matchers[ i ]( elem, context, xml ) ) {
						return false;
					}
				}
				return true;
			} :
			matchers[ 0 ];
	}

	function multipleContexts( selector, contexts, results ) {
		var i = 0,
			len = contexts.length;
		for ( ; i < len; i++ ) {
			Sizzle( selector, contexts[ i ], results );
		}
		return results;
	}

	function condense( unmatched, map, filter, context, xml ) {
		var elem,
			newUnmatched = [],
			i = 0,
			len = unmatched.length,
			mapped = map != null;

		for ( ; i < len; i++ ) {
			if ( ( elem = unmatched[ i ] ) ) {
				if ( !filter || filter( elem, context, xml ) ) {
					newUnmatched.push( elem );
					if ( mapped ) {
						map.push( i );
					}
				}
			}
		}

		return newUnmatched;
	}

	function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
		if ( postFilter && !postFilter[ expando ] ) {
			postFilter = setMatcher( postFilter );
		}
		if ( postFinder && !postFinder[ expando ] ) {
			postFinder = setMatcher( postFinder, postSelector );
		}
		return markFunction( function( seed, results, context, xml ) {
			var temp, i, elem,
				preMap = [],
				postMap = [],
				preexisting = results.length,

				// Get initial elements from seed or context
				elems = seed || multipleContexts(
					selector || "*",
					context.nodeType ? [ context ] : context,
					[]
				),

				// Prefilter to get matcher input, preserving a map for seed-results synchronization
				matcherIn = preFilter && ( seed || !selector ) ?
					condense( elems, preMap, preFilter, context, xml ) :
					elems,

				matcherOut = matcher ?

					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results :
					matcherIn;

			// Find primary matches
			if ( matcher ) {
				matcher( matcherIn, matcherOut, context, xml );
			}

			// Apply postFilter
			if ( postFilter ) {
				temp = condense( matcherOut, postMap );
				postFilter( temp, [], context, xml );

				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while ( i-- ) {
					if ( ( elem = temp[ i ] ) ) {
						matcherOut[ postMap[ i ] ] = !( matcherIn[ postMap[ i ] ] = elem );
					}
				}
			}

			if ( seed ) {
				if ( postFinder || preFilter ) {
					if ( postFinder ) {

						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while ( i-- ) {
							if ( ( elem = matcherOut[ i ] ) ) {

								// Restore matcherIn since elem is not yet a final match
								temp.push( ( matcherIn[ i ] = elem ) );
							}
						}
						postFinder( null, ( matcherOut = [] ), temp, xml );
					}

					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while ( i-- ) {
						if ( ( elem = matcherOut[ i ] ) &&
							( temp = postFinder ? indexOf( seed, elem ) : preMap[ i ] ) > -1 ) {

							seed[ temp ] = !( results[ temp ] = elem );
						}
					}
				}

			// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(
					matcherOut === results ?
						matcherOut.splice( preexisting, matcherOut.length ) :
						matcherOut
				);
				if ( postFinder ) {
					postFinder( null, results, matcherOut, xml );
				} else {
					push.apply( results, matcherOut );
				}
			}
		} );
	}

	function matcherFromTokens( tokens ) {
		var checkContext, matcher, j,
			len = tokens.length,
			leadingRelative = Expr.relative[ tokens[ 0 ].type ],
			implicitRelative = leadingRelative || Expr.relative[ " " ],
			i = leadingRelative ? 1 : 0,

			// The foundational matcher ensures that elements are reachable from top-level context(s)
			matchContext = addCombinator( function( elem ) {
				return elem === checkContext;
			}, implicitRelative, true ),
			matchAnyContext = addCombinator( function( elem ) {
				return indexOf( checkContext, elem ) > -1;
			}, implicitRelative, true ),
			matchers = [ function( elem, context, xml ) {
				var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
					( checkContext = context ).nodeType ?
						matchContext( elem, context, xml ) :
						matchAnyContext( elem, context, xml ) );

				// Avoid hanging onto element (issue #299)
				checkContext = null;
				return ret;
			} ];

		for ( ; i < len; i++ ) {
			if ( ( matcher = Expr.relative[ tokens[ i ].type ] ) ) {
				matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
			} else {
				matcher = Expr.filter[ tokens[ i ].type ].apply( null, tokens[ i ].matches );

				// Return special upon seeing a positional matcher
				if ( matcher[ expando ] ) {

					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for ( ; j < len; j++ ) {
						if ( Expr.relative[ tokens[ j ].type ] ) {
							break;
						}
					}
					return setMatcher(
						i > 1 && elementMatcher( matchers ),
						i > 1 && toSelector(

						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens
							.slice( 0, i - 1 )
							.concat( { value: tokens[ i - 2 ].type === " " ? "*" : "" } )
						).replace( rtrim, "$1" ),
						matcher,
						i < j && matcherFromTokens( tokens.slice( i, j ) ),
						j < len && matcherFromTokens( ( tokens = tokens.slice( j ) ) ),
						j < len && toSelector( tokens )
					);
				}
				matchers.push( matcher );
			}
		}

		return elementMatcher( matchers );
	}

	function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
		var bySet = setMatchers.length > 0,
			byElement = elementMatchers.length > 0,
			superMatcher = function( seed, context, xml, results, outermost ) {
				var elem, j, matcher,
					matchedCount = 0,
					i = "0",
					unmatched = seed && [],
					setMatched = [],
					contextBackup = outermostContext,

					// We must always have either seed elements or outermost context
					elems = seed || byElement && Expr.find[ "TAG" ]( "*", outermost ),

					// Use integer dirruns iff this is the outermost matcher
					dirrunsUnique = ( dirruns += contextBackup == null ? 1 : Math.random() || 0.1 ),
					len = elems.length;

				if ( outermost ) {

					// Support: IE 11+, Edge 17 - 18+
					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
					// two documents; shallow comparisons work.
					// eslint-disable-next-line eqeqeq
					outermostContext = context == document || context || outermost;
				}

				// Add elements passing elementMatchers directly to results
				// Support: IE<9, Safari
				// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
				for ( ; i !== len && ( elem = elems[ i ] ) != null; i++ ) {
					if ( byElement && elem ) {
						j = 0;

						// Support: IE 11+, Edge 17 - 18+
						// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
						// two documents; shallow comparisons work.
						// eslint-disable-next-line eqeqeq
						if ( !context && elem.ownerDocument != document ) {
							setDocument( elem );
							xml = !documentIsHTML;
						}
						while ( ( matcher = elementMatchers[ j++ ] ) ) {
							if ( matcher( elem, context || document, xml ) ) {
								results.push( elem );
								break;
							}
						}
						if ( outermost ) {
							dirruns = dirrunsUnique;
						}
					}

					// Track unmatched elements for set filters
					if ( bySet ) {

						// They will have gone through all possible matchers
						if ( ( elem = !matcher && elem ) ) {
							matchedCount--;
						}

						// Lengthen the array for every element, matched or not
						if ( seed ) {
							unmatched.push( elem );
						}
					}
				}

				// `i` is now the count of elements visited above, and adding it to `matchedCount`
				// makes the latter nonnegative.
				matchedCount += i;

				// Apply set filters to unmatched elements
				// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
				// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
				// no element matchers and no seed.
				// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
				// case, which will result in a "00" `matchedCount` that differs from `i` but is also
				// numerically zero.
				if ( bySet && i !== matchedCount ) {
					j = 0;
					while ( ( matcher = setMatchers[ j++ ] ) ) {
						matcher( unmatched, setMatched, context, xml );
					}

					if ( seed ) {

						// Reintegrate element matches to eliminate the need for sorting
						if ( matchedCount > 0 ) {
							while ( i-- ) {
								if ( !( unmatched[ i ] || setMatched[ i ] ) ) {
									setMatched[ i ] = pop.call( results );
								}
							}
						}

						// Discard index placeholder values to get only actual matches
						setMatched = condense( setMatched );
					}

					// Add matches to results
					push.apply( results, setMatched );

					// Seedless set matches succeeding multiple successful matchers stipulate sorting
					if ( outermost && !seed && setMatched.length > 0 &&
						( matchedCount + setMatchers.length ) > 1 ) {

						Sizzle.uniqueSort( results );
					}
				}

				// Override manipulation of globals by nested matchers
				if ( outermost ) {
					dirruns = dirrunsUnique;
					outermostContext = contextBackup;
				}

				return unmatched;
			};

		return bySet ?
			markFunction( superMatcher ) :
			superMatcher;
	}

	compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
		var i,
			setMatchers = [],
			elementMatchers = [],
			cached = compilerCache[ selector + " " ];

		if ( !cached ) {

			// Generate a function of recursive functions that can be used to check each element
			if ( !match ) {
				match = tokenize( selector );
			}
			i = match.length;
			while ( i-- ) {
				cached = matcherFromTokens( match[ i ] );
				if ( cached[ expando ] ) {
					setMatchers.push( cached );
				} else {
					elementMatchers.push( cached );
				}
			}

			// Cache the compiled function
			cached = compilerCache(
				selector,
				matcherFromGroupMatchers( elementMatchers, setMatchers )
			);

			// Save selector and tokenization
			cached.selector = selector;
		}
		return cached;
	};

	/**
	 * A low-level selection function that works with Sizzle's compiled
	 *  selector functions
	 * @param {String|Function} selector A selector or a pre-compiled
	 *  selector function built with Sizzle.compile
	 * @param {Element} context
	 * @param {Array} [results]
	 * @param {Array} [seed] A set of elements to match against
	 */
	select = Sizzle.select = function( selector, context, results, seed ) {
		var i, tokens, token, type, find,
			compiled = typeof selector === "function" && selector,
			match = !seed && tokenize( ( selector = compiled.selector || selector ) );

		results = results || [];

		// Try to minimize operations if there is only one selector in the list and no seed
		// (the latter of which guarantees us context)
		if ( match.length === 1 ) {

			// Reduce context if the leading compound selector is an ID
			tokens = match[ 0 ] = match[ 0 ].slice( 0 );
			if ( tokens.length > 2 && ( token = tokens[ 0 ] ).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[ 1 ].type ] ) {

				context = ( Expr.find[ "ID" ]( token.matches[ 0 ]
					.replace( runescape, funescape ), context ) || [] )[ 0 ];
				if ( !context ) {
					return results;

				// Precompiled matchers will still verify ancestry, so step up a level
				} else if ( compiled ) {
					context = context.parentNode;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr[ "needsContext" ].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[ i ];

				// Abort if we hit a combinator
				if ( Expr.relative[ ( type = token.type ) ] ) {
					break;
				}
				if ( ( find = Expr.find[ type ] ) ) {

					// Search, expanding context for leading sibling combinators
					if ( ( seed = find(
						token.matches[ 0 ].replace( runescape, funescape ),
						rsibling.test( tokens[ 0 ].type ) && testContext( context.parentNode ) ||
							context
					) ) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}

		// Compile and execute a filtering function if one is not provided
		// Provide `match` to avoid retokenization if we modified the selector above
		( compiled || compile( selector, match ) )(
			seed,
			context,
			!documentIsHTML,
			results,
			!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
		);
		return results;
	};

	// One-time assignments

	// Sort stability
	support.sortStable = expando.split( "" ).sort( sortOrder ).join( "" ) === expando;

	// Support: Chrome 14-35+
	// Always assume duplicates if they aren't passed to the comparison function
	support.detectDuplicates = !!hasDuplicate;

	// Initialize against the default document
	setDocument();

	// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert( function( el ) {

		// Should return 1, but returns 4 (following)
		return el.compareDocumentPosition( document.createElement( "fieldset" ) ) & 1;
	} );

	// Support: IE<8
	// Prevent attribute/property "interpolation"
	// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
	if ( !assert( function( el ) {
		el.innerHTML = "<a href='#'></a>";
		return el.firstChild.getAttribute( "href" ) === "#";
	} ) ) {
		addHandle( "type|href|height|width", function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
			}
		} );
	}

	// Support: IE<9
	// Use defaultValue in place of getAttribute("value")
	if ( !support.attributes || !assert( function( el ) {
		el.innerHTML = "<input/>";
		el.firstChild.setAttribute( "value", "" );
		return el.firstChild.getAttribute( "value" ) === "";
	} ) ) {
		addHandle( "value", function( elem, _name, isXML ) {
			if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
				return elem.defaultValue;
			}
		} );
	}

	// Support: IE<9
	// Use getAttributeNode to fetch booleans when getAttribute lies
	if ( !assert( function( el ) {
		return el.getAttribute( "disabled" ) == null;
	} ) ) {
		addHandle( booleans, function( elem, name, isXML ) {
			var val;
			if ( !isXML ) {
				return elem[ name ] === true ? name.toLowerCase() :
					( val = elem.getAttributeNode( name ) ) && val.specified ?
						val.value :
						null;
			}
		} );
	}

	return Sizzle;

	} )( window );



	jQuery.find = Sizzle;
	jQuery.expr = Sizzle.selectors;

	// Deprecated
	jQuery.expr[ ":" ] = jQuery.expr.pseudos;
	jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
	jQuery.text = Sizzle.getText;
	jQuery.isXMLDoc = Sizzle.isXML;
	jQuery.contains = Sizzle.contains;
	jQuery.escapeSelector = Sizzle.escape;




	var dir = function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	};


	var siblings = function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	};


	var rneedsContext = jQuery.expr.match.needsContext;



	function nodeName( elem, name ) {

		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

	}
	var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



	// Implement the identical functionality for filter and not
	function winnow( elements, qualifier, not ) {
		if ( isFunction( qualifier ) ) {
			return jQuery.grep( elements, function( elem, i ) {
				return !!qualifier.call( elem, i, elem ) !== not;
			} );
		}

		// Single element
		if ( qualifier.nodeType ) {
			return jQuery.grep( elements, function( elem ) {
				return ( elem === qualifier ) !== not;
			} );
		}

		// Arraylike of elements (jQuery, arguments, Array)
		if ( typeof qualifier !== "string" ) {
			return jQuery.grep( elements, function( elem ) {
				return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
			} );
		}

		// Filtered directly for both simple and complex selectors
		return jQuery.filter( qualifier, elements, not );
	}

	jQuery.filter = function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		if ( elems.length === 1 && elem.nodeType === 1 ) {
			return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
		}

		return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		} ) );
	};

	jQuery.fn.extend( {
		find: function( selector ) {
			var i, ret,
				len = this.length,
				self = this;

			if ( typeof selector !== "string" ) {
				return this.pushStack( jQuery( selector ).filter( function() {
					for ( i = 0; i < len; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				} ) );
			}

			ret = this.pushStack( [] );

			for ( i = 0; i < len; i++ ) {
				jQuery.find( selector, self[ i ], ret );
			}

			return len > 1 ? jQuery.uniqueSort( ret ) : ret;
		},
		filter: function( selector ) {
			return this.pushStack( winnow( this, selector || [], false ) );
		},
		not: function( selector ) {
			return this.pushStack( winnow( this, selector || [], true ) );
		},
		is: function( selector ) {
			return !!winnow(
				this,

				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				typeof selector === "string" && rneedsContext.test( selector ) ?
					jQuery( selector ) :
					selector || [],
				false
			).length;
		}
	} );


	// Initialize a jQuery object


	// A central reference to the root jQuery(document)
	var rootjQuery,

		// A simple way to check for HTML strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
		// Strict HTML recognition (#11290: must start with <)
		// Shortcut simple #id case for speed
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

		init = jQuery.fn.init = function( selector, context, root ) {
			var match, elem;

			// HANDLE: $(""), $(null), $(undefined), $(false)
			if ( !selector ) {
				return this;
			}

			// Method init() accepts an alternate rootjQuery
			// so migrate can support jQuery.sub (gh-2101)
			root = root || rootjQuery;

			// Handle HTML strings
			if ( typeof selector === "string" ) {
				if ( selector[ 0 ] === "<" &&
					selector[ selector.length - 1 ] === ">" &&
					selector.length >= 3 ) {

					// Assume that strings that start and end with <> are HTML and skip the regex check
					match = [ null, selector, null ];

				} else {
					match = rquickExpr.exec( selector );
				}

				// Match html or make sure no context is specified for #id
				if ( match && ( match[ 1 ] || !context ) ) {

					// HANDLE: $(html) -> $(array)
					if ( match[ 1 ] ) {
						context = context instanceof jQuery ? context[ 0 ] : context;

						// Option to run scripts is true for back-compat
						// Intentionally let the error be thrown if parseHTML is not present
						jQuery.merge( this, jQuery.parseHTML(
							match[ 1 ],
							context && context.nodeType ? context.ownerDocument || context : document,
							true
						) );

						// HANDLE: $(html, props)
						if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
							for ( match in context ) {

								// Properties of context are called as methods if possible
								if ( isFunction( this[ match ] ) ) {
									this[ match ]( context[ match ] );

								// ...and otherwise set as attributes
								} else {
									this.attr( match, context[ match ] );
								}
							}
						}

						return this;

					// HANDLE: $(#id)
					} else {
						elem = document.getElementById( match[ 2 ] );

						if ( elem ) {

							// Inject the element directly into the jQuery object
							this[ 0 ] = elem;
							this.length = 1;
						}
						return this;
					}

				// HANDLE: $(expr, $(...))
				} else if ( !context || context.jquery ) {
					return ( context || root ).find( selector );

				// HANDLE: $(expr, context)
				// (which is just equivalent to: $(context).find(expr)
				} else {
					return this.constructor( context ).find( selector );
				}

			// HANDLE: $(DOMElement)
			} else if ( selector.nodeType ) {
				this[ 0 ] = selector;
				this.length = 1;
				return this;

			// HANDLE: $(function)
			// Shortcut for document ready
			} else if ( isFunction( selector ) ) {
				return root.ready !== undefined ?
					root.ready( selector ) :

					// Execute immediately if ready is not present
					selector( jQuery );
			}

			return jQuery.makeArray( selector, this );
		};

	// Give the init function the jQuery prototype for later instantiation
	init.prototype = jQuery.fn;

	// Initialize central reference
	rootjQuery = jQuery( document );


	var rparentsprev = /^(?:parents|prev(?:Until|All))/,

		// Methods guaranteed to produce a unique set when starting from a unique set
		guaranteedUnique = {
			children: true,
			contents: true,
			next: true,
			prev: true
		};

	jQuery.fn.extend( {
		has: function( target ) {
			var targets = jQuery( target, this ),
				l = targets.length;

			return this.filter( function() {
				var i = 0;
				for ( ; i < l; i++ ) {
					if ( jQuery.contains( this, targets[ i ] ) ) {
						return true;
					}
				}
			} );
		},

		closest: function( selectors, context ) {
			var cur,
				i = 0,
				l = this.length,
				matched = [],
				targets = typeof selectors !== "string" && jQuery( selectors );

			// Positional selectors never match, since there's no _selection_ context
			if ( !rneedsContext.test( selectors ) ) {
				for ( ; i < l; i++ ) {
					for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

						// Always skip document fragments
						if ( cur.nodeType < 11 && ( targets ?
							targets.index( cur ) > -1 :

							// Don't pass non-elements to Sizzle
							cur.nodeType === 1 &&
								jQuery.find.matchesSelector( cur, selectors ) ) ) {

							matched.push( cur );
							break;
						}
					}
				}
			}

			return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
		},

		// Determine the position of an element within the set
		index: function( elem ) {

			// No argument, return index in parent
			if ( !elem ) {
				return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
			}

			// Index in selector
			if ( typeof elem === "string" ) {
				return indexOf.call( jQuery( elem ), this[ 0 ] );
			}

			// Locate the position of the desired element
			return indexOf.call( this,

				// If it receives a jQuery object, the first element is used
				elem.jquery ? elem[ 0 ] : elem
			);
		},

		add: function( selector, context ) {
			return this.pushStack(
				jQuery.uniqueSort(
					jQuery.merge( this.get(), jQuery( selector, context ) )
				)
			);
		},

		addBack: function( selector ) {
			return this.add( selector == null ?
				this.prevObject : this.prevObject.filter( selector )
			);
		}
	} );

	function sibling( cur, dir ) {
		while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
		return cur;
	}

	jQuery.each( {
		parent: function( elem ) {
			var parent = elem.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function( elem ) {
			return dir( elem, "parentNode" );
		},
		parentsUntil: function( elem, _i, until ) {
			return dir( elem, "parentNode", until );
		},
		next: function( elem ) {
			return sibling( elem, "nextSibling" );
		},
		prev: function( elem ) {
			return sibling( elem, "previousSibling" );
		},
		nextAll: function( elem ) {
			return dir( elem, "nextSibling" );
		},
		prevAll: function( elem ) {
			return dir( elem, "previousSibling" );
		},
		nextUntil: function( elem, _i, until ) {
			return dir( elem, "nextSibling", until );
		},
		prevUntil: function( elem, _i, until ) {
			return dir( elem, "previousSibling", until );
		},
		siblings: function( elem ) {
			return siblings( ( elem.parentNode || {} ).firstChild, elem );
		},
		children: function( elem ) {
			return siblings( elem.firstChild );
		},
		contents: function( elem ) {
			if ( elem.contentDocument != null &&

				// Support: IE 11+
				// <object> elements with no `data` attribute has an object
				// `contentDocument` with a `null` prototype.
				getProto( elem.contentDocument ) ) {

				return elem.contentDocument;
			}

			// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
			// Treat the template element as a regular one in browsers that
			// don't support it.
			if ( nodeName( elem, "template" ) ) {
				elem = elem.content || elem;
			}

			return jQuery.merge( [], elem.childNodes );
		}
	}, function( name, fn ) {
		jQuery.fn[ name ] = function( until, selector ) {
			var matched = jQuery.map( this, fn, until );

			if ( name.slice( -5 ) !== "Until" ) {
				selector = until;
			}

			if ( selector && typeof selector === "string" ) {
				matched = jQuery.filter( selector, matched );
			}

			if ( this.length > 1 ) {

				// Remove duplicates
				if ( !guaranteedUnique[ name ] ) {
					jQuery.uniqueSort( matched );
				}

				// Reverse order for parents* and prev-derivatives
				if ( rparentsprev.test( name ) ) {
					matched.reverse();
				}
			}

			return this.pushStack( matched );
		};
	} );
	var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



	// Convert String-formatted options into Object-formatted ones
	function createOptions( options ) {
		var object = {};
		jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
			object[ flag ] = true;
		} );
		return object;
	}

	/*
	 * Create a callback list using the following parameters:
	 *
	 *	options: an optional list of space-separated options that will change how
	 *			the callback list behaves or a more traditional option object
	 *
	 * By default a callback list will act like an event callback list and can be
	 * "fired" multiple times.
	 *
	 * Possible options:
	 *
	 *	once:			will ensure the callback list can only be fired once (like a Deferred)
	 *
	 *	memory:			will keep track of previous values and will call any callback added
	 *					after the list has been fired right away with the latest "memorized"
	 *					values (like a Deferred)
	 *
	 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
	 *
	 *	stopOnFalse:	interrupt callings when a callback returns false
	 *
	 */
	jQuery.Callbacks = function( options ) {

		// Convert options from String-formatted to Object-formatted if needed
		// (we check in cache first)
		options = typeof options === "string" ?
			createOptions( options ) :
			jQuery.extend( {}, options );

		var // Flag to know if list is currently firing
			firing,

			// Last fire value for non-forgettable lists
			memory,

			// Flag to know if list was already fired
			fired,

			// Flag to prevent firing
			locked,

			// Actual callback list
			list = [],

			// Queue of execution data for repeatable lists
			queue = [],

			// Index of currently firing callback (modified by add/remove as needed)
			firingIndex = -1,

			// Fire callbacks
			fire = function() {

				// Enforce single-firing
				locked = locked || options.once;

				// Execute callbacks for all pending executions,
				// respecting firingIndex overrides and runtime changes
				fired = firing = true;
				for ( ; queue.length; firingIndex = -1 ) {
					memory = queue.shift();
					while ( ++firingIndex < list.length ) {

						// Run callback and check for early termination
						if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
							options.stopOnFalse ) {

							// Jump to end and forget the data so .add doesn't re-fire
							firingIndex = list.length;
							memory = false;
						}
					}
				}

				// Forget the data if we're done with it
				if ( !options.memory ) {
					memory = false;
				}

				firing = false;

				// Clean up if we're done firing for good
				if ( locked ) {

					// Keep an empty list if we have data for future add calls
					if ( memory ) {
						list = [];

					// Otherwise, this object is spent
					} else {
						list = "";
					}
				}
			},

			// Actual Callbacks object
			self = {

				// Add a callback or a collection of callbacks to the list
				add: function() {
					if ( list ) {

						// If we have memory from a past run, we should fire after adding
						if ( memory && !firing ) {
							firingIndex = list.length - 1;
							queue.push( memory );
						}

						( function add( args ) {
							jQuery.each( args, function( _, arg ) {
								if ( isFunction( arg ) ) {
									if ( !options.unique || !self.has( arg ) ) {
										list.push( arg );
									}
								} else if ( arg && arg.length && toType( arg ) !== "string" ) {

									// Inspect recursively
									add( arg );
								}
							} );
						} )( arguments );

						if ( memory && !firing ) {
							fire();
						}
					}
					return this;
				},

				// Remove a callback from the list
				remove: function() {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );

							// Handle firing indexes
							if ( index <= firingIndex ) {
								firingIndex--;
							}
						}
					} );
					return this;
				},

				// Check if a given callback is in the list.
				// If no argument is given, return whether or not list has callbacks attached.
				has: function( fn ) {
					return fn ?
						jQuery.inArray( fn, list ) > -1 :
						list.length > 0;
				},

				// Remove all callbacks from the list
				empty: function() {
					if ( list ) {
						list = [];
					}
					return this;
				},

				// Disable .fire and .add
				// Abort any current/pending executions
				// Clear all callbacks and values
				disable: function() {
					locked = queue = [];
					list = memory = "";
					return this;
				},
				disabled: function() {
					return !list;
				},

				// Disable .fire
				// Also disable .add unless we have memory (since it would have no effect)
				// Abort any pending executions
				lock: function() {
					locked = queue = [];
					if ( !memory && !firing ) {
						list = memory = "";
					}
					return this;
				},
				locked: function() {
					return !!locked;
				},

				// Call all callbacks with the given context and arguments
				fireWith: function( context, args ) {
					if ( !locked ) {
						args = args || [];
						args = [ context, args.slice ? args.slice() : args ];
						queue.push( args );
						if ( !firing ) {
							fire();
						}
					}
					return this;
				},

				// Call all the callbacks with the given arguments
				fire: function() {
					self.fireWith( this, arguments );
					return this;
				},

				// To know if the callbacks have already been called at least once
				fired: function() {
					return !!fired;
				}
			};

		return self;
	};


	function Identity( v ) {
		return v;
	}
	function Thrower( ex ) {
		throw ex;
	}

	function adoptValue( value, resolve, reject, noValue ) {
		var method;

		try {

			// Check for promise aspect first to privilege synchronous behavior
			if ( value && isFunction( ( method = value.promise ) ) ) {
				method.call( value ).done( resolve ).fail( reject );

			// Other thenables
			} else if ( value && isFunction( ( method = value.then ) ) ) {
				method.call( value, resolve, reject );

			// Other non-thenables
			} else {

				// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
				// * false: [ value ].slice( 0 ) => resolve( value )
				// * true: [ value ].slice( 1 ) => resolve()
				resolve.apply( undefined, [ value ].slice( noValue ) );
			}

		// For Promises/A+, convert exceptions into rejections
		// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
		// Deferred#then to conditionally suppress rejection.
		} catch ( value ) {

			// Support: Android 4.0 only
			// Strict mode functions invoked without .call/.apply get global-object context
			reject.apply( undefined, [ value ] );
		}
	}

	jQuery.extend( {

		Deferred: function( func ) {
			var tuples = [

					// action, add listener, callbacks,
					// ... .then handlers, argument index, [final state]
					[ "notify", "progress", jQuery.Callbacks( "memory" ),
						jQuery.Callbacks( "memory" ), 2 ],
					[ "resolve", "done", jQuery.Callbacks( "once memory" ),
						jQuery.Callbacks( "once memory" ), 0, "resolved" ],
					[ "reject", "fail", jQuery.Callbacks( "once memory" ),
						jQuery.Callbacks( "once memory" ), 1, "rejected" ]
				],
				state = "pending",
				promise = {
					state: function() {
						return state;
					},
					always: function() {
						deferred.done( arguments ).fail( arguments );
						return this;
					},
					"catch": function( fn ) {
						return promise.then( null, fn );
					},

					// Keep pipe for back-compat
					pipe: function( /* fnDone, fnFail, fnProgress */ ) {
						var fns = arguments;

						return jQuery.Deferred( function( newDefer ) {
							jQuery.each( tuples, function( _i, tuple ) {

								// Map tuples (progress, done, fail) to arguments (done, fail, progress)
								var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

								// deferred.progress(function() { bind to newDefer or newDefer.notify })
								// deferred.done(function() { bind to newDefer or newDefer.resolve })
								// deferred.fail(function() { bind to newDefer or newDefer.reject })
								deferred[ tuple[ 1 ] ]( function() {
									var returned = fn && fn.apply( this, arguments );
									if ( returned && isFunction( returned.promise ) ) {
										returned.promise()
											.progress( newDefer.notify )
											.done( newDefer.resolve )
											.fail( newDefer.reject );
									} else {
										newDefer[ tuple[ 0 ] + "With" ](
											this,
											fn ? [ returned ] : arguments
										);
									}
								} );
							} );
							fns = null;
						} ).promise();
					},
					then: function( onFulfilled, onRejected, onProgress ) {
						var maxDepth = 0;
						function resolve( depth, deferred, handler, special ) {
							return function() {
								var that = this,
									args = arguments,
									mightThrow = function() {
										var returned, then;

										// Support: Promises/A+ section 2.3.3.3.3
										// https://promisesaplus.com/#point-59
										// Ignore double-resolution attempts
										if ( depth < maxDepth ) {
											return;
										}

										returned = handler.apply( that, args );

										// Support: Promises/A+ section 2.3.1
										// https://promisesaplus.com/#point-48
										if ( returned === deferred.promise() ) {
											throw new TypeError( "Thenable self-resolution" );
										}

										// Support: Promises/A+ sections 2.3.3.1, 3.5
										// https://promisesaplus.com/#point-54
										// https://promisesaplus.com/#point-75
										// Retrieve `then` only once
										then = returned &&

											// Support: Promises/A+ section 2.3.4
											// https://promisesaplus.com/#point-64
											// Only check objects and functions for thenability
											( typeof returned === "object" ||
												typeof returned === "function" ) &&
											returned.then;

										// Handle a returned thenable
										if ( isFunction( then ) ) {

											// Special processors (notify) just wait for resolution
											if ( special ) {
												then.call(
													returned,
													resolve( maxDepth, deferred, Identity, special ),
													resolve( maxDepth, deferred, Thrower, special )
												);

											// Normal processors (resolve) also hook into progress
											} else {

												// ...and disregard older resolution values
												maxDepth++;

												then.call(
													returned,
													resolve( maxDepth, deferred, Identity, special ),
													resolve( maxDepth, deferred, Thrower, special ),
													resolve( maxDepth, deferred, Identity,
														deferred.notifyWith )
												);
											}

										// Handle all other returned values
										} else {

											// Only substitute handlers pass on context
											// and multiple values (non-spec behavior)
											if ( handler !== Identity ) {
												that = undefined;
												args = [ returned ];
											}

											// Process the value(s)
											// Default process is resolve
											( special || deferred.resolveWith )( that, args );
										}
									},

									// Only normal processors (resolve) catch and reject exceptions
									process = special ?
										mightThrow :
										function() {
											try {
												mightThrow();
											} catch ( e ) {

												if ( jQuery.Deferred.exceptionHook ) {
													jQuery.Deferred.exceptionHook( e,
														process.stackTrace );
												}

												// Support: Promises/A+ section 2.3.3.3.4.1
												// https://promisesaplus.com/#point-61
												// Ignore post-resolution exceptions
												if ( depth + 1 >= maxDepth ) {

													// Only substitute handlers pass on context
													// and multiple values (non-spec behavior)
													if ( handler !== Thrower ) {
														that = undefined;
														args = [ e ];
													}

													deferred.rejectWith( that, args );
												}
											}
										};

								// Support: Promises/A+ section 2.3.3.3.1
								// https://promisesaplus.com/#point-57
								// Re-resolve promises immediately to dodge false rejection from
								// subsequent errors
								if ( depth ) {
									process();
								} else {

									// Call an optional hook to record the stack, in case of exception
									// since it's otherwise lost when execution goes async
									if ( jQuery.Deferred.getStackHook ) {
										process.stackTrace = jQuery.Deferred.getStackHook();
									}
									window.setTimeout( process );
								}
							};
						}

						return jQuery.Deferred( function( newDefer ) {

							// progress_handlers.add( ... )
							tuples[ 0 ][ 3 ].add(
								resolve(
									0,
									newDefer,
									isFunction( onProgress ) ?
										onProgress :
										Identity,
									newDefer.notifyWith
								)
							);

							// fulfilled_handlers.add( ... )
							tuples[ 1 ][ 3 ].add(
								resolve(
									0,
									newDefer,
									isFunction( onFulfilled ) ?
										onFulfilled :
										Identity
								)
							);

							// rejected_handlers.add( ... )
							tuples[ 2 ][ 3 ].add(
								resolve(
									0,
									newDefer,
									isFunction( onRejected ) ?
										onRejected :
										Thrower
								)
							);
						} ).promise();
					},

					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
						return obj != null ? jQuery.extend( obj, promise ) : promise;
					}
				},
				deferred = {};

			// Add list-specific methods
			jQuery.each( tuples, function( i, tuple ) {
				var list = tuple[ 2 ],
					stateString = tuple[ 5 ];

				// promise.progress = list.add
				// promise.done = list.add
				// promise.fail = list.add
				promise[ tuple[ 1 ] ] = list.add;

				// Handle state
				if ( stateString ) {
					list.add(
						function() {

							// state = "resolved" (i.e., fulfilled)
							// state = "rejected"
							state = stateString;
						},

						// rejected_callbacks.disable
						// fulfilled_callbacks.disable
						tuples[ 3 - i ][ 2 ].disable,

						// rejected_handlers.disable
						// fulfilled_handlers.disable
						tuples[ 3 - i ][ 3 ].disable,

						// progress_callbacks.lock
						tuples[ 0 ][ 2 ].lock,

						// progress_handlers.lock
						tuples[ 0 ][ 3 ].lock
					);
				}

				// progress_handlers.fire
				// fulfilled_handlers.fire
				// rejected_handlers.fire
				list.add( tuple[ 3 ].fire );

				// deferred.notify = function() { deferred.notifyWith(...) }
				// deferred.resolve = function() { deferred.resolveWith(...) }
				// deferred.reject = function() { deferred.rejectWith(...) }
				deferred[ tuple[ 0 ] ] = function() {
					deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
					return this;
				};

				// deferred.notifyWith = list.fireWith
				// deferred.resolveWith = list.fireWith
				// deferred.rejectWith = list.fireWith
				deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
			} );

			// Make the deferred a promise
			promise.promise( deferred );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
		},

		// Deferred helper
		when: function( singleValue ) {
			var

				// count of uncompleted subordinates
				remaining = arguments.length,

				// count of unprocessed arguments
				i = remaining,

				// subordinate fulfillment data
				resolveContexts = Array( i ),
				resolveValues = slice.call( arguments ),

				// the primary Deferred
				primary = jQuery.Deferred(),

				// subordinate callback factory
				updateFunc = function( i ) {
					return function( value ) {
						resolveContexts[ i ] = this;
						resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
						if ( !( --remaining ) ) {
							primary.resolveWith( resolveContexts, resolveValues );
						}
					};
				};

			// Single- and empty arguments are adopted like Promise.resolve
			if ( remaining <= 1 ) {
				adoptValue( singleValue, primary.done( updateFunc( i ) ).resolve, primary.reject,
					!remaining );

				// Use .then() to unwrap secondary thenables (cf. gh-3000)
				if ( primary.state() === "pending" ||
					isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

					return primary.then();
				}
			}

			// Multiple arguments are aggregated like Promise.all array elements
			while ( i-- ) {
				adoptValue( resolveValues[ i ], updateFunc( i ), primary.reject );
			}

			return primary.promise();
		}
	} );


	// These usually indicate a programmer mistake during development,
	// warn about them ASAP rather than swallowing them by default.
	var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

	jQuery.Deferred.exceptionHook = function( error, stack ) {

		// Support: IE 8 - 9 only
		// Console exists when dev tools are open, which can happen at any time
		if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
			window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
		}
	};




	jQuery.readyException = function( error ) {
		window.setTimeout( function() {
			throw error;
		} );
	};




	// The deferred used on DOM ready
	var readyList = jQuery.Deferred();

	jQuery.fn.ready = function( fn ) {

		readyList
			.then( fn )

			// Wrap jQuery.readyException in a function so that the lookup
			// happens at the time of error handling instead of callback
			// registration.
			.catch( function( error ) {
				jQuery.readyException( error );
			} );

		return this;
	};

	jQuery.extend( {

		// Is the DOM ready to be used? Set to true once it occurs.
		isReady: false,

		// A counter to track how many items to wait for before
		// the ready event fires. See #6781
		readyWait: 1,

		// Handle when the DOM is ready
		ready: function( wait ) {

			// Abort if there are pending holds or we're already ready
			if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
				return;
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If a normal DOM Ready event fired, decrement, and wait if need be
			if ( wait !== true && --jQuery.readyWait > 0 ) {
				return;
			}

			// If there are functions bound, to execute
			readyList.resolveWith( document, [ jQuery ] );
		}
	} );

	jQuery.ready.then = readyList.then;

	// The ready event handler and self cleanup method
	function completed() {
		document.removeEventListener( "DOMContentLoaded", completed );
		window.removeEventListener( "load", completed );
		jQuery.ready();
	}

	// Catch cases where $(document).ready() is called
	// after the browser event has already occurred.
	// Support: IE <=9 - 10 only
	// Older IE sometimes signals "interactive" too soon
	if ( document.readyState === "complete" ||
		( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

		// Handle it asynchronously to allow scripts the opportunity to delay ready
		window.setTimeout( jQuery.ready );

	} else {

		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", completed );

		// A fallback to window.onload, that will always work
		window.addEventListener( "load", completed );
	}




	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			len = elems.length,
			bulk = key == null;

		// Sets many values
		if ( toType( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				access( elems, fn, i, key[ i ], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {

				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, _key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < len; i++ ) {
					fn(
						elems[ i ], key, raw ?
							value :
							value.call( elems[ i ], i, fn( elems[ i ], key ) )
					);
				}
			}
		}

		if ( chainable ) {
			return elems;
		}

		// Gets
		if ( bulk ) {
			return fn.call( elems );
		}

		return len ? fn( elems[ 0 ], key ) : emptyGet;
	};


	// Matches dashed string for camelizing
	var rmsPrefix = /^-ms-/,
		rdashAlpha = /-([a-z])/g;

	// Used by camelCase as callback to replace()
	function fcamelCase( _all, letter ) {
		return letter.toUpperCase();
	}

	// Convert dashed to camelCase; used by the css and data modules
	// Support: IE <=9 - 11, Edge 12 - 15
	// Microsoft forgot to hump their vendor prefix (#9572)
	function camelCase( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	}
	var acceptData = function( owner ) {

		// Accepts only:
		//  - Node
		//    - Node.ELEMENT_NODE
		//    - Node.DOCUMENT_NODE
		//  - Object
		//    - Any
		return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
	};




	function Data() {
		this.expando = jQuery.expando + Data.uid++;
	}

	Data.uid = 1;

	Data.prototype = {

		cache: function( owner ) {

			// Check if the owner object already has a cache
			var value = owner[ this.expando ];

			// If not, create one
			if ( !value ) {
				value = {};

				// We can accept data for non-element nodes in modern browsers,
				// but we should not, see #8335.
				// Always return an empty object.
				if ( acceptData( owner ) ) {

					// If it is a node unlikely to be stringify-ed or looped over
					// use plain assignment
					if ( owner.nodeType ) {
						owner[ this.expando ] = value;

					// Otherwise secure it in a non-enumerable property
					// configurable must be true to allow the property to be
					// deleted when data is removed
					} else {
						Object.defineProperty( owner, this.expando, {
							value: value,
							configurable: true
						} );
					}
				}
			}

			return value;
		},
		set: function( owner, data, value ) {
			var prop,
				cache = this.cache( owner );

			// Handle: [ owner, key, value ] args
			// Always use camelCase key (gh-2257)
			if ( typeof data === "string" ) {
				cache[ camelCase( data ) ] = value;

			// Handle: [ owner, { properties } ] args
			} else {

				// Copy the properties one-by-one to the cache object
				for ( prop in data ) {
					cache[ camelCase( prop ) ] = data[ prop ];
				}
			}
			return cache;
		},
		get: function( owner, key ) {
			return key === undefined ?
				this.cache( owner ) :

				// Always use camelCase key (gh-2257)
				owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
		},
		access: function( owner, key, value ) {

			// In cases where either:
			//
			//   1. No key was specified
			//   2. A string key was specified, but no value provided
			//
			// Take the "read" path and allow the get method to determine
			// which value to return, respectively either:
			//
			//   1. The entire cache object
			//   2. The data stored at the key
			//
			if ( key === undefined ||
					( ( key && typeof key === "string" ) && value === undefined ) ) {

				return this.get( owner, key );
			}

			// When the key is not a string, or both a key and value
			// are specified, set or extend (existing objects) with either:
			//
			//   1. An object of properties
			//   2. A key and value
			//
			this.set( owner, key, value );

			// Since the "set" path can have two possible entry points
			// return the expected data based on which path was taken[*]
			return value !== undefined ? value : key;
		},
		remove: function( owner, key ) {
			var i,
				cache = owner[ this.expando ];

			if ( cache === undefined ) {
				return;
			}

			if ( key !== undefined ) {

				// Support array or space separated string of keys
				if ( Array.isArray( key ) ) {

					// If key is an array of keys...
					// We always set camelCase keys, so remove that.
					key = key.map( camelCase );
				} else {
					key = camelCase( key );

					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					key = key in cache ?
						[ key ] :
						( key.match( rnothtmlwhite ) || [] );
				}

				i = key.length;

				while ( i-- ) {
					delete cache[ key[ i ] ];
				}
			}

			// Remove the expando if there's no more data
			if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

				// Support: Chrome <=35 - 45
				// Webkit & Blink performance suffers when deleting properties
				// from DOM nodes, so set to undefined instead
				// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
				if ( owner.nodeType ) {
					owner[ this.expando ] = undefined;
				} else {
					delete owner[ this.expando ];
				}
			}
		},
		hasData: function( owner ) {
			var cache = owner[ this.expando ];
			return cache !== undefined && !jQuery.isEmptyObject( cache );
		}
	};
	var dataPriv = new Data();

	var dataUser = new Data();



	//	Implementation Summary
	//
	//	1. Enforce API surface and semantic compatibility with 1.9.x branch
	//	2. Improve the module's maintainability by reducing the storage
	//		paths to a single mechanism.
	//	3. Use the same single mechanism to support "private" and "user" data.
	//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	//	5. Avoid exposing implementation details on user objects (eg. expando properties)
	//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

	var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
		rmultiDash = /[A-Z]/g;

	function getData( data ) {
		if ( data === "true" ) {
			return true;
		}

		if ( data === "false" ) {
			return false;
		}

		if ( data === "null" ) {
			return null;
		}

		// Only convert to a number if it doesn't change the string
		if ( data === +data + "" ) {
			return +data;
		}

		if ( rbrace.test( data ) ) {
			return JSON.parse( data );
		}

		return data;
	}

	function dataAttr( elem, key, data ) {
		var name;

		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {
			name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
			data = elem.getAttribute( name );

			if ( typeof data === "string" ) {
				try {
					data = getData( data );
				} catch ( e ) {}

				// Make sure we set the data so it isn't changed later
				dataUser.set( elem, key, data );
			} else {
				data = undefined;
			}
		}
		return data;
	}

	jQuery.extend( {
		hasData: function( elem ) {
			return dataUser.hasData( elem ) || dataPriv.hasData( elem );
		},

		data: function( elem, name, data ) {
			return dataUser.access( elem, name, data );
		},

		removeData: function( elem, name ) {
			dataUser.remove( elem, name );
		},

		// TODO: Now that all calls to _data and _removeData have been replaced
		// with direct calls to dataPriv methods, these can be deprecated.
		_data: function( elem, name, data ) {
			return dataPriv.access( elem, name, data );
		},

		_removeData: function( elem, name ) {
			dataPriv.remove( elem, name );
		}
	} );

	jQuery.fn.extend( {
		data: function( key, value ) {
			var i, name, data,
				elem = this[ 0 ],
				attrs = elem && elem.attributes;

			// Gets all values
			if ( key === undefined ) {
				if ( this.length ) {
					data = dataUser.get( elem );

					if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
						i = attrs.length;
						while ( i-- ) {

							// Support: IE 11 only
							// The attrs elements can be null (#14894)
							if ( attrs[ i ] ) {
								name = attrs[ i ].name;
								if ( name.indexOf( "data-" ) === 0 ) {
									name = camelCase( name.slice( 5 ) );
									dataAttr( elem, name, data[ name ] );
								}
							}
						}
						dataPriv.set( elem, "hasDataAttrs", true );
					}
				}

				return data;
			}

			// Sets multiple values
			if ( typeof key === "object" ) {
				return this.each( function() {
					dataUser.set( this, key );
				} );
			}

			return access( this, function( value ) {
				var data;

				// The calling jQuery object (element matches) is not empty
				// (and therefore has an element appears at this[ 0 ]) and the
				// `value` parameter was not undefined. An empty jQuery object
				// will result in `undefined` for elem = this[ 0 ] which will
				// throw an exception if an attempt to read a data cache is made.
				if ( elem && value === undefined ) {

					// Attempt to get data from the cache
					// The key will always be camelCased in Data
					data = dataUser.get( elem, key );
					if ( data !== undefined ) {
						return data;
					}

					// Attempt to "discover" the data in
					// HTML5 custom data-* attrs
					data = dataAttr( elem, key );
					if ( data !== undefined ) {
						return data;
					}

					// We tried really hard, but the data doesn't exist.
					return;
				}

				// Set the data...
				this.each( function() {

					// We always store the camelCased key
					dataUser.set( this, key, value );
				} );
			}, null, value, arguments.length > 1, null, true );
		},

		removeData: function( key ) {
			return this.each( function() {
				dataUser.remove( this, key );
			} );
		}
	} );


	jQuery.extend( {
		queue: function( elem, type, data ) {
			var queue;

			if ( elem ) {
				type = ( type || "fx" ) + "queue";
				queue = dataPriv.get( elem, type );

				// Speed up dequeue by getting out quickly if this is just a lookup
				if ( data ) {
					if ( !queue || Array.isArray( data ) ) {
						queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
					} else {
						queue.push( data );
					}
				}
				return queue || [];
			}
		},

		dequeue: function( elem, type ) {
			type = type || "fx";

			var queue = jQuery.queue( elem, type ),
				startLength = queue.length,
				fn = queue.shift(),
				hooks = jQuery._queueHooks( elem, type ),
				next = function() {
					jQuery.dequeue( elem, type );
				};

			// If the fx queue is dequeued, always remove the progress sentinel
			if ( fn === "inprogress" ) {
				fn = queue.shift();
				startLength--;
			}

			if ( fn ) {

				// Add a progress sentinel to prevent the fx queue from being
				// automatically dequeued
				if ( type === "fx" ) {
					queue.unshift( "inprogress" );
				}

				// Clear up the last queue stop function
				delete hooks.stop;
				fn.call( elem, next, hooks );
			}

			if ( !startLength && hooks ) {
				hooks.empty.fire();
			}
		},

		// Not public - generate a queueHooks object, or return the current one
		_queueHooks: function( elem, type ) {
			var key = type + "queueHooks";
			return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
				empty: jQuery.Callbacks( "once memory" ).add( function() {
					dataPriv.remove( elem, [ type + "queue", key ] );
				} )
			} );
		}
	} );

	jQuery.fn.extend( {
		queue: function( type, data ) {
			var setter = 2;

			if ( typeof type !== "string" ) {
				data = type;
				type = "fx";
				setter--;
			}

			if ( arguments.length < setter ) {
				return jQuery.queue( this[ 0 ], type );
			}

			return data === undefined ?
				this :
				this.each( function() {
					var queue = jQuery.queue( this, type, data );

					// Ensure a hooks for this queue
					jQuery._queueHooks( this, type );

					if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
						jQuery.dequeue( this, type );
					}
				} );
		},
		dequeue: function( type ) {
			return this.each( function() {
				jQuery.dequeue( this, type );
			} );
		},
		clearQueue: function( type ) {
			return this.queue( type || "fx", [] );
		},

		// Get a promise resolved when queues of a certain type
		// are emptied (fx is the type by default)
		promise: function( type, obj ) {
			var tmp,
				count = 1,
				defer = jQuery.Deferred(),
				elements = this,
				i = this.length,
				resolve = function() {
					if ( !( --count ) ) {
						defer.resolveWith( elements, [ elements ] );
					}
				};

			if ( typeof type !== "string" ) {
				obj = type;
				type = undefined;
			}
			type = type || "fx";

			while ( i-- ) {
				tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
				if ( tmp && tmp.empty ) {
					count++;
					tmp.empty.add( resolve );
				}
			}
			resolve();
			return defer.promise( obj );
		}
	} );
	var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

	var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


	var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

	var documentElement = document.documentElement;



		var isAttached = function( elem ) {
				return jQuery.contains( elem.ownerDocument, elem );
			},
			composed = { composed: true };

		// Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
		// Check attachment across shadow DOM boundaries when possible (gh-3504)
		// Support: iOS 10.0-10.2 only
		// Early iOS 10 versions support `attachShadow` but not `getRootNode`,
		// leading to errors. We need to check for `getRootNode`.
		if ( documentElement.getRootNode ) {
			isAttached = function( elem ) {
				return jQuery.contains( elem.ownerDocument, elem ) ||
					elem.getRootNode( composed ) === elem.ownerDocument;
			};
		}
	var isHiddenWithinTree = function( elem, el ) {

			// isHiddenWithinTree might be called from jQuery#filter function;
			// in that case, element will be second argument
			elem = el || elem;

			// Inline style trumps all
			return elem.style.display === "none" ||
				elem.style.display === "" &&

				// Otherwise, check computed style
				// Support: Firefox <=43 - 45
				// Disconnected elements can have computed display: none, so first confirm that elem is
				// in the document.
				isAttached( elem ) &&

				jQuery.css( elem, "display" ) === "none";
		};



	function adjustCSS( elem, prop, valueParts, tween ) {
		var adjusted, scale,
			maxIterations = 20,
			currentValue = tween ?
				function() {
					return tween.cur();
				} :
				function() {
					return jQuery.css( elem, prop, "" );
				},
			initial = currentValue(),
			unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

			// Starting value computation is required for potential unit mismatches
			initialInUnit = elem.nodeType &&
				( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
				rcssNum.exec( jQuery.css( elem, prop ) );

		if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

			// Support: Firefox <=54
			// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
			initial = initial / 2;

			// Trust units reported by jQuery.css
			unit = unit || initialInUnit[ 3 ];

			// Iteratively approximate from a nonzero starting point
			initialInUnit = +initial || 1;

			while ( maxIterations-- ) {

				// Evaluate and update our best guess (doubling guesses that zero out).
				// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
				jQuery.style( elem, prop, initialInUnit + unit );
				if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
					maxIterations = 0;
				}
				initialInUnit = initialInUnit / scale;

			}

			initialInUnit = initialInUnit * 2;
			jQuery.style( elem, prop, initialInUnit + unit );

			// Make sure we update the tween properties later on
			valueParts = valueParts || [];
		}

		if ( valueParts ) {
			initialInUnit = +initialInUnit || +initial || 0;

			// Apply relative offset (+=/-=) if specified
			adjusted = valueParts[ 1 ] ?
				initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
				+valueParts[ 2 ];
			if ( tween ) {
				tween.unit = unit;
				tween.start = initialInUnit;
				tween.end = adjusted;
			}
		}
		return adjusted;
	}


	var defaultDisplayMap = {};

	function getDefaultDisplay( elem ) {
		var temp,
			doc = elem.ownerDocument,
			nodeName = elem.nodeName,
			display = defaultDisplayMap[ nodeName ];

		if ( display ) {
			return display;
		}

		temp = doc.body.appendChild( doc.createElement( nodeName ) );
		display = jQuery.css( temp, "display" );

		temp.parentNode.removeChild( temp );

		if ( display === "none" ) {
			display = "block";
		}
		defaultDisplayMap[ nodeName ] = display;

		return display;
	}

	function showHide( elements, show ) {
		var display, elem,
			values = [],
			index = 0,
			length = elements.length;

		// Determine new display value for elements that need to change
		for ( ; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}

			display = elem.style.display;
			if ( show ) {

				// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
				// check is required in this first loop unless we have a nonempty display value (either
				// inline or about-to-be-restored)
				if ( display === "none" ) {
					values[ index ] = dataPriv.get( elem, "display" ) || null;
					if ( !values[ index ] ) {
						elem.style.display = "";
					}
				}
				if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
					values[ index ] = getDefaultDisplay( elem );
				}
			} else {
				if ( display !== "none" ) {
					values[ index ] = "none";

					// Remember what we're overwriting
					dataPriv.set( elem, "display", display );
				}
			}
		}

		// Set the display of the elements in a second loop to avoid constant reflow
		for ( index = 0; index < length; index++ ) {
			if ( values[ index ] != null ) {
				elements[ index ].style.display = values[ index ];
			}
		}

		return elements;
	}

	jQuery.fn.extend( {
		show: function() {
			return showHide( this, true );
		},
		hide: function() {
			return showHide( this );
		},
		toggle: function( state ) {
			if ( typeof state === "boolean" ) {
				return state ? this.show() : this.hide();
			}

			return this.each( function() {
				if ( isHiddenWithinTree( this ) ) {
					jQuery( this ).show();
				} else {
					jQuery( this ).hide();
				}
			} );
		}
	} );
	var rcheckableType = ( /^(?:checkbox|radio)$/i );

	var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

	var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



	( function() {
		var fragment = document.createDocumentFragment(),
			div = fragment.appendChild( document.createElement( "div" ) ),
			input = document.createElement( "input" );

		// Support: Android 4.0 - 4.3 only
		// Check state lost if the name is set (#11217)
		// Support: Windows Web Apps (WWA)
		// `name` and `type` must use .setAttribute for WWA (#14901)
		input.setAttribute( "type", "radio" );
		input.setAttribute( "checked", "checked" );
		input.setAttribute( "name", "t" );

		div.appendChild( input );

		// Support: Android <=4.1 only
		// Older WebKit doesn't clone checked state correctly in fragments
		support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

		// Support: IE <=11 only
		// Make sure textarea (and checkbox) defaultValue is properly cloned
		div.innerHTML = "<textarea>x</textarea>";
		support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

		// Support: IE <=9 only
		// IE <=9 replaces <option> tags with their contents when inserted outside of
		// the select element.
		div.innerHTML = "<option></option>";
		support.option = !!div.lastChild;
	} )();


	// We have to close these tags to support XHTML (#13200)
	var wrapMap = {

		// XHTML parsers do not magically insert elements in the
		// same way that tag soup parsers do. So we cannot shorten
		// this by omitting <tbody> or other required elements.
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;

	// Support: IE <=9 only
	if ( !support.option ) {
		wrapMap.optgroup = wrapMap.option = [ 1, "<select multiple='multiple'>", "</select>" ];
	}


	function getAll( context, tag ) {

		// Support: IE <=9 - 11 only
		// Use typeof to avoid zero-argument method invocation on host objects (#15151)
		var ret;

		if ( typeof context.getElementsByTagName !== "undefined" ) {
			ret = context.getElementsByTagName( tag || "*" );

		} else if ( typeof context.querySelectorAll !== "undefined" ) {
			ret = context.querySelectorAll( tag || "*" );

		} else {
			ret = [];
		}

		if ( tag === undefined || tag && nodeName( context, tag ) ) {
			return jQuery.merge( [ context ], ret );
		}

		return ret;
	}


	// Mark scripts as having already been evaluated
	function setGlobalEval( elems, refElements ) {
		var i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			dataPriv.set(
				elems[ i ],
				"globalEval",
				!refElements || dataPriv.get( refElements[ i ], "globalEval" )
			);
		}
	}


	var rhtml = /<|&#?\w+;/;

	function buildFragment( elems, context, scripts, selection, ignored ) {
		var elem, tmp, tag, wrap, attached, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( toType( elem ) === "object" ) {

					// Support: Android <=4.0 only, PhantomJS 1 only
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: Android <=4.0 only, PhantomJS 1 only
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( ( elem = nodes[ i++ ] ) ) {

			// Skip elements already in the context collection (trac-4087)
			if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
				if ( ignored ) {
					ignored.push( elem );
				}
				continue;
			}

			attached = isAttached( elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( attached ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( ( elem = tmp[ j++ ] ) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	}


	var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

	function returnTrue() {
		return true;
	}

	function returnFalse() {
		return false;
	}

	// Support: IE <=9 - 11+
	// focus() and blur() are asynchronous, except when they are no-op.
	// So expect focus to be synchronous when the element is already active,
	// and blur to be synchronous when the element is not already active.
	// (focus and blur are always synchronous in other supported browsers,
	// this just defines when we can count on it).
	function expectSync( elem, type ) {
		return ( elem === safeActiveElement() ) === ( type === "focus" );
	}

	// Support: IE <=9 only
	// Accessing document.activeElement can throw unexpectedly
	// https://bugs.jquery.com/ticket/13393
	function safeActiveElement() {
		try {
			return document.activeElement;
		} catch ( err ) { }
	}

	function on( elem, types, selector, data, fn, one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {

			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {

				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				on( elem, type, selector, data, types[ type ], one );
			}
			return elem;
		}

		if ( data == null && fn == null ) {

			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {

				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {

				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return elem;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {

				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};

			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return elem.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		} );
	}

	/*
	 * Helper functions for managing events -- not part of the public interface.
	 * Props to Dean Edwards' addEvent library for many of the ideas.
	 */
	jQuery.event = {

		global: {},

		add: function( elem, types, handler, data, selector ) {

			var handleObjIn, eventHandle, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.get( elem );

			// Only attach events to objects that accept data
			if ( !acceptData( elem ) ) {
				return;
			}

			// Caller can pass in an object of custom data in lieu of the handler
			if ( handler.handler ) {
				handleObjIn = handler;
				handler = handleObjIn.handler;
				selector = handleObjIn.selector;
			}

			// Ensure that invalid selectors throw exceptions at attach time
			// Evaluate against documentElement in case elem is a non-element node (e.g., document)
			if ( selector ) {
				jQuery.find.matchesSelector( documentElement, selector );
			}

			// Make sure that the handler has a unique ID, used to find/remove it later
			if ( !handler.guid ) {
				handler.guid = jQuery.guid++;
			}

			// Init the element's event structure and main handler, if this is the first
			if ( !( events = elemData.events ) ) {
				events = elemData.events = Object.create( null );
			}
			if ( !( eventHandle = elemData.handle ) ) {
				eventHandle = elemData.handle = function( e ) {

					// Discard the second event of a jQuery.event.trigger() and
					// when an event is called after a page has unloaded
					return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
						jQuery.event.dispatch.apply( elem, arguments ) : undefined;
				};
			}

			// Handle multiple events separated by a space
			types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// There *must* be a type, no attaching namespace-only handlers
				if ( !type ) {
					continue;
				}

				// If event changes its type, use the special event handlers for the changed type
				special = jQuery.event.special[ type ] || {};

				// If selector defined, determine special event api type, otherwise given type
				type = ( selector ? special.delegateType : special.bindType ) || type;

				// Update special based on newly reset type
				special = jQuery.event.special[ type ] || {};

				// handleObj is passed to all event handlers
				handleObj = jQuery.extend( {
					type: type,
					origType: origType,
					data: data,
					handler: handler,
					guid: handler.guid,
					selector: selector,
					needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
					namespace: namespaces.join( "." )
				}, handleObjIn );

				// Init the event handler queue if we're the first
				if ( !( handlers = events[ type ] ) ) {
					handlers = events[ type ] = [];
					handlers.delegateCount = 0;

					// Only use addEventListener if the special events handler returns false
					if ( !special.setup ||
						special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

						if ( elem.addEventListener ) {
							elem.addEventListener( type, eventHandle );
						}
					}
				}

				if ( special.add ) {
					special.add.call( elem, handleObj );

					if ( !handleObj.handler.guid ) {
						handleObj.handler.guid = handler.guid;
					}
				}

				// Add to the element's handler list, delegates in front
				if ( selector ) {
					handlers.splice( handlers.delegateCount++, 0, handleObj );
				} else {
					handlers.push( handleObj );
				}

				// Keep track of which events have ever been used, for event optimization
				jQuery.event.global[ type ] = true;
			}

		},

		// Detach an event or set of events from an element
		remove: function( elem, types, handler, selector, mappedTypes ) {

			var j, origCount, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

			if ( !elemData || !( events = elemData.events ) ) {
				return;
			}

			// Once for each type.namespace in types; type may be omitted
			types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// Unbind all events (on this namespace, if provided) for the element
				if ( !type ) {
					for ( type in events ) {
						jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
					}
					continue;
				}

				special = jQuery.event.special[ type ] || {};
				type = ( selector ? special.delegateType : special.bindType ) || type;
				handlers = events[ type ] || [];
				tmp = tmp[ 2 ] &&
					new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

				// Remove matching events
				origCount = j = handlers.length;
				while ( j-- ) {
					handleObj = handlers[ j ];

					if ( ( mappedTypes || origType === handleObj.origType ) &&
						( !handler || handler.guid === handleObj.guid ) &&
						( !tmp || tmp.test( handleObj.namespace ) ) &&
						( !selector || selector === handleObj.selector ||
							selector === "**" && handleObj.selector ) ) {
						handlers.splice( j, 1 );

						if ( handleObj.selector ) {
							handlers.delegateCount--;
						}
						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}
				}

				// Remove generic event handler if we removed something and no more handlers exist
				// (avoids potential for endless recursion during removal of special event handlers)
				if ( origCount && !handlers.length ) {
					if ( !special.teardown ||
						special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

						jQuery.removeEvent( elem, type, elemData.handle );
					}

					delete events[ type ];
				}
			}

			// Remove data and the expando if it's no longer used
			if ( jQuery.isEmptyObject( events ) ) {
				dataPriv.remove( elem, "handle events" );
			}
		},

		dispatch: function( nativeEvent ) {

			var i, j, ret, matched, handleObj, handlerQueue,
				args = new Array( arguments.length ),

				// Make a writable jQuery.Event from the native event object
				event = jQuery.event.fix( nativeEvent ),

				handlers = (
					dataPriv.get( this, "events" ) || Object.create( null )
				)[ event.type ] || [],
				special = jQuery.event.special[ event.type ] || {};

			// Use the fix-ed jQuery.Event rather than the (read-only) native event
			args[ 0 ] = event;

			for ( i = 1; i < arguments.length; i++ ) {
				args[ i ] = arguments[ i ];
			}

			event.delegateTarget = this;

			// Call the preDispatch hook for the mapped type, and let it bail if desired
			if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
				return;
			}

			// Determine handlers
			handlerQueue = jQuery.event.handlers.call( this, event, handlers );

			// Run delegates first; they may want to stop propagation beneath us
			i = 0;
			while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
				event.currentTarget = matched.elem;

				j = 0;
				while ( ( handleObj = matched.handlers[ j++ ] ) &&
					!event.isImmediatePropagationStopped() ) {

					// If the event is namespaced, then each handler is only invoked if it is
					// specially universal or its namespaces are a superset of the event's.
					if ( !event.rnamespace || handleObj.namespace === false ||
						event.rnamespace.test( handleObj.namespace ) ) {

						event.handleObj = handleObj;
						event.data = handleObj.data;

						ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
							handleObj.handler ).apply( matched.elem, args );

						if ( ret !== undefined ) {
							if ( ( event.result = ret ) === false ) {
								event.preventDefault();
								event.stopPropagation();
							}
						}
					}
				}
			}

			// Call the postDispatch hook for the mapped type
			if ( special.postDispatch ) {
				special.postDispatch.call( this, event );
			}

			return event.result;
		},

		handlers: function( event, handlers ) {
			var i, handleObj, sel, matchedHandlers, matchedSelectors,
				handlerQueue = [],
				delegateCount = handlers.delegateCount,
				cur = event.target;

			// Find delegate handlers
			if ( delegateCount &&

				// Support: IE <=9
				// Black-hole SVG <use> instance trees (trac-13180)
				cur.nodeType &&

				// Support: Firefox <=42
				// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
				// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
				// Support: IE 11 only
				// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
				!( event.type === "click" && event.button >= 1 ) ) {

				for ( ; cur !== this; cur = cur.parentNode || this ) {

					// Don't check non-elements (#13208)
					// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
					if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
						matchedHandlers = [];
						matchedSelectors = {};
						for ( i = 0; i < delegateCount; i++ ) {
							handleObj = handlers[ i ];

							// Don't conflict with Object.prototype properties (#13203)
							sel = handleObj.selector + " ";

							if ( matchedSelectors[ sel ] === undefined ) {
								matchedSelectors[ sel ] = handleObj.needsContext ?
									jQuery( sel, this ).index( cur ) > -1 :
									jQuery.find( sel, this, null, [ cur ] ).length;
							}
							if ( matchedSelectors[ sel ] ) {
								matchedHandlers.push( handleObj );
							}
						}
						if ( matchedHandlers.length ) {
							handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
						}
					}
				}
			}

			// Add the remaining (directly-bound) handlers
			cur = this;
			if ( delegateCount < handlers.length ) {
				handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
			}

			return handlerQueue;
		},

		addProp: function( name, hook ) {
			Object.defineProperty( jQuery.Event.prototype, name, {
				enumerable: true,
				configurable: true,

				get: isFunction( hook ) ?
					function() {
						if ( this.originalEvent ) {
							return hook( this.originalEvent );
						}
					} :
					function() {
						if ( this.originalEvent ) {
							return this.originalEvent[ name ];
						}
					},

				set: function( value ) {
					Object.defineProperty( this, name, {
						enumerable: true,
						configurable: true,
						writable: true,
						value: value
					} );
				}
			} );
		},

		fix: function( originalEvent ) {
			return originalEvent[ jQuery.expando ] ?
				originalEvent :
				new jQuery.Event( originalEvent );
		},

		special: {
			load: {

				// Prevent triggered image.load events from bubbling to window.load
				noBubble: true
			},
			click: {

				// Utilize native event to ensure correct state for checkable inputs
				setup: function( data ) {

					// For mutual compressibility with _default, replace `this` access with a local var.
					// `|| data` is dead code meant only to preserve the variable through minification.
					var el = this || data;

					// Claim the first handler
					if ( rcheckableType.test( el.type ) &&
						el.click && nodeName( el, "input" ) ) {

						// dataPriv.set( el, "click", ... )
						leverageNative( el, "click", returnTrue );
					}

					// Return false to allow normal processing in the caller
					return false;
				},
				trigger: function( data ) {

					// For mutual compressibility with _default, replace `this` access with a local var.
					// `|| data` is dead code meant only to preserve the variable through minification.
					var el = this || data;

					// Force setup before triggering a click
					if ( rcheckableType.test( el.type ) &&
						el.click && nodeName( el, "input" ) ) {

						leverageNative( el, "click" );
					}

					// Return non-false to allow normal event-path propagation
					return true;
				},

				// For cross-browser consistency, suppress native .click() on links
				// Also prevent it if we're currently inside a leveraged native-event stack
				_default: function( event ) {
					var target = event.target;
					return rcheckableType.test( target.type ) &&
						target.click && nodeName( target, "input" ) &&
						dataPriv.get( target, "click" ) ||
						nodeName( target, "a" );
				}
			},

			beforeunload: {
				postDispatch: function( event ) {

					// Support: Firefox 20+
					// Firefox doesn't alert if the returnValue field is not set.
					if ( event.result !== undefined && event.originalEvent ) {
						event.originalEvent.returnValue = event.result;
					}
				}
			}
		}
	};

	// Ensure the presence of an event listener that handles manually-triggered
	// synthetic events by interrupting progress until reinvoked in response to
	// *native* events that it fires directly, ensuring that state changes have
	// already occurred before other listeners are invoked.
	function leverageNative( el, type, expectSync ) {

		// Missing expectSync indicates a trigger call, which must force setup through jQuery.event.add
		if ( !expectSync ) {
			if ( dataPriv.get( el, type ) === undefined ) {
				jQuery.event.add( el, type, returnTrue );
			}
			return;
		}

		// Register the controller as a special universal handler for all event namespaces
		dataPriv.set( el, type, false );
		jQuery.event.add( el, type, {
			namespace: false,
			handler: function( event ) {
				var notAsync, result,
					saved = dataPriv.get( this, type );

				if ( ( event.isTrigger & 1 ) && this[ type ] ) {

					// Interrupt processing of the outer synthetic .trigger()ed event
					// Saved data should be false in such cases, but might be a leftover capture object
					// from an async native handler (gh-4350)
					if ( !saved.length ) {

						// Store arguments for use when handling the inner native event
						// There will always be at least one argument (an event object), so this array
						// will not be confused with a leftover capture object.
						saved = slice.call( arguments );
						dataPriv.set( this, type, saved );

						// Trigger the native event and capture its result
						// Support: IE <=9 - 11+
						// focus() and blur() are asynchronous
						notAsync = expectSync( this, type );
						this[ type ]();
						result = dataPriv.get( this, type );
						if ( saved !== result || notAsync ) {
							dataPriv.set( this, type, false );
						} else {
							result = {};
						}
						if ( saved !== result ) {

							// Cancel the outer synthetic event
							event.stopImmediatePropagation();
							event.preventDefault();

							// Support: Chrome 86+
							// In Chrome, if an element having a focusout handler is blurred by
							// clicking outside of it, it invokes the handler synchronously. If
							// that handler calls `.remove()` on the element, the data is cleared,
							// leaving `result` undefined. We need to guard against this.
							return result && result.value;
						}

					// If this is an inner synthetic event for an event with a bubbling surrogate
					// (focus or blur), assume that the surrogate already propagated from triggering the
					// native event and prevent that from happening again here.
					// This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
					// bubbling surrogate propagates *after* the non-bubbling base), but that seems
					// less bad than duplication.
					} else if ( ( jQuery.event.special[ type ] || {} ).delegateType ) {
						event.stopPropagation();
					}

				// If this is a native event triggered above, everything is now in order
				// Fire an inner synthetic event with the original arguments
				} else if ( saved.length ) {

					// ...and capture the result
					dataPriv.set( this, type, {
						value: jQuery.event.trigger(

							// Support: IE <=9 - 11+
							// Extend with the prototype to reset the above stopImmediatePropagation()
							jQuery.extend( saved[ 0 ], jQuery.Event.prototype ),
							saved.slice( 1 ),
							this
						)
					} );

					// Abort handling of the native event
					event.stopImmediatePropagation();
				}
			}
		} );
	}

	jQuery.removeEvent = function( elem, type, handle ) {

		// This "if" is needed for plain objects
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle );
		}
	};

	jQuery.Event = function( src, props ) {

		// Allow instantiation without the 'new' keyword
		if ( !( this instanceof jQuery.Event ) ) {
			return new jQuery.Event( src, props );
		}

		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = src.defaultPrevented ||
					src.defaultPrevented === undefined &&

					// Support: Android <=2.3 only
					src.returnValue === false ?
				returnTrue :
				returnFalse;

			// Create target properties
			// Support: Safari <=6 - 7 only
			// Target should not be a text node (#504, #13143)
			this.target = ( src.target && src.target.nodeType === 3 ) ?
				src.target.parentNode :
				src.target;

			this.currentTarget = src.currentTarget;
			this.relatedTarget = src.relatedTarget;

		// Event type
		} else {
			this.type = src;
		}

		// Put explicitly provided properties onto the event object
		if ( props ) {
			jQuery.extend( this, props );
		}

		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || Date.now();

		// Mark it as fixed
		this[ jQuery.expando ] = true;
	};

	// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
	// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	jQuery.Event.prototype = {
		constructor: jQuery.Event,
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse,
		isSimulated: false,

		preventDefault: function() {
			var e = this.originalEvent;

			this.isDefaultPrevented = returnTrue;

			if ( e && !this.isSimulated ) {
				e.preventDefault();
			}
		},
		stopPropagation: function() {
			var e = this.originalEvent;

			this.isPropagationStopped = returnTrue;

			if ( e && !this.isSimulated ) {
				e.stopPropagation();
			}
		},
		stopImmediatePropagation: function() {
			var e = this.originalEvent;

			this.isImmediatePropagationStopped = returnTrue;

			if ( e && !this.isSimulated ) {
				e.stopImmediatePropagation();
			}

			this.stopPropagation();
		}
	};

	// Includes all common event props including KeyEvent and MouseEvent specific props
	jQuery.each( {
		altKey: true,
		bubbles: true,
		cancelable: true,
		changedTouches: true,
		ctrlKey: true,
		detail: true,
		eventPhase: true,
		metaKey: true,
		pageX: true,
		pageY: true,
		shiftKey: true,
		view: true,
		"char": true,
		code: true,
		charCode: true,
		key: true,
		keyCode: true,
		button: true,
		buttons: true,
		clientX: true,
		clientY: true,
		offsetX: true,
		offsetY: true,
		pointerId: true,
		pointerType: true,
		screenX: true,
		screenY: true,
		targetTouches: true,
		toElement: true,
		touches: true,
		which: true
	}, jQuery.event.addProp );

	jQuery.each( { focus: "focusin", blur: "focusout" }, function( type, delegateType ) {
		jQuery.event.special[ type ] = {

			// Utilize native event if possible so blur/focus sequence is correct
			setup: function() {

				// Claim the first handler
				// dataPriv.set( this, "focus", ... )
				// dataPriv.set( this, "blur", ... )
				leverageNative( this, type, expectSync );

				// Return false to allow normal processing in the caller
				return false;
			},
			trigger: function() {

				// Force setup before trigger
				leverageNative( this, type );

				// Return non-false to allow normal event-path propagation
				return true;
			},

			// Suppress native focus or blur as it's already being fired
			// in leverageNative.
			_default: function() {
				return true;
			},

			delegateType: delegateType
		};
	} );

	// Create mouseenter/leave events using mouseover/out and event-time checks
	// so that event delegation works in jQuery.
	// Do the same for pointerenter/pointerleave and pointerover/pointerout
	//
	// Support: Safari 7 only
	// Safari sends mouseenter too often; see:
	// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
	// for the description of the bug (it existed in older Chrome versions as well).
	jQuery.each( {
		mouseenter: "mouseover",
		mouseleave: "mouseout",
		pointerenter: "pointerover",
		pointerleave: "pointerout"
	}, function( orig, fix ) {
		jQuery.event.special[ orig ] = {
			delegateType: fix,
			bindType: fix,

			handle: function( event ) {
				var ret,
					target = this,
					related = event.relatedTarget,
					handleObj = event.handleObj;

				// For mouseenter/leave call the handler if related is outside the target.
				// NB: No relatedTarget if the mouse left/entered the browser window
				if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
					event.type = handleObj.origType;
					ret = handleObj.handler.apply( this, arguments );
					event.type = fix;
				}
				return ret;
			}
		};
	} );

	jQuery.fn.extend( {

		on: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn );
		},
		one: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn, 1 );
		},
		off: function( types, selector, fn ) {
			var handleObj, type;
			if ( types && types.preventDefault && types.handleObj ) {

				// ( event )  dispatched jQuery.Event
				handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
					handleObj.namespace ?
						handleObj.origType + "." + handleObj.namespace :
						handleObj.origType,
					handleObj.selector,
					handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {

				// ( types-object [, selector] )
				for ( type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {

				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each( function() {
				jQuery.event.remove( this, types, fn, selector );
			} );
		}
	} );


	var

		// Support: IE <=10 - 11, Edge 12 - 13 only
		// In IE/Edge using regex groups here causes severe slowdowns.
		// See https://connect.microsoft.com/IE/feedback/details/1736512/
		rnoInnerhtml = /<script|<style|<link/i,

		// checked="checked" or checked
		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
		rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

	// Prefer a tbody over its parent table for containing new rows
	function manipulationTarget( elem, content ) {
		if ( nodeName( elem, "table" ) &&
			nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

			return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
		}

		return elem;
	}

	// Replace/restore the type attribute of script elements for safe DOM manipulation
	function disableScript( elem ) {
		elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
		return elem;
	}
	function restoreScript( elem ) {
		if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
			elem.type = elem.type.slice( 5 );
		} else {
			elem.removeAttribute( "type" );
		}

		return elem;
	}

	function cloneCopyEvent( src, dest ) {
		var i, l, type, pdataOld, udataOld, udataCur, events;

		if ( dest.nodeType !== 1 ) {
			return;
		}

		// 1. Copy private data: events, handlers, etc.
		if ( dataPriv.hasData( src ) ) {
			pdataOld = dataPriv.get( src );
			events = pdataOld.events;

			if ( events ) {
				dataPriv.remove( dest, "handle events" );

				for ( type in events ) {
					for ( i = 0, l = events[ type ].length; i < l; i++ ) {
						jQuery.event.add( dest, type, events[ type ][ i ] );
					}
				}
			}
		}

		// 2. Copy user data
		if ( dataUser.hasData( src ) ) {
			udataOld = dataUser.access( src );
			udataCur = jQuery.extend( {}, udataOld );

			dataUser.set( dest, udataCur );
		}
	}

	// Fix IE bugs, see support tests
	function fixInput( src, dest ) {
		var nodeName = dest.nodeName.toLowerCase();

		// Fails to persist the checked state of a cloned checkbox or radio button.
		if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
			dest.checked = src.checked;

		// Fails to return the selected option to the default selected state when cloning options
		} else if ( nodeName === "input" || nodeName === "textarea" ) {
			dest.defaultValue = src.defaultValue;
		}
	}

	function domManip( collection, args, callback, ignored ) {

		// Flatten any nested arrays
		args = flat( args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = collection.length,
			iNoClone = l - 1,
			value = args[ 0 ],
			valueIsFunction = isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( valueIsFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return collection.each( function( index ) {
				var self = collection.eq( index );
				if ( valueIsFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				domManip( self, args, callback, ignored );
			} );
		}

		if ( l ) {
			fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			// Require either new content or an interest in ignored elements to invoke the callback
			if ( first || ignored ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item
				// instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {

							// Support: Android <=4.0 only, PhantomJS 1 only
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( collection[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!dataPriv.access( node, "globalEval" ) &&
							jQuery.contains( doc, node ) ) {

							if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl && !node.noModule ) {
									jQuery._evalUrl( node.src, {
										nonce: node.nonce || node.getAttribute( "nonce" )
									}, doc );
								}
							} else {
								DOMEval( node.textContent.replace( rcleanScript, "" ), node, doc );
							}
						}
					}
				}
			}
		}

		return collection;
	}

	function remove( elem, selector, keepData ) {
		var node,
			nodes = selector ? jQuery.filter( selector, elem ) : elem,
			i = 0;

		for ( ; ( node = nodes[ i ] ) != null; i++ ) {
			if ( !keepData && node.nodeType === 1 ) {
				jQuery.cleanData( getAll( node ) );
			}

			if ( node.parentNode ) {
				if ( keepData && isAttached( node ) ) {
					setGlobalEval( getAll( node, "script" ) );
				}
				node.parentNode.removeChild( node );
			}
		}

		return elem;
	}

	jQuery.extend( {
		htmlPrefilter: function( html ) {
			return html;
		},

		clone: function( elem, dataAndEvents, deepDataAndEvents ) {
			var i, l, srcElements, destElements,
				clone = elem.cloneNode( true ),
				inPage = isAttached( elem );

			// Fix IE cloning issues
			if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
					!jQuery.isXMLDoc( elem ) ) {

				// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
				destElements = getAll( clone );
				srcElements = getAll( elem );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					fixInput( srcElements[ i ], destElements[ i ] );
				}
			}

			// Copy the events from the original to the clone
			if ( dataAndEvents ) {
				if ( deepDataAndEvents ) {
					srcElements = srcElements || getAll( elem );
					destElements = destElements || getAll( clone );

					for ( i = 0, l = srcElements.length; i < l; i++ ) {
						cloneCopyEvent( srcElements[ i ], destElements[ i ] );
					}
				} else {
					cloneCopyEvent( elem, clone );
				}
			}

			// Preserve script evaluation history
			destElements = getAll( clone, "script" );
			if ( destElements.length > 0 ) {
				setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
			}

			// Return the cloned set
			return clone;
		},

		cleanData: function( elems ) {
			var data, elem, type,
				special = jQuery.event.special,
				i = 0;

			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				if ( acceptData( elem ) ) {
					if ( ( data = elem[ dataPriv.expando ] ) ) {
						if ( data.events ) {
							for ( type in data.events ) {
								if ( special[ type ] ) {
									jQuery.event.remove( elem, type );

								// This is a shortcut to avoid jQuery.event.remove's overhead
								} else {
									jQuery.removeEvent( elem, type, data.handle );
								}
							}
						}

						// Support: Chrome <=35 - 45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataPriv.expando ] = undefined;
					}
					if ( elem[ dataUser.expando ] ) {

						// Support: Chrome <=35 - 45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataUser.expando ] = undefined;
					}
				}
			}
		}
	} );

	jQuery.fn.extend( {
		detach: function( selector ) {
			return remove( this, selector, true );
		},

		remove: function( selector ) {
			return remove( this, selector );
		},

		text: function( value ) {
			return access( this, function( value ) {
				return value === undefined ?
					jQuery.text( this ) :
					this.empty().each( function() {
						if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
							this.textContent = value;
						}
					} );
			}, null, value, arguments.length );
		},

		append: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.appendChild( elem );
				}
			} );
		},

		prepend: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.insertBefore( elem, target.firstChild );
				}
			} );
		},

		before: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this );
				}
			} );
		},

		after: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this.nextSibling );
				}
			} );
		},

		empty: function() {
			var elem,
				i = 0;

			for ( ; ( elem = this[ i ] ) != null; i++ ) {
				if ( elem.nodeType === 1 ) {

					// Prevent memory leaks
					jQuery.cleanData( getAll( elem, false ) );

					// Remove any remaining nodes
					elem.textContent = "";
				}
			}

			return this;
		},

		clone: function( dataAndEvents, deepDataAndEvents ) {
			dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
			deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

			return this.map( function() {
				return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
			} );
		},

		html: function( value ) {
			return access( this, function( value ) {
				var elem = this[ 0 ] || {},
					i = 0,
					l = this.length;

				if ( value === undefined && elem.nodeType === 1 ) {
					return elem.innerHTML;
				}

				// See if we can take a shortcut and just use innerHTML
				if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
					!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

					value = jQuery.htmlPrefilter( value );

					try {
						for ( ; i < l; i++ ) {
							elem = this[ i ] || {};

							// Remove element nodes and prevent memory leaks
							if ( elem.nodeType === 1 ) {
								jQuery.cleanData( getAll( elem, false ) );
								elem.innerHTML = value;
							}
						}

						elem = 0;

					// If using innerHTML throws an exception, use the fallback method
					} catch ( e ) {}
				}

				if ( elem ) {
					this.empty().append( value );
				}
			}, null, value, arguments.length );
		},

		replaceWith: function() {
			var ignored = [];

			// Make the changes, replacing each non-ignored context element with the new content
			return domManip( this, arguments, function( elem ) {
				var parent = this.parentNode;

				if ( jQuery.inArray( this, ignored ) < 0 ) {
					jQuery.cleanData( getAll( this ) );
					if ( parent ) {
						parent.replaceChild( elem, this );
					}
				}

			// Force callback invocation
			}, ignored );
		}
	} );

	jQuery.each( {
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var elems,
				ret = [],
				insert = jQuery( selector ),
				last = insert.length - 1,
				i = 0;

			for ( ; i <= last; i++ ) {
				elems = i === last ? this : this.clone( true );
				jQuery( insert[ i ] )[ original ]( elems );

				// Support: Android <=4.0 only, PhantomJS 1 only
				// .get() because push.apply(_, arraylike) throws on ancient WebKit
				push.apply( ret, elems.get() );
			}

			return this.pushStack( ret );
		};
	} );
	var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

	var getStyles = function( elem ) {

			// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
			// IE throws on elements created in popups
			// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
			var view = elem.ownerDocument.defaultView;

			if ( !view || !view.opener ) {
				view = window;
			}

			return view.getComputedStyle( elem );
		};

	var swap = function( elem, options, callback ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.call( elem );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	};


	var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



	( function() {

		// Executing both pixelPosition & boxSizingReliable tests require only one layout
		// so they're executed at the same time to save the second computation.
		function computeStyleTests() {

			// This is a singleton, we need to execute it only once
			if ( !div ) {
				return;
			}

			container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
				"margin-top:1px;padding:0;border:0";
			div.style.cssText =
				"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
				"margin:auto;border:1px;padding:1px;" +
				"width:60%;top:1%";
			documentElement.appendChild( container ).appendChild( div );

			var divStyle = window.getComputedStyle( div );
			pixelPositionVal = divStyle.top !== "1%";

			// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
			reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

			// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
			// Some styles come back with percentage values, even though they shouldn't
			div.style.right = "60%";
			pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

			// Support: IE 9 - 11 only
			// Detect misreporting of content dimensions for box-sizing:border-box elements
			boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

			// Support: IE 9 only
			// Detect overflow:scroll screwiness (gh-3699)
			// Support: Chrome <=64
			// Don't get tricked when zoom affects offsetWidth (gh-4029)
			div.style.position = "absolute";
			scrollboxSizeVal = roundPixelMeasures( div.offsetWidth / 3 ) === 12;

			documentElement.removeChild( container );

			// Nullify the div so it wouldn't be stored in the memory and
			// it will also be a sign that checks already performed
			div = null;
		}

		function roundPixelMeasures( measure ) {
			return Math.round( parseFloat( measure ) );
		}

		var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
			reliableTrDimensionsVal, reliableMarginLeftVal,
			container = document.createElement( "div" ),
			div = document.createElement( "div" );

		// Finish early in limited (non-browser) environments
		if ( !div.style ) {
			return;
		}

		// Support: IE <=9 - 11 only
		// Style of cloned element affects source element cloned (#8908)
		div.style.backgroundClip = "content-box";
		div.cloneNode( true ).style.backgroundClip = "";
		support.clearCloneStyle = div.style.backgroundClip === "content-box";

		jQuery.extend( support, {
			boxSizingReliable: function() {
				computeStyleTests();
				return boxSizingReliableVal;
			},
			pixelBoxStyles: function() {
				computeStyleTests();
				return pixelBoxStylesVal;
			},
			pixelPosition: function() {
				computeStyleTests();
				return pixelPositionVal;
			},
			reliableMarginLeft: function() {
				computeStyleTests();
				return reliableMarginLeftVal;
			},
			scrollboxSize: function() {
				computeStyleTests();
				return scrollboxSizeVal;
			},

			// Support: IE 9 - 11+, Edge 15 - 18+
			// IE/Edge misreport `getComputedStyle` of table rows with width/height
			// set in CSS while `offset*` properties report correct values.
			// Behavior in IE 9 is more subtle than in newer versions & it passes
			// some versions of this test; make sure not to make it pass there!
			//
			// Support: Firefox 70+
			// Only Firefox includes border widths
			// in computed dimensions. (gh-4529)
			reliableTrDimensions: function() {
				var table, tr, trChild, trStyle;
				if ( reliableTrDimensionsVal == null ) {
					table = document.createElement( "table" );
					tr = document.createElement( "tr" );
					trChild = document.createElement( "div" );

					table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
					tr.style.cssText = "border:1px solid";

					// Support: Chrome 86+
					// Height set through cssText does not get applied.
					// Computed height then comes back as 0.
					tr.style.height = "1px";
					trChild.style.height = "9px";

					// Support: Android 8 Chrome 86+
					// In our bodyBackground.html iframe,
					// display for all div elements is set to "inline",
					// which causes a problem only in Android 8 Chrome 86.
					// Ensuring the div is display: block
					// gets around this issue.
					trChild.style.display = "block";

					documentElement
						.appendChild( table )
						.appendChild( tr )
						.appendChild( trChild );

					trStyle = window.getComputedStyle( tr );
					reliableTrDimensionsVal = ( parseInt( trStyle.height, 10 ) +
						parseInt( trStyle.borderTopWidth, 10 ) +
						parseInt( trStyle.borderBottomWidth, 10 ) ) === tr.offsetHeight;

					documentElement.removeChild( table );
				}
				return reliableTrDimensionsVal;
			}
		} );
	} )();


	function curCSS( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,

			// Support: Firefox 51+
			// Retrieving style before computed somehow
			// fixes an issue with getting wrong values
			// on detached elements
			style = elem.style;

		computed = computed || getStyles( elem );

		// getPropertyValue is needed for:
		//   .css('filter') (IE 9 only, #12537)
		//   .css('--customProperty) (#3144)
		if ( computed ) {
			ret = computed.getPropertyValue( name ) || computed[ name ];

			if ( ret === "" && !isAttached( elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Android Browser returns percentage for some values,
			// but width seems to be reliably pixels.
			// This is against the CSSOM draft spec:
			// https://drafts.csswg.org/cssom/#resolved-values
			if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret !== undefined ?

			// Support: IE <=9 - 11 only
			// IE returns zIndex value as an integer.
			ret + "" :
			ret;
	}


	function addGetHookIf( conditionFn, hookFn ) {

		// Define the hook, we'll check on the first run if it's really needed.
		return {
			get: function() {
				if ( conditionFn() ) {

					// Hook not needed (or it's not possible to use it due
					// to missing dependency), remove it.
					delete this.get;
					return;
				}

				// Hook needed; redefine it so that the support test is not executed again.
				return ( this.get = hookFn ).apply( this, arguments );
			}
		};
	}


	var cssPrefixes = [ "Webkit", "Moz", "ms" ],
		emptyStyle = document.createElement( "div" ).style,
		vendorProps = {};

	// Return a vendor-prefixed property or undefined
	function vendorPropName( name ) {

		// Check for vendor prefixed names
		var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
			i = cssPrefixes.length;

		while ( i-- ) {
			name = cssPrefixes[ i ] + capName;
			if ( name in emptyStyle ) {
				return name;
			}
		}
	}

	// Return a potentially-mapped jQuery.cssProps or vendor prefixed property
	function finalPropName( name ) {
		var final = jQuery.cssProps[ name ] || vendorProps[ name ];

		if ( final ) {
			return final;
		}
		if ( name in emptyStyle ) {
			return name;
		}
		return vendorProps[ name ] = vendorPropName( name ) || name;
	}


	var

		// Swappable if display is none or starts with table
		// except "table", "table-cell", or "table-caption"
		// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
		rdisplayswap = /^(none|table(?!-c[ea]).+)/,
		rcustomProp = /^--/,
		cssShow = { position: "absolute", visibility: "hidden", display: "block" },
		cssNormalTransform = {
			letterSpacing: "0",
			fontWeight: "400"
		};

	function setPositiveNumber( _elem, value, subtract ) {

		// Any relative (+/-) values have already been
		// normalized at this point
		var matches = rcssNum.exec( value );
		return matches ?

			// Guard against undefined "subtract", e.g., when used as in cssHooks
			Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
			value;
	}

	function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
		var i = dimension === "width" ? 1 : 0,
			extra = 0,
			delta = 0;

		// Adjustment may not be necessary
		if ( box === ( isBorderBox ? "border" : "content" ) ) {
			return 0;
		}

		for ( ; i < 4; i += 2 ) {

			// Both box models exclude margin
			if ( box === "margin" ) {
				delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
			}

			// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
			if ( !isBorderBox ) {

				// Add padding
				delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

				// For "border" or "margin", add border
				if ( box !== "padding" ) {
					delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

				// But still keep track of it otherwise
				} else {
					extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}

			// If we get here with a border-box (content + padding + border), we're seeking "content" or
			// "padding" or "margin"
			} else {

				// For "content", subtract padding
				if ( box === "content" ) {
					delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
				}

				// For "content" or "padding", subtract border
				if ( box !== "margin" ) {
					delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			}
		}

		// Account for positive content-box scroll gutter when requested by providing computedVal
		if ( !isBorderBox && computedVal >= 0 ) {

			// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
			// Assuming integer scroll gutter, subtract the rest and round down
			delta += Math.max( 0, Math.ceil(
				elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
				computedVal -
				delta -
				extra -
				0.5

			// If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
			// Use an explicit zero to avoid NaN (gh-3964)
			) ) || 0;
		}

		return delta;
	}

	function getWidthOrHeight( elem, dimension, extra ) {

		// Start with computed style
		var styles = getStyles( elem ),

			// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
			// Fake content-box until we know it's needed to know the true value.
			boxSizingNeeded = !support.boxSizingReliable() || extra,
			isBorderBox = boxSizingNeeded &&
				jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
			valueIsBorderBox = isBorderBox,

			val = curCSS( elem, dimension, styles ),
			offsetProp = "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 );

		// Support: Firefox <=54
		// Return a confounding non-pixel value or feign ignorance, as appropriate.
		if ( rnumnonpx.test( val ) ) {
			if ( !extra ) {
				return val;
			}
			val = "auto";
		}


		// Support: IE 9 - 11 only
		// Use offsetWidth/offsetHeight for when box sizing is unreliable.
		// In those cases, the computed value can be trusted to be border-box.
		if ( ( !support.boxSizingReliable() && isBorderBox ||

			// Support: IE 10 - 11+, Edge 15 - 18+
			// IE/Edge misreport `getComputedStyle` of table rows with width/height
			// set in CSS while `offset*` properties report correct values.
			// Interestingly, in some cases IE 9 doesn't suffer from this issue.
			!support.reliableTrDimensions() && nodeName( elem, "tr" ) ||

			// Fall back to offsetWidth/offsetHeight when value is "auto"
			// This happens for inline elements with no explicit setting (gh-3571)
			val === "auto" ||

			// Support: Android <=4.1 - 4.3 only
			// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
			!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) &&

			// Make sure the element is visible & connected
			elem.getClientRects().length ) {

			isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

			// Where available, offsetWidth/offsetHeight approximate border box dimensions.
			// Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
			// retrieved value as a content box dimension.
			valueIsBorderBox = offsetProp in elem;
			if ( valueIsBorderBox ) {
				val = elem[ offsetProp ];
			}
		}

		// Normalize "" and auto
		val = parseFloat( val ) || 0;

		// Adjust for the element's box model
		return ( val +
			boxModelAdjustment(
				elem,
				dimension,
				extra || ( isBorderBox ? "border" : "content" ),
				valueIsBorderBox,
				styles,

				// Provide the current computed size to request scroll gutter calculation (gh-3589)
				val
			)
		) + "px";
	}

	jQuery.extend( {

		// Add in style property hooks for overriding the default
		// behavior of getting and setting a style property
		cssHooks: {
			opacity: {
				get: function( elem, computed ) {
					if ( computed ) {

						// We should always get a number back from opacity
						var ret = curCSS( elem, "opacity" );
						return ret === "" ? "1" : ret;
					}
				}
			}
		},

		// Don't automatically add "px" to these possibly-unitless properties
		cssNumber: {
			"animationIterationCount": true,
			"columnCount": true,
			"fillOpacity": true,
			"flexGrow": true,
			"flexShrink": true,
			"fontWeight": true,
			"gridArea": true,
			"gridColumn": true,
			"gridColumnEnd": true,
			"gridColumnStart": true,
			"gridRow": true,
			"gridRowEnd": true,
			"gridRowStart": true,
			"lineHeight": true,
			"opacity": true,
			"order": true,
			"orphans": true,
			"widows": true,
			"zIndex": true,
			"zoom": true
		},

		// Add in properties whose names you wish to fix before
		// setting or getting the value
		cssProps: {},

		// Get and set the style property on a DOM Node
		style: function( elem, name, value, extra ) {

			// Don't set styles on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
				return;
			}

			// Make sure that we're working with the right name
			var ret, type, hooks,
				origName = camelCase( name ),
				isCustomProp = rcustomProp.test( name ),
				style = elem.style;

			// Make sure that we're working with the right name. We don't
			// want to query the value if it is a CSS custom property
			// since they are user-defined.
			if ( !isCustomProp ) {
				name = finalPropName( origName );
			}

			// Gets hook for the prefixed version, then unprefixed version
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// Check if we're setting a value
			if ( value !== undefined ) {
				type = typeof value;

				// Convert "+=" or "-=" to relative numbers (#7345)
				if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
					value = adjustCSS( elem, name, ret );

					// Fixes bug #9237
					type = "number";
				}

				// Make sure that null and NaN values aren't set (#7116)
				if ( value == null || value !== value ) {
					return;
				}

				// If a number was passed in, add the unit (except for certain CSS properties)
				// The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
				// "px" to a few hardcoded values.
				if ( type === "number" && !isCustomProp ) {
					value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
				}

				// background-* props affect original clone's values
				if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
					style[ name ] = "inherit";
				}

				// If a hook was provided, use that value, otherwise just set the specified value
				if ( !hooks || !( "set" in hooks ) ||
					( value = hooks.set( elem, value, extra ) ) !== undefined ) {

					if ( isCustomProp ) {
						style.setProperty( name, value );
					} else {
						style[ name ] = value;
					}
				}

			} else {

				// If a hook was provided get the non-computed value from there
				if ( hooks && "get" in hooks &&
					( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

					return ret;
				}

				// Otherwise just get the value from the style object
				return style[ name ];
			}
		},

		css: function( elem, name, extra, styles ) {
			var val, num, hooks,
				origName = camelCase( name ),
				isCustomProp = rcustomProp.test( name );

			// Make sure that we're working with the right name. We don't
			// want to modify the value if it is a CSS custom property
			// since they are user-defined.
			if ( !isCustomProp ) {
				name = finalPropName( origName );
			}

			// Try prefixed name followed by the unprefixed name
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// If a hook was provided get the computed value from there
			if ( hooks && "get" in hooks ) {
				val = hooks.get( elem, true, extra );
			}

			// Otherwise, if a way to get the computed value exists, use that
			if ( val === undefined ) {
				val = curCSS( elem, name, styles );
			}

			// Convert "normal" to computed value
			if ( val === "normal" && name in cssNormalTransform ) {
				val = cssNormalTransform[ name ];
			}

			// Make numeric if forced or a qualifier was provided and val looks numeric
			if ( extra === "" || extra ) {
				num = parseFloat( val );
				return extra === true || isFinite( num ) ? num || 0 : val;
			}

			return val;
		}
	} );

	jQuery.each( [ "height", "width" ], function( _i, dimension ) {
		jQuery.cssHooks[ dimension ] = {
			get: function( elem, computed, extra ) {
				if ( computed ) {

					// Certain elements can have dimension info if we invisibly show them
					// but it must have a current display style that would benefit
					return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

						// Support: Safari 8+
						// Table columns in Safari have non-zero offsetWidth & zero
						// getBoundingClientRect().width unless display is changed.
						// Support: IE <=11 only
						// Running getBoundingClientRect on a disconnected node
						// in IE throws an error.
						( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
				}
			},

			set: function( elem, value, extra ) {
				var matches,
					styles = getStyles( elem ),

					// Only read styles.position if the test has a chance to fail
					// to avoid forcing a reflow.
					scrollboxSizeBuggy = !support.scrollboxSize() &&
						styles.position === "absolute",

					// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
					boxSizingNeeded = scrollboxSizeBuggy || extra,
					isBorderBox = boxSizingNeeded &&
						jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					subtract = extra ?
						boxModelAdjustment(
							elem,
							dimension,
							extra,
							isBorderBox,
							styles
						) :
						0;

				// Account for unreliable border-box dimensions by comparing offset* to computed and
				// faking a content-box to get border and padding (gh-3699)
				if ( isBorderBox && scrollboxSizeBuggy ) {
					subtract -= Math.ceil(
						elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
						parseFloat( styles[ dimension ] ) -
						boxModelAdjustment( elem, dimension, "border", false, styles ) -
						0.5
					);
				}

				// Convert to pixels if value adjustment is needed
				if ( subtract && ( matches = rcssNum.exec( value ) ) &&
					( matches[ 3 ] || "px" ) !== "px" ) {

					elem.style[ dimension ] = value;
					value = jQuery.css( elem, dimension );
				}

				return setPositiveNumber( elem, value, subtract );
			}
		};
	} );

	jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
		function( elem, computed ) {
			if ( computed ) {
				return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
					elem.getBoundingClientRect().left -
						swap( elem, { marginLeft: 0 }, function() {
							return elem.getBoundingClientRect().left;
						} )
				) + "px";
			}
		}
	);

	// These hooks are used by animate to expand properties
	jQuery.each( {
		margin: "",
		padding: "",
		border: "Width"
	}, function( prefix, suffix ) {
		jQuery.cssHooks[ prefix + suffix ] = {
			expand: function( value ) {
				var i = 0,
					expanded = {},

					// Assumes a single number if not a string
					parts = typeof value === "string" ? value.split( " " ) : [ value ];

				for ( ; i < 4; i++ ) {
					expanded[ prefix + cssExpand[ i ] + suffix ] =
						parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
				}

				return expanded;
			}
		};

		if ( prefix !== "margin" ) {
			jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
		}
	} );

	jQuery.fn.extend( {
		css: function( name, value ) {
			return access( this, function( elem, name, value ) {
				var styles, len,
					map = {},
					i = 0;

				if ( Array.isArray( name ) ) {
					styles = getStyles( elem );
					len = name.length;

					for ( ; i < len; i++ ) {
						map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
					}

					return map;
				}

				return value !== undefined ?
					jQuery.style( elem, name, value ) :
					jQuery.css( elem, name );
			}, name, value, arguments.length > 1 );
		}
	} );


	function Tween( elem, options, prop, end, easing ) {
		return new Tween.prototype.init( elem, options, prop, end, easing );
	}
	jQuery.Tween = Tween;

	Tween.prototype = {
		constructor: Tween,
		init: function( elem, options, prop, end, easing, unit ) {
			this.elem = elem;
			this.prop = prop;
			this.easing = easing || jQuery.easing._default;
			this.options = options;
			this.start = this.now = this.cur();
			this.end = end;
			this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
		},
		cur: function() {
			var hooks = Tween.propHooks[ this.prop ];

			return hooks && hooks.get ?
				hooks.get( this ) :
				Tween.propHooks._default.get( this );
		},
		run: function( percent ) {
			var eased,
				hooks = Tween.propHooks[ this.prop ];

			if ( this.options.duration ) {
				this.pos = eased = jQuery.easing[ this.easing ](
					percent, this.options.duration * percent, 0, 1, this.options.duration
				);
			} else {
				this.pos = eased = percent;
			}
			this.now = ( this.end - this.start ) * eased + this.start;

			if ( this.options.step ) {
				this.options.step.call( this.elem, this.now, this );
			}

			if ( hooks && hooks.set ) {
				hooks.set( this );
			} else {
				Tween.propHooks._default.set( this );
			}
			return this;
		}
	};

	Tween.prototype.init.prototype = Tween.prototype;

	Tween.propHooks = {
		_default: {
			get: function( tween ) {
				var result;

				// Use a property on the element directly when it is not a DOM element,
				// or when there is no matching style property that exists.
				if ( tween.elem.nodeType !== 1 ||
					tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
					return tween.elem[ tween.prop ];
				}

				// Passing an empty string as a 3rd parameter to .css will automatically
				// attempt a parseFloat and fallback to a string if the parse fails.
				// Simple values such as "10px" are parsed to Float;
				// complex values such as "rotate(1rad)" are returned as-is.
				result = jQuery.css( tween.elem, tween.prop, "" );

				// Empty strings, null, undefined and "auto" are converted to 0.
				return !result || result === "auto" ? 0 : result;
			},
			set: function( tween ) {

				// Use step hook for back compat.
				// Use cssHook if its there.
				// Use .style if available and use plain properties where available.
				if ( jQuery.fx.step[ tween.prop ] ) {
					jQuery.fx.step[ tween.prop ]( tween );
				} else if ( tween.elem.nodeType === 1 && (
					jQuery.cssHooks[ tween.prop ] ||
						tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
					jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
				} else {
					tween.elem[ tween.prop ] = tween.now;
				}
			}
		}
	};

	// Support: IE <=9 only
	// Panic based approach to setting things on disconnected nodes
	Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
		set: function( tween ) {
			if ( tween.elem.nodeType && tween.elem.parentNode ) {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	};

	jQuery.easing = {
		linear: function( p ) {
			return p;
		},
		swing: function( p ) {
			return 0.5 - Math.cos( p * Math.PI ) / 2;
		},
		_default: "swing"
	};

	jQuery.fx = Tween.prototype.init;

	// Back compat <1.8 extension point
	jQuery.fx.step = {};




	var
		fxNow, inProgress,
		rfxtypes = /^(?:toggle|show|hide)$/,
		rrun = /queueHooks$/;

	function schedule() {
		if ( inProgress ) {
			if ( document.hidden === false && window.requestAnimationFrame ) {
				window.requestAnimationFrame( schedule );
			} else {
				window.setTimeout( schedule, jQuery.fx.interval );
			}

			jQuery.fx.tick();
		}
	}

	// Animations created synchronously will run synchronously
	function createFxNow() {
		window.setTimeout( function() {
			fxNow = undefined;
		} );
		return ( fxNow = Date.now() );
	}

	// Generate parameters to create a standard animation
	function genFx( type, includeWidth ) {
		var which,
			i = 0,
			attrs = { height: type };

		// If we include width, step value is 1 to do all cssExpand values,
		// otherwise step value is 2 to skip over Left and Right
		includeWidth = includeWidth ? 1 : 0;
		for ( ; i < 4; i += 2 - includeWidth ) {
			which = cssExpand[ i ];
			attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
		}

		if ( includeWidth ) {
			attrs.opacity = attrs.width = type;
		}

		return attrs;
	}

	function createTween( value, prop, animation ) {
		var tween,
			collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

				// We're done with this property
				return tween;
			}
		}
	}

	function defaultPrefilter( elem, props, opts ) {
		var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
			isBox = "width" in props || "height" in props,
			anim = this,
			orig = {},
			style = elem.style,
			hidden = elem.nodeType && isHiddenWithinTree( elem ),
			dataShow = dataPriv.get( elem, "fxshow" );

		// Queue-skipping animations hijack the fx hooks
		if ( !opts.queue ) {
			hooks = jQuery._queueHooks( elem, "fx" );
			if ( hooks.unqueued == null ) {
				hooks.unqueued = 0;
				oldfire = hooks.empty.fire;
				hooks.empty.fire = function() {
					if ( !hooks.unqueued ) {
						oldfire();
					}
				};
			}
			hooks.unqueued++;

			anim.always( function() {

				// Ensure the complete handler is called before this completes
				anim.always( function() {
					hooks.unqueued--;
					if ( !jQuery.queue( elem, "fx" ).length ) {
						hooks.empty.fire();
					}
				} );
			} );
		}

		// Detect show/hide animations
		for ( prop in props ) {
			value = props[ prop ];
			if ( rfxtypes.test( value ) ) {
				delete props[ prop ];
				toggle = toggle || value === "toggle";
				if ( value === ( hidden ? "hide" : "show" ) ) {

					// Pretend to be hidden if this is a "show" and
					// there is still data from a stopped show/hide
					if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
						hidden = true;

					// Ignore all other no-op show/hide data
					} else {
						continue;
					}
				}
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
			}
		}

		// Bail out if this is a no-op like .hide().hide()
		propTween = !jQuery.isEmptyObject( props );
		if ( !propTween && jQuery.isEmptyObject( orig ) ) {
			return;
		}

		// Restrict "overflow" and "display" styles during box animations
		if ( isBox && elem.nodeType === 1 ) {

			// Support: IE <=9 - 11, Edge 12 - 15
			// Record all 3 overflow attributes because IE does not infer the shorthand
			// from identically-valued overflowX and overflowY and Edge just mirrors
			// the overflowX value there.
			opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

			// Identify a display type, preferring old show/hide data over the CSS cascade
			restoreDisplay = dataShow && dataShow.display;
			if ( restoreDisplay == null ) {
				restoreDisplay = dataPriv.get( elem, "display" );
			}
			display = jQuery.css( elem, "display" );
			if ( display === "none" ) {
				if ( restoreDisplay ) {
					display = restoreDisplay;
				} else {

					// Get nonempty value(s) by temporarily forcing visibility
					showHide( [ elem ], true );
					restoreDisplay = elem.style.display || restoreDisplay;
					display = jQuery.css( elem, "display" );
					showHide( [ elem ] );
				}
			}

			// Animate inline elements as inline-block
			if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
				if ( jQuery.css( elem, "float" ) === "none" ) {

					// Restore the original display value at the end of pure show/hide animations
					if ( !propTween ) {
						anim.done( function() {
							style.display = restoreDisplay;
						} );
						if ( restoreDisplay == null ) {
							display = style.display;
							restoreDisplay = display === "none" ? "" : display;
						}
					}
					style.display = "inline-block";
				}
			}
		}

		if ( opts.overflow ) {
			style.overflow = "hidden";
			anim.always( function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			} );
		}

		// Implement show/hide animations
		propTween = false;
		for ( prop in orig ) {

			// General show/hide setup for this element animation
			if ( !propTween ) {
				if ( dataShow ) {
					if ( "hidden" in dataShow ) {
						hidden = dataShow.hidden;
					}
				} else {
					dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
				}

				// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
				if ( toggle ) {
					dataShow.hidden = !hidden;
				}

				// Show elements before animating them
				if ( hidden ) {
					showHide( [ elem ], true );
				}

				/* eslint-disable no-loop-func */

				anim.done( function() {

					/* eslint-enable no-loop-func */

					// The final step of a "hide" animation is actually hiding the element
					if ( !hidden ) {
						showHide( [ elem ] );
					}
					dataPriv.remove( elem, "fxshow" );
					for ( prop in orig ) {
						jQuery.style( elem, prop, orig[ prop ] );
					}
				} );
			}

			// Per-property setup
			propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = propTween.start;
				if ( hidden ) {
					propTween.end = propTween.start;
					propTween.start = 0;
				}
			}
		}
	}

	function propFilter( props, specialEasing ) {
		var index, name, easing, value, hooks;

		// camelCase, specialEasing and expand cssHook pass
		for ( index in props ) {
			name = camelCase( index );
			easing = specialEasing[ name ];
			value = props[ index ];
			if ( Array.isArray( value ) ) {
				easing = value[ 1 ];
				value = props[ index ] = value[ 0 ];
			}

			if ( index !== name ) {
				props[ name ] = value;
				delete props[ index ];
			}

			hooks = jQuery.cssHooks[ name ];
			if ( hooks && "expand" in hooks ) {
				value = hooks.expand( value );
				delete props[ name ];

				// Not quite $.extend, this won't overwrite existing keys.
				// Reusing 'index' because we have the correct "name"
				for ( index in value ) {
					if ( !( index in props ) ) {
						props[ index ] = value[ index ];
						specialEasing[ index ] = easing;
					}
				}
			} else {
				specialEasing[ name ] = easing;
			}
		}
	}

	function Animation( elem, properties, options ) {
		var result,
			stopped,
			index = 0,
			length = Animation.prefilters.length,
			deferred = jQuery.Deferred().always( function() {

				// Don't match elem in the :animated selector
				delete tick.elem;
			} ),
			tick = function() {
				if ( stopped ) {
					return false;
				}
				var currentTime = fxNow || createFxNow(),
					remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

					// Support: Android 2.3 only
					// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
					temp = remaining / animation.duration || 0,
					percent = 1 - temp,
					index = 0,
					length = animation.tweens.length;

				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( percent );
				}

				deferred.notifyWith( elem, [ animation, percent, remaining ] );

				// If there's more to do, yield
				if ( percent < 1 && length ) {
					return remaining;
				}

				// If this was an empty animation, synthesize a final progress notification
				if ( !length ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
				}

				// Resolve the animation and report its conclusion
				deferred.resolveWith( elem, [ animation ] );
				return false;
			},
			animation = deferred.promise( {
				elem: elem,
				props: jQuery.extend( {}, properties ),
				opts: jQuery.extend( true, {
					specialEasing: {},
					easing: jQuery.easing._default
				}, options ),
				originalProperties: properties,
				originalOptions: options,
				startTime: fxNow || createFxNow(),
				duration: options.duration,
				tweens: [],
				createTween: function( prop, end ) {
					var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
					animation.tweens.push( tween );
					return tween;
				},
				stop: function( gotoEnd ) {
					var index = 0,

						// If we are going to the end, we want to run all the tweens
						// otherwise we skip this part
						length = gotoEnd ? animation.tweens.length : 0;
					if ( stopped ) {
						return this;
					}
					stopped = true;
					for ( ; index < length; index++ ) {
						animation.tweens[ index ].run( 1 );
					}

					// Resolve when we played the last frame; otherwise, reject
					if ( gotoEnd ) {
						deferred.notifyWith( elem, [ animation, 1, 0 ] );
						deferred.resolveWith( elem, [ animation, gotoEnd ] );
					} else {
						deferred.rejectWith( elem, [ animation, gotoEnd ] );
					}
					return this;
				}
			} ),
			props = animation.props;

		propFilter( props, animation.opts.specialEasing );

		for ( ; index < length; index++ ) {
			result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
			if ( result ) {
				if ( isFunction( result.stop ) ) {
					jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
						result.stop.bind( result );
				}
				return result;
			}
		}

		jQuery.map( props, createTween, animation );

		if ( isFunction( animation.opts.start ) ) {
			animation.opts.start.call( elem, animation );
		}

		// Attach callbacks from options
		animation
			.progress( animation.opts.progress )
			.done( animation.opts.done, animation.opts.complete )
			.fail( animation.opts.fail )
			.always( animation.opts.always );

		jQuery.fx.timer(
			jQuery.extend( tick, {
				elem: elem,
				anim: animation,
				queue: animation.opts.queue
			} )
		);

		return animation;
	}

	jQuery.Animation = jQuery.extend( Animation, {

		tweeners: {
			"*": [ function( prop, value ) {
				var tween = this.createTween( prop, value );
				adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
				return tween;
			} ]
		},

		tweener: function( props, callback ) {
			if ( isFunction( props ) ) {
				callback = props;
				props = [ "*" ];
			} else {
				props = props.match( rnothtmlwhite );
			}

			var prop,
				index = 0,
				length = props.length;

			for ( ; index < length; index++ ) {
				prop = props[ index ];
				Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
				Animation.tweeners[ prop ].unshift( callback );
			}
		},

		prefilters: [ defaultPrefilter ],

		prefilter: function( callback, prepend ) {
			if ( prepend ) {
				Animation.prefilters.unshift( callback );
			} else {
				Animation.prefilters.push( callback );
			}
		}
	} );

	jQuery.speed = function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
			complete: fn || !fn && easing ||
				isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !isFunction( easing ) && easing
		};

		// Go to the end state if fx are off
		if ( jQuery.fx.off ) {
			opt.duration = 0;

		} else {
			if ( typeof opt.duration !== "number" ) {
				if ( opt.duration in jQuery.fx.speeds ) {
					opt.duration = jQuery.fx.speeds[ opt.duration ];

				} else {
					opt.duration = jQuery.fx.speeds._default;
				}
			}
		}

		// Normalize opt.queue - true/undefined/null -> "fx"
		if ( opt.queue == null || opt.queue === true ) {
			opt.queue = "fx";
		}

		// Queueing
		opt.old = opt.complete;

		opt.complete = function() {
			if ( isFunction( opt.old ) ) {
				opt.old.call( this );
			}

			if ( opt.queue ) {
				jQuery.dequeue( this, opt.queue );
			}
		};

		return opt;
	};

	jQuery.fn.extend( {
		fadeTo: function( speed, to, easing, callback ) {

			// Show any hidden elements after setting opacity to 0
			return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

				// Animate to the value specified
				.end().animate( { opacity: to }, speed, easing, callback );
		},
		animate: function( prop, speed, easing, callback ) {
			var empty = jQuery.isEmptyObject( prop ),
				optall = jQuery.speed( speed, easing, callback ),
				doAnimation = function() {

					// Operate on a copy of prop so per-property easing won't be lost
					var anim = Animation( this, jQuery.extend( {}, prop ), optall );

					// Empty animations, or finishing resolves immediately
					if ( empty || dataPriv.get( this, "finish" ) ) {
						anim.stop( true );
					}
				};

			doAnimation.finish = doAnimation;

			return empty || optall.queue === false ?
				this.each( doAnimation ) :
				this.queue( optall.queue, doAnimation );
		},
		stop: function( type, clearQueue, gotoEnd ) {
			var stopQueue = function( hooks ) {
				var stop = hooks.stop;
				delete hooks.stop;
				stop( gotoEnd );
			};

			if ( typeof type !== "string" ) {
				gotoEnd = clearQueue;
				clearQueue = type;
				type = undefined;
			}
			if ( clearQueue ) {
				this.queue( type || "fx", [] );
			}

			return this.each( function() {
				var dequeue = true,
					index = type != null && type + "queueHooks",
					timers = jQuery.timers,
					data = dataPriv.get( this );

				if ( index ) {
					if ( data[ index ] && data[ index ].stop ) {
						stopQueue( data[ index ] );
					}
				} else {
					for ( index in data ) {
						if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
							stopQueue( data[ index ] );
						}
					}
				}

				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this &&
						( type == null || timers[ index ].queue === type ) ) {

						timers[ index ].anim.stop( gotoEnd );
						dequeue = false;
						timers.splice( index, 1 );
					}
				}

				// Start the next in the queue if the last step wasn't forced.
				// Timers currently will call their complete callbacks, which
				// will dequeue but only if they were gotoEnd.
				if ( dequeue || !gotoEnd ) {
					jQuery.dequeue( this, type );
				}
			} );
		},
		finish: function( type ) {
			if ( type !== false ) {
				type = type || "fx";
			}
			return this.each( function() {
				var index,
					data = dataPriv.get( this ),
					queue = data[ type + "queue" ],
					hooks = data[ type + "queueHooks" ],
					timers = jQuery.timers,
					length = queue ? queue.length : 0;

				// Enable finishing flag on private data
				data.finish = true;

				// Empty the queue first
				jQuery.queue( this, type, [] );

				if ( hooks && hooks.stop ) {
					hooks.stop.call( this, true );
				}

				// Look for any active animations, and finish them
				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
						timers[ index ].anim.stop( true );
						timers.splice( index, 1 );
					}
				}

				// Look for any animations in the old queue and finish them
				for ( index = 0; index < length; index++ ) {
					if ( queue[ index ] && queue[ index ].finish ) {
						queue[ index ].finish.call( this );
					}
				}

				// Turn off finishing flag
				delete data.finish;
			} );
		}
	} );

	jQuery.each( [ "toggle", "show", "hide" ], function( _i, name ) {
		var cssFn = jQuery.fn[ name ];
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return speed == null || typeof speed === "boolean" ?
				cssFn.apply( this, arguments ) :
				this.animate( genFx( name, true ), speed, easing, callback );
		};
	} );

	// Generate shortcuts for custom animations
	jQuery.each( {
		slideDown: genFx( "show" ),
		slideUp: genFx( "hide" ),
		slideToggle: genFx( "toggle" ),
		fadeIn: { opacity: "show" },
		fadeOut: { opacity: "hide" },
		fadeToggle: { opacity: "toggle" }
	}, function( name, props ) {
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return this.animate( props, speed, easing, callback );
		};
	} );

	jQuery.timers = [];
	jQuery.fx.tick = function() {
		var timer,
			i = 0,
			timers = jQuery.timers;

		fxNow = Date.now();

		for ( ; i < timers.length; i++ ) {
			timer = timers[ i ];

			// Run the timer and safely remove it when done (allowing for external removal)
			if ( !timer() && timers[ i ] === timer ) {
				timers.splice( i--, 1 );
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
		fxNow = undefined;
	};

	jQuery.fx.timer = function( timer ) {
		jQuery.timers.push( timer );
		jQuery.fx.start();
	};

	jQuery.fx.interval = 13;
	jQuery.fx.start = function() {
		if ( inProgress ) {
			return;
		}

		inProgress = true;
		schedule();
	};

	jQuery.fx.stop = function() {
		inProgress = null;
	};

	jQuery.fx.speeds = {
		slow: 600,
		fast: 200,

		// Default speed
		_default: 400
	};


	// Based off of the plugin by Clint Helfers, with permission.
	// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
	jQuery.fn.delay = function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = window.setTimeout( next, time );
			hooks.stop = function() {
				window.clearTimeout( timeout );
			};
		} );
	};


	( function() {
		var input = document.createElement( "input" ),
			select = document.createElement( "select" ),
			opt = select.appendChild( document.createElement( "option" ) );

		input.type = "checkbox";

		// Support: Android <=4.3 only
		// Default value for a checkbox should be "on"
		support.checkOn = input.value !== "";

		// Support: IE <=11 only
		// Must access selectedIndex to make default options select
		support.optSelected = opt.selected;

		// Support: IE <=11 only
		// An input loses its value after becoming a radio
		input = document.createElement( "input" );
		input.value = "t";
		input.type = "radio";
		support.radioValue = input.value === "t";
	} )();


	var boolHook,
		attrHandle = jQuery.expr.attrHandle;

	jQuery.fn.extend( {
		attr: function( name, value ) {
			return access( this, jQuery.attr, name, value, arguments.length > 1 );
		},

		removeAttr: function( name ) {
			return this.each( function() {
				jQuery.removeAttr( this, name );
			} );
		}
	} );

	jQuery.extend( {
		attr: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set attributes on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			// Fallback to prop when attributes are not supported
			if ( typeof elem.getAttribute === "undefined" ) {
				return jQuery.prop( elem, name, value );
			}

			// Attribute hooks are determined by the lowercase version
			// Grab necessary hook if one is defined
			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
				hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
					( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
			}

			if ( value !== undefined ) {
				if ( value === null ) {
					jQuery.removeAttr( elem, name );
					return;
				}

				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				elem.setAttribute( name, value + "" );
				return value;
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ? undefined : ret;
		},

		attrHooks: {
			type: {
				set: function( elem, value ) {
					if ( !support.radioValue && value === "radio" &&
						nodeName( elem, "input" ) ) {
						var val = elem.value;
						elem.setAttribute( "type", value );
						if ( val ) {
							elem.value = val;
						}
						return value;
					}
				}
			}
		},

		removeAttr: function( elem, value ) {
			var name,
				i = 0,

				// Attribute names can contain non-HTML whitespace characters
				// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
				attrNames = value && value.match( rnothtmlwhite );

			if ( attrNames && elem.nodeType === 1 ) {
				while ( ( name = attrNames[ i++ ] ) ) {
					elem.removeAttribute( name );
				}
			}
		}
	} );

	// Hooks for boolean attributes
	boolHook = {
		set: function( elem, value, name ) {
			if ( value === false ) {

				// Remove boolean attributes when set to false
				jQuery.removeAttr( elem, name );
			} else {
				elem.setAttribute( name, name );
			}
			return name;
		}
	};

	jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( _i, name ) {
		var getter = attrHandle[ name ] || jQuery.find.attr;

		attrHandle[ name ] = function( elem, name, isXML ) {
			var ret, handle,
				lowercaseName = name.toLowerCase();

			if ( !isXML ) {

				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ lowercaseName ];
				attrHandle[ lowercaseName ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					lowercaseName :
					null;
				attrHandle[ lowercaseName ] = handle;
			}
			return ret;
		};
	} );




	var rfocusable = /^(?:input|select|textarea|button)$/i,
		rclickable = /^(?:a|area)$/i;

	jQuery.fn.extend( {
		prop: function( name, value ) {
			return access( this, jQuery.prop, name, value, arguments.length > 1 );
		},

		removeProp: function( name ) {
			return this.each( function() {
				delete this[ jQuery.propFix[ name ] || name ];
			} );
		}
	} );

	jQuery.extend( {
		prop: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set properties on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

				// Fix name and attach hooks
				name = jQuery.propFix[ name ] || name;
				hooks = jQuery.propHooks[ name ];
			}

			if ( value !== undefined ) {
				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				return ( elem[ name ] = value );
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			return elem[ name ];
		},

		propHooks: {
			tabIndex: {
				get: function( elem ) {

					// Support: IE <=9 - 11 only
					// elem.tabIndex doesn't always return the
					// correct value when it hasn't been explicitly set
					// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
					// Use proper attribute retrieval(#12072)
					var tabindex = jQuery.find.attr( elem, "tabindex" );

					if ( tabindex ) {
						return parseInt( tabindex, 10 );
					}

					if (
						rfocusable.test( elem.nodeName ) ||
						rclickable.test( elem.nodeName ) &&
						elem.href
					) {
						return 0;
					}

					return -1;
				}
			}
		},

		propFix: {
			"for": "htmlFor",
			"class": "className"
		}
	} );

	// Support: IE <=11 only
	// Accessing the selectedIndex property
	// forces the browser to respect setting selected
	// on the option
	// The getter ensures a default option is selected
	// when in an optgroup
	// eslint rule "no-unused-expressions" is disabled for this code
	// since it considers such accessions noop
	if ( !support.optSelected ) {
		jQuery.propHooks.selected = {
			get: function( elem ) {

				/* eslint no-unused-expressions: "off" */

				var parent = elem.parentNode;
				if ( parent && parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
				return null;
			},
			set: function( elem ) {

				/* eslint no-unused-expressions: "off" */

				var parent = elem.parentNode;
				if ( parent ) {
					parent.selectedIndex;

					if ( parent.parentNode ) {
						parent.parentNode.selectedIndex;
					}
				}
			}
		};
	}

	jQuery.each( [
		"tabIndex",
		"readOnly",
		"maxLength",
		"cellSpacing",
		"cellPadding",
		"rowSpan",
		"colSpan",
		"useMap",
		"frameBorder",
		"contentEditable"
	], function() {
		jQuery.propFix[ this.toLowerCase() ] = this;
	} );




		// Strip and collapse whitespace according to HTML spec
		// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
		function stripAndCollapse( value ) {
			var tokens = value.match( rnothtmlwhite ) || [];
			return tokens.join( " " );
		}


	function getClass( elem ) {
		return elem.getAttribute && elem.getAttribute( "class" ) || "";
	}

	function classesToArray( value ) {
		if ( Array.isArray( value ) ) {
			return value;
		}
		if ( typeof value === "string" ) {
			return value.match( rnothtmlwhite ) || [];
		}
		return [];
	}

	jQuery.fn.extend( {
		addClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;

			if ( isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			classes = classesToArray( value );

			if ( classes.length ) {
				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );
					cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {
							if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
								cur += clazz + " ";
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = stripAndCollapse( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}

			return this;
		},

		removeClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;

			if ( isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			if ( !arguments.length ) {
				return this.attr( "class", "" );
			}

			classes = classesToArray( value );

			if ( classes.length ) {
				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );

					// This expression is here for better compressibility (see addClass)
					cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {

							// Remove *all* instances
							while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
								cur = cur.replace( " " + clazz + " ", " " );
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = stripAndCollapse( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}

			return this;
		},

		toggleClass: function( value, stateVal ) {
			var type = typeof value,
				isValidValue = type === "string" || Array.isArray( value );

			if ( typeof stateVal === "boolean" && isValidValue ) {
				return stateVal ? this.addClass( value ) : this.removeClass( value );
			}

			if ( isFunction( value ) ) {
				return this.each( function( i ) {
					jQuery( this ).toggleClass(
						value.call( this, i, getClass( this ), stateVal ),
						stateVal
					);
				} );
			}

			return this.each( function() {
				var className, i, self, classNames;

				if ( isValidValue ) {

					// Toggle individual class names
					i = 0;
					self = jQuery( this );
					classNames = classesToArray( value );

					while ( ( className = classNames[ i++ ] ) ) {

						// Check each className given, space separated list
						if ( self.hasClass( className ) ) {
							self.removeClass( className );
						} else {
							self.addClass( className );
						}
					}

				// Toggle whole class name
				} else if ( value === undefined || type === "boolean" ) {
					className = getClass( this );
					if ( className ) {

						// Store className if set
						dataPriv.set( this, "__className__", className );
					}

					// If the element has a class name or if we're passed `false`,
					// then remove the whole classname (if there was one, the above saved it).
					// Otherwise bring back whatever was previously saved (if anything),
					// falling back to the empty string if nothing was stored.
					if ( this.setAttribute ) {
						this.setAttribute( "class",
							className || value === false ?
								"" :
								dataPriv.get( this, "__className__" ) || ""
						);
					}
				}
			} );
		},

		hasClass: function( selector ) {
			var className, elem,
				i = 0;

			className = " " + selector + " ";
			while ( ( elem = this[ i++ ] ) ) {
				if ( elem.nodeType === 1 &&
					( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
				}
			}

			return false;
		}
	} );




	var rreturn = /\r/g;

	jQuery.fn.extend( {
		val: function( value ) {
			var hooks, ret, valueIsFunction,
				elem = this[ 0 ];

			if ( !arguments.length ) {
				if ( elem ) {
					hooks = jQuery.valHooks[ elem.type ] ||
						jQuery.valHooks[ elem.nodeName.toLowerCase() ];

					if ( hooks &&
						"get" in hooks &&
						( ret = hooks.get( elem, "value" ) ) !== undefined
					) {
						return ret;
					}

					ret = elem.value;

					// Handle most common string cases
					if ( typeof ret === "string" ) {
						return ret.replace( rreturn, "" );
					}

					// Handle cases where value is null/undef or number
					return ret == null ? "" : ret;
				}

				return;
			}

			valueIsFunction = isFunction( value );

			return this.each( function( i ) {
				var val;

				if ( this.nodeType !== 1 ) {
					return;
				}

				if ( valueIsFunction ) {
					val = value.call( this, i, jQuery( this ).val() );
				} else {
					val = value;
				}

				// Treat null/undefined as ""; convert numbers to string
				if ( val == null ) {
					val = "";

				} else if ( typeof val === "number" ) {
					val += "";

				} else if ( Array.isArray( val ) ) {
					val = jQuery.map( val, function( value ) {
						return value == null ? "" : value + "";
					} );
				}

				hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

				// If set returns undefined, fall back to normal setting
				if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
					this.value = val;
				}
			} );
		}
	} );

	jQuery.extend( {
		valHooks: {
			option: {
				get: function( elem ) {

					var val = jQuery.find.attr( elem, "value" );
					return val != null ?
						val :

						// Support: IE <=10 - 11 only
						// option.text throws exceptions (#14686, #14858)
						// Strip and collapse whitespace
						// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
						stripAndCollapse( jQuery.text( elem ) );
				}
			},
			select: {
				get: function( elem ) {
					var value, option, i,
						options = elem.options,
						index = elem.selectedIndex,
						one = elem.type === "select-one",
						values = one ? null : [],
						max = one ? index + 1 : options.length;

					if ( index < 0 ) {
						i = max;

					} else {
						i = one ? index : 0;
					}

					// Loop through all the selected options
					for ( ; i < max; i++ ) {
						option = options[ i ];

						// Support: IE <=9 only
						// IE8-9 doesn't update selected after form reset (#2551)
						if ( ( option.selected || i === index ) &&

								// Don't return options that are disabled or in a disabled optgroup
								!option.disabled &&
								( !option.parentNode.disabled ||
									!nodeName( option.parentNode, "optgroup" ) ) ) {

							// Get the specific value for the option
							value = jQuery( option ).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;
				},

				set: function( elem, value ) {
					var optionSet, option,
						options = elem.options,
						values = jQuery.makeArray( value ),
						i = options.length;

					while ( i-- ) {
						option = options[ i ];

						/* eslint-disable no-cond-assign */

						if ( option.selected =
							jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
						) {
							optionSet = true;
						}

						/* eslint-enable no-cond-assign */
					}

					// Force browsers to behave consistently when non-matching value is set
					if ( !optionSet ) {
						elem.selectedIndex = -1;
					}
					return values;
				}
			}
		}
	} );

	// Radios and checkboxes getter/setter
	jQuery.each( [ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			set: function( elem, value ) {
				if ( Array.isArray( value ) ) {
					return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
				}
			}
		};
		if ( !support.checkOn ) {
			jQuery.valHooks[ this ].get = function( elem ) {
				return elem.getAttribute( "value" ) === null ? "on" : elem.value;
			};
		}
	} );




	// Return jQuery for attributes-only inclusion


	support.focusin = "onfocusin" in window;


	var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
		stopPropagationCallback = function( e ) {
			e.stopPropagation();
		};

	jQuery.extend( jQuery.event, {

		trigger: function( event, data, elem, onlyHandlers ) {

			var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
				eventPath = [ elem || document ],
				type = hasOwn.call( event, "type" ) ? event.type : event,
				namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

			cur = lastElement = tmp = elem = elem || document;

			// Don't do events on text and comment nodes
			if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
				return;
			}

			// focus/blur morphs to focusin/out; ensure we're not firing them right now
			if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
				return;
			}

			if ( type.indexOf( "." ) > -1 ) {

				// Namespaced trigger; create a regexp to match event type in handle()
				namespaces = type.split( "." );
				type = namespaces.shift();
				namespaces.sort();
			}
			ontype = type.indexOf( ":" ) < 0 && "on" + type;

			// Caller can pass in a jQuery.Event object, Object, or just an event type string
			event = event[ jQuery.expando ] ?
				event :
				new jQuery.Event( type, typeof event === "object" && event );

			// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
			event.isTrigger = onlyHandlers ? 2 : 3;
			event.namespace = namespaces.join( "." );
			event.rnamespace = event.namespace ?
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
				null;

			// Clean up the event in case it is being reused
			event.result = undefined;
			if ( !event.target ) {
				event.target = elem;
			}

			// Clone any incoming data and prepend the event, creating the handler arg list
			data = data == null ?
				[ event ] :
				jQuery.makeArray( data, [ event ] );

			// Allow special events to draw outside the lines
			special = jQuery.event.special[ type ] || {};
			if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
				return;
			}

			// Determine event propagation path in advance, per W3C events spec (#9951)
			// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
			if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

				bubbleType = special.delegateType || type;
				if ( !rfocusMorph.test( bubbleType + type ) ) {
					cur = cur.parentNode;
				}
				for ( ; cur; cur = cur.parentNode ) {
					eventPath.push( cur );
					tmp = cur;
				}

				// Only add window if we got to document (e.g., not plain obj or detached DOM)
				if ( tmp === ( elem.ownerDocument || document ) ) {
					eventPath.push( tmp.defaultView || tmp.parentWindow || window );
				}
			}

			// Fire handlers on the event path
			i = 0;
			while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
				lastElement = cur;
				event.type = i > 1 ?
					bubbleType :
					special.bindType || type;

				// jQuery handler
				handle = ( dataPriv.get( cur, "events" ) || Object.create( null ) )[ event.type ] &&
					dataPriv.get( cur, "handle" );
				if ( handle ) {
					handle.apply( cur, data );
				}

				// Native handler
				handle = ontype && cur[ ontype ];
				if ( handle && handle.apply && acceptData( cur ) ) {
					event.result = handle.apply( cur, data );
					if ( event.result === false ) {
						event.preventDefault();
					}
				}
			}
			event.type = type;

			// If nobody prevented the default action, do it now
			if ( !onlyHandlers && !event.isDefaultPrevented() ) {

				if ( ( !special._default ||
					special._default.apply( eventPath.pop(), data ) === false ) &&
					acceptData( elem ) ) {

					// Call a native DOM method on the target with the same name as the event.
					// Don't do default actions on window, that's where global variables be (#6170)
					if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

						// Don't re-trigger an onFOO event when we call its FOO() method
						tmp = elem[ ontype ];

						if ( tmp ) {
							elem[ ontype ] = null;
						}

						// Prevent re-triggering of the same event, since we already bubbled it above
						jQuery.event.triggered = type;

						if ( event.isPropagationStopped() ) {
							lastElement.addEventListener( type, stopPropagationCallback );
						}

						elem[ type ]();

						if ( event.isPropagationStopped() ) {
							lastElement.removeEventListener( type, stopPropagationCallback );
						}

						jQuery.event.triggered = undefined;

						if ( tmp ) {
							elem[ ontype ] = tmp;
						}
					}
				}
			}

			return event.result;
		},

		// Piggyback on a donor event to simulate a different one
		// Used only for `focus(in | out)` events
		simulate: function( type, elem, event ) {
			var e = jQuery.extend(
				new jQuery.Event(),
				event,
				{
					type: type,
					isSimulated: true
				}
			);

			jQuery.event.trigger( e, null, elem );
		}

	} );

	jQuery.fn.extend( {

		trigger: function( type, data ) {
			return this.each( function() {
				jQuery.event.trigger( type, data, this );
			} );
		},
		triggerHandler: function( type, data ) {
			var elem = this[ 0 ];
			if ( elem ) {
				return jQuery.event.trigger( type, data, elem, true );
			}
		}
	} );


	// Support: Firefox <=44
	// Firefox doesn't have focus(in | out) events
	// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
	//
	// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
	// focus(in | out) events fire after focus & blur events,
	// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
	// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
	if ( !support.focusin ) {
		jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

			// Attach a single capturing handler on the document while someone wants focusin/focusout
			var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
			};

			jQuery.event.special[ fix ] = {
				setup: function() {

					// Handle: regular nodes (via `this.ownerDocument`), window
					// (via `this.document`) & document (via `this`).
					var doc = this.ownerDocument || this.document || this,
						attaches = dataPriv.access( doc, fix );

					if ( !attaches ) {
						doc.addEventListener( orig, handler, true );
					}
					dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
				},
				teardown: function() {
					var doc = this.ownerDocument || this.document || this,
						attaches = dataPriv.access( doc, fix ) - 1;

					if ( !attaches ) {
						doc.removeEventListener( orig, handler, true );
						dataPriv.remove( doc, fix );

					} else {
						dataPriv.access( doc, fix, attaches );
					}
				}
			};
		} );
	}
	var location = window.location;

	var nonce = { guid: Date.now() };

	var rquery = ( /\?/ );



	// Cross-browser xml parsing
	jQuery.parseXML = function( data ) {
		var xml, parserErrorElem;
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE 9 - 11 only
		// IE throws on parseFromString with invalid input.
		try {
			xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
		} catch ( e ) {}

		parserErrorElem = xml && xml.getElementsByTagName( "parsererror" )[ 0 ];
		if ( !xml || parserErrorElem ) {
			jQuery.error( "Invalid XML: " + (
				parserErrorElem ?
					jQuery.map( parserErrorElem.childNodes, function( el ) {
						return el.textContent;
					} ).join( "\n" ) :
					data
			) );
		}
		return xml;
	};


	var
		rbracket = /\[\]$/,
		rCRLF = /\r?\n/g,
		rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
		rsubmittable = /^(?:input|select|textarea|keygen)/i;

	function buildParams( prefix, obj, traditional, add ) {
		var name;

		if ( Array.isArray( obj ) ) {

			// Serialize array item.
			jQuery.each( obj, function( i, v ) {
				if ( traditional || rbracket.test( prefix ) ) {

					// Treat each array item as a scalar.
					add( prefix, v );

				} else {

					// Item is non-scalar (array or object), encode its numeric index.
					buildParams(
						prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
						v,
						traditional,
						add
					);
				}
			} );

		} else if ( !traditional && toType( obj ) === "object" ) {

			// Serialize object item.
			for ( name in obj ) {
				buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
			}

		} else {

			// Serialize scalar item.
			add( prefix, obj );
		}
	}

	// Serialize an array of form elements or a set of
	// key/values into a query string
	jQuery.param = function( a, traditional ) {
		var prefix,
			s = [],
			add = function( key, valueOrFunction ) {

				// If value is a function, invoke it and use its return value
				var value = isFunction( valueOrFunction ) ?
					valueOrFunction() :
					valueOrFunction;

				s[ s.length ] = encodeURIComponent( key ) + "=" +
					encodeURIComponent( value == null ? "" : value );
			};

		if ( a == null ) {
			return "";
		}

		// If an array was passed in, assume that it is an array of form elements.
		if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			} );

		} else {

			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( prefix in a ) {
				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join( "&" );
	};

	jQuery.fn.extend( {
		serialize: function() {
			return jQuery.param( this.serializeArray() );
		},
		serializeArray: function() {
			return this.map( function() {

				// Can add propHook for "elements" to filter or add form elements
				var elements = jQuery.prop( this, "elements" );
				return elements ? jQuery.makeArray( elements ) : this;
			} ).filter( function() {
				var type = this.type;

				// Use .is( ":disabled" ) so that fieldset[disabled] works
				return this.name && !jQuery( this ).is( ":disabled" ) &&
					rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
					( this.checked || !rcheckableType.test( type ) );
			} ).map( function( _i, elem ) {
				var val = jQuery( this ).val();

				if ( val == null ) {
					return null;
				}

				if ( Array.isArray( val ) ) {
					return jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					} );
				}

				return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
			} ).get();
		}
	} );


	var
		r20 = /%20/g,
		rhash = /#.*$/,
		rantiCache = /([?&])_=[^&]*/,
		rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

		// #7653, #8125, #8152: local protocol detection
		rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
		rnoContent = /^(?:GET|HEAD)$/,
		rprotocol = /^\/\//,

		/* Prefilters
		 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
		 * 2) These are called:
		 *    - BEFORE asking for a transport
		 *    - AFTER param serialization (s.data is a string if s.processData is true)
		 * 3) key is the dataType
		 * 4) the catchall symbol "*" can be used
		 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
		 */
		prefilters = {},

		/* Transports bindings
		 * 1) key is the dataType
		 * 2) the catchall symbol "*" can be used
		 * 3) selection will start with transport dataType and THEN go to "*" if needed
		 */
		transports = {},

		// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
		allTypes = "*/".concat( "*" ),

		// Anchor tag for parsing the document origin
		originAnchor = document.createElement( "a" );

	originAnchor.href = location.href;

	// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
	function addToPrefiltersOrTransports( structure ) {

		// dataTypeExpression is optional and defaults to "*"
		return function( dataTypeExpression, func ) {

			if ( typeof dataTypeExpression !== "string" ) {
				func = dataTypeExpression;
				dataTypeExpression = "*";
			}

			var dataType,
				i = 0,
				dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

			if ( isFunction( func ) ) {

				// For each dataType in the dataTypeExpression
				while ( ( dataType = dataTypes[ i++ ] ) ) {

					// Prepend if requested
					if ( dataType[ 0 ] === "+" ) {
						dataType = dataType.slice( 1 ) || "*";
						( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

					// Otherwise append
					} else {
						( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
					}
				}
			}
		};
	}

	// Base inspection function for prefilters and transports
	function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

		var inspected = {},
			seekingTransport = ( structure === transports );

		function inspect( dataType ) {
			var selected;
			inspected[ dataType ] = true;
			jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
				var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
				if ( typeof dataTypeOrTransport === "string" &&
					!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

					options.dataTypes.unshift( dataTypeOrTransport );
					inspect( dataTypeOrTransport );
					return false;
				} else if ( seekingTransport ) {
					return !( selected = dataTypeOrTransport );
				}
			} );
			return selected;
		}

		return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
	}

	// A special extend for ajax options
	// that takes "flat" options (not to be deep extended)
	// Fixes #9887
	function ajaxExtend( target, src ) {
		var key, deep,
			flatOptions = jQuery.ajaxSettings.flatOptions || {};

		for ( key in src ) {
			if ( src[ key ] !== undefined ) {
				( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
			}
		}
		if ( deep ) {
			jQuery.extend( true, target, deep );
		}

		return target;
	}

	/* Handles responses to an ajax request:
	 * - finds the right dataType (mediates between content-type and expected dataType)
	 * - returns the corresponding response
	 */
	function ajaxHandleResponses( s, jqXHR, responses ) {

		var ct, type, finalDataType, firstDataType,
			contents = s.contents,
			dataTypes = s.dataTypes;

		// Remove auto dataType and get content-type in the process
		while ( dataTypes[ 0 ] === "*" ) {
			dataTypes.shift();
			if ( ct === undefined ) {
				ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
			}
		}

		// Check if we're dealing with a known content-type
		if ( ct ) {
			for ( type in contents ) {
				if ( contents[ type ] && contents[ type ].test( ct ) ) {
					dataTypes.unshift( type );
					break;
				}
			}
		}

		// Check to see if we have a response for the expected dataType
		if ( dataTypes[ 0 ] in responses ) {
			finalDataType = dataTypes[ 0 ];
		} else {

			// Try convertible dataTypes
			for ( type in responses ) {
				if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
					finalDataType = type;
					break;
				}
				if ( !firstDataType ) {
					firstDataType = type;
				}
			}

			// Or just use first one
			finalDataType = finalDataType || firstDataType;
		}

		// If we found a dataType
		// We add the dataType to the list if needed
		// and return the corresponding response
		if ( finalDataType ) {
			if ( finalDataType !== dataTypes[ 0 ] ) {
				dataTypes.unshift( finalDataType );
			}
			return responses[ finalDataType ];
		}
	}

	/* Chain conversions given the request and the original response
	 * Also sets the responseXXX fields on the jqXHR instance
	 */
	function ajaxConvert( s, response, jqXHR, isSuccess ) {
		var conv2, current, conv, tmp, prev,
			converters = {},

			// Work with a copy of dataTypes in case we need to modify it for conversion
			dataTypes = s.dataTypes.slice();

		// Create converters map with lowercased keys
		if ( dataTypes[ 1 ] ) {
			for ( conv in s.converters ) {
				converters[ conv.toLowerCase() ] = s.converters[ conv ];
			}
		}

		current = dataTypes.shift();

		// Convert to each sequential dataType
		while ( current ) {

			if ( s.responseFields[ current ] ) {
				jqXHR[ s.responseFields[ current ] ] = response;
			}

			// Apply the dataFilter if provided
			if ( !prev && isSuccess && s.dataFilter ) {
				response = s.dataFilter( response, s.dataType );
			}

			prev = current;
			current = dataTypes.shift();

			if ( current ) {

				// There's only work to do if current dataType is non-auto
				if ( current === "*" ) {

					current = prev;

				// Convert response if prev dataType is non-auto and differs from current
				} else if ( prev !== "*" && prev !== current ) {

					// Seek a direct converter
					conv = converters[ prev + " " + current ] || converters[ "* " + current ];

					// If none found, seek a pair
					if ( !conv ) {
						for ( conv2 in converters ) {

							// If conv2 outputs current
							tmp = conv2.split( " " );
							if ( tmp[ 1 ] === current ) {

								// If prev can be converted to accepted input
								conv = converters[ prev + " " + tmp[ 0 ] ] ||
									converters[ "* " + tmp[ 0 ] ];
								if ( conv ) {

									// Condense equivalence converters
									if ( conv === true ) {
										conv = converters[ conv2 ];

									// Otherwise, insert the intermediate dataType
									} else if ( converters[ conv2 ] !== true ) {
										current = tmp[ 0 ];
										dataTypes.unshift( tmp[ 1 ] );
									}
									break;
								}
							}
						}
					}

					// Apply converter (if not an equivalence)
					if ( conv !== true ) {

						// Unless errors are allowed to bubble, catch and return them
						if ( conv && s.throws ) {
							response = conv( response );
						} else {
							try {
								response = conv( response );
							} catch ( e ) {
								return {
									state: "parsererror",
									error: conv ? e : "No conversion from " + prev + " to " + current
								};
							}
						}
					}
				}
			}
		}

		return { state: "success", data: response };
	}

	jQuery.extend( {

		// Counter for holding the number of active queries
		active: 0,

		// Last-Modified header cache for next request
		lastModified: {},
		etag: {},

		ajaxSettings: {
			url: location.href,
			type: "GET",
			isLocal: rlocalProtocol.test( location.protocol ),
			global: true,
			processData: true,
			async: true,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",

			/*
			timeout: 0,
			data: null,
			dataType: null,
			username: null,
			password: null,
			cache: null,
			throws: false,
			traditional: false,
			headers: {},
			*/

			accepts: {
				"*": allTypes,
				text: "text/plain",
				html: "text/html",
				xml: "application/xml, text/xml",
				json: "application/json, text/javascript"
			},

			contents: {
				xml: /\bxml\b/,
				html: /\bhtml/,
				json: /\bjson\b/
			},

			responseFields: {
				xml: "responseXML",
				text: "responseText",
				json: "responseJSON"
			},

			// Data converters
			// Keys separate source (or catchall "*") and destination types with a single space
			converters: {

				// Convert anything to text
				"* text": String,

				// Text to html (true = no transformation)
				"text html": true,

				// Evaluate text as a json expression
				"text json": JSON.parse,

				// Parse text as xml
				"text xml": jQuery.parseXML
			},

			// For options that shouldn't be deep extended:
			// you can add your own custom options here if
			// and when you create one that shouldn't be
			// deep extended (see ajaxExtend)
			flatOptions: {
				url: true,
				context: true
			}
		},

		// Creates a full fledged settings object into target
		// with both ajaxSettings and settings fields.
		// If target is omitted, writes into ajaxSettings.
		ajaxSetup: function( target, settings ) {
			return settings ?

				// Building a settings object
				ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

				// Extending ajaxSettings
				ajaxExtend( jQuery.ajaxSettings, target );
		},

		ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
		ajaxTransport: addToPrefiltersOrTransports( transports ),

		// Main method
		ajax: function( url, options ) {

			// If url is an object, simulate pre-1.5 signature
			if ( typeof url === "object" ) {
				options = url;
				url = undefined;
			}

			// Force options to be an object
			options = options || {};

			var transport,

				// URL without anti-cache param
				cacheURL,

				// Response headers
				responseHeadersString,
				responseHeaders,

				// timeout handle
				timeoutTimer,

				// Url cleanup var
				urlAnchor,

				// Request state (becomes false upon send and true upon completion)
				completed,

				// To know if global events are to be dispatched
				fireGlobals,

				// Loop variable
				i,

				// uncached part of the url
				uncached,

				// Create the final options object
				s = jQuery.ajaxSetup( {}, options ),

				// Callbacks context
				callbackContext = s.context || s,

				// Context for global events is callbackContext if it is a DOM node or jQuery collection
				globalEventContext = s.context &&
					( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

				// Deferreds
				deferred = jQuery.Deferred(),
				completeDeferred = jQuery.Callbacks( "once memory" ),

				// Status-dependent callbacks
				statusCode = s.statusCode || {},

				// Headers (they are sent all at once)
				requestHeaders = {},
				requestHeadersNames = {},

				// Default abort message
				strAbort = "canceled",

				// Fake xhr
				jqXHR = {
					readyState: 0,

					// Builds headers hashtable if needed
					getResponseHeader: function( key ) {
						var match;
						if ( completed ) {
							if ( !responseHeaders ) {
								responseHeaders = {};
								while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
									responseHeaders[ match[ 1 ].toLowerCase() + " " ] =
										( responseHeaders[ match[ 1 ].toLowerCase() + " " ] || [] )
											.concat( match[ 2 ] );
								}
							}
							match = responseHeaders[ key.toLowerCase() + " " ];
						}
						return match == null ? null : match.join( ", " );
					},

					// Raw string
					getAllResponseHeaders: function() {
						return completed ? responseHeadersString : null;
					},

					// Caches the header
					setRequestHeader: function( name, value ) {
						if ( completed == null ) {
							name = requestHeadersNames[ name.toLowerCase() ] =
								requestHeadersNames[ name.toLowerCase() ] || name;
							requestHeaders[ name ] = value;
						}
						return this;
					},

					// Overrides response content-type header
					overrideMimeType: function( type ) {
						if ( completed == null ) {
							s.mimeType = type;
						}
						return this;
					},

					// Status-dependent callbacks
					statusCode: function( map ) {
						var code;
						if ( map ) {
							if ( completed ) {

								// Execute the appropriate callbacks
								jqXHR.always( map[ jqXHR.status ] );
							} else {

								// Lazy-add the new callbacks in a way that preserves old ones
								for ( code in map ) {
									statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
								}
							}
						}
						return this;
					},

					// Cancel the request
					abort: function( statusText ) {
						var finalText = statusText || strAbort;
						if ( transport ) {
							transport.abort( finalText );
						}
						done( 0, finalText );
						return this;
					}
				};

			// Attach deferreds
			deferred.promise( jqXHR );

			// Add protocol if not provided (prefilters might expect it)
			// Handle falsy url in the settings object (#10093: consistency with old signature)
			// We also use the url parameter if available
			s.url = ( ( url || s.url || location.href ) + "" )
				.replace( rprotocol, location.protocol + "//" );

			// Alias method option to type as per ticket #12004
			s.type = options.method || options.type || s.method || s.type;

			// Extract dataTypes list
			s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

			// A cross-domain request is in order when the origin doesn't match the current origin.
			if ( s.crossDomain == null ) {
				urlAnchor = document.createElement( "a" );

				// Support: IE <=8 - 11, Edge 12 - 15
				// IE throws exception on accessing the href property if url is malformed,
				// e.g. http://example.com:80x/
				try {
					urlAnchor.href = s.url;

					// Support: IE <=8 - 11 only
					// Anchor's host property isn't correctly set when s.url is relative
					urlAnchor.href = urlAnchor.href;
					s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
						urlAnchor.protocol + "//" + urlAnchor.host;
				} catch ( e ) {

					// If there is an error parsing the URL, assume it is crossDomain,
					// it can be rejected by the transport if it is invalid
					s.crossDomain = true;
				}
			}

			// Convert data if not already a string
			if ( s.data && s.processData && typeof s.data !== "string" ) {
				s.data = jQuery.param( s.data, s.traditional );
			}

			// Apply prefilters
			inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

			// If request was aborted inside a prefilter, stop there
			if ( completed ) {
				return jqXHR;
			}

			// We can fire global events as of now if asked to
			// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
			fireGlobals = jQuery.event && s.global;

			// Watch for a new set of requests
			if ( fireGlobals && jQuery.active++ === 0 ) {
				jQuery.event.trigger( "ajaxStart" );
			}

			// Uppercase the type
			s.type = s.type.toUpperCase();

			// Determine if request has content
			s.hasContent = !rnoContent.test( s.type );

			// Save the URL in case we're toying with the If-Modified-Since
			// and/or If-None-Match header later on
			// Remove hash to simplify url manipulation
			cacheURL = s.url.replace( rhash, "" );

			// More options handling for requests with no content
			if ( !s.hasContent ) {

				// Remember the hash so we can put it back
				uncached = s.url.slice( cacheURL.length );

				// If data is available and should be processed, append data to url
				if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
					cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

					// #9682: remove data so that it's not used in an eventual retry
					delete s.data;
				}

				// Add or update anti-cache param if needed
				if ( s.cache === false ) {
					cacheURL = cacheURL.replace( rantiCache, "$1" );
					uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce.guid++ ) +
						uncached;
				}

				// Put hash and anti-cache on the URL that will be requested (gh-1732)
				s.url = cacheURL + uncached;

			// Change '%20' to '+' if this is encoded form body content (gh-2658)
			} else if ( s.data && s.processData &&
				( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
				s.data = s.data.replace( r20, "+" );
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
				}
				if ( jQuery.etag[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
				}
			}

			// Set the correct header, if data is being sent
			if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
				jqXHR.setRequestHeader( "Content-Type", s.contentType );
			}

			// Set the Accepts header for the server, depending on the dataType
			jqXHR.setRequestHeader(
				"Accept",
				s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
					s.accepts[ s.dataTypes[ 0 ] ] +
						( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
					s.accepts[ "*" ]
			);

			// Check for headers option
			for ( i in s.headers ) {
				jqXHR.setRequestHeader( i, s.headers[ i ] );
			}

			// Allow custom headers/mimetypes and early abort
			if ( s.beforeSend &&
				( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

				// Abort if not done already and return
				return jqXHR.abort();
			}

			// Aborting is no longer a cancellation
			strAbort = "abort";

			// Install callbacks on deferreds
			completeDeferred.add( s.complete );
			jqXHR.done( s.success );
			jqXHR.fail( s.error );

			// Get transport
			transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

			// If no transport, we auto-abort
			if ( !transport ) {
				done( -1, "No Transport" );
			} else {
				jqXHR.readyState = 1;

				// Send global event
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
				}

				// If request was aborted inside ajaxSend, stop there
				if ( completed ) {
					return jqXHR;
				}

				// Timeout
				if ( s.async && s.timeout > 0 ) {
					timeoutTimer = window.setTimeout( function() {
						jqXHR.abort( "timeout" );
					}, s.timeout );
				}

				try {
					completed = false;
					transport.send( requestHeaders, done );
				} catch ( e ) {

					// Rethrow post-completion exceptions
					if ( completed ) {
						throw e;
					}

					// Propagate others as results
					done( -1, e );
				}
			}

			// Callback for when everything is done
			function done( status, nativeStatusText, responses, headers ) {
				var isSuccess, success, error, response, modified,
					statusText = nativeStatusText;

				// Ignore repeat invocations
				if ( completed ) {
					return;
				}

				completed = true;

				// Clear timeout if it exists
				if ( timeoutTimer ) {
					window.clearTimeout( timeoutTimer );
				}

				// Dereference transport for early garbage collection
				// (no matter how long the jqXHR object will be used)
				transport = undefined;

				// Cache response headers
				responseHeadersString = headers || "";

				// Set readyState
				jqXHR.readyState = status > 0 ? 4 : 0;

				// Determine if successful
				isSuccess = status >= 200 && status < 300 || status === 304;

				// Get response data
				if ( responses ) {
					response = ajaxHandleResponses( s, jqXHR, responses );
				}

				// Use a noop converter for missing script but not if jsonp
				if ( !isSuccess &&
					jQuery.inArray( "script", s.dataTypes ) > -1 &&
					jQuery.inArray( "json", s.dataTypes ) < 0 ) {
					s.converters[ "text script" ] = function() {};
				}

				// Convert no matter what (that way responseXXX fields are always set)
				response = ajaxConvert( s, response, jqXHR, isSuccess );

				// If successful, handle type chaining
				if ( isSuccess ) {

					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if ( s.ifModified ) {
						modified = jqXHR.getResponseHeader( "Last-Modified" );
						if ( modified ) {
							jQuery.lastModified[ cacheURL ] = modified;
						}
						modified = jqXHR.getResponseHeader( "etag" );
						if ( modified ) {
							jQuery.etag[ cacheURL ] = modified;
						}
					}

					// if no content
					if ( status === 204 || s.type === "HEAD" ) {
						statusText = "nocontent";

					// if not modified
					} else if ( status === 304 ) {
						statusText = "notmodified";

					// If we have data, let's convert it
					} else {
						statusText = response.state;
						success = response.data;
						error = response.error;
						isSuccess = !error;
					}
				} else {

					// Extract error from statusText and normalize for non-aborts
					error = statusText;
					if ( status || !statusText ) {
						statusText = "error";
						if ( status < 0 ) {
							status = 0;
						}
					}
				}

				// Set data for the fake xhr object
				jqXHR.status = status;
				jqXHR.statusText = ( nativeStatusText || statusText ) + "";

				// Success/Error
				if ( isSuccess ) {
					deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
				} else {
					deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
				}

				// Status-dependent callbacks
				jqXHR.statusCode( statusCode );
				statusCode = undefined;

				if ( fireGlobals ) {
					globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
						[ jqXHR, s, isSuccess ? success : error ] );
				}

				// Complete
				completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

					// Handle the global AJAX counter
					if ( !( --jQuery.active ) ) {
						jQuery.event.trigger( "ajaxStop" );
					}
				}
			}

			return jqXHR;
		},

		getJSON: function( url, data, callback ) {
			return jQuery.get( url, data, callback, "json" );
		},

		getScript: function( url, callback ) {
			return jQuery.get( url, undefined, callback, "script" );
		}
	} );

	jQuery.each( [ "get", "post" ], function( _i, method ) {
		jQuery[ method ] = function( url, data, callback, type ) {

			// Shift arguments if data argument was omitted
			if ( isFunction( data ) ) {
				type = type || callback;
				callback = data;
				data = undefined;
			}

			// The url can be an options object (which then must have .url)
			return jQuery.ajax( jQuery.extend( {
				url: url,
				type: method,
				dataType: type,
				data: data,
				success: callback
			}, jQuery.isPlainObject( url ) && url ) );
		};
	} );

	jQuery.ajaxPrefilter( function( s ) {
		var i;
		for ( i in s.headers ) {
			if ( i.toLowerCase() === "content-type" ) {
				s.contentType = s.headers[ i ] || "";
			}
		}
	} );


	jQuery._evalUrl = function( url, options, doc ) {
		return jQuery.ajax( {
			url: url,

			// Make this explicit, since user can override this through ajaxSetup (#11264)
			type: "GET",
			dataType: "script",
			cache: true,
			async: false,
			global: false,

			// Only evaluate the response if it is successful (gh-4126)
			// dataFilter is not invoked for failure responses, so using it instead
			// of the default converter is kludgy but it works.
			converters: {
				"text script": function() {}
			},
			dataFilter: function( response ) {
				jQuery.globalEval( response, options, doc );
			}
		} );
	};


	jQuery.fn.extend( {
		wrapAll: function( html ) {
			var wrap;

			if ( this[ 0 ] ) {
				if ( isFunction( html ) ) {
					html = html.call( this[ 0 ] );
				}

				// The elements to wrap the target around
				wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

				if ( this[ 0 ].parentNode ) {
					wrap.insertBefore( this[ 0 ] );
				}

				wrap.map( function() {
					var elem = this;

					while ( elem.firstElementChild ) {
						elem = elem.firstElementChild;
					}

					return elem;
				} ).append( this );
			}

			return this;
		},

		wrapInner: function( html ) {
			if ( isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapInner( html.call( this, i ) );
				} );
			}

			return this.each( function() {
				var self = jQuery( this ),
					contents = self.contents();

				if ( contents.length ) {
					contents.wrapAll( html );

				} else {
					self.append( html );
				}
			} );
		},

		wrap: function( html ) {
			var htmlIsFunction = isFunction( html );

			return this.each( function( i ) {
				jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
			} );
		},

		unwrap: function( selector ) {
			this.parent( selector ).not( "body" ).each( function() {
				jQuery( this ).replaceWith( this.childNodes );
			} );
			return this;
		}
	} );


	jQuery.expr.pseudos.hidden = function( elem ) {
		return !jQuery.expr.pseudos.visible( elem );
	};
	jQuery.expr.pseudos.visible = function( elem ) {
		return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
	};




	jQuery.ajaxSettings.xhr = function() {
		try {
			return new window.XMLHttpRequest();
		} catch ( e ) {}
	};

	var xhrSuccessStatus = {

			// File protocol always yields status code 0, assume 200
			0: 200,

			// Support: IE <=9 only
			// #1450: sometimes IE returns 1223 when it should be 204
			1223: 204
		},
		xhrSupported = jQuery.ajaxSettings.xhr();

	support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
	support.ajax = xhrSupported = !!xhrSupported;

	jQuery.ajaxTransport( function( options ) {
		var callback, errorCallback;

		// Cross domain only allowed if supported through XMLHttpRequest
		if ( support.cors || xhrSupported && !options.crossDomain ) {
			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr();

					xhr.open(
						options.type,
						options.url,
						options.async,
						options.username,
						options.password
					);

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						xhr.setRequestHeader( i, headers[ i ] );
					}

					// Callback
					callback = function( type ) {
						return function() {
							if ( callback ) {
								callback = errorCallback = xhr.onload =
									xhr.onerror = xhr.onabort = xhr.ontimeout =
										xhr.onreadystatechange = null;

								if ( type === "abort" ) {
									xhr.abort();
								} else if ( type === "error" ) {

									// Support: IE <=9 only
									// On a manual native abort, IE9 throws
									// errors on any property access that is not readyState
									if ( typeof xhr.status !== "number" ) {
										complete( 0, "error" );
									} else {
										complete(

											// File: protocol always yields status 0; see #8605, #14207
											xhr.status,
											xhr.statusText
										);
									}
								} else {
									complete(
										xhrSuccessStatus[ xhr.status ] || xhr.status,
										xhr.statusText,

										// Support: IE <=9 only
										// IE9 has no XHR2 but throws on binary (trac-11426)
										// For XHR2 non-text, let the caller handle it (gh-2498)
										( xhr.responseType || "text" ) !== "text"  ||
										typeof xhr.responseText !== "string" ?
											{ binary: xhr.response } :
											{ text: xhr.responseText },
										xhr.getAllResponseHeaders()
									);
								}
							}
						};
					};

					// Listen to events
					xhr.onload = callback();
					errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

					// Support: IE 9 only
					// Use onreadystatechange to replace onabort
					// to handle uncaught aborts
					if ( xhr.onabort !== undefined ) {
						xhr.onabort = errorCallback;
					} else {
						xhr.onreadystatechange = function() {

							// Check readyState before timeout as it changes
							if ( xhr.readyState === 4 ) {

								// Allow onerror to be called first,
								// but that will not handle a native abort
								// Also, save errorCallback to a variable
								// as xhr.onerror cannot be accessed
								window.setTimeout( function() {
									if ( callback ) {
										errorCallback();
									}
								} );
							}
						};
					}

					// Create the abort callback
					callback = callback( "abort" );

					try {

						// Do send the request (this may raise an exception)
						xhr.send( options.hasContent && options.data || null );
					} catch ( e ) {

						// #14683: Only rethrow if this hasn't been notified as an error yet
						if ( callback ) {
							throw e;
						}
					}
				},

				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
	jQuery.ajaxPrefilter( function( s ) {
		if ( s.crossDomain ) {
			s.contents.script = false;
		}
	} );

	// Install script dataType
	jQuery.ajaxSetup( {
		accepts: {
			script: "text/javascript, application/javascript, " +
				"application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /\b(?:java|ecma)script\b/
		},
		converters: {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			}
		}
	} );

	// Handle cache's special case and crossDomain
	jQuery.ajaxPrefilter( "script", function( s ) {
		if ( s.cache === undefined ) {
			s.cache = false;
		}
		if ( s.crossDomain ) {
			s.type = "GET";
		}
	} );

	// Bind script tag hack transport
	jQuery.ajaxTransport( "script", function( s ) {

		// This transport only deals with cross domain or forced-by-attrs requests
		if ( s.crossDomain || s.scriptAttrs ) {
			var script, callback;
			return {
				send: function( _, complete ) {
					script = jQuery( "<script>" )
						.attr( s.scriptAttrs || {} )
						.prop( { charset: s.scriptCharset, src: s.url } )
						.on( "load error", callback = function( evt ) {
							script.remove();
							callback = null;
							if ( evt ) {
								complete( evt.type === "error" ? 404 : 200, evt.type );
							}
						} );

					// Use native DOM manipulation to avoid our domManip AJAX trickery
					document.head.appendChild( script[ 0 ] );
				},
				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	var oldCallbacks = [],
		rjsonp = /(=)\?(?=&|$)|\?\?/;

	// Default jsonp settings
	jQuery.ajaxSetup( {
		jsonp: "callback",
		jsonpCallback: function() {
			var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce.guid++ ) );
			this[ callback ] = true;
			return callback;
		}
	} );

	// Detect, normalize options and install callbacks for jsonp requests
	jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

		var callbackName, overwritten, responseContainer,
			jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
				"url" :
				typeof s.data === "string" &&
					( s.contentType || "" )
						.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
					rjsonp.test( s.data ) && "data"
			);

		// Handle iff the expected data type is "jsonp" or we have a parameter to set
		if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

			// Get callback name, remembering preexisting value associated with it
			callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
				s.jsonpCallback() :
				s.jsonpCallback;

			// Insert callback into url or form data
			if ( jsonProp ) {
				s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
			} else if ( s.jsonp !== false ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
			}

			// Use data converter to retrieve json after script execution
			s.converters[ "script json" ] = function() {
				if ( !responseContainer ) {
					jQuery.error( callbackName + " was not called" );
				}
				return responseContainer[ 0 ];
			};

			// Force json dataType
			s.dataTypes[ 0 ] = "json";

			// Install callback
			overwritten = window[ callbackName ];
			window[ callbackName ] = function() {
				responseContainer = arguments;
			};

			// Clean-up function (fires after converters)
			jqXHR.always( function() {

				// If previous value didn't exist - remove it
				if ( overwritten === undefined ) {
					jQuery( window ).removeProp( callbackName );

				// Otherwise restore preexisting value
				} else {
					window[ callbackName ] = overwritten;
				}

				// Save back as free
				if ( s[ callbackName ] ) {

					// Make sure that re-using the options doesn't screw things around
					s.jsonpCallback = originalSettings.jsonpCallback;

					// Save the callback name for future use
					oldCallbacks.push( callbackName );
				}

				// Call if it was a function and we have a response
				if ( responseContainer && isFunction( overwritten ) ) {
					overwritten( responseContainer[ 0 ] );
				}

				responseContainer = overwritten = undefined;
			} );

			// Delegate to script
			return "script";
		}
	} );




	// Support: Safari 8 only
	// In Safari 8 documents created via document.implementation.createHTMLDocument
	// collapse sibling forms: the second one becomes a child of the first one.
	// Because of that, this security measure has to be disabled in Safari 8.
	// https://bugs.webkit.org/show_bug.cgi?id=137337
	support.createHTMLDocument = ( function() {
		var body = document.implementation.createHTMLDocument( "" ).body;
		body.innerHTML = "<form></form><form></form>";
		return body.childNodes.length === 2;
	} )();


	// Argument "data" should be string of html
	// context (optional): If specified, the fragment will be created in this context,
	// defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	jQuery.parseHTML = function( data, context, keepScripts ) {
		if ( typeof data !== "string" ) {
			return [];
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}

		var base, parsed, scripts;

		if ( !context ) {

			// Stop scripts or inline event handlers from being executed immediately
			// by using document.implementation
			if ( support.createHTMLDocument ) {
				context = document.implementation.createHTMLDocument( "" );

				// Set the base href for the created document
				// so any parsed elements with URLs
				// are based on the document's URL (gh-2965)
				base = context.createElement( "base" );
				base.href = document.location.href;
				context.head.appendChild( base );
			} else {
				context = document;
			}
		}

		parsed = rsingleTag.exec( data );
		scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[ 1 ] ) ];
		}

		parsed = buildFragment( [ data ], context, scripts );

		if ( scripts && scripts.length ) {
			jQuery( scripts ).remove();
		}

		return jQuery.merge( [], parsed.childNodes );
	};


	/**
	 * Load a url into a page
	 */
	jQuery.fn.load = function( url, params, callback ) {
		var selector, type, response,
			self = this,
			off = url.indexOf( " " );

		if ( off > -1 ) {
			selector = stripAndCollapse( url.slice( off ) );
			url = url.slice( 0, off );
		}

		// If it's a function
		if ( isFunction( params ) ) {

			// We assume that it's the callback
			callback = params;
			params = undefined;

		// Otherwise, build a param string
		} else if ( params && typeof params === "object" ) {
			type = "POST";
		}

		// If we have elements to modify, make the request
		if ( self.length > 0 ) {
			jQuery.ajax( {
				url: url,

				// If "type" variable is undefined, then "GET" method will be used.
				// Make value of this field explicit since
				// user can override it through ajaxSetup method
				type: type || "GET",
				dataType: "html",
				data: params
			} ).done( function( responseText ) {

				// Save response for use in complete callback
				response = arguments;

				self.html( selector ?

					// If a selector was specified, locate the right elements in a dummy div
					// Exclude scripts to avoid IE 'Permission Denied' errors
					jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

					// Otherwise use the full result
					responseText );

			// If the request succeeds, this function gets "data", "status", "jqXHR"
			// but they are ignored because response was set above.
			// If it fails, this function gets "jqXHR", "status", "error"
			} ).always( callback && function( jqXHR, status ) {
				self.each( function() {
					callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
				} );
			} );
		}

		return this;
	};




	jQuery.expr.pseudos.animated = function( elem ) {
		return jQuery.grep( jQuery.timers, function( fn ) {
			return elem === fn.elem;
		} ).length;
	};




	jQuery.offset = {
		setOffset: function( elem, options, i ) {
			var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
				position = jQuery.css( elem, "position" ),
				curElem = jQuery( elem ),
				props = {};

			// Set position first, in-case top/left are set even on static elem
			if ( position === "static" ) {
				elem.style.position = "relative";
			}

			curOffset = curElem.offset();
			curCSSTop = jQuery.css( elem, "top" );
			curCSSLeft = jQuery.css( elem, "left" );
			calculatePosition = ( position === "absolute" || position === "fixed" ) &&
				( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

			// Need to be able to calculate position if either
			// top or left is auto and position is either absolute or fixed
			if ( calculatePosition ) {
				curPosition = curElem.position();
				curTop = curPosition.top;
				curLeft = curPosition.left;

			} else {
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}

			if ( isFunction( options ) ) {

				// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
				options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
			}

			if ( options.top != null ) {
				props.top = ( options.top - curOffset.top ) + curTop;
			}
			if ( options.left != null ) {
				props.left = ( options.left - curOffset.left ) + curLeft;
			}

			if ( "using" in options ) {
				options.using.call( elem, props );

			} else {
				curElem.css( props );
			}
		}
	};

	jQuery.fn.extend( {

		// offset() relates an element's border box to the document origin
		offset: function( options ) {

			// Preserve chaining for setter
			if ( arguments.length ) {
				return options === undefined ?
					this :
					this.each( function( i ) {
						jQuery.offset.setOffset( this, options, i );
					} );
			}

			var rect, win,
				elem = this[ 0 ];

			if ( !elem ) {
				return;
			}

			// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
			// Support: IE <=11 only
			// Running getBoundingClientRect on a
			// disconnected node in IE throws an error
			if ( !elem.getClientRects().length ) {
				return { top: 0, left: 0 };
			}

			// Get document-relative position by adding viewport scroll to viewport-relative gBCR
			rect = elem.getBoundingClientRect();
			win = elem.ownerDocument.defaultView;
			return {
				top: rect.top + win.pageYOffset,
				left: rect.left + win.pageXOffset
			};
		},

		// position() relates an element's margin box to its offset parent's padding box
		// This corresponds to the behavior of CSS absolute positioning
		position: function() {
			if ( !this[ 0 ] ) {
				return;
			}

			var offsetParent, offset, doc,
				elem = this[ 0 ],
				parentOffset = { top: 0, left: 0 };

			// position:fixed elements are offset from the viewport, which itself always has zero offset
			if ( jQuery.css( elem, "position" ) === "fixed" ) {

				// Assume position:fixed implies availability of getBoundingClientRect
				offset = elem.getBoundingClientRect();

			} else {
				offset = this.offset();

				// Account for the *real* offset parent, which can be the document or its root element
				// when a statically positioned element is identified
				doc = elem.ownerDocument;
				offsetParent = elem.offsetParent || doc.documentElement;
				while ( offsetParent &&
					( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
					jQuery.css( offsetParent, "position" ) === "static" ) {

					offsetParent = offsetParent.parentNode;
				}
				if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

					// Incorporate borders into its offset, since they are outside its content origin
					parentOffset = jQuery( offsetParent ).offset();
					parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
					parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
				}
			}

			// Subtract parent offsets and element margins
			return {
				top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
				left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
			};
		},

		// This method will return documentElement in the following cases:
		// 1) For the element inside the iframe without offsetParent, this method will return
		//    documentElement of the parent window
		// 2) For the hidden or detached element
		// 3) For body or html element, i.e. in case of the html node - it will return itself
		//
		// but those exceptions were never presented as a real life use-cases
		// and might be considered as more preferable results.
		//
		// This logic, however, is not guaranteed and can change at any point in the future
		offsetParent: function() {
			return this.map( function() {
				var offsetParent = this.offsetParent;

				while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || documentElement;
			} );
		}
	} );

	// Create scrollLeft and scrollTop methods
	jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
		var top = "pageYOffset" === prop;

		jQuery.fn[ method ] = function( val ) {
			return access( this, function( elem, method, val ) {

				// Coalesce documents and windows
				var win;
				if ( isWindow( elem ) ) {
					win = elem;
				} else if ( elem.nodeType === 9 ) {
					win = elem.defaultView;
				}

				if ( val === undefined ) {
					return win ? win[ prop ] : elem[ method ];
				}

				if ( win ) {
					win.scrollTo(
						!top ? val : win.pageXOffset,
						top ? val : win.pageYOffset
					);

				} else {
					elem[ method ] = val;
				}
			}, method, val, arguments.length );
		};
	} );

	// Support: Safari <=7 - 9.1, Chrome <=37 - 49
	// Add the top/left cssHooks using jQuery.fn.position
	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
	// getComputedStyle returns percent when specified for top/left/bottom/right;
	// rather than make the css module depend on the offset module, just check for it here
	jQuery.each( [ "top", "left" ], function( _i, prop ) {
		jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
			function( elem, computed ) {
				if ( computed ) {
					computed = curCSS( elem, prop );

					// If curCSS returns percentage, fallback to offset
					return rnumnonpx.test( computed ) ?
						jQuery( elem ).position()[ prop ] + "px" :
						computed;
				}
			}
		);
	} );


	// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
	jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
		jQuery.each( {
			padding: "inner" + name,
			content: type,
			"": "outer" + name
		}, function( defaultExtra, funcName ) {

			// Margin is only for outerHeight, outerWidth
			jQuery.fn[ funcName ] = function( margin, value ) {
				var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
					extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

				return access( this, function( elem, type, value ) {
					var doc;

					if ( isWindow( elem ) ) {

						// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
						return funcName.indexOf( "outer" ) === 0 ?
							elem[ "inner" + name ] :
							elem.document.documentElement[ "client" + name ];
					}

					// Get document width or height
					if ( elem.nodeType === 9 ) {
						doc = elem.documentElement;

						// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
						// whichever is greatest
						return Math.max(
							elem.body[ "scroll" + name ], doc[ "scroll" + name ],
							elem.body[ "offset" + name ], doc[ "offset" + name ],
							doc[ "client" + name ]
						);
					}

					return value === undefined ?

						// Get width or height on the element, requesting but not forcing parseFloat
						jQuery.css( elem, type, extra ) :

						// Set width or height on the element
						jQuery.style( elem, type, value, extra );
				}, type, chainable ? margin : undefined, chainable );
			};
		} );
	} );


	jQuery.each( [
		"ajaxStart",
		"ajaxStop",
		"ajaxComplete",
		"ajaxError",
		"ajaxSuccess",
		"ajaxSend"
	], function( _i, type ) {
		jQuery.fn[ type ] = function( fn ) {
			return this.on( type, fn );
		};
	} );




	jQuery.fn.extend( {

		bind: function( types, data, fn ) {
			return this.on( types, null, data, fn );
		},
		unbind: function( types, fn ) {
			return this.off( types, null, fn );
		},

		delegate: function( selector, types, data, fn ) {
			return this.on( types, selector, data, fn );
		},
		undelegate: function( selector, types, fn ) {

			// ( namespace ) or ( selector, types [, fn] )
			return arguments.length === 1 ?
				this.off( selector, "**" ) :
				this.off( types, selector || "**", fn );
		},

		hover: function( fnOver, fnOut ) {
			return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
		}
	} );

	jQuery.each(
		( "blur focus focusin focusout resize scroll click dblclick " +
		"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
		"change select submit keydown keypress keyup contextmenu" ).split( " " ),
		function( _i, name ) {

			// Handle event binding
			jQuery.fn[ name ] = function( data, fn ) {
				return arguments.length > 0 ?
					this.on( name, null, data, fn ) :
					this.trigger( name );
			};
		}
	);




	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

	// Bind a function to a context, optionally partially applying any
	// arguments.
	// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
	// However, it is not slated for removal any time soon
	jQuery.proxy = function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	};

	jQuery.holdReady = function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	};
	jQuery.isArray = Array.isArray;
	jQuery.parseJSON = JSON.parse;
	jQuery.nodeName = nodeName;
	jQuery.isFunction = isFunction;
	jQuery.isWindow = isWindow;
	jQuery.camelCase = camelCase;
	jQuery.type = toType;

	jQuery.now = Date.now;

	jQuery.isNumeric = function( obj ) {

		// As of jQuery 3.0, isNumeric is limited to
		// strings and numbers (primitives or objects)
		// that can be coerced to finite numbers (gh-2662)
		var type = jQuery.type( obj );
		return ( type === "number" || type === "string" ) &&

			// parseFloat NaNs numeric-cast false positives ("")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			!isNaN( obj - parseFloat( obj ) );
	};

	jQuery.trim = function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	};



	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.

	// Note that for maximum portability, libraries that are not jQuery should
	// declare themselves as anonymous modules, and avoid setting a global if an
	// AMD loader is present. jQuery is a special case. For more information, see
	// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

	if ( true ) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return jQuery;
		}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}




	var

		// Map over jQuery in case of overwrite
		_jQuery = window.jQuery,

		// Map over the $ in case of overwrite
		_$ = window.$;

	jQuery.noConflict = function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	};

	// Expose jQuery and $ identifiers, even in AMD
	// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
	// and CommonJS for browser emulators (#13566)
	if ( typeof noGlobal === "undefined" ) {
		window.jQuery = window.$ = jQuery;
	}




	return jQuery;
	} );


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;// TinyColor v1.4.2
	// https://github.com/bgrins/TinyColor
	// Brian Grinstead, MIT License

	(function(Math) {

	var trimLeft = /^\s+/,
	    trimRight = /\s+$/,
	    tinyCounter = 0,
	    mathRound = Math.round,
	    mathMin = Math.min,
	    mathMax = Math.max,
	    mathRandom = Math.random;

	function tinycolor (color, opts) {

	    color = (color) ? color : '';
	    opts = opts || { };

	    // If input is already a tinycolor, return itself
	    if (color instanceof tinycolor) {
	       return color;
	    }
	    // If we are called as a function, call using new instead
	    if (!(this instanceof tinycolor)) {
	        return new tinycolor(color, opts);
	    }

	    var rgb = inputToRGB(color);
	    this._originalInput = color,
	    this._r = rgb.r,
	    this._g = rgb.g,
	    this._b = rgb.b,
	    this._a = rgb.a,
	    this._roundA = mathRound(100*this._a) / 100,
	    this._format = opts.format || rgb.format;
	    this._gradientType = opts.gradientType;

	    // Don't let the range of [0,255] come back in [0,1].
	    // Potentially lose a little bit of precision here, but will fix issues where
	    // .5 gets interpreted as half of the total, instead of half of 1
	    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
	    if (this._r < 1) { this._r = mathRound(this._r); }
	    if (this._g < 1) { this._g = mathRound(this._g); }
	    if (this._b < 1) { this._b = mathRound(this._b); }

	    this._ok = rgb.ok;
	    this._tc_id = tinyCounter++;
	}

	tinycolor.prototype = {
	    isDark: function() {
	        return this.getBrightness() < 128;
	    },
	    isLight: function() {
	        return !this.isDark();
	    },
	    isValid: function() {
	        return this._ok;
	    },
	    getOriginalInput: function() {
	      return this._originalInput;
	    },
	    getFormat: function() {
	        return this._format;
	    },
	    getAlpha: function() {
	        return this._a;
	    },
	    getBrightness: function() {
	        //http://www.w3.org/TR/AERT#color-contrast
	        var rgb = this.toRgb();
	        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
	    },
	    getLuminance: function() {
	        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
	        var rgb = this.toRgb();
	        var RsRGB, GsRGB, BsRGB, R, G, B;
	        RsRGB = rgb.r/255;
	        GsRGB = rgb.g/255;
	        BsRGB = rgb.b/255;

	        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
	        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
	        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
	        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
	    },
	    setAlpha: function(value) {
	        this._a = boundAlpha(value);
	        this._roundA = mathRound(100*this._a) / 100;
	        return this;
	    },
	    toHsv: function() {
	        var hsv = rgbToHsv(this._r, this._g, this._b);
	        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
	    },
	    toHsvString: function() {
	        var hsv = rgbToHsv(this._r, this._g, this._b);
	        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
	        return (this._a == 1) ?
	          "hsv("  + h + ", " + s + "%, " + v + "%)" :
	          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
	    },
	    toHsl: function() {
	        var hsl = rgbToHsl(this._r, this._g, this._b);
	        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
	    },
	    toHslString: function() {
	        var hsl = rgbToHsl(this._r, this._g, this._b);
	        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
	        return (this._a == 1) ?
	          "hsl("  + h + ", " + s + "%, " + l + "%)" :
	          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
	    },
	    toHex: function(allow3Char) {
	        return rgbToHex(this._r, this._g, this._b, allow3Char);
	    },
	    toHexString: function(allow3Char) {
	        return '#' + this.toHex(allow3Char);
	    },
	    toHex8: function(allow4Char) {
	        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
	    },
	    toHex8String: function(allow4Char) {
	        return '#' + this.toHex8(allow4Char);
	    },
	    toRgb: function() {
	        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
	    },
	    toRgbString: function() {
	        return (this._a == 1) ?
	          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
	          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
	    },
	    toPercentageRgb: function() {
	        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
	    },
	    toPercentageRgbString: function() {
	        return (this._a == 1) ?
	          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
	          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
	    },
	    toName: function() {
	        if (this._a === 0) {
	            return "transparent";
	        }

	        if (this._a < 1) {
	            return false;
	        }

	        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
	    },
	    toFilter: function(secondColor) {
	        var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
	        var secondHex8String = hex8String;
	        var gradientType = this._gradientType ? "GradientType = 1, " : "";

	        if (secondColor) {
	            var s = tinycolor(secondColor);
	            secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
	        }

	        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
	    },
	    toString: function(format) {
	        var formatSet = !!format;
	        format = format || this._format;

	        var formattedString = false;
	        var hasAlpha = this._a < 1 && this._a >= 0;
	        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

	        if (needsAlphaFormat) {
	            // Special case for "transparent", all other non-alpha formats
	            // will return rgba when there is transparency.
	            if (format === "name" && this._a === 0) {
	                return this.toName();
	            }
	            return this.toRgbString();
	        }
	        if (format === "rgb") {
	            formattedString = this.toRgbString();
	        }
	        if (format === "prgb") {
	            formattedString = this.toPercentageRgbString();
	        }
	        if (format === "hex" || format === "hex6") {
	            formattedString = this.toHexString();
	        }
	        if (format === "hex3") {
	            formattedString = this.toHexString(true);
	        }
	        if (format === "hex4") {
	            formattedString = this.toHex8String(true);
	        }
	        if (format === "hex8") {
	            formattedString = this.toHex8String();
	        }
	        if (format === "name") {
	            formattedString = this.toName();
	        }
	        if (format === "hsl") {
	            formattedString = this.toHslString();
	        }
	        if (format === "hsv") {
	            formattedString = this.toHsvString();
	        }

	        return formattedString || this.toHexString();
	    },
	    clone: function() {
	        return tinycolor(this.toString());
	    },

	    _applyModification: function(fn, args) {
	        var color = fn.apply(null, [this].concat([].slice.call(args)));
	        this._r = color._r;
	        this._g = color._g;
	        this._b = color._b;
	        this.setAlpha(color._a);
	        return this;
	    },
	    lighten: function() {
	        return this._applyModification(lighten, arguments);
	    },
	    brighten: function() {
	        return this._applyModification(brighten, arguments);
	    },
	    darken: function() {
	        return this._applyModification(darken, arguments);
	    },
	    desaturate: function() {
	        return this._applyModification(desaturate, arguments);
	    },
	    saturate: function() {
	        return this._applyModification(saturate, arguments);
	    },
	    greyscale: function() {
	        return this._applyModification(greyscale, arguments);
	    },
	    spin: function() {
	        return this._applyModification(spin, arguments);
	    },

	    _applyCombination: function(fn, args) {
	        return fn.apply(null, [this].concat([].slice.call(args)));
	    },
	    analogous: function() {
	        return this._applyCombination(analogous, arguments);
	    },
	    complement: function() {
	        return this._applyCombination(complement, arguments);
	    },
	    monochromatic: function() {
	        return this._applyCombination(monochromatic, arguments);
	    },
	    splitcomplement: function() {
	        return this._applyCombination(splitcomplement, arguments);
	    },
	    triad: function() {
	        return this._applyCombination(triad, arguments);
	    },
	    tetrad: function() {
	        return this._applyCombination(tetrad, arguments);
	    }
	};

	// If input is an object, force 1 into "1.0" to handle ratios properly
	// String input requires "1.0" as input, so 1 will be treated as 1
	tinycolor.fromRatio = function(color, opts) {
	    if (typeof color == "object") {
	        var newColor = {};
	        for (var i in color) {
	            if (color.hasOwnProperty(i)) {
	                if (i === "a") {
	                    newColor[i] = color[i];
	                }
	                else {
	                    newColor[i] = convertToPercentage(color[i]);
	                }
	            }
	        }
	        color = newColor;
	    }

	    return tinycolor(color, opts);
	};

	// Given a string or object, convert that input to RGB
	// Possible string inputs:
	//
	//     "red"
	//     "#f00" or "f00"
	//     "#ff0000" or "ff0000"
	//     "#ff000000" or "ff000000"
	//     "rgb 255 0 0" or "rgb (255, 0, 0)"
	//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
	//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
	//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
	//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
	//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
	//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
	//
	function inputToRGB(color) {

	    var rgb = { r: 0, g: 0, b: 0 };
	    var a = 1;
	    var s = null;
	    var v = null;
	    var l = null;
	    var ok = false;
	    var format = false;

	    if (typeof color == "string") {
	        color = stringInputToObject(color);
	    }

	    if (typeof color == "object") {
	        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
	            rgb = rgbToRgb(color.r, color.g, color.b);
	            ok = true;
	            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
	        }
	        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
	            s = convertToPercentage(color.s);
	            v = convertToPercentage(color.v);
	            rgb = hsvToRgb(color.h, s, v);
	            ok = true;
	            format = "hsv";
	        }
	        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
	            s = convertToPercentage(color.s);
	            l = convertToPercentage(color.l);
	            rgb = hslToRgb(color.h, s, l);
	            ok = true;
	            format = "hsl";
	        }

	        if (color.hasOwnProperty("a")) {
	            a = color.a;
	        }
	    }

	    a = boundAlpha(a);

	    return {
	        ok: ok,
	        format: color.format || format,
	        r: mathMin(255, mathMax(rgb.r, 0)),
	        g: mathMin(255, mathMax(rgb.g, 0)),
	        b: mathMin(255, mathMax(rgb.b, 0)),
	        a: a
	    };
	}


	// Conversion Functions
	// --------------------

	// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
	// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

	// `rgbToRgb`
	// Handle bounds / percentage checking to conform to CSS color spec
	// <http://www.w3.org/TR/css3-color/>
	// *Assumes:* r, g, b in [0, 255] or [0, 1]
	// *Returns:* { r, g, b } in [0, 255]
	function rgbToRgb(r, g, b){
	    return {
	        r: bound01(r, 255) * 255,
	        g: bound01(g, 255) * 255,
	        b: bound01(b, 255) * 255
	    };
	}

	// `rgbToHsl`
	// Converts an RGB color value to HSL.
	// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
	// *Returns:* { h, s, l } in [0,1]
	function rgbToHsl(r, g, b) {

	    r = bound01(r, 255);
	    g = bound01(g, 255);
	    b = bound01(b, 255);

	    var max = mathMax(r, g, b), min = mathMin(r, g, b);
	    var h, s, l = (max + min) / 2;

	    if(max == min) {
	        h = s = 0; // achromatic
	    }
	    else {
	        var d = max - min;
	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	        switch(max) {
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }

	        h /= 6;
	    }

	    return { h: h, s: s, l: l };
	}

	// `hslToRgb`
	// Converts an HSL color value to RGB.
	// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
	// *Returns:* { r, g, b } in the set [0, 255]
	function hslToRgb(h, s, l) {
	    var r, g, b;

	    h = bound01(h, 360);
	    s = bound01(s, 100);
	    l = bound01(l, 100);

	    function hue2rgb(p, q, t) {
	        if(t < 0) t += 1;
	        if(t > 1) t -= 1;
	        if(t < 1/6) return p + (q - p) * 6 * t;
	        if(t < 1/2) return q;
	        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
	        return p;
	    }

	    if(s === 0) {
	        r = g = b = l; // achromatic
	    }
	    else {
	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        var p = 2 * l - q;
	        r = hue2rgb(p, q, h + 1/3);
	        g = hue2rgb(p, q, h);
	        b = hue2rgb(p, q, h - 1/3);
	    }

	    return { r: r * 255, g: g * 255, b: b * 255 };
	}

	// `rgbToHsv`
	// Converts an RGB color value to HSV
	// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
	// *Returns:* { h, s, v } in [0,1]
	function rgbToHsv(r, g, b) {

	    r = bound01(r, 255);
	    g = bound01(g, 255);
	    b = bound01(b, 255);

	    var max = mathMax(r, g, b), min = mathMin(r, g, b);
	    var h, s, v = max;

	    var d = max - min;
	    s = max === 0 ? 0 : d / max;

	    if(max == min) {
	        h = 0; // achromatic
	    }
	    else {
	        switch(max) {
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }
	        h /= 6;
	    }
	    return { h: h, s: s, v: v };
	}

	// `hsvToRgb`
	// Converts an HSV color value to RGB.
	// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
	// *Returns:* { r, g, b } in the set [0, 255]
	 function hsvToRgb(h, s, v) {

	    h = bound01(h, 360) * 6;
	    s = bound01(s, 100);
	    v = bound01(v, 100);

	    var i = Math.floor(h),
	        f = h - i,
	        p = v * (1 - s),
	        q = v * (1 - f * s),
	        t = v * (1 - (1 - f) * s),
	        mod = i % 6,
	        r = [v, q, p, p, t, v][mod],
	        g = [t, v, v, q, p, p][mod],
	        b = [p, p, t, v, v, q][mod];

	    return { r: r * 255, g: g * 255, b: b * 255 };
	}

	// `rgbToHex`
	// Converts an RGB color to hex
	// Assumes r, g, and b are contained in the set [0, 255]
	// Returns a 3 or 6 character hex
	function rgbToHex(r, g, b, allow3Char) {

	    var hex = [
	        pad2(mathRound(r).toString(16)),
	        pad2(mathRound(g).toString(16)),
	        pad2(mathRound(b).toString(16))
	    ];

	    // Return a 3 character hex if possible
	    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
	    }

	    return hex.join("");
	}

	// `rgbaToHex`
	// Converts an RGBA color plus alpha transparency to hex
	// Assumes r, g, b are contained in the set [0, 255] and
	// a in [0, 1]. Returns a 4 or 8 character rgba hex
	function rgbaToHex(r, g, b, a, allow4Char) {

	    var hex = [
	        pad2(mathRound(r).toString(16)),
	        pad2(mathRound(g).toString(16)),
	        pad2(mathRound(b).toString(16)),
	        pad2(convertDecimalToHex(a))
	    ];

	    // Return a 4 character hex if possible
	    if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
	    }

	    return hex.join("");
	}

	// `rgbaToArgbHex`
	// Converts an RGBA color to an ARGB Hex8 string
	// Rarely used, but required for "toFilter()"
	function rgbaToArgbHex(r, g, b, a) {

	    var hex = [
	        pad2(convertDecimalToHex(a)),
	        pad2(mathRound(r).toString(16)),
	        pad2(mathRound(g).toString(16)),
	        pad2(mathRound(b).toString(16))
	    ];

	    return hex.join("");
	}

	// `equals`
	// Can be called with any tinycolor input
	tinycolor.equals = function (color1, color2) {
	    if (!color1 || !color2) { return false; }
	    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
	};

	tinycolor.random = function() {
	    return tinycolor.fromRatio({
	        r: mathRandom(),
	        g: mathRandom(),
	        b: mathRandom()
	    });
	};


	// Modification Functions
	// ----------------------
	// Thanks to less.js for some of the basics here
	// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

	function desaturate(color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.s -= amount / 100;
	    hsl.s = clamp01(hsl.s);
	    return tinycolor(hsl);
	}

	function saturate(color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.s += amount / 100;
	    hsl.s = clamp01(hsl.s);
	    return tinycolor(hsl);
	}

	function greyscale(color) {
	    return tinycolor(color).desaturate(100);
	}

	function lighten (color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.l += amount / 100;
	    hsl.l = clamp01(hsl.l);
	    return tinycolor(hsl);
	}

	function brighten(color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var rgb = tinycolor(color).toRgb();
	    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
	    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
	    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
	    return tinycolor(rgb);
	}

	function darken (color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.l -= amount / 100;
	    hsl.l = clamp01(hsl.l);
	    return tinycolor(hsl);
	}

	// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
	// Values outside of this range will be wrapped into this range.
	function spin(color, amount) {
	    var hsl = tinycolor(color).toHsl();
	    var hue = (hsl.h + amount) % 360;
	    hsl.h = hue < 0 ? 360 + hue : hue;
	    return tinycolor(hsl);
	}

	// Combination Functions
	// ---------------------
	// Thanks to jQuery xColor for some of the ideas behind these
	// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

	function complement(color) {
	    var hsl = tinycolor(color).toHsl();
	    hsl.h = (hsl.h + 180) % 360;
	    return tinycolor(hsl);
	}

	function triad(color) {
	    var hsl = tinycolor(color).toHsl();
	    var h = hsl.h;
	    return [
	        tinycolor(color),
	        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
	        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
	    ];
	}

	function tetrad(color) {
	    var hsl = tinycolor(color).toHsl();
	    var h = hsl.h;
	    return [
	        tinycolor(color),
	        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
	        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
	        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
	    ];
	}

	function splitcomplement(color) {
	    var hsl = tinycolor(color).toHsl();
	    var h = hsl.h;
	    return [
	        tinycolor(color),
	        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
	        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
	    ];
	}

	function analogous(color, results, slices) {
	    results = results || 6;
	    slices = slices || 30;

	    var hsl = tinycolor(color).toHsl();
	    var part = 360 / slices;
	    var ret = [tinycolor(color)];

	    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
	        hsl.h = (hsl.h + part) % 360;
	        ret.push(tinycolor(hsl));
	    }
	    return ret;
	}

	function monochromatic(color, results) {
	    results = results || 6;
	    var hsv = tinycolor(color).toHsv();
	    var h = hsv.h, s = hsv.s, v = hsv.v;
	    var ret = [];
	    var modification = 1 / results;

	    while (results--) {
	        ret.push(tinycolor({ h: h, s: s, v: v}));
	        v = (v + modification) % 1;
	    }

	    return ret;
	}

	// Utility Functions
	// ---------------------

	tinycolor.mix = function(color1, color2, amount) {
	    amount = (amount === 0) ? 0 : (amount || 50);

	    var rgb1 = tinycolor(color1).toRgb();
	    var rgb2 = tinycolor(color2).toRgb();

	    var p = amount / 100;

	    var rgba = {
	        r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
	        g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
	        b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
	        a: ((rgb2.a - rgb1.a) * p) + rgb1.a
	    };

	    return tinycolor(rgba);
	};


	// Readability Functions
	// ---------------------
	// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

	// `contrast`
	// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
	tinycolor.readability = function(color1, color2) {
	    var c1 = tinycolor(color1);
	    var c2 = tinycolor(color2);
	    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
	};

	// `isReadable`
	// Ensure that foreground and background color combinations meet WCAG2 guidelines.
	// The third argument is an optional Object.
	//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
	//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
	// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

	// *Example*
	//    tinycolor.isReadable("#000", "#111") => false
	//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
	tinycolor.isReadable = function(color1, color2, wcag2) {
	    var readability = tinycolor.readability(color1, color2);
	    var wcag2Parms, out;

	    out = false;

	    wcag2Parms = validateWCAG2Parms(wcag2);
	    switch (wcag2Parms.level + wcag2Parms.size) {
	        case "AAsmall":
	        case "AAAlarge":
	            out = readability >= 4.5;
	            break;
	        case "AAlarge":
	            out = readability >= 3;
	            break;
	        case "AAAsmall":
	            out = readability >= 7;
	            break;
	    }
	    return out;

	};

	// `mostReadable`
	// Given a base color and a list of possible foreground or background
	// colors for that base, returns the most readable color.
	// Optionally returns Black or White if the most readable color is unreadable.
	// *Example*
	//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
	//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
	//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
	//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
	tinycolor.mostReadable = function(baseColor, colorList, args) {
	    var bestColor = null;
	    var bestScore = 0;
	    var readability;
	    var includeFallbackColors, level, size ;
	    args = args || {};
	    includeFallbackColors = args.includeFallbackColors ;
	    level = args.level;
	    size = args.size;

	    for (var i= 0; i < colorList.length ; i++) {
	        readability = tinycolor.readability(baseColor, colorList[i]);
	        if (readability > bestScore) {
	            bestScore = readability;
	            bestColor = tinycolor(colorList[i]);
	        }
	    }

	    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
	        return bestColor;
	    }
	    else {
	        args.includeFallbackColors=false;
	        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
	    }
	};


	// Big List of Colors
	// ------------------
	// <http://www.w3.org/TR/css3-color/#svg-color>
	var names = tinycolor.names = {
	    aliceblue: "f0f8ff",
	    antiquewhite: "faebd7",
	    aqua: "0ff",
	    aquamarine: "7fffd4",
	    azure: "f0ffff",
	    beige: "f5f5dc",
	    bisque: "ffe4c4",
	    black: "000",
	    blanchedalmond: "ffebcd",
	    blue: "00f",
	    blueviolet: "8a2be2",
	    brown: "a52a2a",
	    burlywood: "deb887",
	    burntsienna: "ea7e5d",
	    cadetblue: "5f9ea0",
	    chartreuse: "7fff00",
	    chocolate: "d2691e",
	    coral: "ff7f50",
	    cornflowerblue: "6495ed",
	    cornsilk: "fff8dc",
	    crimson: "dc143c",
	    cyan: "0ff",
	    darkblue: "00008b",
	    darkcyan: "008b8b",
	    darkgoldenrod: "b8860b",
	    darkgray: "a9a9a9",
	    darkgreen: "006400",
	    darkgrey: "a9a9a9",
	    darkkhaki: "bdb76b",
	    darkmagenta: "8b008b",
	    darkolivegreen: "556b2f",
	    darkorange: "ff8c00",
	    darkorchid: "9932cc",
	    darkred: "8b0000",
	    darksalmon: "e9967a",
	    darkseagreen: "8fbc8f",
	    darkslateblue: "483d8b",
	    darkslategray: "2f4f4f",
	    darkslategrey: "2f4f4f",
	    darkturquoise: "00ced1",
	    darkviolet: "9400d3",
	    deeppink: "ff1493",
	    deepskyblue: "00bfff",
	    dimgray: "696969",
	    dimgrey: "696969",
	    dodgerblue: "1e90ff",
	    firebrick: "b22222",
	    floralwhite: "fffaf0",
	    forestgreen: "228b22",
	    fuchsia: "f0f",
	    gainsboro: "dcdcdc",
	    ghostwhite: "f8f8ff",
	    gold: "ffd700",
	    goldenrod: "daa520",
	    gray: "808080",
	    green: "008000",
	    greenyellow: "adff2f",
	    grey: "808080",
	    honeydew: "f0fff0",
	    hotpink: "ff69b4",
	    indianred: "cd5c5c",
	    indigo: "4b0082",
	    ivory: "fffff0",
	    khaki: "f0e68c",
	    lavender: "e6e6fa",
	    lavenderblush: "fff0f5",
	    lawngreen: "7cfc00",
	    lemonchiffon: "fffacd",
	    lightblue: "add8e6",
	    lightcoral: "f08080",
	    lightcyan: "e0ffff",
	    lightgoldenrodyellow: "fafad2",
	    lightgray: "d3d3d3",
	    lightgreen: "90ee90",
	    lightgrey: "d3d3d3",
	    lightpink: "ffb6c1",
	    lightsalmon: "ffa07a",
	    lightseagreen: "20b2aa",
	    lightskyblue: "87cefa",
	    lightslategray: "789",
	    lightslategrey: "789",
	    lightsteelblue: "b0c4de",
	    lightyellow: "ffffe0",
	    lime: "0f0",
	    limegreen: "32cd32",
	    linen: "faf0e6",
	    magenta: "f0f",
	    maroon: "800000",
	    mediumaquamarine: "66cdaa",
	    mediumblue: "0000cd",
	    mediumorchid: "ba55d3",
	    mediumpurple: "9370db",
	    mediumseagreen: "3cb371",
	    mediumslateblue: "7b68ee",
	    mediumspringgreen: "00fa9a",
	    mediumturquoise: "48d1cc",
	    mediumvioletred: "c71585",
	    midnightblue: "191970",
	    mintcream: "f5fffa",
	    mistyrose: "ffe4e1",
	    moccasin: "ffe4b5",
	    navajowhite: "ffdead",
	    navy: "000080",
	    oldlace: "fdf5e6",
	    olive: "808000",
	    olivedrab: "6b8e23",
	    orange: "ffa500",
	    orangered: "ff4500",
	    orchid: "da70d6",
	    palegoldenrod: "eee8aa",
	    palegreen: "98fb98",
	    paleturquoise: "afeeee",
	    palevioletred: "db7093",
	    papayawhip: "ffefd5",
	    peachpuff: "ffdab9",
	    peru: "cd853f",
	    pink: "ffc0cb",
	    plum: "dda0dd",
	    powderblue: "b0e0e6",
	    purple: "800080",
	    rebeccapurple: "663399",
	    red: "f00",
	    rosybrown: "bc8f8f",
	    royalblue: "4169e1",
	    saddlebrown: "8b4513",
	    salmon: "fa8072",
	    sandybrown: "f4a460",
	    seagreen: "2e8b57",
	    seashell: "fff5ee",
	    sienna: "a0522d",
	    silver: "c0c0c0",
	    skyblue: "87ceeb",
	    slateblue: "6a5acd",
	    slategray: "708090",
	    slategrey: "708090",
	    snow: "fffafa",
	    springgreen: "00ff7f",
	    steelblue: "4682b4",
	    tan: "d2b48c",
	    teal: "008080",
	    thistle: "d8bfd8",
	    tomato: "ff6347",
	    turquoise: "40e0d0",
	    violet: "ee82ee",
	    wheat: "f5deb3",
	    white: "fff",
	    whitesmoke: "f5f5f5",
	    yellow: "ff0",
	    yellowgreen: "9acd32"
	};

	// Make it easy to access colors via `hexNames[hex]`
	var hexNames = tinycolor.hexNames = flip(names);


	// Utilities
	// ---------

	// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
	function flip(o) {
	    var flipped = { };
	    for (var i in o) {
	        if (o.hasOwnProperty(i)) {
	            flipped[o[i]] = i;
	        }
	    }
	    return flipped;
	}

	// Return a valid alpha value [0,1] with all invalid values being set to 1
	function boundAlpha(a) {
	    a = parseFloat(a);

	    if (isNaN(a) || a < 0 || a > 1) {
	        a = 1;
	    }

	    return a;
	}

	// Take input from [0, n] and return it as [0, 1]
	function bound01(n, max) {
	    if (isOnePointZero(n)) { n = "100%"; }

	    var processPercent = isPercentage(n);
	    n = mathMin(max, mathMax(0, parseFloat(n)));

	    // Automatically convert percentage into number
	    if (processPercent) {
	        n = parseInt(n * max, 10) / 100;
	    }

	    // Handle floating point rounding errors
	    if ((Math.abs(n - max) < 0.000001)) {
	        return 1;
	    }

	    // Convert into [0, 1] range if it isn't already
	    return (n % max) / parseFloat(max);
	}

	// Force a number between 0 and 1
	function clamp01(val) {
	    return mathMin(1, mathMax(0, val));
	}

	// Parse a base-16 hex value into a base-10 integer
	function parseIntFromHex(val) {
	    return parseInt(val, 16);
	}

	// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
	// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
	function isOnePointZero(n) {
	    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
	}

	// Check to see if string passed in is a percentage
	function isPercentage(n) {
	    return typeof n === "string" && n.indexOf('%') != -1;
	}

	// Force a hex value to have 2 characters
	function pad2(c) {
	    return c.length == 1 ? '0' + c : '' + c;
	}

	// Replace a decimal with it's percentage value
	function convertToPercentage(n) {
	    if (n <= 1) {
	        n = (n * 100) + "%";
	    }

	    return n;
	}

	// Converts a decimal to a hex value
	function convertDecimalToHex(d) {
	    return Math.round(parseFloat(d) * 255).toString(16);
	}
	// Converts a hex value to a decimal
	function convertHexToDecimal(h) {
	    return (parseIntFromHex(h) / 255);
	}

	var matchers = (function() {

	    // <http://www.w3.org/TR/css3-values/#integers>
	    var CSS_INTEGER = "[-\\+]?\\d+%?";

	    // <http://www.w3.org/TR/css3-values/#number-value>
	    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

	    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
	    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

	    // Actual matching.
	    // Parentheses and commas are optional, but not required.
	    // Whitespace can take the place of commas or opening paren
	    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

	    return {
	        CSS_UNIT: new RegExp(CSS_UNIT),
	        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
	        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
	        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
	        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
	        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
	        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
	        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
	        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	    };
	})();

	// `isValidCSSUnit`
	// Take in a single string / number and check to see if it looks like a CSS unit
	// (see `matchers` above for definition).
	function isValidCSSUnit(color) {
	    return !!matchers.CSS_UNIT.exec(color);
	}

	// `stringInputToObject`
	// Permissive string parsing.  Take in a number of formats, and output an object
	// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
	function stringInputToObject(color) {

	    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
	    var named = false;
	    if (names[color]) {
	        color = names[color];
	        named = true;
	    }
	    else if (color == 'transparent') {
	        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
	    }

	    // Try to match string input using regular expressions.
	    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
	    // Just return an object and let the conversion functions handle that.
	    // This way the result will be the same whether the tinycolor is initialized with string or object.
	    var match;
	    if ((match = matchers.rgb.exec(color))) {
	        return { r: match[1], g: match[2], b: match[3] };
	    }
	    if ((match = matchers.rgba.exec(color))) {
	        return { r: match[1], g: match[2], b: match[3], a: match[4] };
	    }
	    if ((match = matchers.hsl.exec(color))) {
	        return { h: match[1], s: match[2], l: match[3] };
	    }
	    if ((match = matchers.hsla.exec(color))) {
	        return { h: match[1], s: match[2], l: match[3], a: match[4] };
	    }
	    if ((match = matchers.hsv.exec(color))) {
	        return { h: match[1], s: match[2], v: match[3] };
	    }
	    if ((match = matchers.hsva.exec(color))) {
	        return { h: match[1], s: match[2], v: match[3], a: match[4] };
	    }
	    if ((match = matchers.hex8.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1]),
	            g: parseIntFromHex(match[2]),
	            b: parseIntFromHex(match[3]),
	            a: convertHexToDecimal(match[4]),
	            format: named ? "name" : "hex8"
	        };
	    }
	    if ((match = matchers.hex6.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1]),
	            g: parseIntFromHex(match[2]),
	            b: parseIntFromHex(match[3]),
	            format: named ? "name" : "hex"
	        };
	    }
	    if ((match = matchers.hex4.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1] + '' + match[1]),
	            g: parseIntFromHex(match[2] + '' + match[2]),
	            b: parseIntFromHex(match[3] + '' + match[3]),
	            a: convertHexToDecimal(match[4] + '' + match[4]),
	            format: named ? "name" : "hex8"
	        };
	    }
	    if ((match = matchers.hex3.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1] + '' + match[1]),
	            g: parseIntFromHex(match[2] + '' + match[2]),
	            b: parseIntFromHex(match[3] + '' + match[3]),
	            format: named ? "name" : "hex"
	        };
	    }

	    return false;
	}

	function validateWCAG2Parms(parms) {
	    // return valid WCAG2 parms for isReadable.
	    // If input parms are invalid, return {"level":"AA", "size":"small"}
	    var level, size;
	    parms = parms || {"level":"AA", "size":"small"};
	    level = (parms.level || "AA").toUpperCase();
	    size = (parms.size || "small").toLowerCase();
	    if (level !== "AA" && level !== "AAA") {
	        level = "AA";
	    }
	    if (size !== "small" && size !== "large") {
	        size = "small";
	    }
	    return {"level":level, "size":size};
	}

	// Node: Export function
	if (typeof module !== "undefined" && module.exports) {
	    module.exports = tinycolor;
	}
	// AMD/requirejs: Define the module
	else if (true) {
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {return tinycolor;}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}
	// Browser: Expose to window
	else {
	    window.tinycolor = tinycolor;
	}

	})(Math);


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	/*!
	 * @license
	 * TradingView Lightweight Charts v3.8.0
	 * Copyright (c) 2020 TradingView, Inc.
	 * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
	 */
	!function(){"use strict";var t,i;function n(t,i){var n,s=((n={})[0]=[],n[1]=[t.lineWidth,t.lineWidth],n[2]=[2*t.lineWidth,2*t.lineWidth],n[3]=[6*t.lineWidth,6*t.lineWidth],n[4]=[t.lineWidth,4*t.lineWidth],n)[i];t.setLineDash(s)}function s(t,i,n,s){t.beginPath();var h=t.lineWidth%2?.5:0;t.moveTo(n,i+h),t.lineTo(s,i+h),t.stroke()}function h(t,i){if(!t)throw new Error("Assertion failed"+(i?": "+i:""))}function r(t){if(void 0===t)throw new Error("Value is undefined");return t}function e(t){if(null===t)throw new Error("Value is null");return t}function u(t){return e(r(t))}!function(t){t[t.Simple=0]="Simple",t[t.WithSteps=1]="WithSteps"}(t||(t={})),function(t){t[t.Solid=0]="Solid",t[t.Dotted=1]="Dotted",t[t.Dashed=2]="Dashed",t[t.LargeDashed=3]="LargeDashed",t[t.SparseDotted=4]="SparseDotted"}(i||(i={}));var a={khaki:"#f0e68c",azure:"#f0ffff",aliceblue:"#f0f8ff",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gainsboro:"#dcdcdc",gray:"#808080",green:"#008000",honeydew:"#f0fff0",floralwhite:"#fffaf0",lightblue:"#add8e6",lightcoral:"#f08080",lemonchiffon:"#fffacd",hotpink:"#ff69b4",lightyellow:"#ffffe0",greenyellow:"#adff2f",lightgoldenrodyellow:"#fafad2",limegreen:"#32cd32",linen:"#faf0e6",lightcyan:"#e0ffff",magenta:"#f0f",maroon:"#800000",olive:"#808000",orange:"#ffa500",oldlace:"#fdf5e6",mediumblue:"#0000cd",transparent:"#0000",lime:"#0f0",lightpink:"#ffb6c1",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",midnightblue:"#191970",orchid:"#da70d6",mediumorchid:"#ba55d3",mediumturquoise:"#48d1cc",orangered:"#ff4500",royalblue:"#4169e1",powderblue:"#b0e0e6",red:"#f00",coral:"#ff7f50",turquoise:"#40e0d0",white:"#fff",whitesmoke:"#f5f5f5",wheat:"#f5deb3",teal:"#008080",steelblue:"#4682b4",bisque:"#ffe4c4",aquamarine:"#7fffd4",aqua:"#0ff",sienna:"#a0522d",silver:"#c0c0c0",springgreen:"#00ff7f",antiquewhite:"#faebd7",burlywood:"#deb887",brown:"#a52a2a",beige:"#f5f5dc",chocolate:"#d2691e",chartreuse:"#7fff00",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cadetblue:"#5f9ea0",tomato:"#ff6347",fuchsia:"#f0f",blue:"#00f",salmon:"#fa8072",blanchedalmond:"#ffebcd",slateblue:"#6a5acd",slategray:"#708090",thistle:"#d8bfd8",tan:"#d2b48c",cyan:"#0ff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",blueviolet:"#8a2be2",black:"#000",darkmagenta:"#8b008b",darkslateblue:"#483d8b",darkkhaki:"#bdb76b",darkorchid:"#9932cc",darkorange:"#ff8c00",darkgreen:"#006400",darkred:"#8b0000",dodgerblue:"#1e90ff",darkslategray:"#2f4f4f",dimgray:"#696969",deepskyblue:"#00bfff",firebrick:"#b22222",forestgreen:"#228b22",indigo:"#4b0082",ivory:"#fffff0",lavenderblush:"#fff0f5",feldspar:"#d19275",indianred:"#cd5c5c",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightskyblue:"#87cefa",lightslategray:"#789",lightslateblue:"#8470ff",snow:"#fffafa",lightseagreen:"#20b2aa",lightsalmon:"#ffa07a",darksalmon:"#e9967a",darkviolet:"#9400d3",mediumpurple:"#9370d8",mediumaquamarine:"#66cdaa",skyblue:"#87ceeb",lavender:"#e6e6fa",lightsteelblue:"#b0c4de",mediumvioletred:"#c71585",mintcream:"#f5fffa",navajowhite:"#ffdead",navy:"#000080",olivedrab:"#6b8e23",palevioletred:"#d87093",violetred:"#d02090",yellow:"#ff0",yellowgreen:"#9acd32",lawngreen:"#7cfc00",pink:"#ffc0cb",paleturquoise:"#afeeee",palegoldenrod:"#eee8aa",darkolivegreen:"#556b2f",darkseagreen:"#8fbc8f",darkturquoise:"#00ced1",peachpuff:"#ffdab9",deeppink:"#ff1493",violet:"#ee82ee",palegreen:"#98fb98",mediumseagreen:"#3cb371",peru:"#cd853f",saddlebrown:"#8b4513",sandybrown:"#f4a460",rosybrown:"#bc8f8f",purple:"#800080",seagreen:"#2e8b57",seashell:"#fff5ee",papayawhip:"#ffefd5",mediumslateblue:"#7b68ee",plum:"#dda0dd",mediumspringgreen:"#00fa9a"};function o(t){return t<0?0:t>255?255:Math.round(t)||0}function l(t){return t<=0||t>0?t<0?0:t>1?1:Math.round(1e4*t)/1e4:0}var f=/^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i,c=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i,v=/^rgb\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*\)$/,_=/^rgba\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?[\d]{0,10}(?:\.\d+)?)\s*\)$/;function d(t){var i;if((t=t.toLowerCase())in a&&(t=a[t]),i=_.exec(t)||v.exec(t))return[o(parseInt(i[1],10)),o(parseInt(i[2],10)),o(parseInt(i[3],10)),l(i.length<5?1:parseFloat(i[4]))];if(i=c.exec(t))return[o(parseInt(i[1],16)),o(parseInt(i[2],16)),o(parseInt(i[3],16)),1];if(i=f.exec(t))return[o(17*parseInt(i[1],16)),o(17*parseInt(i[2],16)),o(17*parseInt(i[3],16)),1];throw new Error("Cannot parse color: ".concat(t))}function w(t){var i,n=d(t);return{t:"rgb(".concat(n[0],", ").concat(n[1],", ").concat(n[2],")"),i:(i=n,.199*i[0]+.687*i[1]+.114*i[2]>160?"black":"white")}}var M=function(t,i){return M=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,i){t.__proto__=i}||function(t,i){for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(t[n]=i[n])},M(t,i)};function b(t,i){if("function"!=typeof i&&null!==i)throw new TypeError("Class extends value "+String(i)+" is not a constructor or null");function n(){this.constructor=t}M(t,i),t.prototype=null===i?Object.create(i):(n.prototype=i.prototype,new n)}var m=function(){return m=Object.assign||function(t){for(var i,n=1,s=arguments.length;n<s;n++)for(var h in i=arguments[n])Object.prototype.hasOwnProperty.call(i,h)&&(t[h]=i[h]);return t},m.apply(this,arguments)};function g(t,i,n){if(n||2===arguments.length)for(var s,h=0,r=i.length;h<r;h++)!s&&h in i||(s||(s=Array.prototype.slice.call(i,0,h)),s[h]=i[h]);return t.concat(s||Array.prototype.slice.call(i))}var p=function(){function t(){this.h=[]}return t.prototype.u=function(t,i,n){var s={o:t,l:i,v:!0===n};this.h.push(s)},t.prototype._=function(t){var i=this.h.findIndex((function(i){return t===i.o}));i>-1&&this.h.splice(i,1)},t.prototype.M=function(t){this.h=this.h.filter((function(i){return i.l!==t}))},t.prototype.m=function(t,i){var n=g([],this.h,!0);this.h=this.h.filter((function(t){return!t.v})),n.forEach((function(n){return n.o(t,i)}))},t.prototype.g=function(){return this.h.length>0},t.prototype.p=function(){this.h=[]},t}();function y(t){for(var i=[],n=1;n<arguments.length;n++)i[n-1]=arguments[n];for(var s=0,h=i;s<h.length;s++){var r=h[s];for(var e in r)void 0!==r[e]&&("object"!=typeof r[e]||void 0===t[e]?t[e]=r[e]:y(t[e],r[e]))}return t}function k(t){return"number"==typeof t&&isFinite(t)}function x(t){return"number"==typeof t&&t%1==0}function N(t){return"string"==typeof t}function C(t){return"boolean"==typeof t}function S(t){var i,n,s,h=t;if(!h||"object"!=typeof h)return h;for(n in i=Array.isArray(h)?[]:{},h)h.hasOwnProperty(n)&&(s=h[n],i[n]=s&&"object"==typeof s?S(s):s);return i}function T(t){return null!==t}function D(t){return null===t?void 0:t}var A="'Trebuchet MS', Roboto, Ubuntu, sans-serif";function B(t,i,n){return n=void 0!==n?"".concat(n," "):"",void 0===i&&(i=A),"".concat(n).concat(t,"px ").concat(i)}var L=function(){function t(t){this.k={N:1,C:4,S:NaN,T:"",D:"",A:"",B:0,L:0,O:0,F:0,V:0},this.P=t}return t.prototype.R=function(){var t=this.k,i=this.W(),n=this.I();return t.S===i&&t.D===n||(t.S=i,t.D=n,t.T=B(i,n),t.F=Math.floor(i/3.5),t.B=t.F,t.L=Math.max(Math.ceil(i/2-t.C/2),0),t.O=Math.ceil(i/2+t.C/2),t.V=Math.round(i/10)),t.A=this.j(),this.k},t.prototype.j=function(){return this.P.R().layout.textColor},t.prototype.W=function(){return this.P.R().layout.fontSize},t.prototype.I=function(){return this.P.R().layout.fontFamily},t}(),E=function(){function t(){this.q=[]}return t.prototype.U=function(t){this.q=t},t.prototype.H=function(t,i,n,s){this.q.forEach((function(h){t.save(),h.H(t,i,n,s),t.restore()}))},t}(),O=function(){function t(){}return t.prototype.H=function(t,i,n,s){t.save(),t.scale(i,i),this.Y(t,n,s),t.restore()},t.prototype.$=function(t,i,n,s){t.save(),t.scale(i,i),this.K(t,n,s),t.restore()},t.prototype.K=function(t,i,n){},t}(),F=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.X=null,i}return b(i,t),i.prototype.Z=function(t){this.X=t},i.prototype.Y=function(t){if(null!==this.X&&null!==this.X.J){var i=this.X.J,n=this.X,s=function(s){t.beginPath();for(var h=i.to-1;h>=i.from;--h){var r=n.G[h];t.moveTo(r.tt,r.it),t.arc(r.tt,r.it,s,0,2*Math.PI)}t.fill()};t.fillStyle=n.nt,s(n.st+2),t.fillStyle=n.ht,s(n.st)}},i}(O);function V(){return{G:[{tt:0,it:0,rt:0,et:0}],ht:"",nt:"",st:0,J:null}}var P={from:0,to:1},R=function(){function t(t,i){this.ut=new E,this.ot=[],this.lt=[],this.ft=!0,this.P=t,this.ct=i,this.ut.U(this.ot)}return t.prototype.vt=function(t){var i=this.P._t();i.length!==this.ot.length&&(this.lt=i.map(V),this.ot=this.lt.map((function(t){var i=new F;return i.Z(t),i})),this.ut.U(this.ot)),this.ft=!0},t.prototype.dt=function(t,i,n){return this.ft&&(this.wt(t),this.ft=!1),this.ut},t.prototype.wt=function(t){var i=this,n=this.P._t(),s=this.ct.Mt(),h=this.P.bt();n.forEach((function(n,r){var u,a=i.lt[r],o=n.gt(s);if(null!==o&&n.yt()){var l=e(n.kt());a.ht=o.xt,a.st=o.st,a.G[0].et=o.et,a.G[0].it=n.Ct().Nt(o.et,l.St),a.nt=null!==(u=o.Tt)&&void 0!==u?u:i.P.Dt(a.G[0].it/t),a.G[0].rt=s,a.G[0].tt=h.At(s),a.J=P}else a.J=null}))},t}(),z=function(){function t(t){this.Bt=t}return t.prototype.H=function(t,i,h,r){if(null!==this.Bt){var e=this.Bt.Lt.yt,u=this.Bt.Et.yt;if(e||u){t.save();var a=Math.round(this.Bt.tt*i),o=Math.round(this.Bt.it*i),l=Math.ceil(this.Bt.Ot*i),f=Math.ceil(this.Bt.Ft*i);t.lineCap="butt",e&&a>=0&&(t.lineWidth=Math.floor(this.Bt.Lt.Vt*i),t.strokeStyle=this.Bt.Lt.A,t.fillStyle=this.Bt.Lt.A,n(t,this.Bt.Lt.Pt),function(t,i,n,s){t.beginPath();var h=t.lineWidth%2?.5:0;t.moveTo(i+h,n),t.lineTo(i+h,s),t.stroke()}(t,a,0,f)),u&&o>=0&&(t.lineWidth=Math.floor(this.Bt.Et.Vt*i),t.strokeStyle=this.Bt.Et.A,t.fillStyle=this.Bt.Et.A,n(t,this.Bt.Et.Pt),s(t,o,0,l)),t.restore()}}},t}(),W=function(){function t(t){this.ft=!0,this.Rt={Lt:{Vt:1,Pt:0,A:"",yt:!1},Et:{Vt:1,Pt:0,A:"",yt:!1},Ot:0,Ft:0,tt:0,it:0},this.zt=new z(this.Rt),this.Wt=t}return t.prototype.vt=function(){this.ft=!0},t.prototype.dt=function(t,i){return this.ft&&(this.wt(),this.ft=!1),this.zt},t.prototype.wt=function(){var t=this.Wt.yt(),i=e(this.Wt.It()),n=i.jt().R().crosshair,s=this.Rt;s.Et.yt=t&&this.Wt.qt(i),s.Lt.yt=t&&this.Wt.Ut(),s.Et.Vt=n.horzLine.width,s.Et.Pt=n.horzLine.style,s.Et.A=n.horzLine.color,s.Lt.Vt=n.vertLine.width,s.Lt.Pt=n.vertLine.style,s.Lt.A=n.vertLine.color,s.Ot=i.Ht(),s.Ft=i.Yt(),s.tt=this.Wt.$t(),s.it=this.Wt.Kt()},t}();function I(t,i,n,s,h,r){t.fillRect(i+r,n,s-2*r,r),t.fillRect(i+r,n+h-r,s-2*r,r),t.fillRect(i,n,r,h),t.fillRect(i+s-r,n,r,h)}function j(t,i,n){t.save(),t.scale(i,i),n(),t.restore()}function q(t,i,n,s,h,r){t.save(),t.globalCompositeOperation="copy",t.fillStyle=r,t.fillRect(i,n,s,h),t.restore()}function U(t,i,n,s,h,r,e){t.save(),t.globalCompositeOperation="copy";var u=t.createLinearGradient(0,0,0,h);u.addColorStop(0,r),u.addColorStop(1,e),t.fillStyle=u,t.fillRect(i,n,s,h),t.restore()}var H,Y=function(){function t(t,i){this.Z(t,i)}return t.prototype.Z=function(t,i){this.Bt=t,this.Xt=i},t.prototype.H=function(t,i,n,s,h,r){if(this.Bt.yt){t.font=i.T;var e=this.Bt.Zt||!this.Bt.Jt?i.C:0,u=i.N,a=i.F,o=i.B,l=i.L,f=i.O,c=this.Bt.Gt,v=Math.ceil(n.Qt(t,c)),_=i.V,d=i.S+a+o,w=Math.ceil(.5*d),M=u+v+l+f+e,b=this.Xt.ti;this.Xt.ii&&(b=this.Xt.ii);var m,g,p=(b=Math.round(b))-w,y=p+d,k="right"===h,x=k?s:0,N=Math.ceil(s*r),C=x;if(t.fillStyle=this.Xt.t,t.lineWidth=1,t.lineCap="butt",c){k?(m=x-e,g=(C=x-M)+f):(C=x+M,m=x+e,g=x+u+e+l);var S=Math.max(1,Math.floor(r)),T=Math.max(1,Math.floor(u*r)),D=k?N:0,A=Math.round(p*r),B=Math.round(C*r),L=Math.round(b*r)-Math.floor(.5*r),E=L+S+(L-A),O=Math.round(m*r);t.save(),t.beginPath(),t.moveTo(D,A),t.lineTo(B,A),t.lineTo(B,E),t.lineTo(D,E),t.fill(),t.fillStyle=this.Bt.Tt,t.fillRect(k?N-T:0,A,T,E-A),this.Bt.Zt&&(t.fillStyle=this.Xt.A,t.fillRect(D,L,O-D,S)),t.textAlign="left",t.fillStyle=this.Xt.A,j(t,r,(function(){t.fillText(c,g,y-o-_)})),t.restore()}}},t.prototype.Yt=function(t,i){return this.Bt.yt?t.S+t.F+t.B:0},t}(),$=function(){function t(t){this.ni={ti:0,A:"#FFF",t:"#000"},this.si={Gt:"",yt:!1,Zt:!0,Jt:!1,Tt:""},this.hi={Gt:"",yt:!1,Zt:!1,Jt:!0,Tt:""},this.ft=!0,this.ri=new(t||Y)(this.si,this.ni),this.ei=new(t||Y)(this.hi,this.ni)}return t.prototype.Gt=function(){return this.ui(),this.si.Gt},t.prototype.ti=function(){return this.ui(),this.ni.ti},t.prototype.vt=function(){this.ft=!0},t.prototype.Yt=function(t,i){return void 0===i&&(i=!1),Math.max(this.ri.Yt(t,i),this.ei.Yt(t,i))},t.prototype.ai=function(){return this.ni.ii||0},t.prototype.oi=function(t){this.ni.ii=t},t.prototype.li=function(){return this.ui(),this.si.yt||this.hi.yt},t.prototype.fi=function(){return this.ui(),this.si.yt},t.prototype.dt=function(t){return this.ui(),this.si.Zt=this.si.Zt&&t.R().drawTicks,this.hi.Zt=this.hi.Zt&&t.R().drawTicks,this.ri.Z(this.si,this.ni),this.ei.Z(this.hi,this.ni),this.ri},t.prototype.ci=function(){return this.ui(),this.ri.Z(this.si,this.ni),this.ei.Z(this.hi,this.ni),this.ei},t.prototype.ui=function(){this.ft&&(this.si.Zt=!0,this.hi.Zt=!1,this.vi(this.si,this.hi,this.ni))},t}(),K=function(t){function i(i,n,s){var h=t.call(this)||this;return h.Wt=i,h._i=n,h.di=s,h}return b(i,t),i.prototype.vi=function(t,i,n){t.yt=!1;var s=this.Wt.R().horzLine;if(s.labelVisible){var h=this._i.kt();if(this.Wt.yt()&&!this._i.wi()&&null!==h){var r=w(s.labelBackgroundColor);n.t=r.t,n.A=r.i;var e=this.di(this._i);n.ti=e.ti,t.Gt=this._i.Mi(e.et,h),t.yt=!0}}},i}($),X=/[1-9]/g,Z=function(){function t(){this.Bt=null}return t.prototype.Z=function(t){this.Bt=t},t.prototype.H=function(t,i,n){var s=this;if(null!==this.Bt&&!1!==this.Bt.yt&&0!==this.Bt.Gt.length){t.font=i.T;var h=Math.round(i.bi.Qt(t,this.Bt.Gt,X));if(!(h<=0)){t.save();var r=i.mi,u=h+2*r,a=u/2,o=this.Bt.Ht,l=this.Bt.ti,f=Math.floor(l-a)+.5;f<0?(l+=Math.abs(0-f),f=Math.floor(l-a)+.5):f+u>o&&(l-=Math.abs(o-(f+u)),f=Math.floor(l-a)+.5);var c=f+u,v=0+i.N+i.F+i.S+i.B;t.fillStyle=this.Bt.t;var _=Math.round(f*n),d=Math.round(0*n),w=Math.round(c*n),M=Math.round(v*n);t.fillRect(_,d,w-_,M-d);var b=Math.round(this.Bt.ti*n),m=d,g=Math.round((m+i.N+i.C)*n);t.fillStyle=this.Bt.A;var p=Math.max(1,Math.floor(n)),y=Math.floor(.5*n);t.fillRect(b-y,m,p,g-m);var k=v-i.V-i.B;t.textAlign="left",t.fillStyle=this.Bt.A,j(t,n,(function(){t.fillText(e(s.Bt).Gt,f+r,k)})),t.restore()}}},t}(),J=function(){function t(t,i,n){this.ft=!0,this.zt=new Z,this.Rt={yt:!1,t:"#4c525e",A:"white",Gt:"",Ht:0,ti:NaN},this.ct=t,this.gi=i,this.di=n}return t.prototype.vt=function(){this.ft=!0},t.prototype.dt=function(){return this.ft&&(this.wt(),this.ft=!1),this.zt.Z(this.Rt),this.zt},t.prototype.wt=function(){var t=this.Rt;t.yt=!1;var i=this.ct.R().vertLine;if(i.labelVisible){var n=this.gi.bt();if(!n.wi()){var s=n.pi(this.ct.Mt());t.Ht=n.Ht();var h=this.di();if(h.rt){t.ti=h.ti,t.Gt=n.yi(e(s)),t.yt=!0;var r=w(i.labelBackgroundColor);t.t=r.t,t.A=r.i}}}},t}(),G=function(){function t(){this.ki=null,this.xi=0}return t.prototype.Ni=function(){return this.xi},t.prototype.Ci=function(t){this.xi=t},t.prototype.Ct=function(){return this.ki},t.prototype.Si=function(t){this.ki=t},t.prototype.Ti=function(){return[]},t.prototype.yt=function(){return!0},t}();!function(t){t[t.Normal=0]="Normal",t[t.Magnet=1]="Magnet"}(H||(H={}));var Q=function(t){function i(i,n){var s=t.call(this)||this;s.Di=null,s.Ai=NaN,s.Bi=0,s.Li=!0,s.Ei=new Map,s.Oi=!1,s.Fi=NaN,s.Vi=NaN,s.Pi=NaN,s.Ri=NaN,s.gi=i,s.zi=n,s.Wi=new R(i,s);var h,r;s.Ii=(h=function(){return s.Ai},r=function(){return s.Vi},function(t){var i=r(),n=h();if(t===e(s.Di).ji())return{et:n,ti:i};var u=e(t.kt());return{et:t.qi(i,u),ti:i}});var u=function(t,i){return function(){return{rt:s.gi.bt().pi(t()),ti:i()}}}((function(){return s.Bi}),(function(){return s.$t()}));return s.Ui=new J(s,i,u),s.Hi=new W(s),s}return b(i,t),i.prototype.R=function(){return this.zi},i.prototype.Yi=function(t,i){this.Pi=t,this.Ri=i},i.prototype.$i=function(){this.Pi=NaN,this.Ri=NaN},i.prototype.Ki=function(){return this.Pi},i.prototype.Xi=function(){return this.Ri},i.prototype.Zi=function(t,i,n){this.Oi||(this.Oi=!0),this.Li=!0,this.Ji(t,i,n)},i.prototype.Mt=function(){return this.Bi},i.prototype.$t=function(){return this.Fi},i.prototype.Kt=function(){return this.Vi},i.prototype.yt=function(){return this.Li},i.prototype.Gi=function(){this.Li=!1,this.Qi(),this.Ai=NaN,this.Fi=NaN,this.Vi=NaN,this.Di=null,this.$i()},i.prototype.tn=function(t){return null!==this.Di?[this.Hi,this.Wi]:[]},i.prototype.qt=function(t){return t===this.Di&&this.zi.horzLine.visible},i.prototype.Ut=function(){return this.zi.vertLine.visible},i.prototype.nn=function(t,i){this.Li&&this.Di===t||this.Ei.clear();var n=[];return this.Di===t&&n.push(this.sn(this.Ei,i,this.Ii)),n},i.prototype.Ti=function(){return this.Li?[this.Ui]:[]},i.prototype.It=function(){return this.Di},i.prototype.hn=function(){this.Hi.vt(),this.Ei.forEach((function(t){return t.vt()})),this.Ui.vt(),this.Wi.vt()},i.prototype.rn=function(t){return t&&!t.ji().wi()?t.ji():null},i.prototype.Ji=function(t,i,n){this.en(t,i,n)&&this.hn()},i.prototype.en=function(t,i,n){var s=this.Fi,h=this.Vi,r=this.Ai,e=this.Bi,u=this.Di,a=this.rn(n);this.Bi=t,this.Fi=isNaN(t)?NaN:this.gi.bt().At(t),this.Di=n;var o=null!==a?a.kt():null;return null!==a&&null!==o?(this.Ai=i,this.Vi=a.Nt(i,o)):(this.Ai=NaN,this.Vi=NaN),s!==this.Fi||h!==this.Vi||e!==this.Bi||r!==this.Ai||u!==this.Di},i.prototype.Qi=function(){var t=this.gi._t().map((function(t){return t.an().un()})).filter(T),i=0===t.length?null:Math.max.apply(Math,t);this.Bi=null!==i?i:NaN},i.prototype.sn=function(t,i,n){var s=t.get(i);return void 0===s&&(s=new K(this,i,n),t.set(i,s)),s},i}(G);function tt(t){return"left"===t||"right"===t}var it=function(){function t(t){this.on=new Map,this.ln=[],this.fn=t}return t.prototype.cn=function(t,i){var n=function(t,i){return void 0===t?i:{vn:Math.max(t.vn,i.vn),_n:t._n||i._n}}(this.on.get(t),i);this.on.set(t,n)},t.prototype.dn=function(){return this.fn},t.prototype.wn=function(t){var i=this.on.get(t);return void 0===i?{vn:this.fn}:{vn:Math.max(this.fn,i.vn),_n:i._n}},t.prototype.Mn=function(){this.ln=[{bn:0}]},t.prototype.mn=function(t){this.ln=[{bn:1,St:t}]},t.prototype.gn=function(){this.ln=[{bn:4}]},t.prototype.pn=function(t){this.ln.push({bn:2,St:t})},t.prototype.yn=function(t){this.ln.push({bn:3,St:t})},t.prototype.kn=function(){return this.ln},t.prototype.xn=function(t){for(var i=this,n=0,s=t.ln;n<s.length;n++){var h=s[n];this.Nn(h)}this.fn=Math.max(this.fn,t.fn),t.on.forEach((function(t,n){i.cn(n,t)}))},t.prototype.Nn=function(t){switch(t.bn){case 0:this.Mn();break;case 1:this.mn(t.St);break;case 2:this.pn(t.St);break;case 3:this.yn(t.St);break;case 4:this.gn()}},t}(),nt=".";function st(t,i){if(!k(t))return"n/a";if(!x(i))throw new TypeError("invalid length");if(i<0||i>16)throw new TypeError("invalid length");if(0===i)return t.toString();return("0000000000000000"+t.toString()).slice(-i)}var ht=function(){function t(t,i){if(i||(i=1),k(t)&&x(t)||(t=100),t<0)throw new TypeError("invalid base");this._i=t,this.Cn=i,this.Sn()}return t.prototype.format=function(t){var i=t<0?"−":"";return t=Math.abs(t),i+this.Tn(t)},t.prototype.Sn=function(){if(this.Dn=0,this._i>0&&this.Cn>0)for(var t=this._i;t>1;)t/=10,this.Dn++},t.prototype.Tn=function(t){var i=this._i/this.Cn,n=Math.floor(t),s="",h=void 0!==this.Dn?this.Dn:NaN;if(i>1){var r=+(Math.round(t*i)-n*i).toFixed(this.Dn);r>=i&&(r-=i,n+=1),s=nt+st(+r.toFixed(this.Dn)*this.Cn,h)}else n=Math.round(n*i)/i,h>0&&(s=nt+st(0,h));return n.toFixed(0)+s},t}(),rt=function(t){function i(i){return void 0===i&&(i=100),t.call(this,i)||this}return b(i,t),i.prototype.format=function(i){return"".concat(t.prototype.format.call(this,i),"%")},i}(ht),et=function(){function t(t){this.An=t}return t.prototype.format=function(t){var i="";return t<0&&(i="-",t=-t),t<995?i+this.Bn(t):t<999995?i+this.Bn(t/1e3)+"K":t<999999995?(t=1e3*Math.round(t/1e3),i+this.Bn(t/1e6)+"M"):(t=1e6*Math.round(t/1e6),i+this.Bn(t/1e9)+"B")},t.prototype.Bn=function(t){var i=Math.pow(10,this.An);return((t=Math.round(t*i)/i)>=1e-15&&t<1?t.toFixed(this.An).replace(/\.?0+$/,""):String(t)).replace(/(\.[1-9]*)0+$/,(function(t,i){return i}))},t}();function ut(t,i,n,s){if(0!==i.length){var h=i[s.from].tt,r=i[s.from].it;t.moveTo(h,r);for(var e=s.from+1;e<s.to;++e){var u=i[e];if(1===n){var a=i[e-1].it,o=u.tt;t.lineTo(o,a)}t.lineTo(u.tt,u.it)}}}var at=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.X=null,i}return b(i,t),i.prototype.Z=function(t){this.X=t},i.prototype.Y=function(t){if(null!==this.X&&0!==this.X.G.length&&null!==this.X.J){if(t.lineCap="butt",t.lineJoin="round",t.lineWidth=this.X.Vt,n(t,this.X.Pt),t.lineWidth=1,t.beginPath(),1===this.X.G.length){var i=this.X.G[0],s=this.X.Ln/2;t.moveTo(i.tt-s,this.X.En),t.lineTo(i.tt-s,i.it),t.lineTo(i.tt+s,i.it),t.lineTo(i.tt+s,this.X.En)}else t.moveTo(this.X.G[this.X.J.from].tt,this.X.En),t.lineTo(this.X.G[this.X.J.from].tt,this.X.G[this.X.J.from].it),ut(t,this.X.G,this.X.On,this.X.J),this.X.J.to>this.X.J.from&&(t.lineTo(this.X.G[this.X.J.to-1].tt,this.X.En),t.lineTo(this.X.G[this.X.J.from].tt,this.X.En));t.closePath(),t.fillStyle=this.Fn(t),t.fill()}},i}(O),ot=function(t){function i(){return null!==t&&t.apply(this,arguments)||this}return b(i,t),i.prototype.Fn=function(t){var i=this.X,n=t.createLinearGradient(0,0,0,i.Vn);return n.addColorStop(0,i.Pn),n.addColorStop(1,i.Rn),n},i}(at),lt=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.X=null,i}return b(i,t),i.prototype.Z=function(t){this.X=t},i.prototype.Y=function(t){if(null!==this.X&&0!==this.X.G.length&&null!==this.X.J)if(t.lineCap="butt",t.lineWidth=this.X.Vt,n(t,this.X.Pt),t.strokeStyle=this.zn(t),t.lineJoin="round",1===this.X.G.length){t.beginPath();var i=this.X.G[0];t.moveTo(i.tt-this.X.Ln/2,i.it),t.lineTo(i.tt+this.X.Ln/2,i.it),void 0!==i.A&&(t.strokeStyle=i.A),t.stroke()}else this.Wn(t,this.X)},i.prototype.Wn=function(t,i){t.beginPath(),ut(t,i.G,i.On,i.J),t.stroke()},i}(O),ft=function(t){function i(){return null!==t&&t.apply(this,arguments)||this}return b(i,t),i.prototype.Wn=function(t,i){var n,s,h=i.G,r=i.J,e=i.On,u=i.ht;if(0!==h.length&&null!==r){t.beginPath();var a=h[r.from];t.moveTo(a.tt,a.it);var o=null!==(n=a.A)&&void 0!==n?n:u;t.strokeStyle=o;for(var l=function(i){t.stroke(),t.beginPath(),t.strokeStyle=i,o=i},f=r.from+1;f<r.to;++f){var c=h[f],v=h[f-1],_=null!==(s=c.A)&&void 0!==s?s:u;1===e&&(t.lineTo(c.tt,v.it),_!==o&&(l(_),t.moveTo(c.tt,v.it))),t.lineTo(c.tt,c.it),1!==e&&_!==o&&(l(_),t.moveTo(c.tt,c.it))}t.stroke()}},i.prototype.zn=function(){return this.X.ht},i}(lt);function ct(t,i,n,s,h){void 0===s&&(s=0),void 0===h&&(h=t.length);for(var r=h-s;0<r;){var e=r>>1,u=s+e;n(t[u],i)?(s=u+1,r-=e+1):r=e}return s}function vt(t,i,n,s,h){void 0===s&&(s=0),void 0===h&&(h=t.length);for(var r=h-s;0<r;){var e=r>>1,u=s+e;n(i,t[u])?r=e:(s=u+1,r-=e+1)}return s}function _t(t,i){return t.rt<i}function dt(t,i){return t<i.rt}function wt(t,i,n){var s=i.In(),h=i.jn(),r=ct(t,s,_t),e=vt(t,h,dt);if(!n)return{from:r,to:e};var u=r,a=e;return r>0&&r<t.length&&t[r].rt>=s&&(u=r-1),e>0&&e<t.length&&t[e-1].rt<=h&&(a=e+1),{from:u,to:a}}var Mt=function(){function t(t,i,n){this.qn=!0,this.Un=!0,this.Hn=!0,this.Yn=[],this.$n=null,this.Kn=t,this.Xn=i,this.Zn=n}return t.prototype.vt=function(t){this.qn=!0,"data"===t&&(this.Un=!0),"options"===t&&(this.Hn=!0)},t.prototype.Jn=function(){this.Un&&(this.Gn(),this.Un=!1),this.qn&&(this.Qn(),this.qn=!1),this.Hn&&(this.ts(),this.Hn=!1)},t.prototype.ns=function(){this.$n=null},t.prototype.Qn=function(){var t=this.Kn.Ct(),i=this.Xn.bt();if(this.ns(),!i.wi()&&!t.wi()){var n=i.ss();if(null!==n&&0!==this.Kn.an().hs()){var s=this.Kn.kt();null!==s&&(this.$n=wt(this.Yn,n,this.Zn),this.rs(t,i,s.St))}}},t}(),bt=function(t){function i(i,n){return t.call(this,i,n,!0)||this}return b(i,t),i.prototype.rs=function(t,i,n){i.es(this.Yn,D(this.$n)),t.us(this.Yn,n,D(this.$n))},i.prototype.os=function(t,i){return{rt:t,et:i,tt:NaN,it:NaN}},i.prototype.ts=function(){},i.prototype.Gn=function(){var t=this,i=this.Kn.ls();this.Yn=this.Kn.an().fs().map((function(n){var s=n.St[3];return t.cs(n.vs,s,i)}))},i}(Mt),mt=function(t){function i(i,n){var s=t.call(this,i,n)||this;return s.zt=new E,s._s=new ot,s.ds=new ft,s.zt.U([s._s,s.ds]),s}return b(i,t),i.prototype.dt=function(t,i){if(!this.Kn.yt())return null;var n=this.Kn.R();return this.Jn(),this._s.Z({On:n.lineType,G:this.Yn,Pt:n.lineStyle,Vt:n.lineWidth,Pn:n.topColor,Rn:n.bottomColor,En:t,Vn:t,J:this.$n,Ln:this.Xn.bt().ws()}),this.ds.Z({On:n.lineType,G:this.Yn,ht:n.lineColor,Pt:n.lineStyle,Vt:n.lineWidth,J:this.$n,Ln:this.Xn.bt().ws()}),this.zt},i.prototype.cs=function(t,i){return this.os(t,i)},i}(bt);var gt=function(){function t(){this.Bt=null,this.Ms=0,this.bs=0}return t.prototype.Z=function(t){this.Bt=t},t.prototype.H=function(t,i,n,s){if(null!==this.Bt&&0!==this.Bt.an.length&&null!==this.Bt.J){if(this.Ms=this.gs(i),this.Ms>=2)Math.max(1,Math.floor(i))%2!=this.Ms%2&&this.Ms--;this.bs=this.Bt.ps?Math.min(this.Ms,Math.floor(i)):this.Ms;for(var h=null,r=this.bs<=this.Ms&&this.Bt.ws>=Math.floor(1.5*i),e=this.Bt.J.from;e<this.Bt.J.to;++e){var u=this.Bt.an[e];h!==u.A&&(t.fillStyle=u.A,h=u.A);var a=Math.floor(.5*this.bs),o=Math.round(u.tt*i),l=o-a,f=this.bs,c=l+f-1,v=Math.min(u.ys,u.ks),_=Math.max(u.ys,u.ks),d=Math.round(v*i)-a,w=Math.round(_*i)+a,M=Math.max(w-d,this.bs);t.fillRect(l,d,f,M);var b=Math.ceil(1.5*this.Ms);if(r){if(this.Bt.xs){var m=o-b,g=Math.max(d,Math.round(u.Ns*i)-a),p=g+f-1;p>d+M-1&&(g=(p=d+M-1)-f+1),t.fillRect(m,g,l-m,p-g+1)}var y=o+b,k=Math.max(d,Math.round(u.Cs*i)-a),x=k+f-1;x>d+M-1&&(k=(x=d+M-1)-f+1),t.fillRect(c+1,k,y-c,x-k+1)}}}},t.prototype.gs=function(t){var i=Math.floor(t);return Math.max(i,Math.floor(function(t,i){return Math.floor(.3*t*i)}(e(this.Bt).ws,t)))},t}(),pt=function(t){function i(i,n){return t.call(this,i,n,!1)||this}return b(i,t),i.prototype.rs=function(t,i,n){i.es(this.Yn,D(this.$n)),t.Ss(this.Yn,n,D(this.$n))},i.prototype.Ts=function(t,i,n){return{rt:t,open:i.St[0],high:i.St[1],low:i.St[2],close:i.St[3],tt:NaN,Ns:NaN,ys:NaN,ks:NaN,Cs:NaN}},i.prototype.Gn=function(){var t=this,i=this.Kn.ls();this.Yn=this.Kn.an().fs().map((function(n){return t.cs(n.vs,n,i)}))},i}(Mt),yt=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.zt=new gt,i}return b(i,t),i.prototype.dt=function(t,i){if(!this.Kn.yt())return null;var n=this.Kn.R();this.Jn();var s={an:this.Yn,ws:this.Xn.bt().ws(),xs:n.openVisible,ps:n.thinBars,J:this.$n};return this.zt.Z(s),this.zt},i.prototype.ts=function(){var t=this;this.Yn.forEach((function(i){i.A=t.Kn.ls().As(i.rt).Ds}))},i.prototype.cs=function(t,i,n){return m(m({},this.Ts(t,i,n)),{A:n.As(t).Ds})},i}(pt);function kt(t,i,n){return Math.min(Math.max(t,i),n)}function xt(t,i,n){return i-t<=n}function Nt(t){return t<=0?NaN:Math.log(t)/Math.log(10)}function Ct(t){var i=Math.ceil(t);return i%2!=0?i-1:i}function St(t){var i=Math.ceil(t);return i%2==0?i-1:i}var Tt=function(t){function i(){return null!==t&&t.apply(this,arguments)||this}return b(i,t),i.prototype.Fn=function(t){var i=this.X,n=t.createLinearGradient(0,0,0,i.Vn),s=kt(i.En/i.Vn,0,1);return n.addColorStop(0,i.Bs),n.addColorStop(s,i.Ls),n.addColorStop(s,i.Es),n.addColorStop(1,i.Os),n},i}(at),Dt=function(t){function i(){return null!==t&&t.apply(this,arguments)||this}return b(i,t),i.prototype.zn=function(t){var i=this.X,n=t.createLinearGradient(0,0,0,i.Vn),s=kt(i.En/i.Vn,0,1);return n.addColorStop(0,i.Pn),n.addColorStop(s,i.Pn),n.addColorStop(s,i.Rn),n.addColorStop(1,i.Rn),n},i}(lt),At=function(t){function i(i,n){var s=t.call(this,i,n)||this;return s.Fs=new Tt,s.Vs=new Dt,s.ut=new E,s.ut.U([s.Fs,s.Vs]),s}return b(i,t),i.prototype.dt=function(t,i){if(!this.Kn.yt())return null;var n=this.Kn.kt();if(null===n)return null;var s=this.Kn.R();this.Jn();var h=this.Kn.Ct().Nt(s.baseValue.price,n.St),r=this.Xn.bt().ws();return this.Fs.Z({G:this.Yn,Bs:s.topFillColor1,Ls:s.topFillColor2,Es:s.bottomFillColor1,Os:s.bottomFillColor2,Vt:s.lineWidth,Pt:s.lineStyle,On:0,En:h,Vn:t,J:this.$n,Ln:r}),this.Vs.Z({G:this.Yn,Pn:s.topLineColor,Rn:s.bottomLineColor,Vt:s.lineWidth,Pt:s.lineStyle,On:0,En:h,Vn:t,J:this.$n,Ln:r}),this.ut},i.prototype.cs=function(t,i){return this.os(t,i)},i}(bt),Bt=function(){function t(){this.Bt=null,this.Ms=0}return t.prototype.Z=function(t){this.Bt=t},t.prototype.H=function(t,i,n,s){if(null!==this.Bt&&0!==this.Bt.an.length&&null!==this.Bt.J){if(this.Ms=function(t,i){if(t>=2.5&&t<=4)return Math.floor(3*i);var n=1-.2*Math.atan(Math.max(4,t)-4)/(.5*Math.PI),s=Math.floor(t*n*i),h=Math.floor(t*i),r=Math.min(s,h);return Math.max(Math.floor(i),r)}(this.Bt.ws,i),this.Ms>=2)Math.floor(i)%2!=this.Ms%2&&this.Ms--;var h=this.Bt.an;this.Bt.Ps&&this.Rs(t,h,this.Bt.J,i),this.Bt.zs&&this.Ws(t,h,this.Bt.J,this.Bt.ws,i);var r=this.Is(i);(!this.Bt.zs||this.Ms>2*r)&&this.js(t,h,this.Bt.J,i)}},t.prototype.Rs=function(t,i,n,s){if(null!==this.Bt){var h="",r=Math.min(Math.floor(s),Math.floor(this.Bt.ws*s));r=Math.max(Math.floor(s),Math.min(r,this.Ms));for(var e=Math.floor(.5*r),u=null,a=n.from;a<n.to;a++){var o=i[a];o.qs!==h&&(t.fillStyle=o.qs,h=o.qs);var l=Math.round(Math.min(o.Ns,o.Cs)*s),f=Math.round(Math.max(o.Ns,o.Cs)*s),c=Math.round(o.ys*s),v=Math.round(o.ks*s),_=Math.round(s*o.tt)-e,d=_+r-1;null!==u&&(_=Math.max(u+1,_),_=Math.min(_,d));var w=d-_+1;t.fillRect(_,c,w,l-c),t.fillRect(_,f+1,w,v-f),u=d}}},t.prototype.Is=function(t){var i=Math.floor(1*t);this.Ms<=2*i&&(i=Math.floor(.5*(this.Ms-1)));var n=Math.max(Math.floor(t),i);return this.Ms<=2*n?Math.max(Math.floor(t),Math.floor(1*t)):n},t.prototype.Ws=function(t,i,n,s,h){if(null!==this.Bt)for(var r="",e=this.Is(h),u=null,a=n.from;a<n.to;a++){var o=i[a];o.Tt!==r&&(t.fillStyle=o.Tt,r=o.Tt);var l=Math.round(o.tt*h)-Math.floor(.5*this.Ms),f=l+this.Ms-1,c=Math.round(Math.min(o.Ns,o.Cs)*h),v=Math.round(Math.max(o.Ns,o.Cs)*h);if(null!==u&&(l=Math.max(u+1,l),l=Math.min(l,f)),this.Bt.ws*h>2*e)I(t,l,c,f-l+1,v-c+1,e);else{var _=f-l+1;t.fillRect(l,c,_,v-c+1)}u=f}},t.prototype.js=function(t,i,n,s){if(null!==this.Bt)for(var h="",r=this.Is(s),e=n.from;e<n.to;e++){var u=i[e],a=Math.round(Math.min(u.Ns,u.Cs)*s),o=Math.round(Math.max(u.Ns,u.Cs)*s),l=Math.round(u.tt*s)-Math.floor(.5*this.Ms),f=l+this.Ms-1;if(u.A!==h){var c=u.A;t.fillStyle=c,h=c}this.Bt.zs&&(l+=r,a+=r,f-=r,o-=r),a>o||t.fillRect(l,a,f-l+1,o-a+1)}},t}(),Lt=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.zt=new Bt,i}return b(i,t),i.prototype.dt=function(t,i){if(!this.Kn.yt())return null;var n=this.Kn.R();this.Jn();var s={an:this.Yn,ws:this.Xn.bt().ws(),Ps:n.wickVisible,zs:n.borderVisible,J:this.$n};return this.zt.Z(s),this.zt},i.prototype.ts=function(){var t=this;this.Yn.forEach((function(i){var n=t.Kn.ls().As(i.rt);i.A=n.Ds,i.qs=n.Us,i.Tt=n.Hs}))},i.prototype.cs=function(t,i,n){var s=n.As(t);return m(m({},this.Ts(t,i,n)),{A:s.Ds,qs:s.Us,Tt:s.Hs})},i}(pt),Et=function(){function t(){this.Bt=null,this.Ys=[]}return t.prototype.Z=function(t){this.Bt=t,this.Ys=[]},t.prototype.H=function(t,i,n,s){if(null!==this.Bt&&0!==this.Bt.G.length&&null!==this.Bt.J){this.Ys.length||this.$s(i);for(var h=Math.max(1,Math.floor(i)),r=Math.round(this.Bt.Ks*i)-Math.floor(h/2),e=r+h,u=this.Bt.J.from;u<this.Bt.J.to;u++){var a=this.Bt.G[u],o=this.Ys[u-this.Bt.J.from],l=Math.round(a.it*i);t.fillStyle=a.A;var f=void 0,c=void 0;l<=r?(f=l,c=e):(f=r,c=l-Math.floor(h/2)+h),t.fillRect(o.In,f,o.jn-o.In+1,c-f)}}},t.prototype.$s=function(t){if(null!==this.Bt&&0!==this.Bt.G.length&&null!==this.Bt.J){var i=Math.ceil(this.Bt.ws*t)<=1?0:Math.max(1,Math.floor(t)),n=Math.round(this.Bt.ws*t)-i;this.Ys=new Array(this.Bt.J.to-this.Bt.J.from);for(var s=this.Bt.J.from;s<this.Bt.J.to;s++){var h,r=this.Bt.G[s],e=Math.round(r.tt*t),u=void 0,a=void 0;if(n%2)u=e-(h=(n-1)/2),a=e+h;else u=e-(h=n/2),a=e+h-1;this.Ys[s-this.Bt.J.from]={In:u,jn:a,Xs:e,Zs:r.tt*t,rt:r.rt}}for(s=this.Bt.J.from+1;s<this.Bt.J.to;s++){var o=this.Ys[s-this.Bt.J.from],l=this.Ys[s-this.Bt.J.from-1];o.rt===l.rt+1&&(o.In-l.jn!==i+1&&(l.Xs>l.Zs?l.jn=o.In-i-1:o.In=l.jn+i+1))}var f=Math.ceil(this.Bt.ws*t);for(s=this.Bt.J.from;s<this.Bt.J.to;s++){(o=this.Ys[s-this.Bt.J.from]).jn<o.In&&(o.jn=o.In);var c=o.jn-o.In+1;f=Math.min(c,f)}if(i>0&&f<4)for(s=this.Bt.J.from;s<this.Bt.J.to;s++){(c=(o=this.Ys[s-this.Bt.J.from]).jn-o.In+1)>f&&(o.Xs>o.Zs?o.jn-=1:o.In+=1)}}else this.Ys=[]},t}();function Ot(t){return{G:[],ws:t,Ks:NaN,J:null}}function Ft(t,i,n){return{rt:t,et:i,tt:NaN,it:NaN,A:n}}var Vt=function(t){function i(i,n){var s=t.call(this,i,n,!1)||this;return s.ut=new E,s.Js=Ot(0),s.zt=new Et,s}return b(i,t),i.prototype.dt=function(t,i){return this.Kn.yt()?(this.Jn(),this.ut):null},i.prototype.Gn=function(){var t=this.Xn.bt().ws();this.Js=Ot(t);for(var i=0,n=0,s=this.Kn.R().color,h=0,r=this.Kn.an().fs();h<r.length;h++){var e=r[h],u=e.St[3],a=void 0!==e.A?e.A:s,o=Ft(e.vs,u,a);++i<this.Js.G.length?this.Js.G[i]=o:this.Js.G.push(o),this.Yn[n++]={rt:e.vs,tt:0}}this.zt.Z(this.Js),this.ut.U([this.zt])},i.prototype.ts=function(){},i.prototype.ns=function(){t.prototype.ns.call(this),this.Js.J=null},i.prototype.rs=function(t,i,n){if(null!==this.$n){var s=i.ws(),h=e(i.ss()),r=t.Nt(this.Kn.R().base,n);i.es(this.Js.G),t.us(this.Js.G,n),this.Js.Ks=r,this.Js.J=wt(this.Js.G,h,!1),this.Js.ws=s,this.zt.Z(this.Js)}},i}(Mt),Pt=function(t){function i(i,n){var s=t.call(this,i,n)||this;return s.ds=new ft,s}return b(i,t),i.prototype.dt=function(t,i){if(!this.Kn.yt())return null;var n=this.Kn.R();this.Jn();var s={G:this.Yn,ht:n.color,Pt:n.lineStyle,On:n.lineType,Vt:n.lineWidth,J:this.$n,Ln:this.Xn.bt().ws()};return this.ds.Z(s),this.ds},i.prototype.ts=function(){var t=this;this.Yn.forEach((function(i){i.A=t.Kn.ls().As(i.rt).Ds}))},i.prototype.cs=function(t,i,n){var s=this.os(t,i);return s.A=n.As(t).Ds,s},i}(bt),Rt=/[2-9]/g,zt=function(){function t(t){void 0===t&&(t=50),this.Gs=new Map,this.Qs=0,this.th=Array.from(new Array(t))}return t.prototype.ih=function(){this.Gs.clear(),this.th.fill(void 0)},t.prototype.Qt=function(t,i,n){var s=n||Rt,h=String(i).replace(s,"0"),r=this.Gs.get(h);if(void 0===r){if(0===(r=t.measureText(h).width)&&0!==i.length)return 0;var e=this.th[this.Qs];void 0!==e&&this.Gs.delete(e),this.th[this.Qs]=h,this.Qs=(this.Qs+1)%this.th.length,this.Gs.set(h,r)}return r},t}(),Wt=function(){function t(t){this.nh=null,this.k=null,this.sh="right",this.hh=0,this.rh=t}return t.prototype.eh=function(t,i,n,s){this.nh=t,this.k=i,this.hh=n,this.sh=s},t.prototype.H=function(t,i){null!==this.k&&null!==this.nh&&this.nh.H(t,this.k,this.rh,this.hh,this.sh,i)},t}(),It=function(){function t(t,i,n){this.uh=t,this.rh=new zt(50),this.ah=i,this.P=n,this.W=-1,this.zt=new Wt(this.rh)}return t.prototype.dt=function(t,i){var n=this.P.oh(this.ah);if(null===n)return null;var s=n.lh(this.ah)?n.fh():this.ah.Ct();if(null===s)return null;var h=n._h(s);if("overlay"===h)return null;var r=this.P.dh();return r.S!==this.W&&(this.W=r.S,this.rh.ih()),this.zt.eh(this.uh.ci(),r,i,h),this.zt},t}(),jt=function(){function t(){this.Bt=null}return t.prototype.Z=function(t){this.Bt=t},t.prototype.H=function(t,i,h,r){if(null!==this.Bt&&!1!==this.Bt.yt){var e=Math.round(this.Bt.it*i);if(!(e<0||e>Math.ceil(this.Bt.Yt*i))){var u=Math.ceil(this.Bt.Ht*i);t.lineCap="butt",t.strokeStyle=this.Bt.A,t.lineWidth=Math.floor(this.Bt.Vt*i),n(t,this.Bt.Pt),s(t,e,0,u)}}},t}(),qt=function(){function t(t){this.wh={Ht:0,Yt:0,it:0,A:"rgba(0, 0, 0, 0)",Vt:1,Pt:0,yt:!1},this.Mh=new jt,this.ft=!0,this.Kn=t,this.Xn=t.jt(),this.Mh.Z(this.wh)}return t.prototype.vt=function(){this.ft=!0},t.prototype.dt=function(t,i){return this.Kn.yt()?(this.ft&&(this.bh(t,i),this.ft=!1),this.Mh):null},t}(),Ut=function(t){function i(i){return t.call(this,i)||this}return b(i,t),i.prototype.bh=function(t,i){this.wh.yt=!1;var n=this.Kn.Ct(),s=n.mh().mh;if(2===s||3===s){var h=this.Kn.R();if(h.baseLineVisible&&this.Kn.yt()){var r=this.Kn.kt();null!==r&&(this.wh.yt=!0,this.wh.it=n.Nt(r.St,r.St),this.wh.Ht=i,this.wh.Yt=t,this.wh.A=h.baseLineColor,this.wh.Vt=h.baseLineWidth,this.wh.Pt=h.baseLineStyle)}}},i}(qt),Ht=function(){function t(){this.Bt=null}return t.prototype.Z=function(t){this.Bt=t},t.prototype.gh=function(){return this.Bt},t.prototype.H=function(t,i,n,s){var h=this.Bt;if(null!==h){t.save();var r=Math.max(1,Math.floor(i)),e=r%2/2,u=Math.round(h.Zs.x*i)+e,a=h.Zs.y*i;t.fillStyle=h.ph,t.beginPath();var o=Math.max(2,1.5*h.yh)*i;t.arc(u,a,o,0,2*Math.PI,!1),t.fill(),t.fillStyle=h.kh,t.beginPath(),t.arc(u,a,h.st*i,0,2*Math.PI,!1),t.fill(),t.lineWidth=r,t.strokeStyle=h.xh,t.beginPath(),t.arc(u,a,h.st*i+r/2,0,2*Math.PI,!1),t.stroke(),t.restore()}},t}(),Yt=[{Nh:0,Ch:.25,Sh:4,Th:10,Dh:.25,Ah:0,Bh:.4,Lh:.8},{Nh:.25,Ch:.525,Sh:10,Th:14,Dh:0,Ah:0,Bh:.8,Lh:0},{Nh:.525,Ch:1,Sh:14,Th:14,Dh:0,Ah:0,Bh:0,Lh:0}];function $t(t,i,n,s){return function(t,i){if("transparent"===t)return t;var n=d(t),s=n[3];return"rgba(".concat(n[0],", ").concat(n[1],", ").concat(n[2],", ").concat(i*s,")")}(t,n+(s-n)*i)}function Kt(t,i){for(var n,s=t%2600/2600,r=0,e=Yt;r<e.length;r++){var u=e[r];if(s>=u.Nh&&s<=u.Ch){n=u;break}}h(void 0!==n,"Last price animation internal logic error");var a,o,l,f=(s-n.Nh)/(n.Ch-n.Nh);return{kh:$t(i,f,n.Dh,n.Ah),xh:$t(i,f,n.Bh,n.Lh),st:(a=f,o=n.Sh,l=n.Th,o+(l-o)*a)}}var Xt=function(){function t(t){this.zt=new Ht,this.ft=!0,this.Eh=!0,this.Oh=performance.now(),this.Fh=this.Oh-1,this.Vh=t}return t.prototype.Ph=function(){this.Fh=this.Oh-1,this.vt()},t.prototype.Rh=function(){if(this.vt(),2===this.Vh.R().lastPriceAnimation){var t=performance.now(),i=this.Fh-t;if(i>0)return void(i<650&&(this.Fh+=2600));this.Oh=t,this.Fh=t+2600}},t.prototype.vt=function(){this.ft=!0},t.prototype.zh=function(){this.Eh=!0},t.prototype.yt=function(){return 0!==this.Vh.R().lastPriceAnimation},t.prototype.Wh=function(){switch(this.Vh.R().lastPriceAnimation){case 0:return!1;case 1:return!0;case 2:return performance.now()<=this.Fh}},t.prototype.dt=function(t,i){return this.ft?(this.wt(t,i),this.ft=!1,this.Eh=!1):this.Eh&&(this.Ih(),this.Eh=!1),this.zt},t.prototype.wt=function(t,i){this.zt.Z(null);var n=this.Vh.jt().bt(),s=n.ss(),h=this.Vh.kt();if(null!==s&&null!==h){var r=this.Vh.jh(!0);if(!r.qh&&s.Uh(r.vs)){var e={x:n.At(r.vs),y:this.Vh.Ct().Nt(r.et,h.St)},u=r.A,a=this.Vh.R().lineWidth,o=Kt(this.Hh(),u);this.zt.Z({ph:u,yh:a,kh:o.kh,xh:o.xh,st:o.st,Zs:e})}}},t.prototype.Ih=function(){var t=this.zt.gh();if(null!==t){var i=Kt(this.Hh(),t.ph);t.kh=i.kh,t.xh=i.xh,t.st=i.st}},t.prototype.Hh=function(){return this.Wh()?performance.now()-this.Oh:2599},t}();function Zt(t,i){return St(Math.min(Math.max(t,12),30)*i)}function Jt(t,i){switch(t){case"arrowDown":case"arrowUp":return Zt(i,1);case"circle":return Zt(i,.8);case"square":return Zt(i,.7)}}function Gt(t){return Ct(Zt(t,1))}function Qt(t){return Math.max(Zt(t,.1),3)}function ti(t,i,n,s,h){var r=Jt("square",n),e=(r-1)/2,u=t-e,a=i-e;return s>=u&&s<=u+r&&h>=a&&h<=a+r}function ii(t,i,n,s,h){var r=(Jt("arrowUp",h)-1)/2,e=(St(h/2)-1)/2;i.beginPath(),t?(i.moveTo(n-r,s),i.lineTo(n,s-r),i.lineTo(n+r,s),i.lineTo(n+e,s),i.lineTo(n+e,s+r),i.lineTo(n-e,s+r),i.lineTo(n-e,s)):(i.moveTo(n-r,s),i.lineTo(n,s+r),i.lineTo(n+r,s),i.lineTo(n+e,s),i.lineTo(n+e,s-r),i.lineTo(n-e,s-r),i.lineTo(n-e,s)),i.fill()}function ni(t,i,n,s,h,r){return ti(i,n,s,h,r)}var si=function(t){function i(){var i=null!==t&&t.apply(this,arguments)||this;return i.Bt=null,i.rh=new zt,i.W=-1,i.I="",i.Yh="",i}return b(i,t),i.prototype.Z=function(t){this.Bt=t},i.prototype.eh=function(t,i){this.W===t&&this.I===i||(this.W=t,this.I=i,this.Yh=B(t,i),this.rh.ih())},i.prototype.$h=function(t,i){if(null===this.Bt||null===this.Bt.J)return null;for(var n=this.Bt.J.from;n<this.Bt.J.to;n++){var s=this.Bt.G[n];if(ri(s,t,i))return{Kh:s.Xh,Zh:s.Zh}}return null},i.prototype.Y=function(t,i,n){if(null!==this.Bt&&null!==this.Bt.J){t.textBaseline="middle",t.font=this.Yh;for(var s=this.Bt.J.from;s<this.Bt.J.to;s++){var h=this.Bt.G[s];void 0!==h.Gt&&(h.Gt.Ht=this.rh.Qt(t,h.Gt.Jh),h.Gt.Yt=this.W),hi(h,t)}}},i}(O);function hi(t,i){i.fillStyle=t.A,void 0!==t.Gt&&function(t,i,n,s){t.fillText(i,n,s)}(i,t.Gt.Jh,t.tt-t.Gt.Ht/2,t.Gt.it),function(t,i){if(0===t.hs)return;switch(t.Gh){case"arrowDown":return void ii(!1,i,t.tt,t.it,t.hs);case"arrowUp":return void ii(!0,i,t.tt,t.it,t.hs);case"circle":return void function(t,i,n,s){var h=(Jt("circle",s)-1)/2;t.beginPath(),t.arc(i,n,h,0,2*Math.PI,!1),t.fill()}(i,t.tt,t.it,t.hs);case"square":return void function(t,i,n,s){var h=Jt("square",s),r=(h-1)/2,e=i-r,u=n-r;t.fillRect(e,u,h,h)}(i,t.tt,t.it,t.hs)}t.Gh}(t,i)}function ri(t,i,n){return!(void 0===t.Gt||!function(t,i,n,s,h,r){var e=s/2;return h>=t&&h<=t+n&&r>=i-e&&r<=i+e}(t.tt,t.Gt.it,t.Gt.Ht,t.Gt.Yt,i,n))||function(t,i,n){if(0===t.hs)return!1;switch(t.Gh){case"arrowDown":case"arrowUp":return ni(0,t.tt,t.it,t.hs,i,n);case"circle":return function(t,i,n,s,h){var r=2+Jt("circle",n)/2,e=t-s,u=i-h;return Math.sqrt(e*e+u*u)<=r}(t.tt,t.it,t.hs,i,n);case"square":return ti(t.tt,t.it,t.hs,i,n)}}(t,i,n)}function ei(t,i,n,s,h,r,e,u,a){var o=k(n)?n:n.close,l=k(n)?n:n.high,f=k(n)?n:n.low,c=k(i.size)?Math.max(i.size,0):1,v=Gt(u.ws())*c,_=v/2;switch(t.hs=v,i.position){case"inBar":return t.it=e.Nt(o,a),void(void 0!==t.Gt&&(t.Gt.it=t.it+_+r+.6*h));case"aboveBar":return t.it=e.Nt(l,a)-_-s.Qh,void 0!==t.Gt&&(t.Gt.it=t.it-_-.6*h,s.Qh+=1.2*h),void(s.Qh+=v+r);case"belowBar":return t.it=e.Nt(f,a)+_+s.tr,void 0!==t.Gt&&(t.Gt.it=t.it+_+r+.6*h,s.tr+=1.2*h),void(s.tr+=v+r)}i.position}var ui=function(){function t(t,i){this.ft=!0,this.ir=!0,this.nr=!0,this.sr=null,this.zt=new si,this.Vh=t,this.gi=i,this.Bt={G:[],J:null}}return t.prototype.vt=function(t){this.ft=!0,this.nr=!0,"data"===t&&(this.ir=!0)},t.prototype.dt=function(t,i,n){if(!this.Vh.yt())return null;this.ft&&this.Jn();var s=this.gi.R().layout;return this.zt.eh(s.fontSize,s.fontFamily),this.zt.Z(this.Bt),this.zt},t.prototype.hr=function(){if(this.nr){if(this.Vh.rr().length>0){var t=this.gi.bt().ws(),i=Qt(t),n=1.5*Gt(t)+2*i;this.sr={above:n,below:n}}else this.sr=null;this.nr=!1}return this.sr},t.prototype.Jn=function(){var t=this.Vh.Ct(),i=this.gi.bt(),n=this.Vh.rr();this.ir&&(this.Bt.G=n.map((function(t){return{rt:t.time,tt:0,it:0,hs:0,Gh:t.shape,A:t.color,Xh:t.Xh,Zh:t.id,Gt:void 0}})),this.ir=!1);var s=this.gi.R().layout;this.Bt.J=null;var h=i.ss();if(null!==h){var r=this.Vh.kt();if(null!==r&&0!==this.Bt.G.length){var e=NaN,u=Qt(i.ws()),a={Qh:u,tr:u};this.Bt.J=wt(this.Bt.G,h,!0);for(var o=this.Bt.J.from;o<this.Bt.J.to;o++){var l=n[o];l.time!==e&&(a.Qh=u,a.tr=u,e=l.time);var f=this.Bt.G[o];f.tt=i.At(l.time),void 0!==l.text&&l.text.length>0&&(f.Gt={Jh:l.text,it:0,Ht:0,Yt:0});var c=this.Vh.er(l.time);null!==c&&ei(f,l,c,a,s.fontSize,u,t,i,r.St)}this.ft=!1}}},t}(),ai=function(t){function i(i){return t.call(this,i)||this}return b(i,t),i.prototype.bh=function(t,i){var n=this.wh;n.yt=!1;var s=this.Kn.R();if(s.priceLineVisible&&this.Kn.yt()){var h=this.Kn.jh(0===s.priceLineSource);h.qh||(n.yt=!0,n.it=h.ti,n.A=this.Kn.ur(h.A),n.Ht=i,n.Yt=t,n.Vt=s.priceLineWidth,n.Pt=s.priceLineStyle)}},i}(qt),oi=function(t){function i(i){var n=t.call(this)||this;return n.Wt=i,n}return b(i,t),i.prototype.vi=function(t,i,n){t.yt=!1,i.yt=!1;var s=this.Wt;if(s.yt()){var h=s.R(),r=h.lastValueVisible,e=""!==s.ar(),u=0===h.seriesLastValueMode,a=s.jh(!1);if(!a.qh){r&&(t.Gt=this.lr(a,r,u),t.yt=0!==t.Gt.length),(e||u)&&(i.Gt=this.cr(a,r,e,u),i.yt=i.Gt.length>0);var o=s.ur(a.A),l=w(o);n.t=l.t,n.A=l.i,n.ti=a.ti,i.Tt=s.jt().Dt(a.ti/s.Ct().Yt()),t.Tt=o}}},i.prototype.cr=function(t,i,n,s){var h="",r=this.Wt.ar();return n&&0!==r.length&&(h+="".concat(r," ")),i&&s&&(h+=this.Wt.Ct().vr()?t._r:t.dr),h.trim()},i.prototype.lr=function(t,i,n){return i?n?this.Wt.Ct().vr()?t.dr:t._r:t.Gt:""},i}($),li=function(){function t(t,i){this.wr=t,this.Mr=i}return t.prototype.br=function(t){return null!==t&&(this.wr===t.wr&&this.Mr===t.Mr)},t.prototype.mr=function(){return new t(this.wr,this.Mr)},t.prototype.gr=function(){return this.wr},t.prototype.pr=function(){return this.Mr},t.prototype.yr=function(){return this.Mr-this.wr},t.prototype.wi=function(){return this.Mr===this.wr||Number.isNaN(this.Mr)||Number.isNaN(this.wr)},t.prototype.xn=function(i){return null===i?this:new t(Math.min(this.gr(),i.gr()),Math.max(this.pr(),i.pr()))},t.prototype.kr=function(t){if(k(t)&&0!==this.Mr-this.wr){var i=.5*(this.Mr+this.wr),n=this.Mr-i,s=this.wr-i;n*=t,s*=t,this.Mr=i+n,this.wr=i+s}},t.prototype.Nr=function(t){k(t)&&(this.Mr+=t,this.wr+=t)},t.prototype.Cr=function(){return{minValue:this.wr,maxValue:this.Mr}},t.Sr=function(i){return null===i?null:new t(i.minValue,i.maxValue)},t}(),fi=function(){function t(t,i){this.Tr=t,this.Dr=i||null}return t.prototype.Ar=function(){return this.Tr},t.prototype.Br=function(){return this.Dr},t.prototype.Cr=function(){return null===this.Tr?null:{priceRange:this.Tr.Cr(),margins:this.Dr||void 0}},t.Sr=function(i){return null===i?null:new t(li.Sr(i.priceRange),i.margins)},t}(),ci=function(t){function i(i,n){var s=t.call(this,i)||this;return s.Lr=n,s}return b(i,t),i.prototype.bh=function(t,i){var n=this.wh;n.yt=!1;var s=this.Lr.R();if(this.Kn.yt()&&s.lineVisible){var h=this.Lr.Er();null!==h&&(n.yt=!0,n.it=h,n.A=s.color,n.Ht=i,n.Yt=t,n.Vt=s.lineWidth,n.Pt=s.lineStyle)}},i}(qt),vi=function(t){function i(i,n){var s=t.call(this)||this;return s.Vh=i,s.Lr=n,s}return b(i,t),i.prototype.vi=function(t,i,n){t.yt=!1,i.yt=!1;var s=this.Lr.R(),h=s.axisLabelVisible,r=""!==s.title,e=this.Vh;if(h&&e.yt()){var u=this.Lr.Er();if(null!==u){r&&(i.Gt=s.title,i.yt=!0),i.Tt=e.jt().Dt(u/e.Ct().Yt()),t.Gt=e.Ct().Or(s.price),t.yt=!0;var a=w(s.color);n.t=a.t,n.A=a.i,n.ti=u}}},i}($),_i=function(){function t(t,i){this.Vh=t,this.zi=i,this.Fr=new ci(t,this),this.uh=new vi(t,this),this.Vr=new It(this.uh,t,t.jt())}return t.prototype.Pr=function(t){y(this.zi,t),this.vt(),this.Vh.jt().Rr()},t.prototype.R=function(){return this.zi},t.prototype.tn=function(){return[this.Fr,this.Vr]},t.prototype.zr=function(){return this.uh},t.prototype.vt=function(){this.Fr.vt(),this.uh.vt()},t.prototype.Er=function(){var t=this.Vh,i=t.Ct();if(t.jt().bt().wi()||i.wi())return null;var n=t.kt();return null===n?null:i.Nt(this.zi.price,n.St)},t}(),di=function(t){function i(i){var n=t.call(this)||this;return n.gi=i,n}return b(i,t),i.prototype.jt=function(){return this.gi},i}(G),wi={Ds:"",Hs:"",Us:""},Mi=function(){function t(t){this.Vh=t}return t.prototype.As=function(t,i){var n=this.Vh.Wr(),s=this.Vh.R();switch(n){case"Line":return this.Ir(s,t,i);case"Area":return this.jr(s);case"Baseline":return this.qr(s,t,i);case"Bar":return this.Ur(s,t,i);case"Candlestick":return this.Hr(s,t,i);case"Histogram":return this.Yr(s,t,i)}throw new Error("Unknown chart style")},t.prototype.Ur=function(t,i,n){var s=m({},wi),h=t.upColor,r=t.downColor,a=h,o=r,l=e(this.$r(i,n)),f=u(l.St[0])<=u(l.St[3]);return void 0!==l.A?(s.Ds=l.A,s.Hs=l.A):(s.Ds=f?h:r,s.Hs=f?a:o),s},t.prototype.Hr=function(t,i,n){var s,h,r,a=m({},wi),o=t.upColor,l=t.downColor,f=t.borderUpColor,c=t.borderDownColor,v=t.wickUpColor,_=t.wickDownColor,d=e(this.$r(i,n)),w=u(d.St[0])<=u(d.St[3]);return a.Ds=null!==(s=d.A)&&void 0!==s?s:w?o:l,a.Hs=null!==(h=d.Tt)&&void 0!==h?h:w?f:c,a.Us=null!==(r=d.qs)&&void 0!==r?r:w?v:_,a},t.prototype.jr=function(t){return m(m({},wi),{Ds:t.lineColor})},t.prototype.qr=function(t,i,n){var s=e(this.$r(i,n)).St[3]>=t.baseValue.price;return m(m({},wi),{Ds:s?t.topLineColor:t.bottomLineColor})},t.prototype.Ir=function(t,i,n){var s,h=e(this.$r(i,n));return m(m({},wi),{Ds:null!==(s=h.A)&&void 0!==s?s:t.color})},t.prototype.Yr=function(t,i,n){var s=m({},wi),h=e(this.$r(i,n));return s.Ds=void 0!==h.A?h.A:t.color,s},t.prototype.$r=function(t,i){return void 0!==i?i.St:this.Vh.an().Kr(t)},t}(),bi=30,mi=function(){function t(){this.Xr=[],this.Zr=new Map,this.Jr=new Map}return t.prototype.Gr=function(){return this.hs()>0?this.Xr[this.Xr.length-1]:null},t.prototype.Qr=function(){return this.hs()>0?this.te(0):null},t.prototype.un=function(){return this.hs()>0?this.te(this.Xr.length-1):null},t.prototype.hs=function(){return this.Xr.length},t.prototype.wi=function(){return 0===this.hs()},t.prototype.Uh=function(t){return null!==this.ie(t,0)},t.prototype.Kr=function(t){return this.ne(t)},t.prototype.ne=function(t,i){void 0===i&&(i=0);var n=this.ie(t,i);return null===n?null:m(m({},this.se(n)),{vs:this.te(n)})},t.prototype.fs=function(){return this.Xr},t.prototype.he=function(t,i,n){if(this.wi())return null;for(var s=null,h=0,r=n;h<r.length;h++){var e=r[h];s=gi(s,this.re(t,i,e))}return s},t.prototype.Z=function(t){this.Jr.clear(),this.Zr.clear(),this.Xr=t},t.prototype.te=function(t){return this.Xr[t].vs},t.prototype.se=function(t){return this.Xr[t]},t.prototype.ie=function(t,i){var n=this.ee(t);if(null===n&&0!==i)switch(i){case-1:return this.ue(t);case 1:return this.ae(t);default:throw new TypeError("Unknown search mode")}return n},t.prototype.ue=function(t){var i=this.oe(t);return i>0&&(i-=1),i!==this.Xr.length&&this.te(i)<t?i:null},t.prototype.ae=function(t){var i=this.le(t);return i!==this.Xr.length&&t<this.te(i)?i:null},t.prototype.ee=function(t){var i=this.oe(t);return i===this.Xr.length||t<this.Xr[i].vs?null:i},t.prototype.oe=function(t){return ct(this.Xr,t,(function(t,i){return t.vs<i}))},t.prototype.le=function(t){return vt(this.Xr,t,(function(t,i){return i.vs>t}))},t.prototype.fe=function(t,i,n){for(var s=null,h=t;h<i;h++){var r=this.Xr[h].St[n];Number.isNaN(r)||(null===s?s={ce:r,ve:r}:(r<s.ce&&(s.ce=r),r>s.ve&&(s.ve=r)))}return s},t.prototype.re=function(t,i,n){if(this.wi())return null;var s=null,h=e(this.Qr()),r=e(this.un()),u=Math.max(t,h),a=Math.min(i,r),o=Math.ceil(u/bi)*bi,l=Math.max(o,Math.floor(a/bi)*bi),f=this.oe(u),c=this.le(Math.min(a,o,i));s=gi(s,this.fe(f,c,n));var v=this.Zr.get(n);void 0===v&&(v=new Map,this.Zr.set(n,v));for(var _=Math.max(o+1,u);_<l;_+=bi){var d=Math.floor(_/bi),w=v.get(d);if(void 0===w){var M=this.oe(d*bi),b=this.le((d+1)*bi-1);w=this.fe(M,b,n),v.set(d,w)}s=gi(s,w)}f=this.oe(l),c=this.le(a);return s=gi(s,this.fe(f,c,n))},t}();function gi(t,i){return null===t?i:null===i?t:{ce:Math.min(t.ce,i.ce),ve:Math.max(t.ve,i.ve)}}var pi=function(t){function i(i,n,s){var h=t.call(this,i)||this;h.Bt=new mi,h.Fr=new ai(h),h._e=[],h.de=new Ut(h),h.we=null,h.Me=null,h.be=[],h.me=[],h.ge=null,h.zi=n,h.pe=s;var r=new oi(h);return h.Ei=[r],h.Vr=new It(r,h,i),"Area"!==s&&"Line"!==s&&"Baseline"!==s||(h.we=new Xt(h)),h.ye(),h.ke(),h}return b(i,t),i.prototype.p=function(){null!==this.ge&&clearTimeout(this.ge)},i.prototype.ur=function(t){return this.zi.priceLineColor||t},i.prototype.jh=function(t){var i={qh:!0},n=this.Ct();if(this.jt().bt().wi()||n.wi()||this.Bt.wi())return i;var s,h,r=this.jt().bt().ss(),e=this.kt();if(null===r||null===e)return i;if(t){var u=this.Bt.Gr();if(null===u)return i;s=u,h=u.vs}else{var a=this.Bt.ne(r.jn(),-1);if(null===a)return i;if(null===(s=this.Bt.Kr(a.vs)))return i;h=a.vs}var o=s.St[3],l=this.ls().As(h,{St:s}),f=n.Nt(o,e.St);return{qh:!1,et:o,Gt:n.Mi(o,e.St),_r:n.Or(o),dr:n.xe(o,e.St),A:l.Ds,ti:f,vs:h}},i.prototype.ls=function(){return null!==this.Me||(this.Me=new Mi(this)),this.Me},i.prototype.R=function(){return this.zi},i.prototype.Pr=function(t){var i=t.priceScaleId;void 0!==i&&i!==this.zi.priceScaleId&&this.jt().Ne(this,i),y(this.zi,t),null!==this.ki&&void 0!==t.scaleMargins&&this.ki.Pr({scaleMargins:t.scaleMargins}),void 0!==t.priceFormat&&(this.ye(),this.jt().Ce()),this.jt().Se(this),this.jt().Te(),this.Hi.vt("options")},i.prototype.Z=function(t,i){this.Bt.Z(t),this.De(),this.Hi.vt("data"),this.Wi.vt("data"),null!==this.we&&(i&&i.Ae?this.we.Rh():0===t.length&&this.we.Ph());var n=this.jt().oh(this);this.jt().Be(n),this.jt().Se(this),this.jt().Te(),this.jt().Rr()},i.prototype.Le=function(t){this.be=t.map((function(t){return m({},t)})),this.De();var i=this.jt().oh(this);this.Wi.vt("data"),this.jt().Be(i),this.jt().Se(this),this.jt().Te(),this.jt().Rr()},i.prototype.rr=function(){return this.me},i.prototype.Ee=function(t){var i=new _i(this,t);return this._e.push(i),this.jt().Se(this),i},i.prototype.Oe=function(t){var i=this._e.indexOf(t);-1!==i&&this._e.splice(i,1),this.jt().Se(this)},i.prototype.Wr=function(){return this.pe},i.prototype.kt=function(){var t=this.Fe();return null===t?null:{St:t.St[3],Ve:t.rt}},i.prototype.Fe=function(){var t=this.jt().bt().ss();if(null===t)return null;var i=t.In();return this.Bt.ne(i,1)},i.prototype.an=function(){return this.Bt},i.prototype.er=function(t){var i=this.Bt.Kr(t);return null===i?null:"Bar"===this.pe||"Candlestick"===this.pe?{open:i.St[0],high:i.St[1],low:i.St[2],close:i.St[3]}:i.St[3]},i.prototype.Pe=function(t){var i=this,n=this.we;return null!==n&&n.yt()?(null===this.ge&&n.Wh()&&(this.ge=setTimeout((function(){i.ge=null,i.jt().Re()}),0)),n.zh(),[n]):[]},i.prototype.tn=function(){var t=[];this.ze()||t.push(this.de);for(var i=0,n=this._e;i<n.length;i++){var s=n[i];t.push.apply(t,s.tn())}return t.push(this.Hi,this.Fr,this.Vr,this.Wi),t},i.prototype.nn=function(t,i){if(i!==this.ki&&!this.ze())return[];for(var n=g([],this.Ei,!0),s=0,h=this._e;s<h.length;s++){var r=h[s];n.push(r.zr())}return n},i.prototype.We=function(t,i){var n=this;if(void 0!==this.zi.autoscaleInfoProvider){var s=this.zi.autoscaleInfoProvider((function(){var s=n.Ie(t,i);return null===s?null:s.Cr()}));return fi.Sr(s)}return this.Ie(t,i)},i.prototype.je=function(){return this.zi.priceFormat.minMove},i.prototype.qe=function(){return this.Ue},i.prototype.hn=function(){var t;this.Hi.vt(),this.Wi.vt();for(var i=0,n=this.Ei;i<n.length;i++){n[i].vt()}for(var s=0,h=this._e;s<h.length;s++){h[s].vt()}this.Fr.vt(),this.de.vt(),null===(t=this.we)||void 0===t||t.vt()},i.prototype.Ct=function(){return e(t.prototype.Ct.call(this))},i.prototype.gt=function(t){if(!(("Line"===this.pe||"Area"===this.pe||"Baseline"===this.pe)&&this.zi.crosshairMarkerVisible))return null;var i=this.Bt.Kr(t);return null===i?null:{et:i.St[3],st:this.He(),Tt:this.Ye(),xt:this.$e(t)}},i.prototype.ar=function(){return this.zi.title},i.prototype.yt=function(){return this.zi.visible},i.prototype.ze=function(){return!tt(this.Ct().Ke())},i.prototype.Ie=function(t,i){if(!x(t)||!x(i)||this.Bt.wi())return null;var n="Line"===this.pe||"Area"===this.pe||"Baseline"===this.pe||"Histogram"===this.pe?[3]:[2,1],s=this.Bt.he(t,i,n),h=null!==s?new li(s.ce,s.ve):null;if("Histogram"===this.Wr()){var r=this.zi.base,e=new li(r,r);h=null!==h?h.xn(e):e}return new fi(h,this.Wi.hr())},i.prototype.He=function(){switch(this.pe){case"Line":case"Area":case"Baseline":return this.zi.crosshairMarkerRadius}return 0},i.prototype.Ye=function(){switch(this.pe){case"Line":case"Area":case"Baseline":var t=this.zi.crosshairMarkerBorderColor;if(0!==t.length)return t}return null},i.prototype.$e=function(t){switch(this.pe){case"Line":case"Area":case"Baseline":var i=this.zi.crosshairMarkerBackgroundColor;if(0!==i.length)return i}return this.ls().As(t).Ds},i.prototype.ye=function(){switch(this.zi.priceFormat.type){case"custom":this.Ue={format:this.zi.priceFormat.formatter};break;case"volume":this.Ue=new et(this.zi.priceFormat.precision);break;case"percent":this.Ue=new rt(this.zi.priceFormat.precision);break;default:var t=Math.pow(10,this.zi.priceFormat.precision);this.Ue=new ht(t,this.zi.priceFormat.minMove*t)}null!==this.ki&&this.ki.Xe()},i.prototype.De=function(){var t=this,i=this.jt().bt();if(i.wi()||0===this.Bt.hs())this.me=[];else{var n=e(this.Bt.Qr());this.me=this.be.map((function(s,h){var r=e(i.Ze(s.time,!0)),u=r<n?1:-1;return{time:e(t.Bt.ne(r,u)).vs,position:s.position,shape:s.shape,color:s.color,id:s.id,Xh:h,text:s.text,size:s.size}}))}},i.prototype.ke=function(){switch(this.Wi=new ui(this,this.jt()),this.pe){case"Bar":this.Hi=new yt(this,this.jt());break;case"Candlestick":this.Hi=new Lt(this,this.jt());break;case"Line":this.Hi=new Pt(this,this.jt());break;case"Area":this.Hi=new mt(this,this.jt());break;case"Baseline":this.Hi=new At(this,this.jt());break;case"Histogram":this.Hi=new Vt(this,this.jt());break;default:throw Error("Unknown chart style assigned: "+this.pe)}},i}(di),yi=function(){function t(t){this.zi=t}return t.prototype.Je=function(t,i,n){var s=t;if(0===this.zi.mode)return s;var h=n.ji(),r=h.kt();if(null===r)return s;var e=h.Nt(t,r),a=n.Ge().filter((function(t){return t instanceof pi})).reduce((function(t,s){if(n.lh(s)||!s.yt())return t;var h=s.Ct(),r=s.an();if(h.wi()||!r.Uh(i))return t;var e=r.Kr(i);if(null===e)return t;var a=u(s.kt());return t.concat([h.Nt(e.St[3],a.St)])}),[]);if(0===a.length)return s;a.sort((function(t,i){return Math.abs(t-e)-Math.abs(i-e)}));var o=a[0];return s=h.qi(o,r)},t}(),ki=function(){function t(){this.Bt=null}return t.prototype.Z=function(t){this.Bt=t},t.prototype.H=function(t,i,s,h){var r=this;if(null!==this.Bt){var u=Math.max(1,Math.floor(i));t.lineWidth=u;var a=Math.ceil(this.Bt.Ft*i),o=Math.ceil(this.Bt.Ot*i);!function(t,i){t.save(),t.lineWidth%2&&t.translate(.5,.5),i(),t.restore()}(t,(function(){var s=e(r.Bt);if(s.Qe){t.strokeStyle=s.tu,n(t,s.iu),t.beginPath();for(var h=0,l=s.nu;h<l.length;h++){var f=l[h],c=Math.round(f.su*i);t.moveTo(c,-u),t.lineTo(c,a+u)}t.stroke()}if(s.hu){t.strokeStyle=s.ru,n(t,s.eu),t.beginPath();for(var v=0,_=s.uu;v<_.length;v++){var d=_[v],w=Math.round(d.su*i);t.moveTo(-u,w),t.lineTo(o+u,w)}t.stroke()}}))}},t}(),xi=function(){function t(t){this.zt=new ki,this.ft=!0,this.Di=t}return t.prototype.vt=function(){this.ft=!0},t.prototype.dt=function(t,i){if(this.ft){var n=this.Di.jt().R().grid,s={Ft:t,Ot:i,hu:n.horzLines.visible,Qe:n.vertLines.visible,ru:n.horzLines.color,tu:n.vertLines.color,eu:n.horzLines.style,iu:n.vertLines.style,uu:this.Di.ji().au(),nu:this.Di.jt().bt().au()||[]};this.zt.Z(s),this.ft=!1}return this.zt},t}(),Ni=function(){function t(t){this.Hi=new xi(t)}return t.prototype.ou=function(){return this.Hi},t}(),Ci={lu:4,fu:1e-4};function Si(t,i){var n=100*(t-i)/i;return i<0?-n:n}function Ti(t,i){var n=Si(t.gr(),i),s=Si(t.pr(),i);return new li(n,s)}function Di(t,i){var n=100*(t-i)/i+100;return i<0?-n:n}function Ai(t,i){var n=Di(t.gr(),i),s=Di(t.pr(),i);return new li(n,s)}function Bi(t,i){var n=Math.abs(t);if(n<1e-15)return 0;var s=Nt(n+i.fu)+i.lu;return t<0?-s:s}function Li(t,i){var n=Math.abs(t);if(n<1e-15)return 0;var s=Math.pow(10,n-i.lu)-i.fu;return t<0?-s:s}function Ei(t,i){if(null===t)return null;var n=Bi(t.gr(),i),s=Bi(t.pr(),i);return new li(n,s)}function Oi(t,i){if(null===t)return null;var n=Li(t.gr(),i),s=Li(t.pr(),i);return new li(n,s)}function Fi(t){if(null===t)return Ci;var i=Math.abs(t.pr()-t.gr());if(i>=1||i<1e-15)return Ci;var n=Math.ceil(Math.abs(Math.log10(i))),s=Ci.lu+n;return{lu:s,fu:1/Math.pow(10,s)}}var Vi,Pi=function(){function t(t,i){if(this.cu=t,this.vu=i,function(t){if(t<0)return!1;for(var i=t;i>1;i/=10)if(i%10!=0)return!1;return!0}(this.cu))this._u=[2,2.5,2];else{this._u=[];for(var n=this.cu;1!==n;){if(n%2==0)this._u.push(2),n/=2;else{if(n%5!=0)throw new Error("unexpected base");this._u.push(2,2.5),n/=5}if(this._u.length>100)throw new Error("something wrong with base")}}}return t.prototype.du=function(t,i,n){for(var s,h,r,e=0===this.cu?0:1/this.cu,u=Math.pow(10,Math.max(0,Math.ceil(Nt(t-i)))),a=0,o=this.vu[0];;){var l=xt(u,e,1e-14)&&u>e+1e-14,f=xt(u,n*o,1e-14),c=xt(u,1,1e-14);if(!(l&&f&&c))break;u/=o,o=this.vu[++a%this.vu.length]}if(u<=e+1e-14&&(u=e),u=Math.max(1,u),this._u.length>0&&(s=u,h=1,r=1e-14,Math.abs(s-h)<r))for(a=0,o=this._u[0];xt(u,n*o,1e-14)&&u>e+1e-14;)u/=o,o=this._u[++a%this._u.length];return u},t}(),Ri=function(){function t(t,i,n,s){this.wu=[],this._i=t,this.cu=i,this.Mu=n,this.bu=s}return t.prototype.du=function(t,i){if(t<i)throw new Error("high < low");var n=this._i.Yt(),s=(t-i)*this.mu()/n,h=new Pi(this.cu,[2,2.5,2]),r=new Pi(this.cu,[2,2,2.5]),e=new Pi(this.cu,[2.5,2,2]),u=[];return u.push(h.du(t,i,s),r.du(t,i,s),e.du(t,i,s)),function(t){if(t.length<1)throw Error("array is empty");for(var i=t[0],n=1;n<t.length;++n)t[n]<i&&(i=t[n]);return i}(u)},t.prototype.gu=function(){var t=this._i,i=t.kt();if(null!==i){var n=t.Yt(),s=this.Mu(n-1,i),h=this.Mu(0,i),r=this._i.R().entireTextOnly?this.pu()/2:0,e=r,u=n-1-r,a=Math.max(s,h),o=Math.min(s,h);if(a!==o){for(var l=this.du(a,o),f=a%l,c=a>=o?1:-1,v=null,_=0,d=a-(f+=f<0?l:0);d>o;d-=l){var w=this.bu(d,i,!0);null!==v&&Math.abs(w-v)<this.mu()||(w<e||w>u||(_<this.wu.length?(this.wu[_].su=w,this.wu[_].yu=t.ku(d)):this.wu.push({su:w,yu:t.ku(d)}),_++,v=w,t.xu()&&(l=this.du(d*c,o))))}this.wu.length=_}else this.wu=[]}else this.wu=[]},t.prototype.au=function(){return this.wu},t.prototype.pu=function(){return this._i.S()},t.prototype.mu=function(){return Math.ceil(2.5*this.pu())},t}();function zi(t){return t.slice().sort((function(t,i){return e(t.Ni())-e(i.Ni())}))}!function(t){t[t.Normal=0]="Normal",t[t.Logarithmic=1]="Logarithmic",t[t.Percentage=2]="Percentage",t[t.IndexedTo100=3]="IndexedTo100"}(Vi||(Vi={}));var Wi=new rt,Ii=new ht(100,1),ji=function(){function t(t,i,n,s){this.Nu=0,this.Cu=null,this.Tr=null,this.Su=null,this.Tu={Du:!1,Au:null},this.Bu=0,this.Lu=0,this.Eu=new p,this.Ou=new p,this.Fu=[],this.Vu=null,this.Pu=null,this.Ru=null,this.zu=null,this.Ue=Ii,this.Wu=Fi(null),this.Iu=t,this.zi=i,this.ju=n,this.qu=s,this.Uu=new Ri(this,100,this.Hu.bind(this),this.Yu.bind(this))}return t.prototype.Ke=function(){return this.Iu},t.prototype.R=function(){return this.zi},t.prototype.Pr=function(t){if(y(this.zi,t),this.Xe(),void 0!==t.mode&&this.$u({mh:t.mode}),void 0!==t.scaleMargins){var i=r(t.scaleMargins.top),n=r(t.scaleMargins.bottom);if(i<0||i>1)throw new Error("Invalid top margin - expect value between 0 and 1, given=".concat(i));if(n<0||n>1||i+n>1)throw new Error("Invalid bottom margin - expect value between 0 and 1, given=".concat(n));if(i+n>1)throw new Error("Invalid margins - sum of margins must be less than 1, given=".concat(i+n));this.Ku(),this.Pu=null}},t.prototype.Xu=function(){return this.zi.autoScale},t.prototype.xu=function(){return 1===this.zi.mode},t.prototype.vr=function(){return 2===this.zi.mode},t.prototype.Zu=function(){return 3===this.zi.mode},t.prototype.mh=function(){return{_n:this.zi.autoScale,Ju:this.zi.invertScale,mh:this.zi.mode}},t.prototype.$u=function(t){var i=this.mh(),n=null;void 0!==t._n&&(this.zi.autoScale=t._n),void 0!==t.mh&&(this.zi.mode=t.mh,2!==t.mh&&3!==t.mh||(this.zi.autoScale=!0),this.Tu.Du=!1),1===i.mh&&t.mh!==i.mh&&(!function(t,i){if(null===t)return!1;var n=Li(t.gr(),i),s=Li(t.pr(),i);return isFinite(n)&&isFinite(s)}(this.Tr,this.Wu)?this.zi.autoScale=!0:null!==(n=Oi(this.Tr,this.Wu))&&this.Gu(n)),1===t.mh&&t.mh!==i.mh&&null!==(n=Ei(this.Tr,this.Wu))&&this.Gu(n);var s=i.mh!==this.zi.mode;s&&(2===i.mh||this.vr())&&this.Xe(),s&&(3===i.mh||this.Zu())&&this.Xe(),void 0!==t.Ju&&i.Ju!==t.Ju&&(this.zi.invertScale=t.Ju,this.Qu()),this.Ou.m(i,this.mh())},t.prototype.ta=function(){return this.Ou},t.prototype.S=function(){return this.ju.fontSize},t.prototype.Yt=function(){return this.Nu},t.prototype.ia=function(t){this.Nu!==t&&(this.Nu=t,this.Ku(),this.Pu=null)},t.prototype.na=function(){if(this.Cu)return this.Cu;var t=this.Yt()-this.sa()-this.ha();return this.Cu=t,t},t.prototype.Ar=function(){return this.ra(),this.Tr},t.prototype.Gu=function(t,i){var n=this.Tr;(i||null===n&&null!==t||null!==n&&!n.br(t))&&(this.Pu=null,this.Tr=t)},t.prototype.wi=function(){return this.ra(),0===this.Nu||!this.Tr||this.Tr.wi()},t.prototype.ea=function(t){return this.Ju()?t:this.Yt()-1-t},t.prototype.Nt=function(t,i){return this.vr()?t=Si(t,i):this.Zu()&&(t=Di(t,i)),this.Yu(t,i)},t.prototype.us=function(t,i,n){this.ra();for(var s=this.ha(),h=e(this.Ar()),r=h.gr(),u=h.pr(),a=this.na()-1,o=this.Ju(),l=a/(u-r),f=void 0===n?0:n.from,c=void 0===n?t.length:n.to,v=this.ua(),_=f;_<c;_++){var d=t[_],w=d.et;if(!isNaN(w)){var M=w;null!==v&&(M=v(d.et,i));var b=s+l*(M-r),m=o?b:this.Nu-1-b;d.it=m}}},t.prototype.Ss=function(t,i,n){this.ra();for(var s=this.ha(),h=e(this.Ar()),r=h.gr(),u=h.pr(),a=this.na()-1,o=this.Ju(),l=a/(u-r),f=void 0===n?0:n.from,c=void 0===n?t.length:n.to,v=this.ua(),_=f;_<c;_++){var d=t[_],w=d.open,M=d.high,b=d.low,m=d.close;null!==v&&(w=v(d.open,i),M=v(d.high,i),b=v(d.low,i),m=v(d.close,i));var g=s+l*(w-r),p=o?g:this.Nu-1-g;d.Ns=p,g=s+l*(M-r),p=o?g:this.Nu-1-g,d.ys=p,g=s+l*(b-r),p=o?g:this.Nu-1-g,d.ks=p,g=s+l*(m-r),p=o?g:this.Nu-1-g,d.Cs=p}},t.prototype.qi=function(t,i){var n=this.Hu(t,i);return this.aa(n,i)},t.prototype.aa=function(t,i){var n=t;return this.vr()?n=function(t,i){return i<0&&(t=-t),t/100*i+i}(n,i):this.Zu()&&(n=function(t,i){return t-=100,i<0&&(t=-t),t/100*i+i}(n,i)),n},t.prototype.Ge=function(){return this.Fu},t.prototype.oa=function(){if(this.Vu)return this.Vu;for(var t=[],i=0;i<this.Fu.length;i++){var n=this.Fu[i];null===n.Ni()&&n.Ci(i+1),t.push(n)}return t=zi(t),this.Vu=t,this.Vu},t.prototype.la=function(t){-1===this.Fu.indexOf(t)&&(this.Fu.push(t),this.Xe(),this.fa())},t.prototype.ca=function(t){var i=this.Fu.indexOf(t);if(-1===i)throw new Error("source is not attached to scale");this.Fu.splice(i,1),0===this.Fu.length&&(this.$u({_n:!0}),this.Gu(null)),this.Xe(),this.fa()},t.prototype.kt=function(){for(var t=null,i=0,n=this.Fu;i<n.length;i++){var s=n[i].kt();null!==s&&((null===t||s.Ve<t.Ve)&&(t=s))}return null===t?null:t.St},t.prototype.Ju=function(){return this.zi.invertScale},t.prototype.au=function(){var t=null===this.kt();if(null!==this.Pu&&(t||this.Pu.va===t))return this.Pu.au;this.Uu.gu();var i=this.Uu.au();return this.Pu={au:i,va:t},this.Eu.m(),i},t.prototype._a=function(){return this.Eu},t.prototype.da=function(t){this.vr()||this.Zu()||null===this.Ru&&null===this.Su&&(this.wi()||(this.Ru=this.Nu-t,this.Su=e(this.Ar()).mr()))},t.prototype.wa=function(t){if(!this.vr()&&!this.Zu()&&null!==this.Ru){this.$u({_n:!1}),(t=this.Nu-t)<0&&(t=0);var i=(this.Ru+.2*(this.Nu-1))/(t+.2*(this.Nu-1)),n=e(this.Su).mr();i=Math.max(i,.1),n.kr(i),this.Gu(n)}},t.prototype.Ma=function(){this.vr()||this.Zu()||(this.Ru=null,this.Su=null)},t.prototype.ba=function(t){this.Xu()||null===this.zu&&null===this.Su&&(this.wi()||(this.zu=t,this.Su=e(this.Ar()).mr()))},t.prototype.ma=function(t){if(!this.Xu()&&null!==this.zu){var i=e(this.Ar()).yr()/(this.na()-1),n=t-this.zu;this.Ju()&&(n*=-1);var s=n*i,h=e(this.Su).mr();h.Nr(s),this.Gu(h,!0),this.Pu=null}},t.prototype.ga=function(){this.Xu()||null!==this.zu&&(this.zu=null,this.Su=null)},t.prototype.qe=function(){return this.Ue||this.Xe(),this.Ue},t.prototype.Mi=function(t,i){switch(this.zi.mode){case 2:return this.qe().format(Si(t,i));case 3:return this.qe().format(Di(t,i));default:return this.pa(t)}},t.prototype.ku=function(t){switch(this.zi.mode){case 2:case 3:return this.qe().format(t);default:return this.pa(t)}},t.prototype.Or=function(t){return this.pa(t,e(this.ya()).qe())},t.prototype.xe=function(t,i){return t=Si(t,i),Wi.format(t)},t.prototype.ka=function(){return this.Fu},t.prototype.xa=function(t){this.Tu={Au:t,Du:!1}},t.prototype.hn=function(){this.Fu.forEach((function(t){return t.hn()}))},t.prototype.Xe=function(){this.Pu=null;var t=this.ya(),i=100;null!==t&&(i=Math.round(1/t.je())),this.Ue=Ii,this.vr()?(this.Ue=Wi,i=100):this.Zu()?(this.Ue=new ht(100,1),i=100):null!==t&&(this.Ue=t.qe()),this.Uu=new Ri(this,i,this.Hu.bind(this),this.Yu.bind(this)),this.Uu.gu()},t.prototype.fa=function(){this.Vu=null},t.prototype.ya=function(){return this.Fu[0]||null},t.prototype.sa=function(){return this.Ju()?this.zi.scaleMargins.bottom*this.Yt()+this.Lu:this.zi.scaleMargins.top*this.Yt()+this.Bu},t.prototype.ha=function(){return this.Ju()?this.zi.scaleMargins.top*this.Yt()+this.Bu:this.zi.scaleMargins.bottom*this.Yt()+this.Lu},t.prototype.ra=function(){this.Tu.Du||(this.Tu.Du=!0,this.Na())},t.prototype.Ku=function(){this.Cu=null},t.prototype.Yu=function(t,i){if(this.ra(),this.wi())return 0;t=this.xu()&&t?Bi(t,this.Wu):t;var n=e(this.Ar()),s=this.ha()+(this.na()-1)*(t-n.gr())/n.yr();return this.ea(s)},t.prototype.Hu=function(t,i){if(this.ra(),this.wi())return 0;var n=this.ea(t),s=e(this.Ar()),h=s.gr()+s.yr()*((n-this.ha())/(this.na()-1));return this.xu()?Li(h,this.Wu):h},t.prototype.Qu=function(){this.Pu=null,this.Uu.gu()},t.prototype.Na=function(){var t=this.Tu.Au;if(null!==t){for(var i,n,s=null,h=0,r=0,u=0,a=this.ka();u<a.length;u++){var o=a[u];if(o.yt()){var l=o.kt();if(null!==l){var f=o.We(t.In(),t.jn()),c=f&&f.Ar();if(null!==c){switch(this.zi.mode){case 1:c=Ei(c,this.Wu);break;case 2:c=Ti(c,l.St);break;case 3:c=Ai(c,l.St)}if(s=null===s?c:s.xn(e(c)),null!==f){var v=f.Br();null!==v&&(h=Math.max(h,v.above),r=Math.max(h,v.below))}}}}}if(h===this.Bu&&r===this.Lu||(this.Bu=h,this.Lu=r,this.Pu=null,this.Ku()),null!==s){if(s.gr()===s.pr()){var _=this.ya(),d=5*(null===_||this.vr()||this.Zu()?1:_.je());this.xu()&&(s=Oi(s,this.Wu)),s=new li(s.gr()-d,s.pr()+d),this.xu()&&(s=Ei(s,this.Wu))}if(this.xu()){var w=Oi(s,this.Wu),M=Fi(w);if(i=M,n=this.Wu,i.lu!==n.lu||i.fu!==n.fu){var b=null!==this.Su?Oi(this.Su,this.Wu):null;this.Wu=M,s=Ei(w,M),null!==b&&(this.Su=Ei(b,M))}}this.Gu(s)}else null===this.Tr&&(this.Gu(new li(-.5,.5)),this.Wu=Fi(null));this.Tu.Du=!0}},t.prototype.ua=function(){var t=this;return this.vr()?Si:this.Zu()?Di:this.xu()?function(i){return Bi(i,t.Wu)}:null},t.prototype.pa=function(t,i){return void 0===this.qu.priceFormatter?(void 0===i&&(i=this.qe()),i.format(t)):this.qu.priceFormatter(t)},t}(),qi=function(){function t(t,i){this.Fu=[],this.Ca=new Map,this.Nu=0,this.hh=0,this.Sa=1e3,this.Vu=null,this.Ta=new p,this.Da=t,this.gi=i,this.Aa=new Ni(this);var n=i.R();this.Ba=this.La("left",n.leftPriceScale),this.Ea=this.La("right",n.rightPriceScale),this.Ba.ta().u(this.Oa.bind(this,this.Ba),this),this.Ea.ta().u(this.Oa.bind(this,this.Ba),this),this.Fa(n)}return t.prototype.Fa=function(t){if(t.leftPriceScale&&this.Ba.Pr(t.leftPriceScale),t.rightPriceScale&&this.Ea.Pr(t.rightPriceScale),t.localization&&(this.Ba.Xe(),this.Ea.Xe()),t.overlayPriceScales)for(var i=0,n=Array.from(this.Ca.values());i<n.length;i++){var s=e(n[i][0].Ct());s.Pr(t.overlayPriceScales),t.localization&&s.Xe()}},t.prototype.Va=function(t){switch(t){case"left":return this.Ba;case"right":return this.Ea}return this.Ca.has(t)?r(this.Ca.get(t))[0].Ct():null},t.prototype.p=function(){this.jt().Pa().M(this),this.Ba.ta().M(this),this.Ea.ta().M(this),this.Fu.forEach((function(t){t.p&&t.p()})),this.Ta.m()},t.prototype.Ra=function(){return this.Sa},t.prototype.za=function(t){this.Sa=t},t.prototype.jt=function(){return this.gi},t.prototype.Ht=function(){return this.hh},t.prototype.Yt=function(){return this.Nu},t.prototype.Wa=function(t){this.hh=t,this.Ia()},t.prototype.ia=function(t){var i=this;this.Nu=t,this.Ba.ia(t),this.Ea.ia(t),this.Fu.forEach((function(n){if(i.lh(n)){var s=n.Ct();null!==s&&s.ia(t)}})),this.Ia()},t.prototype.Ge=function(){return this.Fu},t.prototype.lh=function(t){var i=t.Ct();return null===i||this.Ba!==i&&this.Ea!==i},t.prototype.la=function(t,i,n){var s=void 0!==n?n:this.qa().ja+1;this.Ua(t,i,s)},t.prototype.ca=function(t){var i=this.Fu.indexOf(t);h(-1!==i,"removeDataSource: invalid data source"),this.Fu.splice(i,1);var n=e(t.Ct()).Ke();if(this.Ca.has(n)){var s=r(this.Ca.get(n)),u=s.indexOf(t);-1!==u&&(s.splice(u,1),0===s.length&&this.Ca.delete(n))}var a=t.Ct();a&&a.Ge().indexOf(t)>=0&&a.ca(t),null!==a&&(a.fa(),this.Ha(a)),this.Vu=null},t.prototype._h=function(t){return t===this.Ba?"left":t===this.Ea?"right":"overlay"},t.prototype.Ya=function(){return this.Ba},t.prototype.$a=function(){return this.Ea},t.prototype.Ka=function(t,i){t.da(i)},t.prototype.Xa=function(t,i){t.wa(i),this.Ia()},t.prototype.Za=function(t){t.Ma()},t.prototype.Ja=function(t,i){t.ba(i)},t.prototype.Ga=function(t,i){t.ma(i),this.Ia()},t.prototype.Qa=function(t){t.ga()},t.prototype.Ia=function(){this.Fu.forEach((function(t){t.hn()}))},t.prototype.ji=function(){var t=null;return this.gi.R().rightPriceScale.visible&&0!==this.Ea.Ge().length?t=this.Ea:this.gi.R().leftPriceScale.visible&&0!==this.Ba.Ge().length?t=this.Ba:0!==this.Fu.length&&(t=this.Fu[0].Ct()),null===t&&(t=this.Ea),t},t.prototype.fh=function(){var t=null;return this.gi.R().rightPriceScale.visible?t=this.Ea:this.gi.R().leftPriceScale.visible&&(t=this.Ba),t},t.prototype.Ha=function(t){null!==t&&t.Xu()&&this.io(t)},t.prototype.no=function(t){var i=this.Da.ss();t.$u({_n:!0}),null!==i&&t.xa(i),this.Ia()},t.prototype.so=function(){this.io(this.Ba),this.io(this.Ea)},t.prototype.ho=function(){var t=this;this.Ha(this.Ba),this.Ha(this.Ea),this.Fu.forEach((function(i){t.lh(i)&&t.Ha(i.Ct())})),this.Ia(),this.gi.Rr()},t.prototype.oa=function(){return null===this.Vu&&(this.Vu=zi(this.Fu)),this.Vu},t.prototype.ro=function(){return this.Ta},t.prototype.eo=function(){return this.Aa},t.prototype.io=function(t){var i=t.ka();if(i&&i.length>0&&!this.Da.wi()){var n=this.Da.ss();null!==n&&t.xa(n)}t.hn()},t.prototype.qa=function(){var t=this.oa();if(0===t.length)return{uo:0,ja:0};for(var i=0,n=0,s=0;s<t.length;s++){var h=t[s].Ni();null!==h&&(h<i&&(i=h),h>n&&(n=h))}return{uo:i,ja:n}},t.prototype.Ua=function(t,i,n){var s=this.Va(i);if(null===s&&(s=this.La(i,this.gi.R().overlayPriceScales)),this.Fu.push(t),!tt(i)){var h=this.Ca.get(i)||[];h.push(t),this.Ca.set(i,h)}s.la(t),t.Si(s),t.Ci(n),this.Ha(s),this.Vu=null},t.prototype.Oa=function(t,i,n){i.mh!==n.mh&&this.io(t)},t.prototype.La=function(t,i){var n=m({visible:!0,autoScale:!0},S(i)),s=new ji(t,n,this.gi.R().layout,this.gi.R().localization);return s.ia(this.Yt()),s},t}(),Ui=function(t){return t.getUTCFullYear()};function Hi(t,i,n){return i.replace(/yyyy/g,function(t){return st(Ui(t),4)}(t)).replace(/yy/g,function(t){return st(Ui(t)%100,2)}(t)).replace(/MMMM/g,function(t,i){return new Date(t.getUTCFullYear(),t.getUTCMonth(),1).toLocaleString(i,{month:"long"})}(t,n)).replace(/MMM/g,function(t,i){return new Date(t.getUTCFullYear(),t.getUTCMonth(),1).toLocaleString(i,{month:"short"})}(t,n)).replace(/MM/g,function(t){return st(function(t){return t.getUTCMonth()+1}(t),2)}(t)).replace(/dd/g,function(t){return st(function(t){return t.getUTCDate()}(t),2)}(t))}var Yi=function(){function t(t,i){void 0===t&&(t="yyyy-MM-dd"),void 0===i&&(i="default"),this.ao=t,this.oo=i}return t.prototype.lo=function(t){return Hi(t,this.ao,this.oo)},t}(),$i=function(){function t(t){this.fo=t||"%h:%m:%s"}return t.prototype.lo=function(t){return this.fo.replace("%h",st(t.getUTCHours(),2)).replace("%m",st(t.getUTCMinutes(),2)).replace("%s",st(t.getUTCSeconds(),2))},t}(),Ki={co:"yyyy-MM-dd",vo:"%h:%m:%s",_o:" ",do:"default"},Xi=function(){function t(t){void 0===t&&(t={});var i=m(m({},Ki),t);this.wo=new Yi(i.co,i.do),this.Mo=new $i(i.vo),this.bo=i._o}return t.prototype.lo=function(t){return"".concat(this.wo.lo(t)).concat(this.bo).concat(this.Mo.lo(t))},t}();var Zi=function(){function t(t,i){void 0===i&&(i=50),this.mo=0,this.po=1,this.yo=1,this.Gs=new Map,this.ko=new Map,this.xo=t,this.No=i}return t.prototype.lo=function(t){var i=void 0===t.Co?new Date(1e3*t.So).getTime():new Date(Date.UTC(t.Co.year,t.Co.month-1,t.Co.day)).getTime(),n=this.Gs.get(i);if(void 0!==n)return n.To;if(this.mo===this.No){var s=this.ko.get(this.yo);this.ko.delete(this.yo),this.Gs.delete(r(s)),this.yo++,this.mo--}var h=this.xo(t);return this.Gs.set(i,{To:h,Do:this.po}),this.ko.set(this.po,i),this.mo++,this.po++,h},t}(),Ji=function(){function t(t,i){h(t<=i,"right should be >= left"),this.Ao=t,this.Bo=i}return t.prototype.In=function(){return this.Ao},t.prototype.jn=function(){return this.Bo},t.prototype.Lo=function(){return this.Bo-this.Ao+1},t.prototype.Uh=function(t){return this.Ao<=t&&t<=this.Bo},t.prototype.br=function(t){return this.Ao===t.In()&&this.Bo===t.jn()},t}();function Gi(t,i){return null===t||null===i?t===i:t.br(i)}var Qi,tn=function(){function t(){this.Eo=new Map,this.Gs=null}return t.prototype.Oo=function(t,i){this.Fo(i),this.Gs=null;for(var n=i;n<t.length;++n){var s=t[n],h=this.Eo.get(s.Vo);void 0===h&&(h=[],this.Eo.set(s.Vo,h)),h.push({vs:n,rt:s.rt,Po:s.Vo})}},t.prototype.Ro=function(t,i){var n=Math.ceil(i/t);return null!==this.Gs&&this.Gs.zo===n||(this.Gs={au:this.Wo(n),zo:n}),this.Gs.au},t.prototype.Fo=function(t){if(0!==t){var i=[];this.Eo.forEach((function(n,s){t<=n[0].vs?i.push(s):n.splice(ct(n,t,(function(i){return i.vs<t})),1/0)}));for(var n=0,s=i;n<s.length;n++){var h=s[n];this.Eo.delete(h)}}else this.Eo.clear()},t.prototype.Wo=function(t){for(var i=[],n=0,s=Array.from(this.Eo.keys()).sort((function(t,i){return i-t}));n<s.length;n++){var h=s[n];if(this.Eo.get(h)){var e=i;i=[];for(var u=e.length,a=0,o=r(this.Eo.get(h)),l=o.length,f=1/0,c=-1/0,v=0;v<l;v++){for(var _=o[v],d=_.vs;a<u;){var w=e[a],M=w.vs;if(!(M<d)){f=M;break}a++,i.push(w),c=M,f=1/0}f-d>=t&&d-c>=t&&(i.push(_),c=d)}for(;a<u;a++)i.push(e[a])}}return i},t}(),nn=function(){function t(t){this.Io=t}return t.prototype.jo=function(){return null===this.Io?null:new Ji(Math.floor(this.Io.In()),Math.ceil(this.Io.jn()))},t.prototype.qo=function(){return this.Io},t.Uo=function(){return new t(null)},t}();!function(t){t[t.Year=0]="Year",t[t.Month=1]="Month",t[t.DayOfMonth=2]="DayOfMonth",t[t.Time=3]="Time",t[t.TimeWithSeconds=4]="TimeWithSeconds"}(Qi||(Qi={}));var sn=function(){function t(t,i,n){this.hh=0,this.Ho=null,this.Yo=[],this.zu=null,this.Ru=null,this.$o=new tn,this.Ko=new Map,this.Xo=nn.Uo(),this.Zo=!0,this.Jo=new p,this.Go=new p,this.Qo=new p,this.tl=null,this.il=null,this.nl=[],this.zi=i,this.qu=n,this.sl=i.rightOffset,this.hl=i.barSpacing,this.gi=t,this.rl()}return t.prototype.R=function(){return this.zi},t.prototype.el=function(t){y(this.qu,t),this.ul(),this.rl()},t.prototype.Pr=function(t,i){var n;y(this.zi,t),this.zi.fixLeftEdge&&this.al(),this.zi.fixRightEdge&&this.ol(),void 0!==t.barSpacing&&this.gi.pn(t.barSpacing),void 0!==t.rightOffset&&this.gi.yn(t.rightOffset),void 0!==t.minBarSpacing&&this.gi.pn(null!==(n=t.barSpacing)&&void 0!==n?n:this.hl),this.ul(),this.rl(),this.Qo.m()},t.prototype.pi=function(t){var i;return(null===(i=this.Yo[t])||void 0===i?void 0:i.rt)||null},t.prototype.Ze=function(t,i){if(this.Yo.length<1)return null;if(t.So>this.Yo[this.Yo.length-1].rt.So)return i?this.Yo.length-1:null;var n=ct(this.Yo,t.So,(function(t,i){return t.rt.So<i}));return t.So<this.Yo[n].rt.So?i?n:null:n},t.prototype.wi=function(){return 0===this.hh||0===this.Yo.length||null===this.Ho},t.prototype.ss=function(){return this.ll(),this.Xo.jo()},t.prototype.fl=function(){return this.ll(),this.Xo.qo()},t.prototype.cl=function(){var t=this.ss();if(null===t)return null;var i={from:t.In(),to:t.jn()};return this.vl(i)},t.prototype.vl=function(t){var i=Math.round(t.from),n=Math.round(t.to),s=e(this._l()),h=e(this.dl());return{from:e(this.pi(Math.max(s,i))),to:e(this.pi(Math.min(h,n)))}},t.prototype.wl=function(t){return{from:e(this.Ze(t.from,!0)),to:e(this.Ze(t.to,!0))}},t.prototype.Ht=function(){return this.hh},t.prototype.Wa=function(t){if(isFinite(t)&&!(t<=0)&&this.hh!==t){if(this.zi.lockVisibleTimeRangeOnResize&&this.hh){var i=this.hl*t/this.hh;this.hl=i}if(this.zi.fixLeftEdge){var n=this.ss();if(null!==n)if(n.In()<=0){var s=this.hh-t;this.sl-=Math.round(s/this.hl)+1}}this.hh=t,this.Zo=!0,this.Ml(),this.bl()}},t.prototype.At=function(t){if(this.wi()||!x(t))return 0;var i=this.ml()+this.sl-t;return this.hh-(i+.5)*this.hl-1},t.prototype.es=function(t,i){for(var n=this.ml(),s=void 0===i?0:i.from,h=void 0===i?t.length:i.to,r=s;r<h;r++){var e=t[r].rt,u=n+this.sl-e,a=this.hh-(u+.5)*this.hl-1;t[r].tt=a}},t.prototype.gl=function(t){return Math.ceil(this.pl(t))},t.prototype.yn=function(t){this.Zo=!0,this.sl=t,this.bl(),this.gi.yl(),this.gi.Rr()},t.prototype.ws=function(){return this.hl},t.prototype.pn=function(t){this.kl(t),this.bl(),this.gi.yl(),this.gi.Rr()},t.prototype.xl=function(){return this.sl},t.prototype.au=function(){if(this.wi())return null;if(null!==this.il)return this.il;for(var t=this.hl,i=5*(this.gi.R().layout.fontSize+4),n=Math.round(i/t),s=e(this.ss()),h=Math.max(s.In(),s.In()-n),r=Math.max(s.jn(),s.jn()-n),u=this.$o.Ro(t,i),a=this._l()+n,o=this.dl()-n,l=this.Nl(),f=this.zi.fixLeftEdge||l,c=this.zi.fixRightEdge||l,v=0,_=0,d=u;_<d.length;_++){var w=d[_];if(h<=w.vs&&w.vs<=r){var M=void 0;v<this.nl.length?((M=this.nl[v]).su=this.At(w.vs),M.yu=this.Cl(w.rt,w.Po),M.Po=w.Po):(M={Sl:!1,su:this.At(w.vs),yu:this.Cl(w.rt,w.Po),Po:w.Po},this.nl.push(M)),this.hl>i/2&&!l?M.Sl=!1:M.Sl=f&&w.vs<=a||c&&w.vs>=o,v++}}return this.nl.length=v,this.il=this.nl,this.nl},t.prototype.Tl=function(){this.Zo=!0,this.pn(this.zi.barSpacing),this.yn(this.zi.rightOffset)},t.prototype.Dl=function(t){this.Zo=!0,this.Ho=t,this.bl(),this.al()},t.prototype.Al=function(t,i){var n=this.pl(t),s=this.ws(),h=s+i*(s/10);this.pn(h),this.zi.rightBarStaysOnScroll||this.yn(this.xl()+(n-this.pl(t)))},t.prototype.da=function(t){this.zu&&this.ga(),null===this.Ru&&null===this.tl&&(this.wi()||(this.Ru=t,this.Bl()))},t.prototype.wa=function(t){if(null!==this.tl){var i=kt(this.hh-t,0,this.hh),n=kt(this.hh-e(this.Ru),0,this.hh);0!==i&&0!==n&&this.pn(this.tl.ws*i/n)}},t.prototype.Ma=function(){null!==this.Ru&&(this.Ru=null,this.Ll())},t.prototype.ba=function(t){null===this.zu&&null===this.tl&&(this.wi()||(this.zu=t,this.Bl()))},t.prototype.ma=function(t){if(null!==this.zu){var i=(this.zu-t)/this.ws();this.sl=e(this.tl).xl+i,this.Zo=!0,this.bl()}},t.prototype.ga=function(){null!==this.zu&&(this.zu=null,this.Ll())},t.prototype.El=function(){this.Ol(this.zi.rightOffset)},t.prototype.Ol=function(t,i){var n=this;if(void 0===i&&(i=400),!isFinite(t))throw new RangeError("offset is required and must be finite number");if(!isFinite(i)||i<=0)throw new RangeError("animationDuration (optional) must be finite positive number");var s=this.sl,h=performance.now(),r=function(){var e=(performance.now()-h)/i,u=e>=1,a=u?t:s+(t-s)*e;n.yn(a),u||setTimeout(r,20)};r()},t.prototype.vt=function(t,i){this.Zo=!0,this.Yo=t,this.$o.Oo(t,i),this.bl()},t.prototype.Fl=function(){return this.Jo},t.prototype.Vl=function(){return this.Go},t.prototype.Pl=function(){return this.Qo},t.prototype.ml=function(){return this.Ho||0},t.prototype.Rl=function(t){var i=t.Lo();this.kl(this.hh/i),this.sl=t.jn()-this.ml(),this.bl(),this.Zo=!0,this.gi.yl(),this.gi.Rr()},t.prototype.zl=function(){var t=this._l(),i=this.dl();null!==t&&null!==i&&this.Rl(new Ji(t,i+this.zi.rightOffset))},t.prototype.Wl=function(t){var i=new Ji(t.from,t.to);this.Rl(i)},t.prototype.yi=function(t){return void 0!==this.qu.timeFormatter?this.qu.timeFormatter(t.Co||t.So):this.Il.lo(new Date(1e3*t.So))},t.prototype.Nl=function(){var t=this.gi.R(),i=t.handleScroll,n=t.handleScale;return!(i.horzTouchDrag||i.mouseWheel||i.pressedMouseMove||i.vertTouchDrag||n.axisDoubleClickReset||n.axisPressedMouseMove.time||n.mouseWheel||n.pinch)},t.prototype._l=function(){return 0===this.Yo.length?null:0},t.prototype.dl=function(){return 0===this.Yo.length?null:this.Yo.length-1},t.prototype.jl=function(t){return(this.hh-1-t)/this.hl},t.prototype.pl=function(t){var i=this.jl(t),n=this.ml()+this.sl-i;return Math.round(1e6*n)/1e6},t.prototype.kl=function(t){var i=this.hl;this.hl=t,this.Ml(),i!==this.hl&&(this.Zo=!0,this.ql())},t.prototype.ll=function(){if(this.Zo)if(this.Zo=!1,this.wi())this.Ul(nn.Uo());else{var t=this.ml(),i=this.hh/this.hl,n=this.sl+t,s=new Ji(n-i+1,n);this.Ul(new nn(s))}},t.prototype.Ml=function(){var t=this.Hl();if(this.hl<t&&(this.hl=t,this.Zo=!0),0!==this.hh){var i=.5*this.hh;this.hl>i&&(this.hl=i,this.Zo=!0)}},t.prototype.Hl=function(){return this.zi.fixLeftEdge&&this.zi.fixRightEdge&&0!==this.Yo.length?this.hh/this.Yo.length:this.zi.minBarSpacing},t.prototype.bl=function(){var t=this.Yl();this.sl>t&&(this.sl=t,this.Zo=!0);var i=this.$l();null!==i&&this.sl<i&&(this.sl=i,this.Zo=!0)},t.prototype.$l=function(){var t=this._l(),i=this.Ho;return null===t||null===i?null:t-i-1+(this.zi.fixLeftEdge?this.hh/this.hl:Math.min(2,this.Yo.length))},t.prototype.Yl=function(){return this.zi.fixRightEdge?0:this.hh/this.hl-Math.min(2,this.Yo.length)},t.prototype.Bl=function(){this.tl={ws:this.ws(),xl:this.xl()}},t.prototype.Ll=function(){this.tl=null},t.prototype.Cl=function(t,i){var n=this,s=this.Ko.get(i);return void 0===s&&(s=new Zi((function(t){return n.Kl(t,i)})),this.Ko.set(i,s)),s.lo(t)},t.prototype.Kl=function(t,i){var n,s=function(t,i,n){switch(t){case 0:case 10:return i?n?4:3:2;case 20:case 21:case 22:case 30:case 31:case 32:case 33:return i?3:2;case 50:return 2;case 60:return 1;case 70:return 0}}(i,this.zi.timeVisible,this.zi.secondsVisible);return void 0!==this.zi.tickMarkFormatter?this.zi.tickMarkFormatter(null!==(n=t.Co)&&void 0!==n?n:t.So,s,this.qu.locale):function(t,i,n){var s={};switch(i){case 0:s.year="numeric";break;case 1:s.month="short";break;case 2:s.day="numeric";break;case 3:s.hour12=!1,s.hour="2-digit",s.minute="2-digit";break;case 4:s.hour12=!1,s.hour="2-digit",s.minute="2-digit",s.second="2-digit"}var h=void 0===t.Co?new Date(1e3*t.So):new Date(Date.UTC(t.Co.year,t.Co.month-1,t.Co.day));return new Date(h.getUTCFullYear(),h.getUTCMonth(),h.getUTCDate(),h.getUTCHours(),h.getUTCMinutes(),h.getUTCSeconds(),h.getUTCMilliseconds()).toLocaleString(n,s)}(t,s,this.qu.locale)},t.prototype.Ul=function(t){var i=this.Xo;this.Xo=t,Gi(i.jo(),this.Xo.jo())||this.Jo.m(),Gi(i.qo(),this.Xo.qo())||this.Go.m(),this.ql()},t.prototype.ql=function(){this.il=null},t.prototype.ul=function(){this.ql(),this.Ko.clear()},t.prototype.rl=function(){var t=this.qu.dateFormat;this.zi.timeVisible?this.Il=new Xi({co:t,vo:this.zi.secondsVisible?"%h:%m:%s":"%h:%m",_o:"   ",do:this.qu.locale}):this.Il=new Yi(t,this.qu.locale)},t.prototype.al=function(){if(this.zi.fixLeftEdge){var t=this._l();if(null!==t){var i=this.ss();if(null!==i){var n=i.In()-t;if(n<0){var s=this.sl-n-1;this.yn(s)}this.Ml()}}}},t.prototype.ol=function(){this.bl(),this.Ml()},t}();var hn,rn=function(t){function i(i){var n=t.call(this)||this;return n.Xl=new Map,n.Bt=i,n}return b(i,t),i.prototype.Y=function(t){},i.prototype.K=function(t){if(this.Bt.yt){t.save();for(var i=0,n=0,s=this.Bt.Zl;n<s.length;n++){if(0!==(a=s[n]).Gt.length){t.font=a.T;var h=this.Jl(t,a.Gt);h>this.Bt.Ht?a.Al=this.Bt.Ht/h:a.Al=1,i+=a.Gl*a.Al}}var r=0;switch(this.Bt.Ql){case"top":r=0;break;case"center":r=Math.max((this.Bt.Yt-i)/2,0);break;case"bottom":r=Math.max(this.Bt.Yt-i,0)}t.fillStyle=this.Bt.A;for(var e=0,u=this.Bt.Zl;e<u.length;e++){var a=u[e];t.save();var o=0;switch(this.Bt.tf){case"left":t.textAlign="left",o=a.Gl/2;break;case"center":t.textAlign="center",o=this.Bt.Ht/2;break;case"right":t.textAlign="right",o=this.Bt.Ht-1-a.Gl/2}t.translate(o,r),t.textBaseline="top",t.font=a.T,t.scale(a.Al,a.Al),t.fillText(a.Gt,0,a.if),t.restore(),r+=a.Gl*a.Al}t.restore()}},i.prototype.Jl=function(t,i){var n=this.nf(t.font),s=n.get(i);return void 0===s&&(s=t.measureText(i).width,n.set(i,s)),s},i.prototype.nf=function(t){var i=this.Xl.get(t);return void 0===i&&(i=new Map,this.Xl.set(t,i)),i},i}(O),en=function(){function t(t){this.ft=!0,this.Rt={yt:!1,A:"",Yt:0,Ht:0,Zl:[],Ql:"center",tf:"center"},this.zt=new rn(this.Rt),this.Wt=t}return t.prototype.vt=function(){this.ft=!0},t.prototype.dt=function(t,i){return this.ft&&(this.wt(t,i),this.ft=!1),this.zt},t.prototype.wt=function(t,i){var n=this.Wt.R(),s=this.Rt;s.yt=n.visible,s.yt&&(s.A=n.color,s.Ht=i,s.Yt=t,s.tf=n.horzAlign,s.Ql=n.vertAlign,s.Zl=[{Gt:n.text,T:B(n.fontSize,n.fontFamily,n.fontStyle),Gl:1.2*n.fontSize,if:0,Al:0}])},t}(),un=function(t){function i(i,n){var s=t.call(this)||this;return s.zi=n,s.Hi=new en(s),s}return b(i,t),i.prototype.nn=function(){return[]},i.prototype.tn=function(){return[this.Hi]},i.prototype.R=function(){return this.zi},i.prototype.hn=function(){this.Hi.vt()},i}(G);!function(t){t[t.OnTouchEnd=0]="OnTouchEnd",t[t.OnNextTap=1]="OnNextTap"}(hn||(hn={}));var an,on,ln,fn=function(){function t(t,i){this.sf=[],this.hf=[],this.hh=0,this.rf=null,this.ef=null,this.uf=new p,this.af=new p,this.lf=null,this.ff=t,this.zi=i,this.cf=new L(this),this.Da=new sn(this,i.timeScale,this.zi.localization),this.ct=new Q(this,i.crosshair),this.vf=new yi(i.crosshair),this._f=new un(this,i.watermark),this.df(),this.sf[0].za(2e3),this.wf=this.Mf(0),this.bf=this.Mf(1)}return t.prototype.Ce=function(){this.mf(new it(3))},t.prototype.Rr=function(){this.mf(new it(2))},t.prototype.Re=function(){this.mf(new it(1))},t.prototype.Se=function(t){var i=this.gf(t);this.mf(i)},t.prototype.pf=function(){return this.ef},t.prototype.yf=function(t){var i=this.ef;this.ef=t,null!==i&&this.Se(i.kf),null!==t&&this.Se(t.kf)},t.prototype.R=function(){return this.zi},t.prototype.Pr=function(t){y(this.zi,t),this.sf.forEach((function(i){return i.Fa(t)})),void 0!==t.timeScale&&this.Da.Pr(t.timeScale),void 0!==t.localization&&this.Da.el(t.localization),(t.leftPriceScale||t.rightPriceScale)&&this.uf.m(),this.wf=this.Mf(0),this.bf=this.Mf(1),this.Ce()},t.prototype.xf=function(t,i){if("left"!==t)if("right"!==t){var n=this.Nf(t);null!==n&&(n.Ct.Pr(i),this.uf.m())}else this.Pr({rightPriceScale:i});else this.Pr({leftPriceScale:i})},t.prototype.Nf=function(t){for(var i=0,n=this.sf;i<n.length;i++){var s=n[i],h=s.Va(t);if(null!==h)return{It:s,Ct:h}}return null},t.prototype.bt=function(){return this.Da},t.prototype.Cf=function(){return this.sf},t.prototype.Sf=function(){return this._f},t.prototype.Tf=function(){return this.ct},t.prototype.Df=function(){return this.af},t.prototype.Af=function(t,i){t.ia(i),this.yl()},t.prototype.Wa=function(t){this.hh=t,this.Da.Wa(this.hh),this.sf.forEach((function(i){return i.Wa(t)})),this.yl()},t.prototype.df=function(t){var i=new qi(this.Da,this);void 0!==t?this.sf.splice(t,0,i):this.sf.push(i);var n=void 0===t?this.sf.length-1:t,s=new it(3);return s.cn(n,{vn:0,_n:!0}),this.mf(s),i},t.prototype.Ka=function(t,i,n){t.Ka(i,n)},t.prototype.Xa=function(t,i,n){t.Xa(i,n),this.Te(),this.mf(this.Bf(t,2))},t.prototype.Za=function(t,i){t.Za(i),this.mf(this.Bf(t,2))},t.prototype.Ja=function(t,i,n){i.Xu()||t.Ja(i,n)},t.prototype.Ga=function(t,i,n){i.Xu()||(t.Ga(i,n),this.Te(),this.mf(this.Bf(t,2)))},t.prototype.Qa=function(t,i){i.Xu()||(t.Qa(i),this.mf(this.Bf(t,2)))},t.prototype.no=function(t,i){t.no(i),this.mf(this.Bf(t,2))},t.prototype.Lf=function(t){this.Da.da(t)},t.prototype.Ef=function(t,i){var n=this.bt();if(!n.wi()&&0!==i){var s=n.Ht();t=Math.max(1,Math.min(t,s)),n.Al(t,i),this.yl()}},t.prototype.Of=function(t){this.Ff(0),this.Vf(t),this.Pf()},t.prototype.Rf=function(t){this.Da.wa(t),this.yl()},t.prototype.zf=function(){this.Da.Ma(),this.Rr()},t.prototype.Ff=function(t){this.rf=t,this.Da.ba(t)},t.prototype.Vf=function(t){var i=!1;return null!==this.rf&&Math.abs(t-this.rf)>20&&(this.rf=null,i=!0),this.Da.ma(t),this.yl(),i},t.prototype.Pf=function(){this.Da.ga(),this.Rr(),this.rf=null},t.prototype._t=function(){return this.hf},t.prototype.Wf=function(t,i,n){this.ct.Yi(t,i);var s=NaN,h=this.Da.gl(t),r=this.Da.ss();null!==r&&(h=Math.min(Math.max(r.In(),h),r.jn()));var e=n.ji(),u=e.kt();null!==u&&(s=e.qi(i,u)),s=this.vf.Je(s,h,n),this.ct.Zi(h,s,n),this.Re(),this.af.m(this.ct.Mt(),{x:t,y:i})},t.prototype.If=function(){this.Tf().Gi(),this.Re(),this.af.m(null,null)},t.prototype.Te=function(){var t=this.ct.It();if(null!==t){var i=this.ct.Ki(),n=this.ct.Xi();this.Wf(i,n,t)}this.ct.hn()},t.prototype.jf=function(t,i,n){var s=this.Da.pi(0);void 0!==i&&void 0!==n&&this.Da.vt(i,n);var h=this.Da.pi(0),r=this.Da.ml(),e=this.Da.ss();if(null!==e&&null!==s&&null!==h){var u=e.Uh(r),a=s.So>h.So,o=null!==t&&t>r&&!a,l=u&&this.Da.R().shiftVisibleRangeOnNewBar;if(o&&!l){var f=t-r;this.Da.yn(this.Da.xl()-f)}}this.Da.Dl(t)},t.prototype.Be=function(t){null!==t&&t.ho()},t.prototype.oh=function(t){var i=this.sf.find((function(i){return i.oa().includes(t)}));return void 0===i?null:i},t.prototype.yl=function(){this._f.hn(),this.sf.forEach((function(t){return t.ho()})),this.Te()},t.prototype.p=function(){this.sf.forEach((function(t){return t.p()})),this.sf.length=0,this.zi.localization.priceFormatter=void 0,this.zi.localization.timeFormatter=void 0},t.prototype.qf=function(){return this.cf},t.prototype.dh=function(){return this.cf.R()},t.prototype.Pa=function(){return this.uf},t.prototype.Uf=function(t,i){var n=this.sf[0],s=this.Hf(i,t,n);return this.hf.push(s),1===this.hf.length?this.Ce():this.Rr(),s},t.prototype.Yf=function(t){var i=this.oh(t),n=this.hf.indexOf(t);h(-1!==n,"Series not found"),this.hf.splice(n,1),e(i).ca(t),t.p&&t.p()},t.prototype.Ne=function(t,i){var n=e(this.oh(t));n.ca(t);var s=this.Nf(i);if(null===s){var h=t.Ni();n.la(t,i,h)}else{h=s.It===n?t.Ni():void 0;s.It.la(t,i,h)}},t.prototype.zl=function(){var t=new it(2);t.Mn(),this.mf(t)},t.prototype.$f=function(t){var i=new it(2);i.mn(t),this.mf(i)},t.prototype.gn=function(){var t=new it(2);t.gn(),this.mf(t)},t.prototype.pn=function(t){var i=new it(2);i.pn(t),this.mf(i)},t.prototype.yn=function(t){var i=new it(2);i.yn(t),this.mf(i)},t.prototype.Kf=function(){return this.zi.rightPriceScale.visible?"right":"left"},t.prototype.Xf=function(){return this.bf},t.prototype.Zf=function(){return this.wf},t.prototype.Dt=function(t){var i=this.bf,n=this.wf;if(i===n)return i;if(t=Math.max(0,Math.min(100,Math.round(100*t))),null===this.lf||this.lf.Pn!==n||this.lf.Rn!==i)this.lf={Pn:n,Rn:i,Jf:new Map};else{var s=this.lf.Jf.get(t);if(void 0!==s)return s}var h=function(t,i,n){var s=d(t),h=s[0],r=s[1],e=s[2],u=s[3],a=d(i),f=a[0],c=a[1],v=a[2],_=a[3],w=[o(h+n*(f-h)),o(r+n*(c-r)),o(e+n*(v-e)),l(u+n*(_-u))];return"rgba(".concat(w[0],", ").concat(w[1],", ").concat(w[2],", ").concat(w[3],")")}(n,i,t/100);return this.lf.Jf.set(t,h),h},t.prototype.Bf=function(t,i){var n=new it(i);if(null!==t){var s=this.sf.indexOf(t);n.cn(s,{vn:i})}return n},t.prototype.gf=function(t,i){return void 0===i&&(i=2),this.Bf(this.oh(t),i)},t.prototype.mf=function(t){this.ff&&this.ff(t),this.sf.forEach((function(t){return t.eo().ou().vt()}))},t.prototype.Hf=function(t,i,n){var s=new pi(this,t,i),h=void 0!==t.priceScaleId?t.priceScaleId:this.Kf();return n.la(s,h),tt(h)||s.Pr(t),s},t.prototype.Mf=function(t){var i=this.zi.layout;return"gradient"===i.background.type?0===t?i.background.topColor:i.background.bottomColor:i.background.color},t}();function cn(t){void 0!==t.borderColor&&(t.borderUpColor=t.borderColor,t.borderDownColor=t.borderColor),void 0!==t.wickColor&&(t.wickUpColor=t.wickColor,t.wickDownColor=t.wickColor)}function vn(t){return!k(t)&&!N(t)}function _n(t){return k(t)}!function(t){t[t.Disabled=0]="Disabled",t[t.Continuous=1]="Continuous",t[t.OnDataUpdate=2]="OnDataUpdate"}(an||(an={})),function(t){t[t.LastBar=0]="LastBar",t[t.LastVisible=1]="LastVisible"}(on||(on={})),function(t){t.Solid="solid",t.VerticalGradient="gradient"}(ln||(ln={}));var dn={allowDownsampling:!0};var wn=function(){function t(t,i){var n=this;this._resolutionMediaQueryList=null,this._resolutionListener=function(t){return n._onResolutionChanged()},this._canvasConfiguredListeners=[],this.canvas=t,this._canvasSize={width:this.canvas.clientWidth,height:this.canvas.clientHeight},this._options=i,this._configureCanvas(),this._installResolutionListener()}return t.prototype.destroy=function(){this._canvasConfiguredListeners.length=0,this._uninstallResolutionListener(),this.canvas=null},Object.defineProperty(t.prototype,"canvasSize",{get:function(){return{width:this._canvasSize.width,height:this._canvasSize.height}},enumerable:!0,configurable:!0}),t.prototype.resizeCanvas=function(t){this._canvasSize={width:t.width,height:t.height},this._configureCanvas()},Object.defineProperty(t.prototype,"pixelRatio",{get:function(){var t=this.canvas.ownerDocument.defaultView;if(null==t)throw new Error("No window is associated with the canvas");return t.devicePixelRatio>1||this._options.allowDownsampling?t.devicePixelRatio:1},enumerable:!0,configurable:!0}),t.prototype.subscribeCanvasConfigured=function(t){this._canvasConfiguredListeners.push(t)},t.prototype.unsubscribeCanvasConfigured=function(t){this._canvasConfiguredListeners=this._canvasConfiguredListeners.filter((function(i){return i!=t}))},t.prototype._configureCanvas=function(){var t=this.pixelRatio;this.canvas.style.width=this._canvasSize.width+"px",this.canvas.style.height=this._canvasSize.height+"px",this.canvas.width=this._canvasSize.width*t,this.canvas.height=this._canvasSize.height*t,this._emitCanvasConfigured()},t.prototype._emitCanvasConfigured=function(){var t=this;this._canvasConfiguredListeners.forEach((function(i){return i.call(t)}))},t.prototype._installResolutionListener=function(){if(null!==this._resolutionMediaQueryList)throw new Error("Resolution listener is already installed");var t=this.canvas.ownerDocument.defaultView;if(null==t)throw new Error("No window is associated with the canvas");var i=t.devicePixelRatio;this._resolutionMediaQueryList=t.matchMedia("all and (resolution: "+i+"dppx)"),this._resolutionMediaQueryList.addListener(this._resolutionListener)},t.prototype._uninstallResolutionListener=function(){null!==this._resolutionMediaQueryList&&(this._resolutionMediaQueryList.removeListener(this._resolutionListener),this._resolutionMediaQueryList=null)},t.prototype._reinstallResolutionListener=function(){this._uninstallResolutionListener(),this._installResolutionListener()},t.prototype._onResolutionChanged=function(){this._configureCanvas(),this._reinstallResolutionListener()},t}(),Mn=function(){function t(t,i){this.Ot=t,this.Ft=i}return t.prototype.br=function(t){return this.Ot===t.Ot&&this.Ft===t.Ft},t}();function bn(t){return t.ownerDocument&&t.ownerDocument.defaultView&&t.ownerDocument.defaultView.devicePixelRatio||1}function mn(t){var i=e(t.getContext("2d"));return i.setTransform(1,0,0,1,0,0),i}function gn(t,i){var n=t.createElement("canvas"),s=bn(n);return n.style.width="".concat(i.Ot,"px"),n.style.height="".concat(i.Ft,"px"),n.width=i.Ot*s,n.height=i.Ft*s,n}function pn(t,i){var n=e(t.ownerDocument).createElement("canvas");t.appendChild(n);var s=function(t,i){return void 0===i&&(i=dn),new wn(t,i)}(n,{allowDownsampling:!1});return s.resizeCanvas({width:i.Ot,height:i.Ft}),s}function yn(t,i){return t.Gf-i.Gf}function kn(t,i,n){var s=(t.Gf-i.Gf)/(t.rt-i.rt);return Math.sign(s)*Math.min(Math.abs(s),n)}var xn=function(){function t(t,i,n,s){this.Qf=null,this.tc=null,this.ic=null,this.nc=null,this.sc=null,this.hc=0,this.rc=0,this.ec=!1,this.uc=t,this.ac=i,this.oc=n,this.Cn=s}return t.prototype.lc=function(t,i){if(null!==this.Qf){if(this.Qf.rt===i)return void(this.Qf.Gf=t);if(Math.abs(this.Qf.Gf-t)<this.Cn)return}this.nc=this.ic,this.ic=this.tc,this.tc=this.Qf,this.Qf={rt:i,Gf:t}},t.prototype.Nh=function(t,i){if(null!==this.Qf&&null!==this.tc&&!(i-this.Qf.rt>50)){var n=0,s=kn(this.Qf,this.tc,this.ac),h=yn(this.Qf,this.tc),r=[s],e=[h];if(n+=h,null!==this.ic){var u=kn(this.tc,this.ic,this.ac);if(Math.sign(u)===Math.sign(s)){var a=yn(this.tc,this.ic);if(r.push(u),e.push(a),n+=a,null!==this.nc){var o=kn(this.ic,this.nc,this.ac);if(Math.sign(o)===Math.sign(s)){var l=yn(this.ic,this.nc);r.push(o),e.push(l),n+=l}}}}for(var f,c,v,_=0,d=0;d<r.length;++d)_+=e[d]/n*r[d];if(!(Math.abs(_)<this.uc))this.sc={Gf:t,rt:i},this.rc=_,this.hc=(f=Math.abs(_),c=this.oc,v=Math.log(c),Math.log(1*v/-f)/v)}},t.prototype.fc=function(t){var i=e(this.sc),n=t-i.rt;return i.Gf+this.rc*(Math.pow(this.oc,n)-1)/Math.log(this.oc)},t.prototype.cc=function(t){return null===this.sc||this.vc(t)===this.hc},t.prototype._c=function(){return this.ec},t.prototype.dc=function(){this.ec=!0},t.prototype.vc=function(t){var i=t-e(this.sc).rt;return Math.min(i,this.hc)},t}(),Nn="undefined"!=typeof window;function Cn(){return!!Nn&&window.navigator.userAgent.toLowerCase().indexOf("firefox")>-1}function Sn(){return!!Nn&&/iPhone|iPad|iPod/.test(window.navigator.platform)}function Tn(t){Nn&&void 0!==window.chrome&&t.addEventListener("mousedown",(function(t){if(1===t.button)return t.preventDefault(),!1}))}var Dn=function(){function t(t,i,n){var s=this;this.wc=0,this.Mc=null,this.bc={tt:Number.NEGATIVE_INFINITY,it:Number.POSITIVE_INFINITY},this.mc=0,this.gc=null,this.yc={tt:Number.NEGATIVE_INFINITY,it:Number.POSITIVE_INFINITY},this.kc=null,this.xc=!1,this.Nc=null,this.Cc=null,this.Sc=!1,this.Tc=!1,this.Dc=!1,this.Ac=null,this.Bc=null,this.Lc=null,this.Ec=null,this.Oc=null,this.Fc=null,this.Vc=null,this.Pc=0,this.Rc=!1,this.zc=!1,this.Wc=!1,this.Ic=0,this.jc=null,this.qc=!Sn(),this.Uc=function(t){s.Hc(t)},this.Yc=function(t){if(s.$c(t)){var i=s.Kc(t);if(++s.mc,s.gc&&s.mc>1)s.Zc(Ln(t),s.yc).Xc<30&&!s.Dc&&s.Jc(i,s.Qc.Gc),s.tv()}else{i=s.Kc(t);if(++s.wc,s.Mc&&s.wc>1)s.Zc(Ln(t),s.bc).Xc<5&&!s.Tc&&s.iv(i,s.Qc.nv),s.sv()}},this.hv=t,this.Qc=i,this.zi=n,this.rv()}return t.prototype.p=function(){null!==this.Ac&&(this.Ac(),this.Ac=null),null!==this.Bc&&(this.Bc(),this.Bc=null),null!==this.Ec&&(this.Ec(),this.Ec=null),null!==this.Oc&&(this.Oc(),this.Oc=null),null!==this.Fc&&(this.Fc(),this.Fc=null),null!==this.Lc&&(this.Lc(),this.Lc=null),this.ev(),this.sv()},t.prototype.uv=function(t){var i=this;this.Ec&&this.Ec();var n=this.av.bind(this);if(this.Ec=function(){i.hv.removeEventListener("mousemove",n)},this.hv.addEventListener("mousemove",n),!this.$c(t)){var s=this.Kc(t);this.iv(s,this.Qc.ov),this.qc=!0}},t.prototype.sv=function(){null!==this.Mc&&clearTimeout(this.Mc),this.wc=0,this.Mc=null,this.bc={tt:Number.NEGATIVE_INFINITY,it:Number.POSITIVE_INFINITY}},t.prototype.tv=function(){null!==this.gc&&clearTimeout(this.gc),this.mc=0,this.gc=null,this.yc={tt:Number.NEGATIVE_INFINITY,it:Number.POSITIVE_INFINITY}},t.prototype.av=function(t){if(!this.Wc&&null===this.Cc&&!this.$c(t)){var i=this.Kc(t);this.iv(i,this.Qc.lv),this.qc=!0}},t.prototype.fv=function(t){var i=On(t.changedTouches,e(this.jc));if(null!==i&&(this.Ic=En(t),null===this.Vc&&!this.zc)){this.Rc=!0;var n=this.Zc(Ln(i),e(this.Cc)),s=n.cv,h=n.vv,r=n.Xc;if(this.Sc||!(r<5)){if(!this.Sc){var u=.5*s,a=h>=u&&!this.zi._v(),o=u>h&&!this.zi.dv();a||o||(this.zc=!0),this.Sc=!0,this.Dc=!0,this.ev(),this.tv()}if(!this.zc){var l=this.Kc(t,i);this.Jc(l,this.Qc.wv),Bn(t)}}}},t.prototype.Mv=function(t){if(0===t.button&&(this.Zc(Ln(t),e(this.Nc)).Xc>=5&&(this.Tc=!0,this.sv()),this.Tc)){var i=this.Kc(t);this.iv(i,this.Qc.bv)}},t.prototype.Zc=function(t,i){var n=Math.abs(i.tt-t.tt),s=Math.abs(i.it-t.it);return{cv:n,vv:s,Xc:n+s}},t.prototype.mv=function(t){var i=On(t.changedTouches,e(this.jc));if(null===i&&0===t.touches.length&&(i=t.changedTouches[0]),null!==i){this.jc=null,this.Ic=En(t),this.ev(),this.Cc=null,this.Fc&&(this.Fc(),this.Fc=null);var n=this.Kc(t,i);if(this.Jc(n,this.Qc.gv),++this.mc,this.gc&&this.mc>1)this.Zc(Ln(i),this.yc).Xc<30&&!this.Dc&&this.Jc(n,this.Qc.Gc),this.tv();else this.Dc||(this.Jc(n,this.Qc.pv),this.Qc.pv&&Bn(t));0===this.mc&&Bn(t),0===t.touches.length&&this.xc&&(this.xc=!1,Bn(t))}},t.prototype.Hc=function(t){if(0===t.button){var i=this.Kc(t);if(this.Nc=null,this.Wc=!1,this.Oc&&(this.Oc(),this.Oc=null),Cn())this.hv.ownerDocument.documentElement.removeEventListener("mouseleave",this.Uc);if(!this.$c(t))if(this.iv(i,this.Qc.yv),++this.wc,this.Mc&&this.wc>1)this.Zc(Ln(t),this.bc).Xc<5&&!this.Tc&&this.iv(i,this.Qc.nv),this.sv();else this.Tc||this.iv(i,this.Qc.kv)}},t.prototype.ev=function(){null!==this.kc&&(clearTimeout(this.kc),this.kc=null)},t.prototype.xv=function(t){if(null===this.jc){var i=t.changedTouches[0];this.jc=i.identifier,this.Ic=En(t);var n=this.hv.ownerDocument.documentElement;this.Dc=!1,this.Sc=!1,this.zc=!1,this.Cc=Ln(i),this.Fc&&(this.Fc(),this.Fc=null);var s=this.fv.bind(this),h=this.mv.bind(this);this.Fc=function(){n.removeEventListener("touchmove",s),n.removeEventListener("touchend",h)},n.addEventListener("touchmove",s,{passive:!1}),n.addEventListener("touchend",h,{passive:!1}),this.ev(),this.kc=setTimeout(this.Nv.bind(this,t),240);var r=this.Kc(t,i);this.Jc(r,this.Qc.Cv),this.gc||(this.mc=0,this.gc=setTimeout(this.tv.bind(this),500),this.yc=Ln(i))}},t.prototype.Sv=function(t){if(0===t.button){var i=this.hv.ownerDocument.documentElement;Cn()&&i.addEventListener("mouseleave",this.Uc),this.Tc=!1,this.Nc=Ln(t),this.Oc&&(this.Oc(),this.Oc=null);var n=this.Mv.bind(this),s=this.Hc.bind(this);if(this.Oc=function(){i.removeEventListener("mousemove",n),i.removeEventListener("mouseup",s)},i.addEventListener("mousemove",n),i.addEventListener("mouseup",s),this.Wc=!0,!this.$c(t)){var h=this.Kc(t);this.iv(h,this.Qc.Tv),this.Mc||(this.wc=0,this.Mc=setTimeout(this.sv.bind(this),500),this.bc=Ln(t))}}},t.prototype.rv=function(){var t=this;this.hv.addEventListener("mouseenter",this.uv.bind(this)),this.hv.addEventListener("touchcancel",this.ev.bind(this));var i=this.hv.ownerDocument,n=function(i){t.Qc.Dv&&(i.target&&t.hv.contains(i.target)||t.Qc.Dv())};this.Bc=function(){i.removeEventListener("touchstart",n)},this.Ac=function(){i.removeEventListener("mousedown",n)},i.addEventListener("mousedown",n),i.addEventListener("touchstart",n,{passive:!0}),Sn()&&(this.Lc=function(){t.hv.removeEventListener("dblclick",t.Yc)},this.hv.addEventListener("dblclick",this.Yc)),this.hv.addEventListener("mouseleave",this.Av.bind(this)),this.hv.addEventListener("touchstart",this.xv.bind(this),{passive:!0}),Tn(this.hv),this.hv.addEventListener("mousedown",this.Sv.bind(this)),this.Bv(),this.hv.addEventListener("touchmove",(function(){}),{passive:!1})},t.prototype.Bv=function(){var t=this;void 0===this.Qc.Lv&&void 0===this.Qc.Ev&&void 0===this.Qc.Ov||(this.hv.addEventListener("touchstart",(function(i){return t.Fv(i.touches)}),{passive:!0}),this.hv.addEventListener("touchmove",(function(i){if(2===i.touches.length&&null!==t.Vc&&void 0!==t.Qc.Ev){var n=An(i.touches[0],i.touches[1])/t.Pc;t.Qc.Ev(t.Vc,n),Bn(i)}}),{passive:!1}),this.hv.addEventListener("touchend",(function(i){t.Fv(i.touches)})))},t.prototype.Fv=function(t){1===t.length&&(this.Rc=!1),2!==t.length||this.Rc||this.xc?this.Vv():this.Pv(t)},t.prototype.Pv=function(t){var i=this.hv.getBoundingClientRect()||{left:0,top:0};this.Vc={tt:(t[0].clientX-i.left+(t[1].clientX-i.left))/2,it:(t[0].clientY-i.top+(t[1].clientY-i.top))/2},this.Pc=An(t[0],t[1]),void 0!==this.Qc.Lv&&this.Qc.Lv(),this.ev()},t.prototype.Vv=function(){null!==this.Vc&&(this.Vc=null,void 0!==this.Qc.Ov&&this.Qc.Ov())},t.prototype.Av=function(t){if(this.Ec&&this.Ec(),!this.$c(t)&&this.qc){var i=this.Kc(t);this.iv(i,this.Qc.Rv),this.qc=!Sn()}},t.prototype.Nv=function(t){var i=On(t.touches,e(this.jc));if(null!==i){var n=this.Kc(t,i);this.Jc(n,this.Qc.zv),this.Dc=!0,this.xc=!0}},t.prototype.$c=function(t){return t.sourceCapabilities&&void 0!==t.sourceCapabilities.firesTouchEvents?t.sourceCapabilities.firesTouchEvents:En(t)<this.Ic+500},t.prototype.Jc=function(t,i){i&&i.call(this.Qc,t)},t.prototype.iv=function(t,i){i&&i.call(this.Qc,t)},t.prototype.Kc=function(t,i){var n=i||t,s=this.hv.getBoundingClientRect()||{left:0,top:0};return{Wv:n.clientX,Iv:n.clientY,jv:n.pageX,qv:n.pageY,Uv:n.screenX,Hv:n.screenY,Yv:n.clientX-s.left,$v:n.clientY-s.top,Kv:t.ctrlKey,Xv:t.altKey,Zv:t.shiftKey,Jv:t.metaKey,Gv:!t.type.startsWith("mouse")&&"contextmenu"!==t.type&&"click"!==t.type,Qv:t.type,t_:n.target,i_:t.view,n_:function(){"touchstart"!==t.type&&Bn(t)}}},t}();function An(t,i){var n=t.clientX-i.clientX,s=t.clientY-i.clientY;return Math.sqrt(n*n+s*s)}function Bn(t){t.cancelable&&t.preventDefault()}function Ln(t){return{tt:t.pageX,it:t.pageY}}function En(t){return t.timeStamp||performance.now()}function On(t,i){for(var n=0;n<t.length;++n)if(t[n].identifier===i)return t[n];return null}var Fn=function(){function t(t,i,n,s){this.rh=new zt(200),this.W=0,this.s_="",this.Yh="",this.th=[],this.h_=new Map,this.W=t,this.s_=i,this.Yh=B(t,n,s)}return t.prototype.p=function(){this.rh.ih(),this.th=[],this.h_.clear()},t.prototype.r_=function(t,i,n,s,h){var r=this.e_(t,i);if("left"!==h){var e=bn(t.canvas);n-=Math.floor(r.u_*e)}s-=Math.floor(r.Yt/2),t.drawImage(r.a_,n,s,r.Ht,r.Yt)},t.prototype.e_=function(t,i){var n,s=this;if(this.h_.has(i))n=r(this.h_.get(i));else{if(this.th.length>=200){var h=r(this.th.shift());this.h_.delete(h)}var e=bn(t.canvas),u=Math.ceil(this.W/4.5),a=Math.round(this.W/10),o=Math.ceil(this.rh.Qt(t,i)),l=Ct(Math.round(o+2*u)),f=Ct(this.W+2*u),c=gn(document,new Mn(l,f));n={Gt:i,u_:Math.round(Math.max(1,o)),Ht:Math.ceil(l*e),Yt:Math.ceil(f*e),a_:c},0!==o&&(this.th.push(n.Gt),this.h_.set(n.Gt,n)),j(t=mn(n.a_),e,(function(){t.font=s.Yh,t.fillStyle=s.s_,t.fillText(i,0,f-u-a)}))}return n},t}(),Vn=function(){function t(t,i,n,s){var h=this;this._i=null,this.o_=null,this.l_=!1,this.f_=new zt(50),this.c_=new Fn(11,"#000"),this.s_=null,this.Yh=null,this.v_=0,this.__=!1,this.d_=function(){h.w_(h.cf.R()),h.__||h.Di.M_().jt().Rr()},this.b_=function(){h.__||h.Di.M_().jt().Rr()},this.Di=t,this.zi=i,this.cf=n,this.m_="left"===s,this.g_=document.createElement("div"),this.g_.style.height="100%",this.g_.style.overflow="hidden",this.g_.style.width="25px",this.g_.style.left="0",this.g_.style.position="relative",this.p_=pn(this.g_,new Mn(16,16)),this.p_.subscribeCanvasConfigured(this.d_);var r=this.p_.canvas;r.style.position="absolute",r.style.zIndex="1",r.style.left="0",r.style.top="0",this.y_=pn(this.g_,new Mn(16,16)),this.y_.subscribeCanvasConfigured(this.b_);var e=this.y_.canvas;e.style.position="absolute",e.style.zIndex="2",e.style.left="0",e.style.top="0";var u={Tv:this.k_.bind(this),Cv:this.k_.bind(this),bv:this.x_.bind(this),wv:this.x_.bind(this),Dv:this.N_.bind(this),yv:this.C_.bind(this),gv:this.C_.bind(this),nv:this.S_.bind(this),Gc:this.S_.bind(this),ov:this.T_.bind(this),Rv:this.D_.bind(this)};this.A_=new Dn(this.y_.canvas,u,{_v:function(){return!1},dv:function(){return!0}})}return t.prototype.p=function(){this.A_.p(),this.y_.unsubscribeCanvasConfigured(this.b_),this.y_.destroy(),this.p_.unsubscribeCanvasConfigured(this.d_),this.p_.destroy(),null!==this._i&&this._i._a().M(this),this._i=null,this.c_.p()},t.prototype.B_=function(){return this.g_},t.prototype.ht=function(){return e(this._i).R().borderColor},t.prototype.L_=function(){return this.zi.textColor},t.prototype.S=function(){return this.zi.fontSize},t.prototype.E_=function(){return B(this.S(),this.zi.fontFamily)},t.prototype.O_=function(){var t=this.cf.R(),i=this.s_!==t.A,n=this.Yh!==t.T;return(i||n)&&(this.w_(t),this.s_=t.A),n&&(this.f_.ih(),this.Yh=t.T),t},t.prototype.F_=function(){if(null===this._i)return 0;var t=0,i=this.O_(),n=mn(this.p_.canvas),s=this._i.au();n.font=this.E_(),s.length>0&&(t=Math.max(this.f_.Qt(n,s[0].yu),this.f_.Qt(n,s[s.length-1].yu)));for(var h=this.V_(),r=h.length;r--;){var e=this.f_.Qt(n,h[r].Gt());e>t&&(t=e)}var u=this._i.kt();if(null!==u&&null!==this.o_){var a=this._i.qi(1,u),o=this._i.qi(this.o_.Ft-2,u);t=Math.max(t,this.f_.Qt(n,this._i.Mi(Math.floor(Math.min(a,o))+.11111111111111,u)),this.f_.Qt(n,this._i.Mi(Math.ceil(Math.max(a,o))-.11111111111111,u)))}var l=t||34,f=Math.ceil(i.N+i.C+i.L+i.O+l);return f+=f%2},t.prototype.P_=function(t){if(t.Ot<0||t.Ft<0)throw new Error("Try to set invalid size to PriceAxisWidget "+JSON.stringify(t));null!==this.o_&&this.o_.br(t)||(this.o_=t,this.__=!0,this.p_.resizeCanvas({width:t.Ot,height:t.Ft}),this.y_.resizeCanvas({width:t.Ot,height:t.Ft}),this.__=!1,this.g_.style.width=t.Ot+"px",this.g_.style.height=t.Ft+"px",this.g_.style.minWidth=t.Ot+"px")},t.prototype.R_=function(){return e(this.o_).Ot},t.prototype.Si=function(t){this._i!==t&&(null!==this._i&&this._i._a().M(this),this._i=t,t._a().u(this.Eu.bind(this),this))},t.prototype.Ct=function(){return this._i},t.prototype.ih=function(){var t=this.Di.z_();this.Di.M_().jt().no(t,e(this.Ct()))},t.prototype.W_=function(t){if(null!==this.o_){if(1!==t){var i=mn(this.p_.canvas);this.I_(),this.j_(i,this.p_.pixelRatio),this.Ws(i,this.p_.pixelRatio),this.q_(i,this.p_.pixelRatio),this.U_(i,this.p_.pixelRatio)}var n=mn(this.y_.canvas),s=this.o_.Ot,h=this.o_.Ft;j(n,this.y_.pixelRatio,(function(){n.clearRect(0,0,s,h)})),this.H_(n,this.y_.pixelRatio)}},t.prototype.Y_=function(){return this.p_.canvas},t.prototype.vt=function(){var t;null===(t=this._i)||void 0===t||t.au()},t.prototype.k_=function(t){if(null!==this._i&&!this._i.wi()&&this.Di.M_().R().handleScale.axisPressedMouseMove.price){var i=this.Di.M_().jt(),n=this.Di.z_();this.l_=!0,i.Ka(n,this._i,t.$v)}},t.prototype.x_=function(t){if(null!==this._i&&this.Di.M_().R().handleScale.axisPressedMouseMove.price){var i=this.Di.M_().jt(),n=this.Di.z_(),s=this._i;i.Xa(n,s,t.$v)}},t.prototype.N_=function(){if(null!==this._i&&this.Di.M_().R().handleScale.axisPressedMouseMove.price){var t=this.Di.M_().jt(),i=this.Di.z_(),n=this._i;this.l_&&(this.l_=!1,t.Za(i,n))}},t.prototype.C_=function(t){if(null!==this._i&&this.Di.M_().R().handleScale.axisPressedMouseMove.price){var i=this.Di.M_().jt(),n=this.Di.z_();this.l_=!1,i.Za(n,this._i)}},t.prototype.S_=function(t){this.Di.M_().R().handleScale.axisDoubleClickReset&&this.ih()},t.prototype.T_=function(t){null!==this._i&&(!this.Di.M_().jt().R().handleScale.axisPressedMouseMove.price||this._i.vr()||this._i.Zu()||this.K_(1))},t.prototype.D_=function(t){this.K_(0)},t.prototype.V_=function(){var t=this,i=[],n=null===this._i?void 0:this._i;return function(s){for(var h=0;h<s.length;++h)for(var r=s[h].nn(t.Di.z_(),n),e=0;e<r.length;e++)i.push(r[e])}(this.Di.z_().oa()),i},t.prototype.j_=function(t,i){var n=this;if(null!==this.o_){var s=this.o_.Ot,h=this.o_.Ft;j(t,i,(function(){var i=n.Di.z_().jt(),r=i.Zf(),e=i.Xf();r===e?q(t,0,0,s,h,r):U(t,0,0,s,h,r,e)}))}},t.prototype.Ws=function(t,i){if(null!==this.o_&&null!==this._i&&this._i.R().borderVisible){t.save(),t.fillStyle=this.ht();var n,s=Math.max(1,Math.floor(this.O_().N*i));n=this.m_?Math.floor(this.o_.Ot*i)-s:0,t.fillRect(n,0,s,Math.ceil(this.o_.Ft*i)),t.restore()}},t.prototype.q_=function(t,i){if(null!==this.o_&&null!==this._i){var n=this._i.au();t.save(),t.strokeStyle=this.ht(),t.font=this.E_(),t.fillStyle=this.ht();var s=this.O_(),h=this._i.R().borderVisible&&this._i.R().drawTicks,r=this.m_?Math.floor((this.o_.Ot-s.C)*i-s.N*i):Math.floor(s.N*i),e=this.m_?Math.round(r-s.L*i):Math.round(r+s.C*i+s.L*i),u=this.m_?"right":"left",a=Math.max(1,Math.floor(i)),o=Math.floor(.5*i);if(h){var l=Math.round(s.C*i);t.beginPath();for(var f=0,c=n;f<c.length;f++){var v=c[f];t.rect(r,Math.round(v.su*i)-o,l,a)}t.fill()}t.fillStyle=this.L_();for(var _=0,d=n;_<d.length;_++){v=d[_];this.c_.r_(t,v.yu,e,Math.round(v.su*i),u)}t.restore()}},t.prototype.I_=function(){if(null!==this.o_&&null!==this._i){var t=this.o_.Ft/2,i=[],n=this._i.oa().slice(),s=this.Di.z_(),h=this.O_();this._i===s.fh()&&this.Di.z_().oa().forEach((function(t){s.lh(t)&&n.push(t)}));var r=this._i.Ge()[0],e=this._i;n.forEach((function(n){var h=n.nn(s,e);h.forEach((function(t){t.oi(null),t.li()&&i.push(t)})),r===n&&h.length>0&&(t=h[0].ti())}));var u=i.filter((function(i){return i.ti()<=t})),a=i.filter((function(i){return i.ti()>t}));if(u.sort((function(t,i){return i.ti()-t.ti()})),u.length&&a.length&&a.push(u[0]),a.sort((function(t,i){return t.ti()-i.ti()})),i.forEach((function(t){return t.oi(t.ti())})),this._i.R().alignLabels){for(var o=1;o<u.length;o++){var l=u[o],f=(v=u[o-1]).Yt(h,!1);l.ti()>(_=v.ai())-f&&l.oi(_-f)}for(var c=1;c<a.length;c++){var v,_;l=a[c],f=(v=a[c-1]).Yt(h,!0);l.ti()<(_=v.ai())+f&&l.oi(_+f)}}}},t.prototype.U_=function(t,i){var n=this;if(null!==this.o_){t.save();var s=this.o_,h=this.V_(),r=this.O_(),u=this.m_?"right":"left";h.forEach((function(h){if(h.fi()){var a=h.dt(e(n._i));t.save(),a.H(t,r,n.f_,s.Ot,u,i),t.restore()}})),t.restore()}},t.prototype.H_=function(t,i){var n=this;if(null!==this.o_&&null!==this._i){t.save();var s=this.o_,h=this.Di.M_().jt(),r=[],u=this.Di.z_(),a=h.Tf().nn(u,this._i);a.length&&r.push(a);var o=this.O_(),l=this.m_?"right":"left";r.forEach((function(h){h.forEach((function(h){t.save(),h.dt(e(n._i)).H(t,o,n.f_,s.Ot,l,i),t.restore()}))})),t.restore()}},t.prototype.K_=function(t){this.g_.style.cursor=1===t?"ns-resize":"default"},t.prototype.Eu=function(){var t=this.F_();this.v_<t&&this.Di.M_().jt().Ce(),this.v_=t},t.prototype.w_=function(t){this.c_.p(),this.c_=new Fn(t.S,t.A,t.D)},t}();function Pn(t,i,n,s,h){t.$&&t.$(i,n,s,h)}function Rn(t,i,n,s,h){t.H(i,n,s,h)}function zn(t,i){return t.tn(i)}function Wn(t,i){return void 0!==t.Pe?t.Pe(i):[]}var In=function(){function t(t,i){var n=this;this.o_=new Mn(0,0),this.X_=null,this.Z_=null,this.J_=null,this.G_=!1,this.Q_=new p,this.td=0,this.nd=!1,this.sd=null,this.hd=!1,this.rd=null,this.ed=null,this.__=!1,this.d_=function(){n.__||null===n.ud||n.gi().Rr()},this.b_=function(){n.__||null===n.ud||n.gi().Rr()},this.ad=t,this.ud=i,this.ud.ro().u(this.od.bind(this),this,!0),this.ld=document.createElement("td"),this.ld.style.padding="0",this.ld.style.position="relative";var s=document.createElement("div");s.style.width="100%",s.style.height="100%",s.style.position="relative",s.style.overflow="hidden",this.fd=document.createElement("td"),this.fd.style.padding="0",this.vd=document.createElement("td"),this.vd.style.padding="0",this.ld.appendChild(s),this.p_=pn(s,new Mn(16,16)),this.p_.subscribeCanvasConfigured(this.d_);var h=this.p_.canvas;h.style.position="absolute",h.style.zIndex="1",h.style.left="0",h.style.top="0",this.y_=pn(s,new Mn(16,16)),this.y_.subscribeCanvasConfigured(this.b_);var r=this.y_.canvas;r.style.position="absolute",r.style.zIndex="2",r.style.left="0",r.style.top="0",this._d=document.createElement("tr"),this._d.appendChild(this.fd),this._d.appendChild(this.ld),this._d.appendChild(this.vd),this.dd(),this.A_=new Dn(this.y_.canvas,this,{_v:function(){return null===n.sd&&!n.ad.R().handleScroll.vertTouchDrag},dv:function(){return null===n.sd&&!n.ad.R().handleScroll.horzTouchDrag}})}return t.prototype.p=function(){null!==this.X_&&this.X_.p(),null!==this.Z_&&this.Z_.p(),this.y_.unsubscribeCanvasConfigured(this.b_),this.y_.destroy(),this.p_.unsubscribeCanvasConfigured(this.d_),this.p_.destroy(),null!==this.ud&&this.ud.ro().M(this),this.A_.p()},t.prototype.z_=function(){return e(this.ud)},t.prototype.wd=function(i){null!==this.ud&&this.ud.ro().M(this),this.ud=i,null!==this.ud&&this.ud.ro().u(t.prototype.od.bind(this),this,!0),this.dd()},t.prototype.M_=function(){return this.ad},t.prototype.B_=function(){return this._d},t.prototype.dd=function(){if(null!==this.ud&&(this.Md(),0!==this.gi()._t().length)){if(null!==this.X_){var t=this.ud.Ya();this.X_.Si(e(t))}if(null!==this.Z_){var i=this.ud.$a();this.Z_.Si(e(i))}}},t.prototype.bd=function(){null!==this.X_&&this.X_.vt(),null!==this.Z_&&this.Z_.vt()},t.prototype.Ra=function(){return null!==this.ud?this.ud.Ra():0},t.prototype.za=function(t){this.ud&&this.ud.za(t)},t.prototype.ov=function(t){if(this.ud){this.md();var i=t.Yv,n=t.$v;this.gd(i,n)}},t.prototype.Tv=function(t){this.md(),this.pd(),this.gd(t.Yv,t.$v)},t.prototype.lv=function(t){if(this.ud){this.md();var i=t.Yv,n=t.$v;this.gd(i,n);var s=this.$h(i,n);this.gi().yf(s&&{kf:s.kf,yd:s.yd})}},t.prototype.kv=function(t){if(null!==this.ud){this.md();var i=t.Yv,n=t.$v;if(this.Q_.g()){var s=this.gi().Tf().Mt();this.Q_.m(s,{x:i,y:n})}}},t.prototype.bv=function(t){this.md(),this.kd(t),this.gd(t.Yv,t.$v)},t.prototype.yv=function(t){null!==this.ud&&(this.md(),this.nd=!1,this.xd(t))},t.prototype.zv=function(t){if(this.nd=!0,null===this.sd){var i={x:t.Yv,y:t.$v};this.Nd(i,i)}},t.prototype.Rv=function(t){null!==this.ud&&(this.md(),this.ud.jt().yf(null),this.Cd())},t.prototype.Sd=function(){return this.Q_},t.prototype.Lv=function(){this.td=1,this.Td()},t.prototype.Ev=function(t,i){if(this.ad.R().handleScale.pinch){var n=5*(i-this.td);this.td=i,this.gi().Ef(t.tt,n)}},t.prototype.Cv=function(t){if(this.nd=!1,this.hd=null!==this.sd,this.pd(),null!==this.sd){var i=this.gi().Tf();this.rd={x:i.$t(),y:i.Kt()},this.sd={x:t.Yv,y:t.$v}}},t.prototype.wv=function(t){if(null!==this.ud){var i=t.Yv,n=t.$v;if(null===this.sd)this.kd(t);else{this.hd=!1;var s=e(this.rd),h=s.x+(i-this.sd.x),r=s.y+(n-this.sd.y);this.gd(h,r)}}},t.prototype.gv=function(t){0===this.M_().R().trackingMode.exitMode&&(this.hd=!0),this.Dd(),this.xd(t)},t.prototype.$h=function(t,i){var n=this.ud;if(null===n)return null;for(var s=0,h=n.oa();s<h.length;s++){var r=h[s],e=this.Ad(r.tn(n),t,i);if(null!==e)return{kf:r,i_:e.i_,yd:e.yd}}return null},t.prototype.Bd=function(t,i){e("left"===i?this.X_:this.Z_).P_(new Mn(t,this.o_.Ft))},t.prototype.Ld=function(){return this.o_},t.prototype.P_=function(t){if(t.Ot<0||t.Ft<0)throw new Error("Try to set invalid size to PaneWidget "+JSON.stringify(t));this.o_.br(t)||(this.o_=t,this.__=!0,this.p_.resizeCanvas({width:t.Ot,height:t.Ft}),this.y_.resizeCanvas({width:t.Ot,height:t.Ft}),this.__=!1,this.ld.style.width=t.Ot+"px",this.ld.style.height=t.Ft+"px")},t.prototype.Ed=function(){var t=e(this.ud);t.Ha(t.Ya()),t.Ha(t.$a());for(var i=0,n=t.Ge();i<n.length;i++){var s=n[i];if(t.lh(s)){var h=s.Ct();null!==h&&t.Ha(h),s.hn()}}},t.prototype.Y_=function(){return this.p_.canvas},t.prototype.W_=function(t){if(0!==t&&null!==this.ud){if(t>1&&this.Ed(),null!==this.X_&&this.X_.W_(t),null!==this.Z_&&this.Z_.W_(t),1!==t){var i=mn(this.p_.canvas);i.save(),this.j_(i,this.p_.pixelRatio),this.ud&&(this.Od(i,this.p_.pixelRatio),this.Fd(i,this.p_.pixelRatio),this.Vd(i,this.p_.pixelRatio,zn)),i.restore()}var n=mn(this.y_.canvas);n.clearRect(0,0,Math.ceil(this.o_.Ot*this.y_.pixelRatio),Math.ceil(this.o_.Ft*this.y_.pixelRatio)),this.Vd(n,this.p_.pixelRatio,Wn),this.Pd(n,this.y_.pixelRatio)}},t.prototype.Rd=function(){return this.X_},t.prototype.zd=function(){return this.Z_},t.prototype.od=function(){null!==this.ud&&this.ud.ro().M(this),this.ud=null},t.prototype.j_=function(t,i){var n=this;j(t,i,(function(){var i=n.gi(),s=i.Zf(),h=i.Xf();s===h?q(t,0,0,n.o_.Ot,n.o_.Ft,h):U(t,0,0,n.o_.Ot,n.o_.Ft,s,h)}))},t.prototype.Od=function(t,i){var n=e(this.ud),s=n.eo().ou().dt(n.Yt(),n.Ht());null!==s&&(t.save(),s.H(t,i,!1),t.restore())},t.prototype.Fd=function(t,i){var n=this.gi().Sf();this.Wd(t,i,zn,Pn,n),this.Wd(t,i,zn,Rn,n)},t.prototype.Pd=function(t,i){this.Wd(t,i,zn,Rn,this.gi().Tf())},t.prototype.Vd=function(t,i,n){for(var s=e(this.ud).oa(),h=0,r=s;h<r.length;h++){var u=r[h];this.Wd(t,i,n,Pn,u)}for(var a=0,o=s;a<o.length;a++){u=o[a];this.Wd(t,i,n,Rn,u)}},t.prototype.Wd=function(t,i,n,s,h){for(var r=e(this.ud),u=n(h,r),a=r.Yt(),o=r.Ht(),l=r.jt().pf(),f=null!==l&&l.kf===h,c=null!==l&&f&&void 0!==l.yd?l.yd.Kh:void 0,v=0,_=u;v<_.length;v++){var d=_[v].dt(a,o);null!==d&&(t.save(),s(d,t,i,f,c),t.restore())}},t.prototype.Ad=function(t,i,n){for(var s=0,h=t;s<h.length;s++){var r=h[s],e=r.dt(this.o_.Ft,this.o_.Ot);if(null!==e&&e.$h){var u=e.$h(i,n);if(null!==u)return{i_:r,yd:u}}}return null},t.prototype.Md=function(){if(null!==this.ud){var t=this.ad,i=this.ud.Ya().R().visible,n=this.ud.$a().R().visible;i||null===this.X_||(this.fd.removeChild(this.X_.B_()),this.X_.p(),this.X_=null),n||null===this.Z_||(this.vd.removeChild(this.Z_.B_()),this.Z_.p(),this.Z_=null);var s=t.jt().qf();i&&null===this.X_&&(this.X_=new Vn(this,t.R().layout,s,"left"),this.fd.appendChild(this.X_.B_())),n&&null===this.Z_&&(this.Z_=new Vn(this,t.R().layout,s,"right"),this.vd.appendChild(this.Z_.B_()))}},t.prototype.Id=function(t){return t.Gv&&this.nd||null!==this.sd},t.prototype.jd=function(t){return Math.max(0,Math.min(t,this.o_.Ot-1))},t.prototype.qd=function(t){return Math.max(0,Math.min(t,this.o_.Ft-1))},t.prototype.gd=function(t,i){this.gi().Wf(this.jd(t),this.qd(i),e(this.ud))},t.prototype.Cd=function(){this.gi().If()},t.prototype.Dd=function(){this.hd&&(this.sd=null,this.Cd())},t.prototype.Nd=function(t,i){this.sd=t,this.hd=!1,this.gd(i.x,i.y);var n=this.gi().Tf();this.rd={x:n.$t(),y:n.Kt()}},t.prototype.gi=function(){return this.ad.jt()},t.prototype.Ud=function(){var t=this.gi(),i=this.z_(),n=i.ji();t.Qa(i,n),t.Pf(),this.J_=null,this.G_=!1},t.prototype.xd=function(t){var i=this;if(this.G_){var n=performance.now();if(null!==this.ed&&this.ed.Nh(t.Yv,n),null===this.ed||this.ed.cc(n))this.Ud();else{var s=this.gi(),h=s.bt(),r=this.ed,e=function(){if(!r._c()){var t=performance.now(),n=r.cc(t);if(!r._c()){var u=h.xl();s.Vf(r.fc(t)),u===h.xl()&&(n=!0,i.ed=null)}n?i.Ud():requestAnimationFrame(e)}};requestAnimationFrame(e)}}},t.prototype.md=function(){this.sd=null},t.prototype.pd=function(){if(this.ud){if(this.Td(),document.activeElement!==document.body&&document.activeElement!==document.documentElement)e(document.activeElement).blur();else{var t=document.getSelection();null!==t&&t.removeAllRanges()}!this.ud.ji().wi()&&this.gi().bt().wi()}},t.prototype.kd=function(t){if(null!==this.ud){var i=this.gi();if(!i.bt().wi()){var n=this.ad.R(),s=n.handleScroll,h=n.kineticScroll;if(s.pressedMouseMove&&!t.Gv||(s.horzTouchDrag||s.vertTouchDrag)&&t.Gv){var r=this.ud.ji(),e=performance.now();null!==this.J_||this.Id(t)||(this.J_={x:t.Wv,y:t.Iv,So:e,Yv:t.Yv,$v:t.$v}),null!==this.ed&&this.ed.lc(t.Yv,e),null===this.J_||this.G_||this.J_.x===t.Wv&&this.J_.y===t.Iv||(null===this.ed&&(t.Gv&&h.touch||!t.Gv&&h.mouse)&&(this.ed=new xn(.2,7,.997,15),this.ed.lc(this.J_.Yv,this.J_.So),this.ed.lc(t.Yv,e)),r.wi()||i.Ja(this.ud,r,t.$v),i.Ff(t.Yv),this.G_=!0),this.G_&&(r.wi()||i.Ga(this.ud,r,t.$v),i.Vf(t.Yv))}}}},t.prototype.Td=function(){var t=performance.now(),i=null===this.ed||this.ed.cc(t);null!==this.ed&&(i||this.Ud()),null!==this.ed&&(this.ed.dc(),this.ed=null)},t}(),jn=function(){function t(t,i,n,s,h){var r=this;this.ft=!0,this.o_=new Mn(0,0),this.d_=function(){return r.W_(3)},this.m_="left"===t,this.cf=n.qf,this.zi=i,this.Hd=s,this.Yd=h,this.g_=document.createElement("div"),this.g_.style.width="25px",this.g_.style.height="100%",this.g_.style.overflow="hidden",this.p_=pn(this.g_,new Mn(16,16)),this.p_.subscribeCanvasConfigured(this.d_)}return t.prototype.p=function(){this.p_.unsubscribeCanvasConfigured(this.d_),this.p_.destroy()},t.prototype.B_=function(){return this.g_},t.prototype.Ld=function(){return this.o_},t.prototype.P_=function(t){if(t.Ot<0||t.Ft<0)throw new Error("Try to set invalid size to PriceAxisStub "+JSON.stringify(t));this.o_.br(t)||(this.o_=t,this.p_.resizeCanvas({width:t.Ot,height:t.Ft}),this.g_.style.width="".concat(t.Ot,"px"),this.g_.style.minWidth="".concat(t.Ot,"px"),this.g_.style.height="".concat(t.Ft,"px"),this.ft=!0)},t.prototype.W_=function(t){if((!(t<3)||this.ft)&&0!==this.o_.Ot&&0!==this.o_.Ft){this.ft=!1;var i=mn(this.p_.canvas);this.j_(i,this.p_.pixelRatio),this.Ws(i,this.p_.pixelRatio)}},t.prototype.Y_=function(){return this.p_.canvas},t.prototype.Ws=function(t,i){if(this.Hd()){var n=this.o_.Ot;t.save(),t.fillStyle=this.zi.timeScale.borderColor;var s=Math.floor(this.cf.R().N*i),h=this.m_?Math.round(n*i)-s:0;t.fillRect(h,0,s,s),t.restore()}},t.prototype.j_=function(t,i){var n=this;j(t,i,(function(){q(t,0,0,n.o_.Ot,n.o_.Ft,n.Yd())}))},t}();function qn(t,i){return t.Po>i.Po?t:i}var Un=function(){function t(t){var i=this;this.$d=null,this.Kd=null,this.k=null,this.Xd=!1,this.o_=new Mn(0,0),this.Zd=new p,this.f_=new zt(5),this.__=!1,this.d_=function(){i.__||i.ad.jt().Rr()},this.b_=function(){i.__||i.ad.jt().Rr()},this.ad=t,this.zi=t.R().layout,this.Jd=document.createElement("tr"),this.Gd=document.createElement("td"),this.Gd.style.padding="0",this.Qd=document.createElement("td"),this.Qd.style.padding="0",this.g_=document.createElement("td"),this.g_.style.height="25px",this.g_.style.padding="0",this.tw=document.createElement("div"),this.tw.style.width="100%",this.tw.style.height="100%",this.tw.style.position="relative",this.tw.style.overflow="hidden",this.g_.appendChild(this.tw),this.p_=pn(this.tw,new Mn(16,16)),this.p_.subscribeCanvasConfigured(this.d_);var n=this.p_.canvas;n.style.position="absolute",n.style.zIndex="1",n.style.left="0",n.style.top="0",this.y_=pn(this.tw,new Mn(16,16)),this.y_.subscribeCanvasConfigured(this.b_);var s=this.y_.canvas;s.style.position="absolute",s.style.zIndex="2",s.style.left="0",s.style.top="0",this.Jd.appendChild(this.Gd),this.Jd.appendChild(this.g_),this.Jd.appendChild(this.Qd),this.iw(),this.ad.jt().Pa().u(this.iw.bind(this),this),this.A_=new Dn(this.y_.canvas,this,{_v:function(){return!0},dv:function(){return!1}})}return t.prototype.p=function(){this.A_.p(),null!==this.$d&&this.$d.p(),null!==this.Kd&&this.Kd.p(),this.y_.unsubscribeCanvasConfigured(this.b_),this.y_.destroy(),this.p_.unsubscribeCanvasConfigured(this.d_),this.p_.destroy()},t.prototype.B_=function(){return this.Jd},t.prototype.nw=function(){return this.$d},t.prototype.sw=function(){return this.Kd},t.prototype.Tv=function(t){if(!this.Xd){this.Xd=!0;var i=this.ad.jt();!i.bt().wi()&&this.ad.R().handleScale.axisPressedMouseMove.time&&i.Lf(t.Yv)}},t.prototype.Cv=function(t){this.Tv(t)},t.prototype.Dv=function(){var t=this.ad.jt();!t.bt().wi()&&this.Xd&&(this.Xd=!1,this.ad.R().handleScale.axisPressedMouseMove.time&&t.zf())},t.prototype.bv=function(t){var i=this.ad.jt();!i.bt().wi()&&this.ad.R().handleScale.axisPressedMouseMove.time&&i.Rf(t.Yv)},t.prototype.wv=function(t){this.bv(t)},t.prototype.yv=function(){this.Xd=!1;var t=this.ad.jt();t.bt().wi()&&!this.ad.R().handleScale.axisPressedMouseMove.time||t.zf()},t.prototype.gv=function(){this.yv()},t.prototype.nv=function(){this.ad.R().handleScale.axisDoubleClickReset&&this.ad.jt().gn()},t.prototype.Gc=function(){this.nv()},t.prototype.ov=function(){this.ad.jt().R().handleScale.axisPressedMouseMove.time&&this.K_(1)},t.prototype.Rv=function(){this.K_(0)},t.prototype.Ld=function(){return this.o_},t.prototype.hw=function(){return this.Zd},t.prototype.rw=function(t,i,n){this.o_&&this.o_.br(t)||(this.o_=t,this.__=!0,this.p_.resizeCanvas({width:t.Ot,height:t.Ft}),this.y_.resizeCanvas({width:t.Ot,height:t.Ft}),this.__=!1,this.g_.style.width=t.Ot+"px",this.g_.style.height=t.Ft+"px",this.Zd.m(t)),null!==this.$d&&this.$d.P_(new Mn(i,t.Ft)),null!==this.Kd&&this.Kd.P_(new Mn(n,t.Ft))},t.prototype.ew=function(){var t=this.uw();return Math.ceil(t.N+t.C+t.S+t.F+t.B)},t.prototype.vt=function(){this.ad.jt().bt().au()},t.prototype.Y_=function(){return this.p_.canvas},t.prototype.W_=function(t){if(0!==t){if(1!==t){var i=mn(this.p_.canvas);this.j_(i,this.p_.pixelRatio),this.Ws(i,this.p_.pixelRatio),this.q_(i,this.p_.pixelRatio),null!==this.$d&&this.$d.W_(t),null!==this.Kd&&this.Kd.W_(t)}var n=mn(this.y_.canvas),s=this.y_.pixelRatio;n.clearRect(0,0,Math.ceil(this.o_.Ot*s),Math.ceil(this.o_.Ft*s)),this.aw([this.ad.jt().Tf()],n,s)}},t.prototype.j_=function(t,i){var n=this;j(t,i,(function(){q(t,0,0,n.o_.Ot,n.o_.Ft,n.ad.jt().Xf())}))},t.prototype.Ws=function(t,i){if(this.ad.R().timeScale.borderVisible){t.save(),t.fillStyle=this.ow();var n=Math.max(1,Math.floor(this.uw().N*i));t.fillRect(0,0,Math.ceil(this.o_.Ot*i),n),t.restore()}},t.prototype.q_=function(t,i){var n=this,s=this.ad.jt().bt().au();if(s&&0!==s.length){var h=s.reduce(qn,s[0]).Po;h>30&&h<50&&(h=30),t.save(),t.strokeStyle=this.ow();var r=this.uw(),e=r.N+r.C+r.F+r.S-r.V;t.textAlign="center",t.fillStyle=this.ow();var u=Math.floor(this.uw().N*i),a=Math.max(1,Math.floor(i)),o=Math.floor(.5*i);if(this.ad.jt().bt().R().borderVisible){t.beginPath();for(var l=Math.round(r.C*i),f=s.length;f--;){var c=Math.round(s[f].su*i);t.rect(c-o,u,a,l)}t.fill()}t.fillStyle=this.j(),j(t,i,(function(){t.font=n.lw();for(var i=0,r=s;i<r.length;i++){if((l=r[i]).Po<h){var u=l.Sl?n.fw(t,l.su,l.yu):l.su;t.fillText(l.yu,u,e)}}t.font=n.cw();for(var a=0,o=s;a<o.length;a++){var l;if((l=o[a]).Po>=h){u=l.Sl?n.fw(t,l.su,l.yu):l.su;t.fillText(l.yu,u,e)}}})),t.restore()}},t.prototype.fw=function(t,i,n){var s=this.f_.Qt(t,n),h=s/2,r=Math.floor(i-h)+.5;return r<0?i+=Math.abs(0-r):r+s>this.o_.Ot&&(i-=Math.abs(this.o_.Ot-(r+s))),i},t.prototype.aw=function(t,i,n){for(var s=this.uw(),h=0,r=t;h<r.length;h++)for(var e=0,u=r[h].Ti();e<u.length;e++){var a=u[e];i.save(),a.dt().H(i,s,n),i.restore()}},t.prototype.ow=function(){return this.ad.R().timeScale.borderColor},t.prototype.j=function(){return this.zi.textColor},t.prototype.W=function(){return this.zi.fontSize},t.prototype.lw=function(){return B(this.W(),this.zi.fontFamily)},t.prototype.cw=function(){return B(this.W(),this.zi.fontFamily,"bold")},t.prototype.uw=function(){null===this.k&&(this.k={N:1,V:NaN,F:NaN,B:NaN,mi:NaN,C:3,S:NaN,T:"",bi:new zt});var t=this.k,i=this.lw();if(t.T!==i){var n=this.W();t.S=n,t.T=i,t.F=Math.ceil(n/2.5),t.B=t.F,t.mi=Math.ceil(n/2),t.V=Math.round(this.W()/5),t.bi.ih()}return this.k},t.prototype.K_=function(t){this.g_.style.cursor=1===t?"ew-resize":"default"},t.prototype.iw=function(){var t=this.ad.jt(),i=t.R();i.leftPriceScale.visible||null===this.$d||(this.Gd.removeChild(this.$d.B_()),this.$d.p(),this.$d=null),i.rightPriceScale.visible||null===this.Kd||(this.Qd.removeChild(this.Kd.B_()),this.Kd.p(),this.Kd=null);var n={qf:this.ad.jt().qf()},s=function(){return i.leftPriceScale.borderVisible&&t.bt().R().borderVisible},h=function(){return t.Xf()};i.leftPriceScale.visible&&null===this.$d&&(this.$d=new jn("left",i,n,s,h),this.Gd.appendChild(this.$d.B_())),i.rightPriceScale.visible&&null===this.Kd&&(this.Kd=new jn("right",i,n,s,h),this.Qd.appendChild(this.Kd.B_()))},t}(),Hn=function(){function t(t,i){var n;this._w=[],this.dw=0,this.Nu=0,this.hh=0,this.ww=0,this.Mw=0,this.bw=null,this.mw=!1,this.Q_=new p,this.af=new p,this.zi=i,this.Jd=document.createElement("div"),this.Jd.classList.add("tv-lightweight-charts"),this.Jd.style.overflow="hidden",this.Jd.style.width="100%",this.Jd.style.height="100%",(n=this.Jd).style.userSelect="none",n.style.webkitUserSelect="none",n.style.msUserSelect="none",n.style.MozUserSelect="none",n.style.webkitTapHighlightColor="transparent",this.gw=document.createElement("table"),this.gw.setAttribute("cellspacing","0"),this.Jd.appendChild(this.gw),this.pw=this.yw.bind(this),this.Jd.addEventListener("wheel",this.pw,{passive:!1}),this.gi=new fn(this.ff.bind(this),this.zi),this.jt().Df().u(this.kw.bind(this),this),this.xw=new Un(this),this.gw.appendChild(this.xw.B_());var s=this.zi.width,h=this.zi.height;if(0===s||0===h){var r=t.getBoundingClientRect();0===s&&(s=Math.floor(r.width),s-=s%2),0===h&&(h=Math.floor(r.height),h-=h%2)}this.Nw(s,h),this.Cw(),t.appendChild(this.Jd),this.Sw(),this.gi.bt().Pl().u(this.gi.Ce.bind(this.gi),this),this.gi.Pa().u(this.gi.Ce.bind(this.gi),this)}return t.prototype.jt=function(){return this.gi},t.prototype.R=function(){return this.zi},t.prototype.Tw=function(){return this._w},t.prototype.Dw=function(){return this.xw},t.prototype.p=function(){this.Jd.removeEventListener("wheel",this.pw),0!==this.dw&&window.cancelAnimationFrame(this.dw),this.gi.Df().M(this),this.gi.bt().Pl().M(this),this.gi.Pa().M(this),this.gi.p();for(var t=0,i=this._w;t<i.length;t++){var n=i[t];this.gw.removeChild(n.B_()),n.Sd().M(this),n.p()}this._w=[],e(this.xw).p(),null!==this.Jd.parentElement&&this.Jd.parentElement.removeChild(this.Jd),this.af.p(),this.Q_.p()},t.prototype.Nw=function(t,i,n){if(void 0===n&&(n=!1),this.Nu!==i||this.hh!==t){this.Nu=i,this.hh=t;var s=i+"px",h=t+"px";e(this.Jd).style.height=s,e(this.Jd).style.width=h,this.gw.style.height=s,this.gw.style.width=h,n?this.Aw(new it(3)):this.gi.Ce()}},t.prototype.W_=function(t){void 0===t&&(t=new it(3));for(var i=0;i<this._w.length;i++)this._w[i].W_(t.wn(i).vn);this.zi.timeScale.visible&&this.xw.W_(t.dn())},t.prototype.Pr=function(t){this.gi.Pr(t),this.Sw();var i=t.width||this.hh,n=t.height||this.Nu;this.Nw(i,n)},t.prototype.Sd=function(){return this.Q_},t.prototype.Df=function(){return this.af},t.prototype.Bw=function(){var t=this;null!==this.bw&&(this.Aw(this.bw),this.bw=null);var i=this._w[0],n=gn(document,new Mn(this.hh,this.Nu)),s=mn(n),h=bn(n);return j(s,h,(function(){var n=0,h=0,r=function(i){for(var r=0;r<t._w.length;r++){var u=t._w[r],a=u.Ld().Ft,o=e("left"===i?u.Rd():u.zd()),l=o.Y_();s.drawImage(l,n,h,o.R_(),a),h+=a}};t.Lw()&&(r("left"),n=e(i.Rd()).R_()),h=0;for(var u=0;u<t._w.length;u++){var a=t._w[u],o=a.Ld(),l=a.Y_();s.drawImage(l,n,h,o.Ot,o.Ft),h+=o.Ft}n+=i.Ld().Ot,t.Ew()&&(h=0,r("right"));var f=function(i){var r=e("left"===i?t.xw.nw():t.xw.sw()),u=r.Ld(),a=r.Y_();s.drawImage(a,n,h,u.Ot,u.Ft)};if(t.zi.timeScale.visible){n=0,t.Lw()&&(f("left"),n=e(i.Rd()).R_());var c=t.xw.Ld();l=t.xw.Y_();s.drawImage(l,n,h,c.Ot,c.Ft),t.Ew()&&(n+=i.Ld().Ot,f("right"),s.restore())}})),n},t.prototype.Ow=function(t){return"none"===t?0:("left"!==t||this.Lw())&&("right"!==t||this.Ew())?0===this._w.length?0:e("left"===t?this._w[0].Rd():this._w[0].zd()).R_():0},t.prototype.Fw=function(){for(var t=0,i=0,n=0,s=0,h=this._w;s<h.length;s++){var r=h[s];this.Lw()&&(i=Math.max(i,e(r.Rd()).F_())),this.Ew()&&(n=Math.max(n,e(r.zd()).F_())),t+=r.Ra()}var u=this.hh,a=this.Nu,o=Math.max(u-i-n,0),l=this.zi.timeScale.visible,f=l?this.xw.ew():0;f%2&&(f+=1);for(var c=0+f,v=a<c?0:a-c,_=v/t,d=0,w=0;w<this._w.length;++w){(r=this._w[w]).wd(this.gi.Cf()[w]);var M,b=0;b=w===this._w.length-1?v-d:Math.round(r.Ra()*_),d+=M=Math.max(b,2),r.P_(new Mn(o,M)),this.Lw()&&r.Bd(i,"left"),this.Ew()&&r.Bd(n,"right"),r.z_()&&this.gi.Af(r.z_(),M)}this.xw.rw(new Mn(l?o:0,f),l?i:0,l?n:0),this.gi.Wa(o),this.ww!==i&&(this.ww=i),this.Mw!==n&&(this.Mw=n)},t.prototype.yw=function(t){var i=t.deltaX/100,n=-t.deltaY/100;if(0!==i&&this.zi.handleScroll.mouseWheel||0!==n&&this.zi.handleScale.mouseWheel){switch(t.cancelable&&t.preventDefault(),t.deltaMode){case t.DOM_DELTA_PAGE:i*=120,n*=120;break;case t.DOM_DELTA_LINE:i*=32,n*=32}if(0!==n&&this.zi.handleScale.mouseWheel){var s=Math.sign(n)*Math.min(1,Math.abs(n)),h=t.clientX-this.Jd.getBoundingClientRect().left;this.jt().Ef(h,s)}0!==i&&this.zi.handleScroll.mouseWheel&&this.jt().Of(-80*i)}},t.prototype.Aw=function(t){var i,n=t.dn();3===n&&this.Vw(),3!==n&&2!==n||(this.Pw(t),this.Rw(t),this.xw.vt(),this._w.forEach((function(t){t.bd()})),3===(null===(i=this.bw)||void 0===i?void 0:i.dn())&&(this.bw.xn(t),this.Vw(),this.Pw(this.bw),this.Rw(this.bw),t=this.bw,this.bw=null)),this.W_(t)},t.prototype.Rw=function(t){for(var i=0,n=t.kn();i<n.length;i++){var s=n[i];this.Nn(s)}},t.prototype.Pw=function(t){for(var i=this.gi.Cf(),n=0;n<i.length;n++)t.wn(n)._n&&i[n].so()},t.prototype.Nn=function(t){var i=this.gi.bt();switch(t.bn){case 0:i.zl();break;case 1:i.Wl(t.St);break;case 2:i.pn(t.St);break;case 3:i.yn(t.St);break;case 4:i.Tl()}},t.prototype.ff=function(t){var i=this;null!==this.bw?this.bw.xn(t):this.bw=t,this.mw||(this.mw=!0,this.dw=window.requestAnimationFrame((function(){if(i.mw=!1,i.dw=0,null!==i.bw){var t=i.bw;i.bw=null,i.Aw(t)}})))},t.prototype.Vw=function(){this.Cw()},t.prototype.Cw=function(){for(var t=this.gi.Cf(),i=t.length,n=this._w.length,s=i;s<n;s++){var h=r(this._w.pop());this.gw.removeChild(h.B_()),h.Sd().M(this),h.p()}for(s=n;s<i;s++){(h=new In(this,t[s])).Sd().u(this.zw.bind(this),this),this._w.push(h),this.gw.insertBefore(h.B_(),this.xw.B_())}for(s=0;s<i;s++){var e=t[s];(h=this._w[s]).z_()!==e?h.wd(e):h.dd()}this.Sw(),this.Fw()},t.prototype.Ww=function(t,i){var n,s=new Map;null!==t&&this.gi._t().forEach((function(i){var n=i.er(t);null!==n&&s.set(i,n)}));if(null!==t){var h=this.gi.bt().pi(t);null!==h&&(n=h)}var r=this.jt().pf(),e=null!==r&&r.kf instanceof pi?r.kf:void 0,u=null!==r&&void 0!==r.yd?r.yd.Zh:void 0;return{rt:n,Iw:i||void 0,jw:e,qw:s,Uw:u}},t.prototype.zw=function(t,i){var n=this;this.Q_.m((function(){return n.Ww(t,i)}))},t.prototype.kw=function(t,i){var n=this;this.af.m((function(){return n.Ww(t,i)}))},t.prototype.Sw=function(){var t=this.zi.timeScale.visible?"":"none";this.xw.B_().style.display=t},t.prototype.Lw=function(){return this._w[0].z_().Ya().R().visible},t.prototype.Ew=function(){return this._w[0].z_().$a().R().visible},t}();function Yn(t,i,n){var s=n.value;return{vs:i,rt:t,St:[s,s,s,s]}}function $n(t,i,n){var s=n.value,h={vs:i,rt:t,St:[s,s,s,s]};return"color"in n&&void 0!==n.color&&(h.A=n.color),h}function Kn(t){return void 0!==t.St}function Xn(t){return function(i,n,s){return void 0===(h=s).open&&void 0===h.value?{rt:i,vs:n}:t(i,n,s);var h}}var Zn={Candlestick:Xn((function(t,i,n){var s={vs:i,rt:t,St:[n.open,n.high,n.low,n.close]};return"color"in n&&void 0!==n.color&&(s.A=n.color),"borderColor"in n&&void 0!==n.borderColor&&(s.Tt=n.borderColor),"wickColor"in n&&void 0!==n.wickColor&&(s.qs=n.wickColor),s})),Bar:Xn((function(t,i,n){var s={vs:i,rt:t,St:[n.open,n.high,n.low,n.close]};return"color"in n&&void 0!==n.color&&(s.A=n.color),s})),Area:Xn(Yn),Baseline:Xn(Yn),Histogram:Xn($n),Line:Xn($n)};function Jn(t){return Zn[t]}function Gn(t){return 60*t*60*1e3}function Qn(t){return 60*t*1e3}var ts,is=[{Hw:(ts=1,1e3*ts),Po:10},{Hw:Qn(1),Po:20},{Hw:Qn(5),Po:21},{Hw:Qn(30),Po:22},{Hw:Gn(1),Po:30},{Hw:Gn(3),Po:31},{Hw:Gn(6),Po:32},{Hw:Gn(12),Po:33}];function ns(t,i){if(t.getUTCFullYear()!==i.getUTCFullYear())return 70;if(t.getUTCMonth()!==i.getUTCMonth())return 60;if(t.getUTCDate()!==i.getUTCDate())return 50;for(var n=is.length-1;n>=0;--n)if(Math.floor(i.getTime()/is[n].Hw)!==Math.floor(t.getTime()/is[n].Hw))return is[n].Po;return 0}function ss(t,i){if(void 0===i&&(i=0),0!==t.length){for(var n=0===i?null:t[i-1].rt.So,s=null!==n?new Date(1e3*n):null,h=0,r=i;r<t.length;++r){var e=t[r],u=new Date(1e3*e.rt.So);null!==s&&(e.Vo=ns(u,s)),h+=e.rt.So-(n||e.rt.So),n=e.rt.So,s=u}if(0===i&&t.length>1){var a=Math.ceil(h/(t.length-1)),o=new Date(1e3*(t[0].rt.So-a));t[0].Vo=ns(new Date(1e3*t[0].rt.So),o)}}}function hs(t){if(!vn(t))throw new Error("time must be of type BusinessDay");var i=new Date(Date.UTC(t.year,t.month-1,t.day,0,0,0,0));return{So:Math.round(i.getTime()/1e3),Co:t}}function rs(t){if(!_n(t))throw new Error("time must be of type isUTCTimestamp");return{So:t}}function es(t){return 0===t.length?null:vn(t[0].time)?hs:rs}function us(t){return _n(t)?rs(t):vn(t)?hs(t):hs(as(t))}function as(t){var i=new Date(t);if(isNaN(i.getTime()))throw new Error("Invalid date string=".concat(t,", expected format=yyyy-mm-dd"));return{day:i.getUTCDate(),month:i.getUTCMonth()+1,year:i.getUTCFullYear()}}function os(t){N(t.time)&&(t.time=as(t.time))}function ls(t){return{vs:0,Yw:new Map,Ve:t}}function fs(t){if(void 0!==t&&0!==t.length)return{$w:t[0].rt.So,Kw:t[t.length-1].rt.So}}var cs=function(){function t(){this.Xw=new Map,this.Zw=new Map,this.Jw=new Map,this.Gw=[]}return t.prototype.p=function(){this.Xw.clear(),this.Zw.clear(),this.Jw.clear(),this.Gw=[]},t.prototype.Qw=function(t,i){var n=this,s=0!==this.Xw.size,h=!1,r=this.Zw.get(t);if(void 0!==r)if(1===this.Zw.size)s=!1,h=!0,this.Xw.clear();else for(var u=0,a=this.Gw;u<a.length;u++){a[u].pointData.Yw.delete(t)&&(h=!0)}var o=[];if(0!==i.length){!function(t){t.forEach(os)}(i);var l=e(es(i)),f=Jn(t.Wr());o=i.map((function(i){var s=l(i.time),r=n.Xw.get(s.So);void 0===r&&(r=ls(s),n.Xw.set(s.So,r),h=!0);var e=f(s,r.vs,i);return r.Yw.set(t,e),e}))}s&&this.tM(),this.iM(t,o);var c=-1;if(h){var v=[];this.Xw.forEach((function(t){v.push({Vo:0,rt:t.Ve,pointData:t})})),v.sort((function(t,i){return t.rt.So-i.rt.So})),c=this.nM(v)}return this.sM(t,c,function(t,i){var n=fs(t),s=fs(i);if(void 0!==n&&void 0!==s)return{Ae:n.Kw>=s.Kw&&n.$w>=s.$w}}(this.Zw.get(t),r))},t.prototype.Yf=function(t){return this.Qw(t,[])},t.prototype.hM=function(t,i){os(i);var n=e(es([i]))(i.time),s=this.Jw.get(t);if(void 0!==s&&n.So<s.So)throw new Error("Cannot update oldest data, last time=".concat(s.So,", new time=").concat(n.So));var h=this.Xw.get(n.So),r=void 0===h;void 0===h&&(h=ls(n),this.Xw.set(n.So,h));var u=Jn(t.Wr())(n,h.vs,i);h.Yw.set(t,u),this.rM(t,u);var a={Ae:Kn(u)};if(!r)return this.sM(t,-1,a);var o={Vo:0,rt:h.Ve,pointData:h},l=ct(this.Gw,o.rt.So,(function(t,i){return t.rt.So<i}));this.Gw.splice(l,0,o);for(var f=l;f<this.Gw.length;++f)vs(this.Gw[f].pointData,f);return ss(this.Gw,l),this.sM(t,l,a)},t.prototype.rM=function(t,i){var n=this.Zw.get(t);void 0===n&&(n=[],this.Zw.set(t,n));var s=0!==n.length?n[n.length-1]:null;null===s||i.rt.So>s.rt.So?Kn(i)&&n.push(i):Kn(i)?n[n.length-1]=i:n.splice(-1,1),this.Jw.set(t,i.rt)},t.prototype.iM=function(t,i){0!==i.length?(this.Zw.set(t,i.filter(Kn)),this.Jw.set(t,i[i.length-1].rt)):(this.Zw.delete(t),this.Jw.delete(t))},t.prototype.tM=function(){for(var t=0,i=this.Gw;t<i.length;t++){var n=i[t];0===n.pointData.Yw.size&&this.Xw.delete(n.rt.So)}},t.prototype.nM=function(t){for(var i=-1,n=0;n<this.Gw.length&&n<t.length;++n){var s=this.Gw[n],h=t[n];if(s.rt.So!==h.rt.So){i=n;break}h.Vo=s.Vo,vs(h.pointData,n)}if(-1===i&&this.Gw.length!==t.length&&(i=Math.min(this.Gw.length,t.length)),-1===i)return-1;for(n=i;n<t.length;++n)vs(t[n].pointData,n);return ss(t,i),this.Gw=t,i},t.prototype.eM=function(){if(0===this.Zw.size)return null;var t=0;return this.Zw.forEach((function(i){0!==i.length&&(t=Math.max(t,i[i.length-1].vs))})),t},t.prototype.sM=function(t,i,n){var s={uM:new Map,bt:{ml:this.eM()}};if(-1!==i)this.Zw.forEach((function(i,h){s.uM.set(h,{gh:i,aM:h===t?n:void 0})})),this.Zw.has(t)||s.uM.set(t,{gh:[],aM:n}),s.bt.oM=this.Gw,s.bt.lM=i;else{var h=this.Zw.get(t);s.uM.set(t,{gh:h||[],aM:n})}return s},t}();function vs(t,i){t.vs=i,t.Yw.forEach((function(t){t.vs=i}))}var _s={color:"#FF0000",price:0,lineStyle:2,lineWidth:1,lineVisible:!0,axisLabelVisible:!0,title:""},ds=function(){function t(t){this.Lr=t}return t.prototype.applyOptions=function(t){this.Lr.Pr(t)},t.prototype.options=function(){return this.Lr.R()},t.prototype.fM=function(){return this.Lr},t}();function ws(t){var i=t.overlay,n=function(t,i){var n={};for(var s in t)Object.prototype.hasOwnProperty.call(t,s)&&i.indexOf(s)<0&&(n[s]=t[s]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var h=0;for(s=Object.getOwnPropertySymbols(t);h<s.length;h++)i.indexOf(s[h])<0&&Object.prototype.propertyIsEnumerable.call(t,s[h])&&(n[s[h]]=t[s[h]])}return n}(t,["overlay"]);return i&&(n.priceScaleId=""),n}var Ms=function(){function t(t,i,n){this.Kn=t,this.cM=i,this.vM=n}return t.prototype.priceFormatter=function(){return this.Kn.qe()},t.prototype.priceToCoordinate=function(t){var i=this.Kn.kt();return null===i?null:this.Kn.Ct().Nt(t,i.St)},t.prototype.coordinateToPrice=function(t){var i=this.Kn.kt();return null===i?null:this.Kn.Ct().qi(t,i.St)},t.prototype.barsInLogicalRange=function(t){if(null===t)return null;var i=new nn(new Ji(t.from,t.to)).jo(),n=this.Kn.an();if(n.wi())return null;var s=n.ne(i.In(),1),h=n.ne(i.jn(),-1),r=e(n.Qr()),u=e(n.un());if(null!==s&&null!==h&&s.vs>h.vs)return{barsBefore:t.from-r,barsAfter:u-t.to};var a={barsBefore:null===s||s.vs===r?t.from-r:s.vs-r,barsAfter:null===h||h.vs===u?u-t.to:u-h.vs};return null!==s&&null!==h&&(a.from=s.rt.Co||s.rt.So,a.to=h.rt.Co||h.rt.So),a},t.prototype.setData=function(t){this.Kn.Wr(),this.cM._M(this.Kn,t)},t.prototype.update=function(t){this.Kn.Wr(),this.cM.dM(this.Kn,t)},t.prototype.setMarkers=function(t){var i=t.map((function(t){return m(m({},t),{time:us(t.time)})}));this.Kn.Le(i)},t.prototype.applyOptions=function(t){var i=ws(t);this.Kn.Pr(i)},t.prototype.options=function(){return S(this.Kn.R())},t.prototype.priceScale=function(){return this.vM.priceScale(this.Kn.Ct().Ke())},t.prototype.createPriceLine=function(t){var i=y(S(_s),t),n=this.Kn.Ee(i);return new ds(n)},t.prototype.removePriceLine=function(t){this.Kn.Oe(t.fM())},t.prototype.seriesType=function(){return this.Kn.Wr()},t}(),bs=function(t){function i(){return null!==t&&t.apply(this,arguments)||this}return b(i,t),i.prototype.applyOptions=function(i){cn(i),t.prototype.applyOptions.call(this,i)},i}(Ms),ms={autoScale:!0,mode:0,invertScale:!1,alignLabels:!0,borderVisible:!0,borderColor:"#2B2B43",entireTextOnly:!1,visible:!1,drawTicks:!0,scaleMargins:{bottom:.1,top:.2}},gs={color:"rgba(0, 0, 0, 0)",visible:!1,fontSize:48,fontFamily:A,fontStyle:"",text:"",horzAlign:"center",vertAlign:"center"},ps={width:0,height:0,layout:{background:{type:"solid",color:"#FFFFFF"},textColor:"#191919",fontSize:11,fontFamily:A},crosshair:{vertLine:{color:"#758696",width:1,style:3,visible:!0,labelVisible:!0,labelBackgroundColor:"#4c525e"},horzLine:{color:"#758696",width:1,style:3,visible:!0,labelVisible:!0,labelBackgroundColor:"#4c525e"},mode:1},grid:{vertLines:{color:"#D6DCDE",style:0,visible:!0},horzLines:{color:"#D6DCDE",style:0,visible:!0}},overlayPriceScales:m({},ms),leftPriceScale:m(m({},ms),{visible:!1}),rightPriceScale:m(m({},ms),{visible:!0}),timeScale:{rightOffset:0,barSpacing:6,minBarSpacing:.5,fixLeftEdge:!1,fixRightEdge:!1,lockVisibleTimeRangeOnResize:!1,rightBarStaysOnScroll:!1,borderVisible:!0,borderColor:"#2B2B43",visible:!0,timeVisible:!1,secondsVisible:!0,shiftVisibleRangeOnNewBar:!0},watermark:gs,localization:{locale:Nn?navigator.language:"",dateFormat:"dd MMM 'yy"},handleScroll:{mouseWheel:!0,pressedMouseMove:!0,horzTouchDrag:!0,vertTouchDrag:!0},handleScale:{axisPressedMouseMove:{time:!0,price:!0},axisDoubleClickReset:!0,mouseWheel:!0,pinch:!0},kineticScroll:{mouse:!1,touch:!0},trackingMode:{exitMode:1}},ys={upColor:"#26a69a",downColor:"#ef5350",wickVisible:!0,borderVisible:!0,borderColor:"#378658",borderUpColor:"#26a69a",borderDownColor:"#ef5350",wickColor:"#737375",wickUpColor:"#26a69a",wickDownColor:"#ef5350"},ks={upColor:"#26a69a",downColor:"#ef5350",openVisible:!0,thinBars:!0},xs={color:"#2196f3",lineStyle:0,lineWidth:3,lineType:0,crosshairMarkerVisible:!0,crosshairMarkerRadius:4,crosshairMarkerBorderColor:"",crosshairMarkerBackgroundColor:"",lastPriceAnimation:0},Ns={topColor:"rgba( 46, 220, 135, 0.4)",bottomColor:"rgba( 40, 221, 100, 0)",lineColor:"#33D778",lineStyle:0,lineWidth:3,lineType:0,crosshairMarkerVisible:!0,crosshairMarkerRadius:4,crosshairMarkerBorderColor:"",crosshairMarkerBackgroundColor:"",lastPriceAnimation:0},Cs={baseValue:{type:"price",price:0},topFillColor1:"rgba(38, 166, 154, 0.28)",topFillColor2:"rgba(38, 166, 154, 0.05)",topLineColor:"rgba(38, 166, 154, 1)",bottomFillColor1:"rgba(239, 83, 80, 0.05)",bottomFillColor2:"rgba(239, 83, 80, 0.28)",bottomLineColor:"rgba(239, 83, 80, 1)",lineWidth:3,lineStyle:0,crosshairMarkerVisible:!0,crosshairMarkerRadius:4,crosshairMarkerBorderColor:"",crosshairMarkerBackgroundColor:"",lastPriceAnimation:0},Ss={color:"#26a69a",base:0},Ts={title:"",visible:!0,lastValueVisible:!0,priceLineVisible:!0,priceLineSource:0,priceLineWidth:1,priceLineColor:"",priceLineStyle:2,baseLineVisible:!0,baseLineWidth:1,baseLineColor:"#B2B5BE",baseLineStyle:0,priceFormat:{type:"price",precision:2,minMove:.01}},Ds=function(){function t(t,i){this.wM=t,this.MM=i}return t.prototype.applyOptions=function(t){this.wM.jt().xf(this.MM,t)},t.prototype.options=function(){return this._i().R()},t.prototype.width=function(){return tt(this.MM)?this.wM.Ow("left"===this.MM?"left":"right"):0},t.prototype._i=function(){return e(this.wM.jt().Nf(this.MM)).Ct},t}(),As=function(){function t(t,i){this.bM=new p,this.Go=new p,this.Zd=new p,this.gi=t,this.Da=t.bt(),this.xw=i,this.Da.Fl().u(this.mM.bind(this)),this.Da.Vl().u(this.gM.bind(this)),this.xw.hw().u(this.pM.bind(this))}return t.prototype.p=function(){this.Da.Fl().M(this),this.Da.Vl().M(this),this.xw.hw().M(this),this.bM.p(),this.Go.p(),this.Zd.p()},t.prototype.scrollPosition=function(){return this.Da.xl()},t.prototype.scrollToPosition=function(t,i){i?this.Da.Ol(t,1e3):this.gi.yn(t)},t.prototype.scrollToRealTime=function(){this.Da.El()},t.prototype.getVisibleRange=function(){var t,i,n=this.Da.cl();return null===n?null:{from:null!==(t=n.from.Co)&&void 0!==t?t:n.from.So,to:null!==(i=n.to.Co)&&void 0!==i?i:n.to.So}},t.prototype.setVisibleRange=function(t){var i={from:us(t.from),to:us(t.to)},n=this.Da.wl(i);this.gi.$f(n)},t.prototype.getVisibleLogicalRange=function(){var t=this.Da.fl();return null===t?null:{from:t.In(),to:t.jn()}},t.prototype.setVisibleLogicalRange=function(t){h(t.from<=t.to,"The from index cannot be after the to index."),this.gi.$f(t)},t.prototype.resetTimeScale=function(){this.gi.gn()},t.prototype.fitContent=function(){this.gi.zl()},t.prototype.logicalToCoordinate=function(t){var i=this.gi.bt();return i.wi()?null:i.At(t)},t.prototype.coordinateToLogical=function(t){return this.Da.wi()?null:this.Da.gl(t)},t.prototype.timeToCoordinate=function(t){var i=us(t),n=this.Da.Ze(i,!1);return null===n?null:this.Da.At(n)},t.prototype.coordinateToTime=function(t){var i,n=this.gi.bt(),s=n.gl(t),h=n.pi(s);return null===h?null:null!==(i=h.Co)&&void 0!==i?i:h.So},t.prototype.width=function(){return this.xw.Ld().Ot},t.prototype.height=function(){return this.xw.Ld().Ft},t.prototype.subscribeVisibleTimeRangeChange=function(t){this.bM.u(t)},t.prototype.unsubscribeVisibleTimeRangeChange=function(t){this.bM._(t)},t.prototype.subscribeVisibleLogicalRangeChange=function(t){this.Go.u(t)},t.prototype.unsubscribeVisibleLogicalRangeChange=function(t){this.Go._(t)},t.prototype.subscribeSizeChange=function(t){this.Zd.u(t)},t.prototype.unsubscribeSizeChange=function(t){this.Zd._(t)},t.prototype.applyOptions=function(t){this.Da.Pr(t)},t.prototype.options=function(){return S(this.Da.R())},t.prototype.mM=function(){this.bM.g()&&this.bM.m(this.getVisibleRange())},t.prototype.gM=function(){this.Go.g()&&this.Go.m(this.getVisibleLogicalRange())},t.prototype.pM=function(t){this.Zd.m(t.Ot,t.Ft)},t}();function Bs(t){if(void 0!==t&&"custom"!==t.type){var i=t;void 0!==i.minMove&&void 0===i.precision&&(i.precision=function(t){if(t>=1)return 0;for(var i=0;i<8;i++){var n=Math.round(t);if(Math.abs(n-t)<1e-8)return i;t*=10}return i}(i.minMove))}}function Ls(t){return function(t){if(C(t.handleScale)){var i=t.handleScale;t.handleScale={axisDoubleClickReset:i,axisPressedMouseMove:{time:i,price:i},mouseWheel:i,pinch:i}}else if(void 0!==t.handleScale&&C(t.handleScale.axisPressedMouseMove)){var n=t.handleScale.axisPressedMouseMove;t.handleScale.axisPressedMouseMove={time:n,price:n}}var s=t.handleScroll;C(s)&&(t.handleScroll={horzTouchDrag:s,vertTouchDrag:s,mouseWheel:s,pressedMouseMove:s})}(t),function(t){if(t.priceScale){t.leftPriceScale=t.leftPriceScale||{},t.rightPriceScale=t.rightPriceScale||{};var i=t.priceScale.position;delete t.priceScale.position,t.leftPriceScale=y(t.leftPriceScale,t.priceScale),t.rightPriceScale=y(t.rightPriceScale,t.priceScale),"left"===i&&(t.leftPriceScale.visible=!0,t.rightPriceScale.visible=!1),"right"===i&&(t.leftPriceScale.visible=!1,t.rightPriceScale.visible=!0),"none"===i&&(t.leftPriceScale.visible=!1,t.rightPriceScale.visible=!1),t.overlayPriceScales=t.overlayPriceScales||{},void 0!==t.priceScale.invertScale&&(t.overlayPriceScales.invertScale=t.priceScale.invertScale),void 0!==t.priceScale.scaleMargins&&(t.overlayPriceScales.scaleMargins=t.priceScale.scaleMargins)}}(t),function(t){t.layout&&t.layout.backgroundColor&&!t.layout.background&&(t.layout.background={type:"solid",color:t.layout.backgroundColor})}(t),t}var Es=function(){function t(t,i){var n=this;this.yM=new cs,this.kM=new Map,this.xM=new Map,this.NM=new p,this.CM=new p;var s=void 0===i?S(ps):y(S(ps),Ls(i));this.wM=new Hn(t,s),this.wM.Sd().u((function(t){n.NM.g()&&n.NM.m(n.SM(t()))}),this),this.wM.Df().u((function(t){n.CM.g()&&n.CM.m(n.SM(t()))}),this);var h=this.wM.jt();this.TM=new As(h,this.wM.Dw())}return t.prototype.remove=function(){this.wM.Sd().M(this),this.wM.Df().M(this),this.TM.p(),this.wM.p(),this.kM.clear(),this.xM.clear(),this.NM.p(),this.CM.p(),this.yM.p()},t.prototype.resize=function(t,i,n){this.wM.Nw(t,i,n)},t.prototype.addAreaSeries=function(t){void 0===t&&(t={}),Bs((t=ws(t)).priceFormat);var i=y(S(Ts),Ns,t),n=this.wM.jt().Uf("Area",i),s=new Ms(n,this,this);return this.kM.set(s,n),this.xM.set(n,s),s},t.prototype.addBaselineSeries=function(t){void 0===t&&(t={}),Bs((t=ws(t)).priceFormat);var i=y(S(Ts),S(Cs),t),n=this.wM.jt().Uf("Baseline",i),s=new Ms(n,this,this);return this.kM.set(s,n),this.xM.set(n,s),s},t.prototype.addBarSeries=function(t){void 0===t&&(t={}),Bs((t=ws(t)).priceFormat);var i=y(S(Ts),ks,t),n=this.wM.jt().Uf("Bar",i),s=new Ms(n,this,this);return this.kM.set(s,n),this.xM.set(n,s),s},t.prototype.addCandlestickSeries=function(t){void 0===t&&(t={}),cn(t=ws(t)),Bs(t.priceFormat);var i=y(S(Ts),ys,t),n=this.wM.jt().Uf("Candlestick",i),s=new bs(n,this,this);return this.kM.set(s,n),this.xM.set(n,s),s},t.prototype.addHistogramSeries=function(t){void 0===t&&(t={}),Bs((t=ws(t)).priceFormat);var i=y(S(Ts),Ss,t),n=this.wM.jt().Uf("Histogram",i),s=new Ms(n,this,this);return this.kM.set(s,n),this.xM.set(n,s),s},t.prototype.addLineSeries=function(t){void 0===t&&(t={}),Bs((t=ws(t)).priceFormat);var i=y(S(Ts),xs,t),n=this.wM.jt().Uf("Line",i),s=new Ms(n,this,this);return this.kM.set(s,n),this.xM.set(n,s),s},t.prototype.removeSeries=function(t){var i=r(this.kM.get(t)),n=this.yM.Yf(i);this.wM.jt().Yf(i),this.DM(n),this.kM.delete(t),this.xM.delete(i)},t.prototype._M=function(t,i){this.DM(this.yM.Qw(t,i))},t.prototype.dM=function(t,i){this.DM(this.yM.hM(t,i))},t.prototype.subscribeClick=function(t){this.NM.u(t)},t.prototype.unsubscribeClick=function(t){this.NM._(t)},t.prototype.subscribeCrosshairMove=function(t){this.CM.u(t)},t.prototype.unsubscribeCrosshairMove=function(t){this.CM._(t)},t.prototype.priceScale=function(t){return void 0===t&&(t=this.wM.jt().Kf()),new Ds(this.wM,t)},t.prototype.timeScale=function(){return this.TM},t.prototype.applyOptions=function(t){this.wM.Pr(Ls(t))},t.prototype.options=function(){return this.wM.R()},t.prototype.takeScreenshot=function(){return this.wM.Bw()},t.prototype.DM=function(t){var i=this.wM.jt();i.jf(t.bt.ml,t.bt.oM,t.bt.lM),t.uM.forEach((function(t,i){return i.Z(t.gh,t.aM)})),i.yl()},t.prototype.AM=function(t){return r(this.xM.get(t))},t.prototype.SM=function(t){var i=this,n=new Map;t.qw.forEach((function(t,s){n.set(i.AM(s),t)}));var s=void 0===t.jw?void 0:this.AM(t.jw);return{time:t.rt&&(t.rt.Co||t.rt.So),point:t.Iw,hoveredSeries:s,hoveredMarkerId:t.Uw,seriesPrices:n}},t}();var Os=Object.freeze({__proto__:null,version:function(){return"3.8.0"},get LineStyle(){return i},get LineType(){return t},get TrackingModeExitMode(){return hn},get CrosshairMode(){return H},get PriceScaleMode(){return Vi},get PriceLineSource(){return on},get LastPriceAnimationMode(){return an},get LasPriceAnimationMode(){return an},get TickMarkType(){return Qi},get ColorType(){return ln},isBusinessDay:vn,isUTCTimestamp:_n,createChart:function(t,i){var n;if(N(t)){var s=document.getElementById(t);h(null!==s,"Cannot find element in DOM with id=".concat(t)),n=s}else n=t;return new Es(n,i)}});window.LightweightCharts=Os}();


/***/ })
/******/ ])});;