// Documentation
 
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

define([
    'jquery',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'tinycolor2',
    'lightweight-charts/dist/lightweight-charts.standalone.production'
],
function(
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
                panzoom: "on",
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
});

