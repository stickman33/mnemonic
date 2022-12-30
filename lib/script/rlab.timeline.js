///<reference path="../typing/knockout.d.ts" /> 
var rlab;
(function (rlab) {
    //interface DateRange {
    //    begin: Date;
    //    end: Date;
    //}
    //interface ValueRange {
    //    min: number;
    //    max: number;
    //}
    //interface Point { X: number, Y: number }
    var EventHandler = /** @class */ (function () {
        function EventHandler() {
            this.handlers = [];
        }
        EventHandler.prototype.add = function (item) {
            this.handlers.push(item);
        };
        EventHandler.prototype.remove = function (item) {
            var idx = this.handlers.indexOf(item);
            if (idx != -1) {
                this.handlers.splice(idx, 1);
            }
        };
        EventHandler.prototype.clear = function () {
            this.handlers = [];
        };
        EventHandler.prototype.fire = function (sender, event) {
            for (var c = 0; c < this.handlers.length; c++) {
                if (this.handlers[c]) {
                    this.handlers[c](sender, event);
                }
            }
        };
        return EventHandler;
    }());
    rlab.EventHandler = EventHandler;
    var TimeLine = /** @class */ (function () {
        function TimeLine(element, options) {
            this.dateRangeChanged = new EventHandler();
            this.selectedItemsChanged = new EventHandler();
            this.selectedTimeChanged = new EventHandler();
            this.clickHandler = this.OnClick.bind(this);
            this.mouseDownHandler = this.OnMouseDown.bind(this);
            this.mouseMoveHandler = this.OnMouseMove.bind(this);
            this.mouseUpHandler = this.OnMouseUp.bind(this);
            this.mouseWheelHandler = this.OnMouseWheel.bind(this);
            this.touchStartHandler = this.OnTouchStart.bind(this);
            this.touchMoveHandler = this.OnTouchMove.bind(this);
            this.touchEndHandler = this.OnTouchEnd.bind(this);
            this.defaultTemplate = '<table class="timeline_root">${PanelsTemplate}</table>';
            this.defaultTemplatePanel = '\
            <tbody class="timeline_panel">\
                <tr><td></td><td class="timeline_legend_panel">${LegendItemsTemplate}</td></tr>\
                <tr><td class="timeline_axis_panel"></td><td class="timeline_canvas_panel"><div style="width: 100%; height: 100%;" class="timeline_grid"></div><canvas class="timeline_canvas"></canvas></td></tr>\
                ${ScaleTemplate}\
            </tbody>';
            //<tr><td class="timeline_axis_panel" > </td><td class="timeline_canvas_panel"><div style="width: 100%; height: 100%;" class="timeline_grid"></div> <canvas style="width: 100%; height: 100%;" class="timeline_canvas" > </canvas></td> </tr>\
            this.defaultTemplateScale = '<tr><td></td><td class="timeline_scale"></td></tr>';
            this.defaultTemplateLegendItem = '\
            <div class="timeline_legend_item" style="text-decoration: none;">\
                <span style="color: ${Color};">●</span> ${Title}\
            </div>';
            this.defaultColors = [
                "#3366CC", "#DC3912", "#FF9900", "#109618",
                "#990099", "#0099C6", "#DD4477", "#66AA00",
                "#B82E2E", "#316395", "#994499", "#22AA99",
                "#AAAA11", "#6633CC", "#E67300", "#8B0707"
            ];
            this.root = element;
            this.options = options || {};
            this.CreateView(options);
            window.addEventListener("resize", this.Draw.bind(this, "window.resize"));
            //window.addEventListener("afterprint", this.Draw.bind(this, "window.afterprint"));
            //this.root.addEventListener("beforeprint", this.Draw.bind(this, "element.resize"));
            //object.addEventListener("beforeprint", myScript);
        }
        TimeLine.prototype.CreateView = function (options) {
            this.RemoveEventListener(document, "mouseup", this.mouseUpHandler);
            this.RemoveEventListener(document, "mousemove", this.mouseMoveHandler);
            for (var c = 0; this.panels && c < this.panels.length; c++) {
                this.RemoveEventListener(this.panels[c].canvas, "click", this.clickHandler);
                this.RemoveEventListener(this.panels[c].canvas, "mousedown", this.mouseDownHandler);
                this.RemoveEventListener(this.panels[c].canvas, "mousewheel", this.mouseWheelHandler);
                this.RemoveEventListener(this.panels[c].canvas, "touchstart", this.touchStartHandler);
                this.RemoveEventListener(this.panels[c].canvas, "touchmove", this.touchMoveHandler);
                this.RemoveEventListener(this.panels[c].canvas, "touchend", this.touchEndHandler);
            }
            this.dateRangeChanged.clear();
            this.selectedItemsChanged.clear();
            this.selectedTimeChanged.clear();
            var dateNow = new Date();
            this.data = this.options.data || [];
            this.begin = this.options.begin || new Date(dateNow.valueOf() - (1000 * 60 * 120));
            this.end = this.options.end || dateNow;
            this.isZoom = this.options.isZoom || false;
            //this.moveable = this.options.moveable || false;
            this.isMoveHorizontal = this.options.isMoveHorizontal || false;
            this.isMoveVertical = this.options.isMoveVertical || false;
            this.isSelectItems = this.options.isSelectItems || false;
            this.isSelectTime = this.options.isSelectTime || false;
            var panelsTemplate = [];
            for (var c = 0; c < this.options.panels.length; c++) {
                var panel = this.options.panels[c];
                var legendsTemplate = [];
                for (var f = 0; f < panel.fields.length; f++) {
                    var field = panel.fields[f];
                    var legendItem = this.defaultTemplateLegendItem.replace("${Title}", field.title || field.field).replace("${Color}", field.color || this.defaultColors[f]);
                    legendsTemplate.push(legendItem);
                }
                panel.isAxis = (panel.isAxis == undefined) ? true : panel.isAxis;
                panel.isScale = (panel.isScale == undefined) ? true : panel.isScale;
                //console.log(panel.isScale);
                panelsTemplate.push(this.defaultTemplatePanel.replace("${LegendItemsTemplate}", legendsTemplate.join("")).replace("${ScaleTemplate}", (panel.isScale) ? this.defaultTemplateScale : ""));
            }
            this.root.innerHTML = this.options.template || this.defaultTemplate.replace("${PanelsTemplate}", panelsTemplate.join(""));
            this.panels = [];
            var elements = this.root.getElementsByClassName("timeline_panel");
            for (var c = 0; c < this.options.panels.length && c < elements.length; c++) {
                var item = this.options.panels[c];
                //console.log(item.isAxis);
                var element = elements[c];
                var panel = {
                    height: item.height || 150,
                    min: item.min || -10,
                    max: item.max || 10,
                    isAxis: item.isAxis,
                    isScale: item.isScale,
                    fields: [],
                    legendPanel: element.getElementsByClassName("timeline_legend_panel").item(0),
                    axisPanel: element.getElementsByClassName("timeline_axis_panel").item(0),
                    canvasPanel: element.getElementsByClassName("timeline_canvas_panel").item(0),
                    canvas: element.getElementsByClassName("timeline_canvas").item(0),
                    grid: element.getElementsByClassName("timeline_grid").item(0)
                };
                for (var f = 0; f < item.fields.length; f++) {
                    var field = item.fields[f];
                    panel.fields.push({
                        field: field.field,
                        title: field.title || field.field,
                        style: field.style || "line",
                        color: field.color || this.defaultColors[f],
                        width: field.width || 2,
                        IsVisible: field.IsVisible || true,
                        data: field.data
                    });
                }
                //console.log(panel.fields);
                //var selfFields = panel.fields;
                //console.log(selfFields);
                var legendPanel = panel.legendPanel.getElementsByClassName("timeline_legend_item");
                for (var l = 0; l < legendPanel.length; l++) {
                    var legend = legendPanel.item(l);
                    //var field = panel.fields[l];
                    //console.log(legend);
                    legend.onclick = this.OnLegendClick.bind(this, legend, panel.fields[l]);
                    //legend.onclick = () => {
                    //    //panel.fields[l].IsVisible = !panel.fields[l].IsVisible;
                    //    console.log(l);
                    //    //return priorCondition(x) && predicate(x);
                    //};
                }
                panel.canvasPanel.style.height = panel.height + "px"; // переехало из Arrange так как устанавливается только один раз
                //if (this.isSelectItems || this.isSelectTime) {
                this.AddEventListener(panel.canvas, "click", this.clickHandler);
                //}
                //if (/*this.moveable ||*/ this.isMoveHorizontal || this.isMoveVertical) {
                this.AddEventListener(panel.canvas, "mousedown", this.mouseDownHandler);
                this.AddEventListener(panel.canvas, "touchstart", this.touchStartHandler);
                //}
                //if (this.isZoom) {
                this.AddEventListener(panel.canvas, "mousewheel", this.mouseWheelHandler);
                //}
                this.panels.push(panel);
            }
            this.scales = [];
            var scales = this.root.getElementsByClassName("timeline_scale");
            for (var c = 0; c < scales.length; c++) {
                this.scales.push(scales[c]);
                //this.AddEventListener(<HTMLElement>scales[c], "mousewheel", this.OnMouseWheel.bind(this));
            }
            this.grids = [];
            var grids = this.root.getElementsByClassName("timeline_grid");
            for (var c = 0; c < grids.length; c++) {
                this.grids.push(grids[c]);
            }
            this.hStep = new StepDate();
            this.vStep = new StepNumber();
            this.dragData = { x: 0, y: 0, begin: undefined, end: undefined, min: 0, max: 0, indexPanel: 0, isBeginDrag: false, isMove: false };
            this.selectedItems = [];
            this.selectedTime = undefined;
            //if (options.dateRangeChanged) {
            //    this.dateRangeChanged.add(options.dateRangeChanged);
            //}
            //if (options.selectedItemsChanged) {
            //    this.selectedItemsChanged.add(options.selectedItemsChanged);
            //}
            this.Draw("createView");
        };
        TimeLine.prototype.AddPanel = function (panel) {
            if (this.panels.indexOf(panel) == -1) {
            }
        };
        TimeLine.prototype.RemovePanel = function (panel) {
        };
        TimeLine.prototype.OnLegendClick = function (element, field, event) {
            field.IsVisible = !field.IsVisible;
            element.style.textDecoration = (field.IsVisible ? "none" : "line-through");
            this.Draw("OnLegendClick");
        };
        TimeLine.prototype.OnClick = function (event) {
            if (event === void 0) { event = window.event; }
            if (!this.dragData.isMove) {
                if (this.isSelectTime || this.isSelectItems) {
                    var canvas = event.currentTarget;
                    for (var c = 0; c < this.panels.length; c++) {
                        if (this.panels[c].canvas == canvas) {
                            if (this.isSelectTime) {
                                this.selectedTime = this.ScreenToTime(event.offsetX);
                                //if (this.selectedTime < this.begin) {
                                //    this.selectedTime = this.begin;
                                //}
                                //if (this.selectedTime > this.end) {
                                //    this.selectedTime = this.end;
                                //}
                                this.selectedTimeChanged.fire(this, this.selectedTime);
                            }
                            if (this.isSelectItems) {
                                var timeMin = this.ScreenToTime(event.offsetX - 5);
                                var timeMax = this.ScreenToTime(event.offsetX + 5);
                                var valueMin = this.ScreenToValue(this.panels[c], event.offsetY + 5);
                                var valueMax = this.ScreenToValue(this.panels[c], event.offsetY - 5);
                                this.selectedItems.splice(0, this.selectedItems.length);
                                for (var d = 0; d < this.data.length; d++) {
                                    var item = this.data[d]; // косяк однако. не учитываются спец.данные из field!!!
                                    if (timeMin <= (item.end || item.begin) && timeMax >= item.begin) {
                                        for (var f = 0; f < this.panels[c].fields.length; f++) {
                                            var value = item[this.panels[c].fields[f].field];
                                            if (valueMin <= value && valueMax >= value) {
                                                this.selectedItems.push(item);
                                                break;
                                            }
                                        }
                                    }
                                }
                                this.selectedItemsChanged.fire(this, this.selectedItems);
                            }
                            this.Draw("OnClick");
                            break;
                        }
                    }
                }
            }
            this.dragData.isMove = false;
        };
        TimeLine.prototype.OnMouseDown = function (event) {
            if (event === void 0) { event = window.event; }
            var canvas = event.currentTarget;
            if (this.isMoveHorizontal || this.isMoveVertical) {
                for (var c = 0; c < this.panels.length; c++) {
                    if (this.panels[c].canvas == canvas) {
                        this.dragData.x = event.clientX;
                        this.dragData.y = event.clientY;
                        this.dragData.begin = new Date(this.begin.valueOf());
                        this.dragData.end = new Date(this.end.valueOf());
                        this.dragData.min = this.panels[c].min;
                        this.dragData.max = this.panels[c].max;
                        this.dragData.indexPanel = c;
                        this.dragData.isBeginDrag = true;
                        this.dragData.isMove = false;
                        document.body.style.cursor = 'move';
                        this.AddEventListener(document, "mouseup", this.mouseUpHandler);
                        this.AddEventListener(document, "mousemove", this.mouseMoveHandler);
                        break;
                    }
                }
            }
            this.PreventDefault(event);
        };
        TimeLine.prototype.OnMouseMove = function (event) {
            if (event === void 0) { event = window.event; }
            if (this.isMoveHorizontal || this.isMoveVertical) {
                if (this.dragData.isBeginDrag) {
                    if (this.isMoveHorizontal) {
                        var diffMillisecs = Math.round((event.clientX - this.dragData.x) * this.GetTimeScale());
                        this.begin = new Date(this.dragData.begin.valueOf() - diffMillisecs);
                        this.end = new Date(this.dragData.end.valueOf() - diffMillisecs);
                    }
                    if (this.isMoveVertical) {
                        var diffValues = (event.clientY - this.dragData.y) * this.GetValueScale(this.panels[this.dragData.indexPanel]);
                        this.options.panels[this.dragData.indexPanel].min = this.dragData.min + diffValues;
                        this.options.panels[this.dragData.indexPanel].max = this.dragData.max + diffValues;
                    }
                    this.dragData.isMove = true;
                    this.Draw("OnMouseMove");
                }
            }
            this.PreventDefault(event);
        };
        TimeLine.prototype.OnMouseUp = function (event) {
            if (event === void 0) { event = window.event; }
            if (this.isMoveHorizontal || this.isMoveVertical) {
                if (this.dragData.isBeginDrag) {
                    //console.log("OnMouseUp: %s",  event);
                    this.RemoveEventListener(document, "mouseup", this.mouseUpHandler);
                    this.RemoveEventListener(document, "mousemove", this.mouseMoveHandler);
                    if (this.dragData.begin.valueOf() != this.begin.valueOf()
                        || this.dragData.end.valueOf() != this.end.valueOf()) {
                        this.dateRangeChanged.fire(this, { begin: new Date(this.begin.valueOf()), end: new Date(this.end.valueOf()) });
                    }
                    this.dragData.isBeginDrag = false;
                    document.body.style.cursor = 'auto';
                }
            }
            this.PreventDefault(event);
        };
        TimeLine.prototype.OnMouseWheel = function (event) {
            if (event === void 0) { event = window.event; }
            if (this.isZoom) {
                var canvas = event.currentTarget;
                var delta = 0;
                if (event.wheelDelta) { /* IE/Opera. */
                    delta = event.wheelDelta / 120;
                }
                else if (event.detail) { /* Mozilla case. */
                    // In Mozilla, sign of delta is different than in IE.
                    // Also, delta is multiple of 3.
                    delta = -event.detail / 3;
                }
                if (delta) {
                    var zoomFactor = delta / 5.0;
                    if (!event.shiftKey) {
                        this.SetTimeScale(zoomFactor, this.ScreenToTime(event.offsetX));
                        this.dateRangeChanged.fire(this, { begin: new Date(this.begin.valueOf()), end: new Date(this.end.valueOf()) });
                    }
                    else {
                        for (var c = 0; c < this.panels.length; c++) {
                            if (this.panels[c].canvas == canvas) {
                                var panel = this.panels[c];
                                this.SetValueScale(panel, zoomFactor, this.ScreenToValue(panel, event.offsetY));
                                break;
                            }
                        }
                    }
                }
                this.PreventDefault(event);
            }
        };
        TimeLine.prototype.OnTouchStart = function (event) {
            // console.log("OnTouchStart: %s",  event);
            // this.eventDateRange.fire("OnTouchStart", event.changedTouches[0].clientX);
            if (this.isMoveHorizontal || this.isMoveVertical) {
                if (event.changedTouches.length == 1) {
                    var canvas = event.currentTarget;
                    for (var c = 0; c < this.panels.length; c++) {
                        if (this.panels[c].canvas == canvas) {
                            this.dragData.x = event.changedTouches[0].clientX;
                            this.dragData.y = event.changedTouches[0].clientY;
                            this.dragData.begin = new Date(this.begin.valueOf());
                            this.dragData.end = new Date(this.end.valueOf());
                            this.dragData.min = this.panels[c].min;
                            this.dragData.max = this.panels[c].max;
                            this.dragData.indexPanel = c;
                            this.dragData.isBeginDrag = true;
                            this.dragData.isMove = false;
                            this.AddEventListener(this.panels[c].canvas, "touchmove", this.touchMoveHandler);
                            this.AddEventListener(this.panels[c].canvas, "touchend", this.touchEndHandler);
                            break;
                        }
                    }
                }
            }
            this.PreventDefault(event);
        };
        TimeLine.prototype.OnTouchMove = function (event) {
            if (this.isMoveHorizontal || this.isMoveVertical) {
                if (this.dragData.isBeginDrag) {
                    var diffMillisecs = Math.round((event.changedTouches[0].clientX - this.dragData.x) * this.GetTimeScale());
                    this.begin = new Date(this.dragData.begin.valueOf() - diffMillisecs);
                    this.end = new Date(this.dragData.end.valueOf() - diffMillisecs);
                    var diffValues = (event.changedTouches[0].clientY - this.dragData.y) * this.GetValueScale(this.panels[this.dragData.indexPanel]);
                    this.options.panels[this.dragData.indexPanel].min = this.dragData.min + diffValues;
                    this.options.panels[this.dragData.indexPanel].max = this.dragData.max + diffValues;
                    this.dragData.isMove = true;
                    this.Draw("OnTouchMove");
                }
            }
            this.PreventDefault(event);
        };
        TimeLine.prototype.OnTouchEnd = function (event) {
            if (this.isMoveHorizontal || this.isMoveVertical) {
                if (this.dragData.isBeginDrag) {
                    this.AddEventListener(this.panels[this.dragData.indexPanel].canvas, "touchmove", this.touchMoveHandler);
                    this.AddEventListener(this.panels[this.dragData.indexPanel].canvas, "touchend", this.touchEndHandler);
                    if (this.dragData.begin.valueOf() != this.begin.valueOf()
                        || this.dragData.end.valueOf() != this.end.valueOf()) {
                        this.dateRangeChanged.fire(this, { begin: new Date(this.begin.valueOf()), end: new Date(this.end.valueOf()) });
                    }
                    this.dragData.isBeginDrag = false;
                }
            }
            this.PreventDefault(event);
        };
        TimeLine.prototype.Draw = function (log) {
            console.log("TimeLine.Draw: %s", log);
            this.Arrange();
            this.DrawScale();
            this.DrawAxis();
            this.DrawLegend();
            this.DrawCanvas();
        };
        TimeLine.prototype.Arrange = function () {
            for (var c = 0; c < this.panels.length; c++) {
                this.ArrangeCanvas(this.panels[c]);
            }
            // calculate char size from timeline_scale style
            if (this.scales.length > 0) {
                var charDiv = document.createElement("DIV");
                charDiv.className = "timeline_scale_label";
                charDiv.style.visibility = "hidden";
                charDiv.innerText = "0";
                this.scales[0].appendChild(charDiv);
                this.scaleCharSize = { Width: charDiv.clientWidth, Height: charDiv.clientHeight };
                this.scales[0].removeChild(charDiv); // TODO: When using .redraw() via the browser event onresize, this gives an error in Chrome
            }
        };
        TimeLine.prototype.ArrangeCanvas = function (panel) {
            var canvasPanel = panel.canvasPanel;
            //console.log("TimeLine.ArrangeCanvas: %s, %s", canvasPanel.clientWidth, canvasPanel.clientHeight);
            //(<HTMLElement>canvasPanel).innerText = "" + canvasPanel.nodeName + " - " + Date.now();
            //console.log(canvasPanel);
            panel.canvas.width = canvasPanel.clientWidth;
            panel.canvas.height = canvasPanel.clientHeight;
            panel.grid.style.width = canvasPanel.clientWidth + "px";
            panel.grid.style.height = canvasPanel.clientHeight + "px";
        };
        TimeLine.prototype.DrawScale = function () {
            if (this.scales.length > 0) {
                var minorLabelPanel = document.createElement("DIV");
                minorLabelPanel.style.position = "relative";
                minorLabelPanel.className = "timeline_scale_minor_panel " + minorLabelPanel.className;
                minorLabelPanel.style.height = this.scaleCharSize.Height - 1 + "px";
                minorLabelPanel.style.overflow = "hidden";
                var majorLabelPanel = document.createElement("DIV");
                majorLabelPanel.style.position = "relative";
                majorLabelPanel.className = "timeline_scale_major_panel " + majorLabelPanel.className;
                majorLabelPanel.style.height = this.scaleCharSize.Height + "px";
                var gridPanel = [];
                // calculate minimum step (in milliseconds) based on character size
                var minimumStep = this.ScreenToTime((this.scaleCharSize.Width - 3) * 6).valueOf() - this.ScreenToTime(0).valueOf();
                this.hStep.setRange(this.begin, this.end, minimumStep);
                //// create a left major label
                var leftMajorLabel = document.createElement("DIV");
                leftMajorLabel = document.createElement("DIV");
                leftMajorLabel.className = "timeline_scale_label";
                leftMajorLabel.style.left = 0 + "px";
                //leftMajorLabel.title = "QQQ"; //leftDate;
                leftMajorLabel.innerText = this.hStep.getLabelMajor(this.ScreenToTime(0));
                majorLabelPanel.appendChild(leftMajorLabel);
                this.hStep.start();
                var count = 0;
                while (!this.hStep.end() && count < 200) {
                    count++;
                    //scale=5 DAY, step=5
                    //if (this.hStep.getCurrent().getDate() == 31) {
                    //    this.hStep.next();
                    //    continue;
                    //}
                    var x = this.TimeToScreen(this.hStep.getCurrent());
                    var labelClassName = "timeline_scale_minor";
                    if (this.hStep.isMajor() && x >= 0) {
                        labelClassName = "timeline_scale_major";
                        var majorValue = document.createElement("DIV");
                        majorValue.className = "timeline_scale_label " + labelClassName;
                        majorValue.style.left = x + "px";
                        //majorValue.title = this.hStep.getCurrent().toISOString();
                        majorValue.innerText = this.hStep.getLabelMajor();
                        majorLabelPanel.appendChild(majorValue);
                        if ((leftMajorLabel.innerText.length * this.scaleCharSize.Width) > x) {
                            majorLabelPanel.removeChild(leftMajorLabel);
                        }
                    }
                    var minorValue = document.createElement("DIV");
                    minorValue.className = "timeline_scale_label " + labelClassName;
                    minorValue.style.left = x + "px";
                    //minorValue.title = this.hStep.getCurrent().toISOString();
                    minorValue.innerText = this.hStep.getLabelMinor();
                    minorLabelPanel.appendChild(minorValue);
                    var gridValue = document.createElement("DIV");
                    gridValue.className = "timeline_scale_grid " + labelClassName;
                    gridValue.style.left = x + "px";
                    gridPanel.push(gridValue);
                    this.hStep.next();
                }
                for (var c = 0; c < this.scales.length; c++) {
                    while (this.scales[c].firstChild) {
                        this.scales[c].removeChild(this.scales[c].firstChild);
                    }
                    this.scales[c].appendChild(minorLabelPanel.cloneNode(true));
                    this.scales[c].appendChild(majorLabelPanel.cloneNode(true));
                }
                for (var c = 0; c < this.grids.length; c++) {
                    while (this.grids[c].firstChild) {
                        this.grids[c].removeChild(this.grids[c].firstChild);
                    }
                    for (var d = 0; d < gridPanel.length; d++) {
                        this.grids[c].appendChild(gridPanel[d].cloneNode(true));
                    }
                }
            }
        };
        TimeLine.prototype.DrawAxis = function () {
            for (var c = 0; c < this.panels.length; c++) {
                var panel = this.panels[c];
                if (panel.isAxis) {
                    var min = undefined;
                    var max = undefined;
                    if (this.options.panels[c].min == undefined || this.options.panels[c].max == undefined) {
                        for (var f = 0; f < panel.fields.length; f++) {
                            var field = panel.fields[f];
                            var data = field.data || this.data;
                            if (field.style != "area" && field.style != "event") {
                                var fieldName = field.field;
                                for (var d = 0; d < data.length; d++) {
                                    min = Math.min((min != undefined) ? min : data[d][fieldName], data[d][fieldName]);
                                    max = Math.max((max != undefined) ? max : data[d][fieldName], data[d][fieldName]);
                                }
                            }
                        }
                    }
                    //panel.min = this.options.panels[c].min || min || panel.min;//-10;
                    //panel.max = this.options.panels[c].max || max || panel.max;//10;
                    panel.min = (this.options.panels[c].min != undefined) ? this.options.panels[c].min : ((min != undefined) ? min : panel.min);
                    panel.max = (this.options.panels[c].max != undefined) ? this.options.panels[c].max : ((max != undefined) ? max : panel.max);
                    // хрен знает что!!! империалистический заговор!!! надо думать эту мысль!!!
                    if (panel.min == panel.max) {
                        panel.min -= 0.1;
                        panel.max += 0.1;
                    }
                    var stepnum = (panel.axisPanel.clientHeight - 4) / 40;
                    // хрен знает что!!! империалистический заговор!!! надо думать эту мысль!!!
                    //if (panel.min == panel.max) {
                    //    panel.min -= 0.1;
                    //    panel.max += 0.1;
                    //}
                    //panel.min -= (panel.max - panel.min) / stepnum / 10;
                    //panel.max += (panel.max - panel.min) / stepnum / 10;
                    // !!!!!!!!!
                    var start = panel.min;
                    var end = panel.max;
                    var step = (panel.max - panel.min) / stepnum;
                    var prettyStep = true;
                    this.vStep._setRange(start, end, step, prettyStep);
                    var axisTextPanel = document.createElement("DIV");
                    var maxWidth = 0;
                    this.vStep.start();
                    while (!this.vStep.end() && axisTextPanel.childNodes.length < 200) {
                        var y = this.vStep.getCurrent();
                        var yScreen = this.ValueToScreen(panel, y);
                        //// use scientific notation when necessary
                        //if (Math.abs(y) > 1e6) {
                        //    y = y.toExponential();
                        //}
                        //else if (Math.abs(y) < 1e-4) {
                        //    if (Math.abs(y) > this.vStep.getStep() / 2)
                        //        y = y.toExponential();
                        //    else
                        //        y = 0;
                        //}
                        if (yScreen >= 0 && yScreen <= panel.canvas.height) {
                            // create the text of the label
                            var labelText = document.createElement("DIV");
                            labelText.className = "timeline_axis_label";
                            labelText.style.top = (yScreen - this.scaleCharSize.Height / 2) + "px";
                            labelText.innerText = y.toString();
                            axisTextPanel.appendChild(labelText); // this.main.axisLeft.appendChild(labelText);
                            // create the label line
                            var labelLine = document.createElement("DIV");
                            labelLine.className = "timeline_axis_bar " + ((y == 0) ? "timeline_axis_major" : "timeline_axis_minor");
                            labelLine.style.top = yScreen + "px";
                            axisTextPanel.appendChild(labelLine); // this.main.axisLeft.appendChild(labelLine);
                            // create the grid line
                            var labelGrid = document.createElement("DIV");
                            labelGrid.className = "timeline_axis_grid " + ((y == 0) ? "timeline_axis_major" : "timeline_axis_minor");
                            labelGrid.style.top = yScreen + "px";
                            panel.grid.appendChild(labelGrid);
                        }
                        this.vStep.next();
                    }
                    while (panel.axisPanel.firstChild) {
                        panel.axisPanel.removeChild(panel.axisPanel.firstChild);
                    }
                    panel.axisPanel.appendChild(axisTextPanel);
                    for (var d = 0; d < axisTextPanel.childNodes.length; d++) {
                        maxWidth = Math.max(maxWidth, axisTextPanel.childNodes[d].offsetWidth);
                    }
                    axisTextPanel.style.width = (maxWidth + 8) + "px";
                    axisTextPanel.style.height = panel.canvas.height + "px";
                }
            }
        };
        TimeLine.prototype.DrawLegend = function () {
        };
        TimeLine.prototype.DrawCanvas = function () {
            for (var c = 0; c < this.panels.length; c++) {
                var panel = this.panels[c];
                this.ArrangeCanvas(panel);
                //let css = window.getComputedStyle(canvas);
                var ctx = panel.canvas.getContext('2d');
                ctx.clearRect(0, 0, panel.canvas.width, panel.canvas.height);
                //ctx.font = "bold 10px Sans";
                //ctx.fillStyle = 'green';
                //ctx.fillRect(0, 0, panel.canvas.width, panel.canvas.height);
                //console.log("TimeLine.DrawCanvas: %s, %s", panel.canvas.width, panel.canvas.height);
                if (this.isSelectTime && this.selectedTime) {
                    var selectedTimeX = this.TimeToScreen(this.selectedTime);
                    selectedTimeX = Math.max(0, selectedTimeX);
                    selectedTimeX = Math.min(panel.canvas.width - 1, selectedTimeX);
                    ctx.fillStyle = "green";
                    ctx.fillRect(selectedTimeX, 0, 1, panel.canvas.height);
                }
                //ctx.font = css.fontWeight + " " + css.fontSize + " " + css.fontFamily;
                //ctx.fillStyle = window.getComputedStyle(canvas).color;
                //ctx.fillText(canvas.clientWidth + "", 150, 100);
                for (var f = 0; f < panel.fields.length; f++) {
                    var field = panel.fields[f];
                    if (field.IsVisible) {
                        var data = field.data || this.data || [];
                        var style = field.style || "line";
                        var width = field.width || 1;
                        var strokeStyle = field.color || this.defaultColors[f]; // "black";
                        ctx.beginPath();
                        ctx.strokeStyle = strokeStyle;
                        ctx.fillStyle = field.color || this.defaultColors[f]; //"black";
                        ctx.lineWidth = width;
                        for (var d = 0; d < data.length; d++) {
                            var index = this.selectedItems.indexOf(data[d]);
                            var x = this.TimeToScreen(data[d].begin);
                            var y = this.ValueToScreen(panel, data[d][field.field]);
                            //if (field.field == "Pressure") {
                            //    console.log("%s: %s, %s", field.field, data[d].begin, data[d][field.field]);
                            //}
                            if (d == 0) {
                                ctx.moveTo(x, y);
                            }
                            if (style == "line" && d > 0) {
                                ctx.lineTo(x, y);
                                if (index > -1) {
                                    ctx.stroke();
                                    ctx.beginPath();
                                    ctx.strokeStyle = "red";
                                    ctx.strokeRect(x - 1, y - 1, ctx.lineWidth + 2, ctx.lineWidth + 2);
                                    ctx.stroke();
                                    ctx.beginPath();
                                    ctx.moveTo(x, y);
                                    ctx.strokeStyle = strokeStyle;
                                }
                            }
                            if (style == "segment" && data[d][field.field] != undefined) {
                                var xEnd = this.TimeToScreen(data[d].end);
                                var xW = Math.max(1, xEnd - x);
                                ctx.fillRect(x, y, xW, width);
                                if (index > -1) {
                                    ctx.strokeStyle = "red";
                                    ctx.strokeRect(x - 1, y - 1, xW + 2, width + 2);
                                    ctx.strokeStyle = strokeStyle;
                                }
                            }
                            if (style == "dot") {
                                ctx.fillRect(x - width / 2, y - width / 2, width, width);
                            }
                            if (style == "area" && data[d].end && data[d][field.field] != undefined) {
                                var xEnd = this.TimeToScreen(data[d].end);
                                ctx.fillRect(x, 0, xEnd - x, panel.canvas.height);
                            }
                            if (style == "event" && data[d][field.field] != undefined) {
                                ctx.fillRect(x, 0, width, panel.canvas.height);
                                ctx.fillText(data[d][field.field], x + 5, 10);
                            }
                        }
                        ctx.stroke();
                    }
                }
            }
        };
        TimeLine.prototype.TimeToScreen = function (date) {
            return (date.valueOf() - this.begin.valueOf()) / this.GetTimeScale();
        };
        TimeLine.prototype.ScreenToTime = function (x) {
            return new Date(x * this.GetTimeScale() + this.begin.valueOf());
        };
        TimeLine.prototype.GetTimeScale = function () {
            return (this.end.valueOf() - this.begin.valueOf()) / (this.scales[0].clientWidth || 800);
        };
        TimeLine.prototype.SetTimeScale = function (scale, scaleAroundDate) {
            if (scaleAroundDate === void 0) { scaleAroundDate = undefined; }
            if (scaleAroundDate == undefined) {
                scaleAroundDate = new Date((this.begin.valueOf() + this.end.valueOf()) / 2);
            }
            // prevent zoom factor larger than 1 or smaller than -1 (larger than 1 will
            // result in a start>=end )
            if (scale >= 1)
                scale = 0.9;
            if (scale <= -1)
                scale = -0.9;
            // adjust a negative factor such that zooming in with 0.1 equals zooming
            // out with a factor -0.1
            if (scale < 0) {
                scale = scale / (1 + scale);
            }
            // zoom start Date and end Date relative to the zoomAroundDate
            var startDiff = this.begin.valueOf() - scaleAroundDate.valueOf();
            var endDiff = this.end.valueOf() - scaleAroundDate.valueOf();
            // calculate new dates
            var newStart = new Date(this.begin.valueOf() - startDiff * scale);
            var newEnd = new Date(this.end.valueOf() - endDiff * scale);
            //console.log("S: %s, E: %s", newStart, newEnd);
            //var interval = (newEnd.valueOf() - newStart.valueOf());
            //var zoomMin = Number(this.zoomMin) || 10;
            //if (zoomMin < 10) {
            //    zoomMin = 10;
            //}
            //if (interval >= zoomMin) {
            //    // apply new dates
            //    this._applyRange(newStart, newEnd, zoomAroundDate);
            this.begin = newStart;
            this.end = newEnd;
            this.Draw("SetTimeScale");
            //    this._redrawHorizontalAxis();
            //    this._redrawData();
            //    this._redrawDataTooltip();
            //}
        };
        TimeLine.prototype.ValueToScreen = function (panel, value) {
            //return (panel.max - value) / this.GetValueScale(panel);
            return (panel.canvas.height - 2) - ((value - panel.min) / this.GetValueScale(panel));
        };
        TimeLine.prototype.ScreenToValue = function (panel, y) {
            //return panel.max - (value * this.GetValueScale(panel));
            return (((panel.canvas.height - 2) - y) * this.GetValueScale(panel)) + panel.min;
        };
        TimeLine.prototype.GetValueScale = function (panel) {
            return (panel.max - panel.min) / (panel.canvas.height - 4);
        };
        TimeLine.prototype.SetValueScale = function (panel, scale, scaleAroundValue) {
            if (scaleAroundValue === void 0) { scaleAroundValue = undefined; }
            if (scaleAroundValue == undefined) {
                scaleAroundValue = (panel.min + panel.max) / 2;
            }
            // prevent zoom factor larger than 1 or smaller than -1 (larger than 1 will
            // result in a start>=end )
            if (scale >= 1)
                scale = 0.9;
            if (scale <= -1)
                scale = -0.9;
            // adjust a negative factor such that zooming in with 0.1 equals zooming
            // out with a factor -0.1
            if (scale < 0) {
                scale = scale / (1 + scale);
            }
            // zoom start Date and end Date relative to the zoomAroundDate
            var startDiff = (panel.min - scaleAroundValue);
            var endDiff = (panel.max - scaleAroundValue);
            // calculate start and end
            var newStart = (panel.min - startDiff * scale);
            var newEnd = (panel.max - endDiff * scale);
            // prevent empty range
            if (newStart >= newEnd) {
                return;
            }
            //// prevent range larger than the available range
            //if (newStart < this.vMin) {
            //    newStart = this.vMin;
            //}
            //if (newEnd > this.vMax) {
            //    newEnd = this.vMax;
            //}
            // apply new range
            var index = this.panels.indexOf(panel);
            this.options.panels[index].min = newStart;
            this.options.panels[index].max = newEnd;
            this.Draw("SetValueScale");
        };
        ;
        //private GetAbsoluteOffsetElement(element: HTMLElement): Point {
        //    let result = { X: 0, Y: 0 };
        //    for (let elem: any = element; elem; elem = elem.offsetParent) {
        //        result.X += elem.offsetTop;
        //        result.Y += elem.offsetLeft;
        //    }
        //    return result;
        //}
        TimeLine.prototype.AddEventListener = function (element, action, listener, useCapture) {
            if (useCapture === void 0) { useCapture = false; }
            if (element.addEventListener) {
                if (action == "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
                    action = "DOMMouseScroll"; // For Firefox
                }
                element.addEventListener(action, listener, useCapture);
            }
            else {
                element.attachEvent("on" + action, listener); // IE browsers
            }
        };
        TimeLine.prototype.RemoveEventListener = function (element, action, listener, useCapture) {
            if (useCapture === void 0) { useCapture = false; }
            if (element.removeEventListener) {
                // non-IE browsers
                if (action == "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
                    action = "DOMMouseScroll"; // For Firefox
                }
                element.removeEventListener(action, listener, useCapture);
            }
            else {
                // IE browsers
                element.detachEvent("on" + action, listener);
            }
        };
        TimeLine.prototype.PreventDefault = function (event) {
            if (event === void 0) { event = window.event; }
            if (event.preventDefault) {
                event.preventDefault(); // non-IE browsers
            }
            else {
                event.returnValue = false; // IE browsers
            }
        };
        return TimeLine;
    }());
    rlab.TimeLine = TimeLine;
    var Scale;
    (function (Scale) {
        Scale[Scale["MILLISECOND"] = 1] = "MILLISECOND";
        Scale[Scale["SECOND"] = 2] = "SECOND";
        Scale[Scale["MINUTE"] = 3] = "MINUTE";
        Scale[Scale["HOUR"] = 4] = "HOUR";
        Scale[Scale["DAY"] = 5] = "DAY";
        Scale[Scale["WEEKDAY"] = 6] = "WEEKDAY";
        Scale[Scale["MONTH"] = 7] = "MONTH";
        Scale[Scale["YEAR"] = 8] = "YEAR";
    })(Scale || (Scale = {}));
    var StepDate = /** @class */ (function () {
        function StepDate(start, end, minimumStep) {
            this.current = new Date();
            this._start = new Date();
            this._end = new Date();
            this.autoScale = true;
            this.scale = Scale.DAY;
            this.step = 1;
            this.setRange(start, end, minimumStep);
        }
        StepDate.prototype.setRange = function (start, end, minimumStep) {
            //if (!(start instanceof Date) || !(end instanceof Date)) {
            //    //throw  "No legal start or end date in method setRange";
            //    return;
            //}
            this._start = (start != undefined) ? new Date(start.valueOf()) : new Date();
            this._end = (end != undefined) ? new Date(end.valueOf()) : new Date();
            if (this.autoScale) {
                this.setMinimumStep(minimumStep);
            }
            //console.log(`setRange: scale=${Scale[this.scale]}, step=${this.step}, minimumStep=${minimumStep}, start=${this._start.toISOString()}, end=${this._end.toISOString()}`);
        };
        ;
        StepDate.prototype.setMinimumStep = function (minimumStep) {
            if (minimumStep == undefined) {
                return;
            }
            var stepYear = (1000 * 60 * 60 * 24 * 30 * 12);
            var stepMonth = (1000 * 60 * 60 * 24 * 30);
            var stepDay = (1000 * 60 * 60 * 24);
            var stepHour = (1000 * 60 * 60);
            var stepMinute = (1000 * 60);
            var stepSecond = (1000);
            var stepMillisecond = (1);
            // find the smallest step that is larger than the provided minimumStep
            if (stepYear * 1000 > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 1000;
            }
            if (stepYear * 500 > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 500;
            }
            if (stepYear * 100 > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 100;
            }
            if (stepYear * 50 > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 50;
            }
            if (stepYear * 10 > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 10;
            }
            if (stepYear * 5 > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 5;
            }
            if (stepYear > minimumStep) {
                this.scale = Scale.YEAR;
                this.step = 1;
            }
            if (stepMonth * 3 > minimumStep) {
                this.scale = Scale.MONTH;
                this.step = 3;
            }
            if (stepMonth > minimumStep) {
                this.scale = Scale.MONTH;
                this.step = 1;
            }
            if (stepDay * 5 > minimumStep) {
                this.scale = Scale.DAY;
                this.step = 5;
            }
            if (stepDay * 2 > minimumStep) {
                this.scale = Scale.DAY;
                this.step = 2;
            }
            if (stepDay > minimumStep) {
                this.scale = Scale.DAY;
                this.step = 1;
            }
            if (stepDay / 2 > minimumStep) {
                this.scale = Scale.WEEKDAY;
                this.step = 1;
            }
            if (stepHour * 4 > minimumStep) {
                this.scale = Scale.HOUR;
                this.step = 4;
            }
            if (stepHour * 3 > minimumStep) {
                this.scale = Scale.HOUR;
                this.step = 3;
            }
            if (stepHour > minimumStep) {
                this.scale = Scale.HOUR;
                this.step = 1;
            }
            if (stepMinute * 15 > minimumStep) {
                this.scale = Scale.MINUTE;
                this.step = 15;
            }
            if (stepMinute * 10 > minimumStep) {
                this.scale = Scale.MINUTE;
                this.step = 10;
            }
            if (stepMinute * 5 > minimumStep) {
                this.scale = Scale.MINUTE;
                this.step = 5;
            }
            if (stepMinute > minimumStep) {
                this.scale = Scale.MINUTE;
                this.step = 1;
            }
            if (stepSecond * 15 > minimumStep) {
                this.scale = Scale.SECOND;
                this.step = 15;
            }
            if (stepSecond * 10 > minimumStep) {
                this.scale = Scale.SECOND;
                this.step = 10;
            }
            if (stepSecond * 5 > minimumStep) {
                this.scale = Scale.SECOND;
                this.step = 5;
            }
            if (stepSecond > minimumStep) {
                this.scale = Scale.SECOND;
                this.step = 1;
            }
            if (stepMillisecond * 200 > minimumStep) {
                this.scale = Scale.MILLISECOND;
                this.step = 200;
            }
            if (stepMillisecond * 100 > minimumStep) {
                this.scale = Scale.MILLISECOND;
                this.step = 100;
            }
            if (stepMillisecond * 50 > minimumStep) {
                this.scale = Scale.MILLISECOND;
                this.step = 50;
            }
            if (stepMillisecond * 10 > minimumStep) {
                this.scale = Scale.MILLISECOND;
                this.step = 10;
            }
            if (stepMillisecond * 5 > minimumStep) {
                this.scale = Scale.MILLISECOND;
                this.step = 5;
            }
            if (stepMillisecond > minimumStep) {
                this.scale = Scale.MILLISECOND;
                this.step = 1;
            }
        };
        ;
        StepDate.prototype.getLabelMajor = function (date) {
            //var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            //var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            if (date === void 0) { date = undefined; }
            if (date == undefined) {
                date = this.current;
            }
            switch (this.scale) {
                //case Scale.MILLISECOND: return (<any>date).format("HH:MM:ss", true); //`0${date.getUTCHours()}`.slice(-2) + ":" + `0${date.getUTCMinutes()}`.slice(-2) + ":" + `0${date.getUTCSeconds()}`.slice(-2);
                case Scale.MILLISECOND: return date.format("dd mmmm HH:MM:ss", true); //`0${date.getUTCHours()}`.slice(-2) + ":" + `0${date.getUTCMinutes()}`.slice(-2) + ":" + `0${date.getUTCSeconds()}`.slice(-2);
                case Scale.SECOND: return date.format("dd mmmm HH:MM", true); //`${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${this.addZeros(date.getUTCHours(), 2)}:${this.addZeros(date.getUTCMinutes(), 2)}`;
                case Scale.MINUTE: return date.format("dddd dd mmmm yyyy", true); //`${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
                case Scale.HOUR: return date.format("dddd dd mmmm yyyy", true); //`${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
                case Scale.WEEKDAY:
                case Scale.DAY: return date.format("mmmm yyyy", true); //`${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
                case Scale.MONTH: return date.format("yyyy", true); //`${date.getUTCFullYear()}`;
                default: return "";
            }
        };
        StepDate.prototype.getLabelMinor = function (date) {
            //var MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            //var DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            if (date === void 0) { date = undefined; }
            if (date == undefined) {
                date = this.current;
            }
            switch (this.scale) {
                case Scale.MILLISECOND: return date.format("l", true); //String(date.getUTCMilliseconds());
                case Scale.SECOND: return date.format("ss", true); //this.addZeros(String(date.getUTCSeconds()), 2);
                case Scale.MINUTE: return date.format("HH:MM", true); //this.addZeros(date.getUTCHours(), 2) + ":" + this.addZeros(date.getUTCMinutes(), 2);
                case Scale.HOUR: return date.format("HH:MM", true); //this.addZeros(date.getUTCHours(), 2) + ":" + this.addZeros(date.getUTCMinutes(), 2);
                case Scale.WEEKDAY: return date.format("ddd dd", true); //DAYS_SHORT[date.getUTCDay()] + ' ' + date.getUTCDate();
                case Scale.DAY: return date.format("dd", true); //this.addZeros(String(date.getUTCDate()), 2);
                case Scale.MONTH: return date.format("mmm", true); //MONTHS_SHORT[date.getUTCMonth()];   // month is zero based
                case Scale.YEAR: return date.format("yyyy", true); //String(date.getUTCFullYear());
                default: return "";
            }
        };
        ;
        StepDate.prototype.addZeros = function (value, len) {
            var str = "" + value;
            while (str.length < len) {
                str = "0" + str;
            }
            return str;
        };
        ;
        StepDate.prototype.start = function () {
            this.current = new Date(this._start.valueOf());
            // round to floor. IMPORTANT: we have no breaks in this switch! (this is no bug). noinspection FallthroughInSwitchStatementJS
            switch (this.scale) {
                case Scale.YEAR:
                    this.current.setUTCFullYear(this.step * Math.floor(this.current.getUTCFullYear() / this.step));
                    this.current.setUTCMonth(0);
                case Scale.MONTH: this.current.setUTCDate(1);
                case Scale.DAY: // intentional fall through
                case Scale.WEEKDAY: this.current.setUTCHours(0);
                case Scale.HOUR: this.current.setUTCMinutes(0);
                case Scale.MINUTE: this.current.setUTCSeconds(0);
                case Scale.SECOND: this.current.setUTCMilliseconds(0);
                //case links.Graph.StepDate.SCALE.MILLISECOND: // nothing to do for milliseconds
            }
            if (this.step != 1) {
                // round down to the first minor value that is a multiple of the current step size
                switch (this.scale) {
                    case Scale.MILLISECOND:
                        this.current.setMilliseconds(this.current.getMilliseconds() - this.current.getMilliseconds() % this.step);
                        break;
                    case Scale.SECOND:
                        this.current.setSeconds(this.current.getSeconds() - this.current.getSeconds() % this.step);
                        break;
                    case Scale.MINUTE:
                        this.current.setMinutes(this.current.getMinutes() - this.current.getMinutes() % this.step);
                        break;
                    //case Scale.HOUR:       this.current.setHours(this.current.getHours() - this.current.getHours() % this.step); break;
                    case Scale.HOUR:
                        this.current.setUTCHours(this.current.getUTCHours() - this.current.getUTCHours() % this.step);
                        break;
                    case Scale.WEEKDAY: // intentional fall through
                    case Scale.DAY:
                        this.current.setDate((this.current.getDate() - 1) - (this.current.getDate() - 1) % this.step + 1);
                        break;
                    case Scale.MONTH:
                        this.current.setMonth(this.current.getMonth() - this.current.getMonth() % this.step);
                        break;
                    case Scale.YEAR:
                        this.current.setFullYear(this.current.getFullYear() - this.current.getFullYear() % this.step);
                        break;
                    default: break;
                }
            }
        };
        ;
        StepDate.prototype.end = function () {
            return (this.current.valueOf() > this._end.valueOf());
        };
        ;
        StepDate.prototype.getCurrent = function () {
            return this.current;
        };
        ;
        StepDate.prototype.isMajor = function () {
            switch (this.scale) {
                case Scale.MILLISECOND: return (this.current.getUTCMilliseconds() == 0);
                case Scale.SECOND: return (this.current.getUTCSeconds() == 0);
                case Scale.MINUTE: return (this.current.getUTCHours() == 0) && (this.current.getUTCMinutes() == 0);
                // Note: this is no bug. Major label is equal for both minute and hour scale
                case Scale.HOUR: return (this.current.getUTCHours() == 0);
                case Scale.WEEKDAY: // intentional fall through
                case Scale.DAY: return (this.current.getUTCDate() == 1);
                case Scale.MONTH: return (this.current.getUTCMonth() == 0);
                case Scale.YEAR: return false;
                default: return false;
            }
        };
        StepDate.prototype.next = function () {
            var prev = this.current.valueOf();
            // Two cases, needed to prevent issues with switching daylight savings
            // (end of March and end of October)
            //if (this.current.getMonth() < 6) {
            //    switch (this.scale) {
            //        case StepDate.SCALE.MILLISECOND:this.current = new Date(this.current.valueOf() + this.step); break;
            //        case StepDate.SCALE.SECOND:     this.current = new Date(this.current.valueOf() + this.step * 1000); break;
            //        case StepDate.SCALE.MINUTE:     this.current = new Date(this.current.valueOf() + this.step * 1000 * 60); break;
            //        case StepDate.SCALE.HOUR:       this.current = new Date(this.current.valueOf() + this.step * 1000 * 60 * 60);
            //            // in case of skipping an hour for daylight savings, adjust the hour again (else you get: 0h 5h 9h ... instead of 0h 4h 8h ...)
            //            //var h = this.current.getHours();
            //            //this.current.setHours(h - (h % this.step));
            //            //console.log("1");
            //            break;
            //        case StepDate.SCALE.WEEKDAY:    // intentional fall through
            //        case StepDate.SCALE.DAY:        this.current.setDate(this.current.getDate() + this.step);
            //            //this.current = new Date(this.current.valueOf() + this.step * 1000 * 60 * 60 * 24);
            //            break;
            //        case StepDate.SCALE.MONTH:      this.current.setMonth(this.current.getMonth() + this.step); break;
            //        case StepDate.SCALE.YEAR:       this.current.setFullYear(this.current.getFullYear() + this.step); break;
            //        default: break;
            //    }
            //}
            //else {
            switch (this.scale) {
                case Scale.MILLISECOND:
                    this.current = new Date(this.current.valueOf() + this.step);
                    break;
                case Scale.SECOND:
                    this.current.setSeconds(this.current.getSeconds() + this.step);
                    break;
                case Scale.MINUTE:
                    this.current.setMinutes(this.current.getMinutes() + this.step);
                    break;
                case Scale.HOUR:
                    this.current.setUTCHours(this.current.getUTCHours() + this.step);
                    //this.current.setUTCHours(this.current.getUTCHours() - this.current.getUTCHours() % this.step);
                    //console.log("2");
                    break;
                case Scale.WEEKDAY: // intentional fall through
                case Scale.DAY:
                    this.current.setDate(this.current.getDate() + this.step);
                    break;
                case Scale.MONTH:
                    this.current.setMonth(this.current.getMonth() + this.step);
                    break;
                case Scale.YEAR:
                    this.current.setFullYear(this.current.getFullYear() + this.step);
                    break;
                default: break;
            }
            //}
            if (this.step != 1) {
                // round down to the correct major value
                switch (this.scale) {
                    case Scale.MILLISECOND:
                        if (this.current.getMilliseconds() < this.step)
                            this.current.setMilliseconds(0);
                        break;
                    case Scale.SECOND:
                        if (this.current.getSeconds() < this.step)
                            this.current.setSeconds(0);
                        break;
                    case Scale.MINUTE:
                        if (this.current.getMinutes() < this.step)
                            this.current.setMinutes(0);
                        break;
                    case Scale.HOUR:
                        if (this.current.getUTCHours() < this.step)
                            this.current.setUTCHours(0);
                        break;
                    case Scale.WEEKDAY: // intentional fall through
                    case Scale.DAY:
                        if (this.current.getDate() < this.step + 1)
                            this.current.setDate(1);
                        break;
                    case Scale.MONTH:
                        if (this.current.getMonth() < this.step)
                            this.current.setMonth(0);
                        break;
                    case Scale.YEAR: break; // nothing to do for year
                    default: break;
                }
            }
            //console.log(`>> next=${this.current.toISOString()}`);
            // safety mechanism: if current time is still unchanged, move to the end
            if (this.current.valueOf() == prev) {
                this.current = new Date(this._end.valueOf());
            }
        };
        ;
        return StepDate;
    }());
    var StepNumber = /** @class */ (function () {
        function StepNumber(start, end, step, prettyStep) {
            this.setStep = function (step, prettyStep) {
                if (step == undefined || step <= 0)
                    return;
                this.prettyStep = prettyStep;
                if (this.prettyStep == true)
                    this._step = this._calculatePrettyStep(step);
                else
                    this._step = step;
                if (this._end / this._step > Math.pow(10, this.precision)) {
                    this.precision = undefined;
                }
            };
            this._start = 0;
            this._end = 0;
            this._step = 1;
            this.prettyStep = true;
            this.precision = 5;
            this._current = 0;
            this._setRange(start, end, step, prettyStep);
        }
        StepNumber.prototype._setRange = function (start, end, step, prettyStep) {
            this._start = start ? start : 0;
            this._end = end ? end : 0;
            this.setStep(step, prettyStep);
        };
        StepNumber.prototype._calculatePrettyStep = function (step) {
            var log10 = function (x) { return Math.log(x) / Math.LN10; };
            // try three steps (multiple of 1, 2, or 5
            var step1 = 1 * Math.pow(10, Math.round(log10(step / 1)));
            var step2 = 2 * Math.pow(10, Math.round(log10(step / 2)));
            var step5 = 5 * Math.pow(10, Math.round(log10(step / 5)));
            // choose the best step (closest to minimum step)
            var prettyStep = step1;
            if (Math.abs(step2 - step) <= Math.abs(prettyStep - step))
                prettyStep = step2;
            if (Math.abs(step5 - step) <= Math.abs(prettyStep - step))
                prettyStep = step5;
            // for safety
            if (prettyStep <= 0) {
                prettyStep = 1;
            }
            return prettyStep;
        };
        StepNumber.prototype.start = function () {
            if (this.prettyStep) {
                this._current = this._start - this._start % this._step;
            }
            else {
                this._current = this._start;
            }
        };
        StepNumber.prototype.end = function () {
            return (this._current > this._end);
        };
        StepNumber.prototype.getCurrent = function () {
            if (this.precision) {
                return Number((this._current).toPrecision(this.precision));
            }
            else {
                return this._current;
            }
        };
        StepNumber.prototype.next = function () {
            this._current += this._step;
        };
        return StepNumber;
    }());
})(rlab || (rlab = {}));
(function (rlab) {
    var knockout;
    (function (knockout) {
        if (ko) {
            function SetValueSafe(property, value) {
                if (ko.isObservable(property)) {
                    property(value);
                }
                else {
                    property = value;
                }
            }
            //unwrapObservable: function (value) {
            //    return ko.isObservable(value) ? value() : value;
            //}
            ko.components.register("timeline", {
                viewModel: {
                    createViewModel: function (params, componentInfo) {
                        //var options = ko.utils.unwrapObservable(params.options) || [];
                        var TLParams = ko.utils.unwrapObservable(params) || {};
                        var options = {};
                        var root = componentInfo.element;
                        var nodes = componentInfo.templateNodes;
                        var skip = {};
                        options.data = ko.utils.unwrapObservable(params.data || []);
                        if (params.dateRange) {
                            var range = ko.utils.unwrapObservable(params.dateRange);
                            options.begin = new Date((ko.utils.unwrapObservable(range.begin) || new Date()).valueOf());
                            options.end = new Date((ko.utils.unwrapObservable(range.end) || new Date()).valueOf());
                        }
                        options.isZoom = TLParams.isZoom();
                        options.isMoveHorizontal = TLParams.isMoveHorizontal();
                        options.isMoveVertical = TLParams.isMoveVertical();
                        options.isSelectItems = TLParams.isSelectItems;
                        options.isSelectTime = TLParams.isSelectTime();
                        options.panels = [];
                        for (var p = 0; p < TLParams.panels.length; p++) {
                            var panel = {
                                height: TLParams.panels[p].height,
                                min: TLParams.panels[p].min,
                                max: TLParams.panels[p].max,
                                isAxis: TLParams.panels[p].isAxis,
                                isScale: TLParams.panels[p].isScale,
                                fields: []
                            };
                            var __fields = ko.utils.unwrapObservable(TLParams.panels[p].fields);
                            for (var f = 0; f < __fields.length; f++) {
                                var field = {
                                    field: __fields[f].field,
                                    title: __fields[f].title,
                                    style: __fields[f].style,
                                    color: __fields[f].color,
                                    width: __fields[f].width,
                                    IsVisible: __fields[f].IsVisible,
                                    data: ko.utils.unwrapObservable(__fields[f].data)
                                };
                                panel.fields.push(field);
                            }
                            options.panels.push(panel);
                        }
                        var template = document.createElement("DIV");
                        for (var c = 0; c < nodes.length; c++) {
                            template.appendChild(nodes[c]);
                        }
                        if (template.childElementCount > 0) {
                            options.template = template.innerHTML;
                        }
                        var timeline = new rlab.TimeLine(root, options);
                        if (TLParams.data && ko.isObservable(TLParams.data)) {
                            TLParams.data.subscribe(function (newValue) {
                                timeline.data = newValue;
                                timeline.Draw("data");
                            });
                        }
                        if (params.dateRange) {
                            skip["dateRange"] = false;
                            var range = ko.utils.unwrapObservable(params.dateRange);
                            SetValueSafe(range.scale, timeline.GetTimeScale());
                            timeline.dateRangeChanged.add(function (sender, event) {
                                skip["dateRange"] = true;
                                SetValueSafe(range.begin, new Date(event.begin.valueOf()));
                                SetValueSafe(range.end, new Date(event.end.valueOf()));
                                SetValueSafe(range.scale, timeline.GetTimeScale());
                                if (ko.isObservable(params.dateRange)) {
                                    params.dateRange.valueHasMutated();
                                }
                                skip["dateRange"] = false;
                            });
                            if (ko.isObservable(params.dateRange)) {
                                params.dateRange.subscribe(function (newValue) {
                                    if (!skip["dateRange"]) {
                                        timeline.begin = new Date((ko.utils.unwrapObservable(newValue.begin) || new Date()).valueOf());
                                        timeline.end = new Date((ko.utils.unwrapObservable(newValue.end) || new Date()).valueOf());
                                        timeline.Draw("dateRange");
                                        //console.log("GetTimeScale: %s", timeline.GetTimeScale());
                                        SetValueSafe(range.scale, timeline.GetTimeScale());
                                    }
                                });
                            }
                        }
                        if (params.selectedTime && ko.isObservable(params.selectedTime)) {
                            skip["selectedTime"] = false;
                            params.selectedTime.subscribe(function (newValue) {
                                if (!skip["selectedTime"]) {
                                    timeline.selectedTime = (newValue) ? new Date(newValue.valueOf()) : undefined;
                                    timeline.Draw("selectedTime");
                                }
                            });
                            timeline.selectedTimeChanged.add(function (sender, event) {
                                skip["selectedTime"] = true;
                                params.selectedTime(new Date(event.valueOf()));
                                skip["selectedTime"] = false;
                            });
                        }
                        if (params.selectedItems && ko.isObservable(params.selectedItems)) {
                            skip["selectedItems"] = false;
                            params.selectedItems.subscribe(function (newValue) {
                                if (!skip["selectedItems"]) {
                                    timeline.selectedItems.splice(0, timeline.selectedItems.length);
                                    Array.prototype.push.apply(timeline.selectedItems, ko.utils.unwrapObservable(newValue));
                                    timeline.Draw("selectedItems");
                                }
                            });
                            timeline.selectedItemsChanged.add(function (sender, event) {
                                skip["selectedItems"] = true;
                                params.selectedItems(timeline.selectedItems.slice(0)); //event);
                                skip["selectedItems"] = false;
                            });
                        }
                        if (params.isZoom && ko.isObservable(params.isZoom)) {
                            params.isZoom.subscribe(function (newValue) {
                                timeline.isZoom = newValue;
                                //timeline.Draw("data");
                            });
                        }
                        if (params.isSelectTime && ko.isObservable(params.isSelectTime)) {
                            params.isSelectTime.subscribe(function (newValue) {
                                timeline.isSelectTime = newValue;
                                //timeline.Draw("data");
                            });
                        }
                        if (params.isMoveHorizontal && ko.isObservable(params.isMoveHorizontal)) {
                            params.isMoveHorizontal.subscribe(function (newValue) {
                                timeline.isMoveHorizontal = newValue;
                                //timeline.Draw("data");
                            });
                        }
                        if (params.isMoveVertical && ko.isObservable(params.isMoveVertical)) {
                            params.isMoveVertical.subscribe(function (newValue) {
                                timeline.isMoveVertical = newValue;
                                //timeline.Draw("data");
                            });
                        }
                        var _loop_1 = function () {
                            if (ko.isObservable(TLParams.panels[p].fields)) {
                                var indxP_1 = p;
                                TLParams.panels[p].fields.subscribe(function (newValue) {
                                    //console.log(indxP + " : " + JSON.stringify(newValue));
                                    var __fields = [];
                                    __fields.push(newValue);
                                    for (var f = 0; f < __fields.length; f++) {
                                        var field = {
                                            field: __fields[f].field,
                                            title: __fields[f].title,
                                            style: __fields[f].style,
                                            color: "red",
                                            width: __fields[f].width,
                                            IsVisible: true,
                                            data: ko.utils.unwrapObservable(__fields[f].data)
                                        };
                                    }
                                    timeline.panels[indxP_1].fields = __fields;
                                    console.log(timeline.panels[indxP_1].fields);
                                    timeline.Draw("field_array");
                                });
                                var _loop_2 = function () {
                                    if (TLParams.panels[indxP_1].fields[f].data && ko.isObservable(TLParams.panels[indxP_1].fields[f].data)) {
                                        var indxF_1 = f;
                                        TLParams.panels[indxP_1].fields[f].data.subscribe(function (newValue) {
                                            //console.log(indxP + " : " + indxF);
                                            timeline.panels[indxP_1].fields[indxF_1].data = newValue;
                                            timeline.Draw("field");
                                        });
                                    }
                                };
                                for (var f = 0; f < TLParams.panels[indxP_1].fields.length; f++) {
                                    _loop_2();
                                }
                            }
                            var _loop_3 = function () {
                                if (TLParams.panels[p].fields[f].data && ko.isObservable(TLParams.panels[p].fields[f].data)) {
                                    var indxP_2 = p;
                                    var indxF_2 = f;
                                    TLParams.panels[p].fields[f].data.subscribe(function (newValue) {
                                        //console.log(indxP + " : " + indxF);
                                        timeline.panels[indxP_2].fields[indxF_2].data = newValue;
                                        timeline.Draw("field");
                                    });
                                }
                            };
                            for (var f = 0; f < TLParams.panels[p].fields.length; f++) {
                                _loop_3();
                            }
                        };
                        for (var p = 0; p < TLParams.panels.length; p++) {
                            _loop_1();
                        }
                        return timeline;
                    }
                },
                template: "<!-- ko template: { nodes: $componentTemplateNodes } --><!-- /ko -->"
            });
        }
    })(knockout = rlab.knockout || (rlab.knockout = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.timeline.js.map