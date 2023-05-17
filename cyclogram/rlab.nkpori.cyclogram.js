///<reference path="../lib/typing/knockout.d.ts" />
///<reference path="../lib/rlab.nkpori.config.ts" />
var rlab;
(function (rlab) {
    var nkpori;
    (function (nkpori) {
        var CyclogramModel = /** @class */ (function () {
            function CyclogramModel(params) {
                this.isTimeLineVisible = ko.observable(false);
                this.isSVGvisible = ko.observable(false);
                this.cycTablePage = 1;
                this.subscriptions = [];
                this.timers = [];
                this.mnemoSquares = ko.observableArray([]);
                this.states = [];
                this.intervals = [];
                //this.spaceCraft = ko.observable(SCs[0].key);
                this.definitions = ko.observableArray([]);
                this.instruments = ko.observableArray([]);
                this.cyclograms = ko.observableArray([]);
                this.selectedCyclogramGUID = ko.observable(null);
                this.commands = ko.observableArray([]);
                this.dateLimitParams = ko.observable({
                    begin: ko.observable(new Date(0)),
                    end: ko.observable(new Date(10 * 60 * 1000))
                });
                this.timeLineOptions = {
                    data: this.commands,
                    dateRange: this.dateLimitParams,
                    zoomable: true,
                    isZoom: ko.observable(false),
                    isMoveHorizontal: ko.observable(false),
                    isMoveVertical: ko.observable(false),
                    isSelectItems: ko.observable(false),
                    isSelectTime: ko.observable(false),
                    panels: [
                        {
                            min: -1,
                            max: 2,
                            isAxis: false,
                            fields: [],
                            isScale: false
                            //IsVisible: false
                        },
                        {
                            //min: -1,
                            //max: 2,
                            height: 200,
                            isAxis: false,
                            fields: []
                        }
                    ],
                    selectedItems: ko.observableArray([]),
                    selectedTime: ko.observable(new Date(0))
                };
                console.log("CyclogramModel: constructed");
                this.GetInstruments();
                this.GetCommandDefinition();
                //this.GetCyclogram(this.cycTablePage);
                this.timeLineOptions;
                this.GetStates();
            }
            CyclogramModel.prototype.dispose = function () {
                while (this.timers.length > 0) {
                    clearInterval(this.timers.shift());
                }
                while (this.subscriptions.length > 0) {
                    this.subscriptions.shift().dispose();
                }
                console.log("CyclogramModel: disposed");
            };
            CyclogramModel.prototype.ShowCyclogramContent = function (self) {
                var _this = this;
                self.dispose();
                var GUID = self.selectedCyclogramGUID();
                self.CommandsGet(GUID);
                self.timeLineOptions.selectedTime(new Date(0));
                self.GetIntervals(GUID);
                if (!self.timeLineOptions.isZoom()) {
                    self.timeLineOptions.isZoom(true);
                }
                if (!self.isSVGvisible()) {
                    self.isSVGvisible(true);
                }
                //this.resizeSVGSquare = this.resizeSVGSquare.bind(this);
                this.resizeSVGSquare = this.resizeSVGSquare.bind(this);
                window.addEventListener("resize", this.resizeSVGSquare);
                window.addEventListener("resize", this.updateLegendWidth);
                this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(function (newValue) {
                    _this.updSVGSquareState();
                }, this));
            };
            CyclogramModel.prototype.updateLegendWidth = function () {
                var legend = document.getElementById("legend");
                if (legend) {
                    var legendWidth = window.innerWidth * 0.1;
                    legend.style.width = legendWidth + "px";
                }
            };
            CyclogramModel.prototype.getRectPos = function (id) {
                var SVGSquarePos;
                var svg = document.getElementById(id);
                var div = document.getElementById("figure").getBoundingClientRect();
                var rect = svg.querySelector('g > rect');
                var boundingClientRect = rect.getBoundingClientRect();
                SVGSquarePos = {
                    x: boundingClientRect.x - div.x,
                    y: boundingClientRect.y - div.y,
                    width: boundingClientRect.width,
                    height: boundingClientRect.height
                };
                return SVGSquarePos;
            };
            CyclogramModel.prototype.countMiddleCoord = function (id, side) {
                var self = this;
                var coordinates = self.getRectPos(id);
                if (side == "top") {
                    var x = coordinates.x + (coordinates.width / 2);
                    var y = coordinates.y;
                    return [x, y];
                }
                else if (side == "lside") {
                    var x = coordinates.x;
                    var y = coordinates.y + (coordinates.height / 2);
                    return [x, y];
                }
                else if (side == "rside") {
                    var x = coordinates.x + coordinates.width;
                    var y = coordinates.y + (coordinates.height / 2);
                    return [x, y];
                }
                else if (side == "bot") {
                    var x = coordinates.x + (coordinates.width / 2);
                    var y = coordinates.y + coordinates.height;
                    return [x, y];
                }
            };
            CyclogramModel.prototype.drawBKUSNILines = function () {
                var self = this;
                var svgDiv = document.getElementById("figure");
                //const svg = document.getElementById("БКУСНИ");
                //let div = document.getElementById("SVG").getBoundingClientRect();
                var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", "100%");
                svg.setAttribute("height", "100%");
                self.mnemoSquares().forEach(function (square) {
                    //if (square.Title == "БКУСНИ") {
                    //    line.setAttribute("x1", "0px");
                    //    line.setAttribute("y1", "0px");
                    //}
                    //else if (square.Title == "ЛАЭРТ") {
                    //    line.setAttribute("x2", "0px");
                    //    line.setAttribute("y2", "0px");
                    //    line.setAttribute("id", "KbvLine");
                    //    //pollLine.setAttribute("id", "PollLine");
                    //}
                    var kbvLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    kbvLine.setAttribute("stroke", "green");
                    kbvLine.setAttribute("stroke-width", "2");
                    kbvLine.setAttribute("x1", "0px");
                    kbvLine.setAttribute("y1", "0px");
                    kbvLine.setAttribute("x2", "0px");
                    kbvLine.setAttribute("y2", "0px");
                    kbvLine.setAttribute("id", "KbvLine_" + square.index);
                    var pollLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    pollLine.setAttribute("stroke", "blue");
                    pollLine.setAttribute("stroke-width", "2");
                    pollLine.setAttribute("x1", "0px");
                    pollLine.setAttribute("y1", "0px");
                    pollLine.setAttribute("x2", "0px");
                    pollLine.setAttribute("y2", "0px");
                    pollLine.setAttribute("id", "PollLine_" + square.index);
                    svg.appendChild(kbvLine);
                    svg.appendChild(pollLine);
                });
                //svg.appendChild(pollLine);
                svgDiv.appendChild(svg);
                //document.body.appendChild(svg);
            };
            CyclogramModel.prototype.updBKUSNIlines = function () {
                var self = this;
                self.mnemoSquares().forEach(function (square) {
                    var kbvLine = document.getElementById("KbvLine_" + square.index);
                    var pollLine = document.getElementById("PollLine_" + square.index);
                    //const pollLine = document.getElementById("PollLine");
                    if (square.Title != "БКУСНИ") {
                        var kbvLineCoords = self.calcLineCoordinates(square.index, square.Title, "kbv");
                        kbvLine.setAttribute("x1", kbvLineCoords.x1);
                        kbvLine.setAttribute("y1", kbvLineCoords.y1);
                        kbvLine.setAttribute("x2", kbvLineCoords.x2);
                        kbvLine.setAttribute("y2", kbvLineCoords.y2);
                        var pollLineCoords = self.calcLineCoordinates(square.index, square.Title, "poll");
                        pollLine.setAttribute("x1", pollLineCoords.x1);
                        pollLine.setAttribute("y1", pollLineCoords.y1);
                        pollLine.setAttribute("x2", pollLineCoords.x2);
                        pollLine.setAttribute("y2", pollLineCoords.y2);
                    }
                });
            };
            CyclogramModel.prototype.calcLineCoordinates = function (squareIndex, squareTitle, lineType) {
                var self = this;
                var offset = 0;
                var lineOffset = 0;
                var bkusniCoords = self.getRectPos("БКУСНИ");
                //let bkusniTop = self.countMiddleCoord("БКУСНИ", "top");
                var bkusniTop = self.countMiddleCoord("БКУСНИ", "top");
                var bkusniBot = self.countMiddleCoord("БКУСНИ", "bot");
                var bkusniLSide = self.countMiddleCoord("БКУСНИ", "lside");
                var bkusniRSide = self.countMiddleCoord("БКУСНИ", "rside");
                var squareBot = self.countMiddleCoord(squareTitle, "bot");
                var squareTop = self.countMiddleCoord(squareTitle, "top");
                var squareLSide = self.countMiddleCoord(squareTitle, "lside");
                var squareRSide = self.countMiddleCoord(squareTitle, "rside");
                var lineCoords = {
                    x1: "",
                    y1: "",
                    x2: "",
                    y2: ""
                };
                if (lineType == 'kbv') {
                    switch (squareIndex) {
                        case 0:
                        case 7:
                            lineOffset = 10;
                            offset = bkusniCoords.width / 16;
                            break;
                        case 1:
                        case 8:
                            offset = bkusniCoords.width * 5 / 16;
                            break;
                        case 2:
                        case 9:
                            offset = bkusniCoords.width * 9 / 16;
                            break;
                        case 3:
                        case 10:
                            lineOffset = -40;
                            offset = bkusniCoords.width * 13 / 16;
                            break;
                    }
                }
                else {
                    switch (squareIndex) {
                        case 0:
                        case 7:
                            lineOffset = 40;
                            offset = bkusniCoords.width * 3 / 16;
                            break;
                        case 1:
                        case 8:
                            lineOffset = 10;
                            offset = (bkusniCoords.width * 7 / 16) - lineOffset;
                            break;
                        case 2:
                        case 9:
                            lineOffset = 10;
                            offset = (bkusniCoords.width * 11 / 16) - lineOffset;
                            break;
                        case 3:
                        case 10:
                            lineOffset = -10;
                            offset = bkusniCoords.width * 15 / 16;
                            break;
                        case 4:
                        case 6:
                            lineOffset = 5;
                            break;
                    }
                }
                if (squareIndex != 4 && squareIndex != 5 && squareIndex != 6) {
                    if (squareIndex < 4) {
                        lineCoords = {
                            x1: bkusniCoords.x + offset + "px",
                            y1: bkusniTop[1] + "px",
                            x2: squareBot[0] + lineOffset + "px",
                            y2: squareBot[1] + "px"
                        };
                    }
                    else {
                        lineCoords = {
                            x1: bkusniCoords.x + offset + "px",
                            y1: bkusniBot[1] + "px",
                            x2: squareTop[0] + lineOffset + "px",
                            y2: squareTop[1] + "px"
                        };
                    }
                }
                else if (squareIndex === 4) {
                    lineCoords = {
                        x1: bkusniLSide[0] + "px",
                        y1: bkusniLSide[1] + lineOffset + "px",
                        x2: squareRSide[0] + "px",
                        y2: squareRSide[1] + lineOffset + "px"
                    };
                }
                else if (squareIndex === 6) {
                    lineCoords = {
                        x1: bkusniRSide[0] + "px",
                        y1: bkusniRSide[1] + lineOffset + "px",
                        x2: squareLSide[0] + "px",
                        y2: squareLSide[1] + lineOffset + "px"
                    };
                }
                return lineCoords;
            };
            CyclogramModel.prototype.calcSVGSquareWidth = function () {
                var containerWidth = document.getElementById("SVG").offsetWidth;
                var squareWidth = (containerWidth - 30) / 5;
                if (squareWidth > 165) {
                    return 165;
                }
                else if (squareWidth < 115) {
                    return 115;
                }
                else {
                    return (containerWidth - 30) / 5;
                }
            };
            CyclogramModel.prototype.resizeSVGSquare = function () {
                var self = this;
                var squareWidth = self.calcSVGSquareWidth();
                //console.log(squareWidth);
                self.mnemoSquares().forEach(function (square) {
                    square.height(squareWidth * 0.4375);
                });
                self.updBKUSNIlines();
            };
            CyclogramModel.prototype.drawSVGSquare = function () {
                var self = this;
                var squares = [];
                var squareWidth = self.calcSVGSquareWidth();
                var top = 0;
                var left = 0;
                var countSquare = 0;
                var countRow = 0;
                var square;
                var squareIndex = 0;
                self.instruments().forEach(function (instr) {
                    if (instr.Title.toString() == "БКУСНИ") {
                        square = ({
                            GUID: instr.GUID.toString(),
                            Title: instr.Title.toString(),
                            Circle: { css: ko.observable("#ebebeb") },
                            fill: ko.observable("#ebebeb"),
                            stroke: ko.observable("black"),
                            text: ko.observable("Расчет недоступен"),
                            top: 25 + 10 + "%",
                            left: "37.5%",
                            width: ko.observable(squareWidth),
                            height: ko.observable(squareWidth * 0.4375),
                            index: 5
                        });
                        return squares.push(square);
                    }
                    else {
                        square = ({
                            GUID: instr.GUID.toString(),
                            Title: instr.Title.toString(),
                            Circle: { css: ko.observable("#ebebeb") },
                            fill: ko.observable("#ebebeb"),
                            stroke: ko.observable("black"),
                            text: ko.observable("Расчет недоступен"),
                            top: top + "%",
                            left: left + "%",
                            width: ko.observable(squareWidth),
                            height: ko.observable(squareWidth * 0.4375),
                            index: squareIndex
                        });
                    }
                    if (countSquare < 3) {
                        if (countRow != 1) {
                            countSquare++;
                            left = left + 25;
                            squareIndex++;
                        }
                        else {
                            if (countSquare == 0) {
                                square = ({
                                    GUID: instr.GUID.toString(),
                                    Title: instr.Title.toString(),
                                    Circle: { css: ko.observable("#ebebeb") },
                                    fill: ko.observable("#ebebeb"),
                                    stroke: ko.observable("black"),
                                    text: ko.observable("Расчет недоступен"),
                                    top: 25 + 10 + "%",
                                    left: "0%",
                                    width: ko.observable(squareWidth),
                                    height: ko.observable(squareWidth * 0.4375),
                                    index: 4
                                });
                                countSquare++;
                                squareIndex += 2;
                            }
                            else if (countSquare == 1) {
                                square = ({
                                    GUID: instr.GUID.toString(),
                                    Title: instr.Title.toString(),
                                    Circle: { css: ko.observable("#ebebeb") },
                                    fill: ko.observable("#ebebeb"),
                                    stroke: ko.observable("black"),
                                    text: ko.observable("Расчет недоступен"),
                                    top: 25 + 10 + "%",
                                    left: "75%",
                                    width: ko.observable(squareWidth),
                                    height: ko.observable(squareWidth * 0.4375),
                                    index: 6
                                });
                                countRow++;
                                countSquare = 0;
                                top = top + 25 + 10;
                                left = 0;
                                squareIndex += 2;
                            }
                        }
                    }
                    else {
                        top = top + 25 + 10;
                        left = 25;
                        countSquare = 0;
                        countRow++;
                    }
                    squares.push(square);
                });
                self.mnemoSquares(squares);
            };
            CyclogramModel.prototype.GetStates = function () {
                var self = this;
                rlab.services.Request({
                    url: "../services/StateMachine.svc/state",
                    //request: {
                    //    spacecraft: self.spaceCraft(),
                    //},
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (state) {
                            tmp_data.push({
                                GUID: state.GUID,
                                GUIDInstrument: state.GUIDInstrument,
                                Title: state.Title
                            });
                        });
                        self.states = tmp_data;
                        //console.log(self.definitions());
                        console.log("список состояний загружен");
                    }
                });
            };
            CyclogramModel.prototype.updSVGSquareState = function () {
                var self = this;
                for (var key in self.intervals) {
                    var value = self.intervals[key];
                    //var selectedTime = 254;
                    var selectedTime = self.timeLineOptions.selectedTime() / 1000;
                    //console.log("Instrument GUID: " + key);
                    value.forEach(function (val) {
                        if (value.length == 1) {
                            self.mnemoSquares().forEach(function (square) {
                                if (key == square.GUID) {
                                    square.text("Расчет недоступен");
                                    square.fill("#ebebeb");
                                    square.Circle.css("#ebebeb");
                                }
                            });
                        }
                        else {
                            if (selectedTime > val.startOffset && selectedTime < val.stopOffset) {
                                self.states.forEach(function (state) {
                                    if (val.GUIDState == state.GUID) {
                                        //console.log("State: " + state.Title);
                                        self.mnemoSquares().forEach(function (square) {
                                            if (square.GUID == state.GUIDInstrument) {
                                                square.text(state.Title);
                                                if (state.Title == "Отключен") {
                                                    square.fill("#ebebeb");
                                                }
                                                else {
                                                    square.fill("#a8c6f7");
                                                }
                                                if (val.GUIDState == "2e85bad5-6a49-ed11-8edc-00155d09ea1d") {
                                                    square.Circle.css("lightgreen");
                                                }
                                                else {
                                                    square.Circle.css("#ebebeb");
                                                }
                                            }
                                        });
                                    }
                                    else if (val.GUIDState == "00000000-0000-0000-0000-000000000000") {
                                        self.updBKUSNIlines();
                                    }
                                });
                            }
                        }
                    });
                }
            };
            CyclogramModel.prototype.updTimeLine = function () {
                var self = this;
                var count = 1;
                for (var key in self.intervals) {
                    var value = self.intervals[key];
                    //value.forEach(val => {
                    self.timeLineOptions.panels[1].fields.forEach(function (instr) {
                        if (key == instr.guidInstr) {
                            //instr.data = { begin: new Date(), end: new Date(), value: count + 1 };
                            if (value.length > 1) {
                                var startOffset = value[0].startOffset;
                                var stopOffset = value[value.length - 1].stopOffset;
                                instr.data.push({ begin: new Date(startOffset * 1000), end: new Date(stopOffset * 1000), value: count + 1 });
                            }
                            else {
                                instr.data.removeAll();
                            }
                        }
                    });
                    count += 2;
                    //});
                }
                self.dateLimitParams.valueHasMutated();
                //self.dataArray.push({ begin: new Date(1), end: new Date(50000), value: 1 });
            };
            CyclogramModel.prototype.GetIntervals = function (guid) {
                var self = this;
                rlab.services.Request({
                    url: "../services/StateMachine.svc/CalculationNI?sequence=" + guid,
                    //request: {
                    //    spacecraft: self.spaceCraft(),
                    //},
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        //let tmp_dict: {};
                        var tmp_intervals = [];
                        data.forEach(function (instr) {
                            tmp_intervals = instr.Value;
                            self.intervals[instr.Key] = tmp_intervals;
                            //console.log(tmp_intervals);
                            //console.log(tmp_dict);
                            //console.log(instr.Key);
                            //console.log(instr.Value);
                        });
                        self.drawSVGSquare();
                        self.drawBKUSNILines();
                        self.updSVGSquareState();
                        self.updTimeLine();
                        //self.intervals = tmp_dict;
                        //console.log(new Date(self.intervals[0][0].startOffset * 1000));
                        //console.log(new Date(self.intervals[0][0].stopOffset * 1000));
                    },
                    error: function (data) {
                        console.log("Ошибка");
                    }
                });
            };
            CyclogramModel.prototype.GetCommandDefinition = function () {
                var self = this;
                rlab.services.Request({
                    url: "../services/Sequences.svc/sequenceitemdefinition",
                    //request: {
                    //    spacecraft: self.spaceCraft(),
                    //},
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (def) {
                            tmp_data.push({
                                GUID: def.GUID,
                                GUIDInstrument: def.GUIDInstrument,
                                ID: def.ID,
                                Title: def.Title
                            });
                        });
                        self.definitions(tmp_data);
                        //console.log(self.definitions());
                        console.log("список определений команд загружен");
                    },
                    error: function (data) {
                        self.cyclograms([]);
                        console.log("Ошибка загрузки списка определений команд");
                    }
                });
            };
            CyclogramModel.prototype.GetInstruments = function () {
                var self = this;
                rlab.services.Request({
                    url: "../services/Sequences.svc/instrument",
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        //let tmp_data: Instrument[] = [];
                        data.forEach(function (instr) {
                            var item = {
                                GUID: instr.GUID,
                                SecurityGroup: instr.SecurityGroup,
                                Title: instr.Title,
                            };
                            self.timeLineOptions.panels[0].fields.push({ title: item.Title, field: item.SecurityGroup + "_value", style: "event", width: 2 });
                            self.timeLineOptions.panels[1].fields.push({ title: item.Title, field: "value", style: "segment", width: 10, data: ko.observableArray([]), guidInstr: item.GUID });
                            //self.timeLineOptions.panels[1].fields.push({ title: item.Title, field: "value", style: "segment", width: 5 });
                            self.instruments.push(item);
                        });
                        self.dateLimitParams.valueHasMutated();
                        self.isTimeLineVisible(true);
                        console.log("список приборов загружен");
                        //console.log(self.instruments());
                        self.instruments().forEach(function (instr) {
                            self.intervals[instr.GUID] = {};
                        });
                        //self.drawSVGSquare();
                        console.log("приборы на мнемосхеме построены");
                    },
                    error: function (data) {
                        //self.instruments([]);
                        self.timeLineOptions.panels[0].fields([]);
                        console.log("Ошибка загрузки ");
                    }
                });
            };
            CyclogramModel.prototype.CommandsGet = function (guid) {
                var self = this;
                rlab.services.Request({
                    //url: "/services/Planning.svc/command",
                    url: "../services/Sequences.svc/sequenceitemNI?guidsequence=" + guid + "&rows=10000&page=1&sidx=Offset&sord=asc",
                    //request: {
                    //    spacecraft: self.spaceCraft(),
                    //    guidCyclogram: guid
                    //},
                    type: "GET",
                    contentType: "application/json",
                    //success: function (data: any[]) {
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (com) {
                            ///kostyl' !!!!!!
                            //com.Instrument = Instr[0].key 
                            var item = {
                                GUID: com.GUID,
                                GUIDSequenceItemDef: com.GUIDSequenceItemDef,
                                GUIDSequence: com.GUIDSequence,
                                Offset: ko.observable(com.Offset * 1000),
                                begin: new Date(com.Offset * 1000)
                            };
                            /*item[com.Instrument + "_value"] = com.Code*/ /*;*/
                            //self.definitions().forEach(def => { if (def.GUID == com.GUIDSequenceItemDef) { console.log(def.GUIDInstrument) } });
                            self.definitions().forEach(function (def) {
                                if (def.GUID == com.GUIDSequenceItemDef) {
                                    self.instruments().forEach(function (instr) {
                                        if (def.GUIDInstrument == instr.GUID.toString()) {
                                            //console.log(instr.Title);
                                            item[instr.SecurityGroup + "_value"] = def.Title;
                                        }
                                    });
                                }
                            });
                            //item["iosph0-instr-pes_value"] = com.GUID;
                            tmp_data.push(item);
                        });
                        self.timeLineOptions.isSelectTime(true);
                        self.dateLimitParams().begin(new Date(-1 * 1000 * 5));
                        self.dateLimitParams().end(new Date(tmp_data[tmp_data.length - 1].Offset() * 1.2));
                        self.commands(tmp_data);
                        //self.timeLineOptions.panels[1].data.push({ "iosph0-instr-pes_value1": "Режим 1", "begin": new Date(0), "end": new Date(50000) });
                        self.dateLimitParams.valueHasMutated();
                        console.log("список команд загружен");
                        //console.log(self.dateLimitParams().end());
                        //console.log(self.commands());
                    },
                    error: function (data) {
                        self.cyclograms([]);
                        console.log("Ошибка загрузки списка команд");
                    }
                });
            };
            return CyclogramModel;
        }());
        nkpori.CyclogramModel = CyclogramModel;
    })(nkpori = rlab.nkpori || (rlab.nkpori = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.nkpori.cyclogram.js.map