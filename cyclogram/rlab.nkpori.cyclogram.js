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
                    legend.style.width = "".concat(legendWidth, "px");
                    legend.style.height = "326px";
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
                //svgLines.remove();
                var svgDiv = document.getElementById("figure");
                var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", "100%");
                svg.setAttribute("height", "100%");
                svg.setAttribute("id", "lines");
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
                    var kbvLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                    kbvLine.setAttribute("stroke", "green");
                    kbvLine.setAttribute("stroke-width", "2");
                    kbvLine.setAttribute("points", "0,0 0,0 0,0 0,0");
                    kbvLine.setAttribute("fill", "none");
                    kbvLine.setAttribute("id", "KbvLine_".concat(square.index));
                    var pollLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                    pollLine.setAttribute("stroke", "blue");
                    pollLine.setAttribute("stroke-width", "2");
                    pollLine.setAttribute("points", "0,0 0,0 0,0 0,0");
                    pollLine.setAttribute("fill", "none");
                    pollLine.setAttribute("id", "PollLine_".concat(square.index));
                    svg.appendChild(kbvLine);
                    svg.appendChild(pollLine);
                });
                //let lineHalfset = document.createElementNS("http://www.w3.org/2000/svg", "line");
                //lineHalfset.setAttribute("stroke", "black");
                //lineHalfset.setAttribute("stroke-width", "2");
                //lineHalfset.setAttribute("z-index", "100");
                //lineHalfset.setAttribute("x1", "6px");
                //lineHalfset.setAttribute("y1", "270px");
                //lineHalfset.setAttribute("x2", "155px");
                //lineHalfset.setAttribute("y2", "270px");
                //svg.appendChild(lineHalfset);
                //svg.appendChild(pollLine);
                svgDiv.appendChild(svg);
                //document.body.appendChild(svg);
                self.updBKUSNIlines();
            };
            CyclogramModel.prototype.updBKUSNIlines = function () {
                var self = this;
                self.mnemoSquares().forEach(function (square) {
                    var kbvLine = document.getElementById("KbvLine_".concat(square.index));
                    var pollLine = document.getElementById("PollLine_".concat(square.index));
                    //const pollLine = document.getElementById("PollLine");
                    if (square.Title != "БКУСНИ") {
                        var kbvLineCoords = self.calcLineCoordinates(square.index, square.Title, "kbv");
                        kbvLine.setAttribute("points", "".concat(kbvLineCoords.x1, ",").concat(kbvLineCoords.y1, " \n").concat(kbvLineCoords.x2, ",").concat(kbvLineCoords.y2, " ").concat(kbvLineCoords.x3, ",").concat(kbvLineCoords.y3, " ").concat(kbvLineCoords.x4, ",").concat(kbvLineCoords.y4));
                        var pollLineCoords = self.calcLineCoordinates(square.index, square.Title, "poll");
                        pollLine.setAttribute("points", "".concat(pollLineCoords.x1, ",").concat(pollLineCoords.y1, " \n").concat(pollLineCoords.x2, ",").concat(pollLineCoords.y2, " ").concat(pollLineCoords.x3, ",").concat(pollLineCoords.y3, " ").concat(pollLineCoords.x4, ",").concat(pollLineCoords.y4));
                    }
                });
            };
            CyclogramModel.prototype.calcLineCoordinates = function (squareIndex, squareTitle, lineType) {
                var self = this;
                var offset = 0;
                var lineOffset = 0;
                var offsetWight = 0; // TO FIX WIGHT BETWEN TWO LINES
                var fixingOffset = 0; // TO FIX SWAPPING GREEN WITH BLUE IN THE MIDDLE TOP OR BOT
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
                    y2: "",
                    x3: "",
                    y3: "",
                    x4: "",
                    y4: ""
                };
                if (lineType == 'kbv') {
                    switch (squareIndex) { // 0,1,2,3 - TOP SQUARES, LINE TO THEM IS GREEN, 'CAUSE OF 'KBV'
                        case 0:
                            lineOffset = 10;
                            offsetWight = 5;
                            offset = bkusniCoords.width / 16;
                            break;
                        case 7:
                            lineOffset = 10;
                            offsetWight = -5;
                            offset = bkusniCoords.width / 16;
                            break;
                        case 1:
                            offset = bkusniCoords.width * 5 / 16;
                            offsetWight = 5;
                            break;
                        case 8:
                            offset = bkusniCoords.width * 5 / 16;
                            offsetWight = -5;
                            break;
                        case 2:
                            offset = bkusniCoords.width * 9 / 16;
                            offsetWight = -10;
                            fixingOffset = 10;
                            break;
                        case 9:
                            offset = bkusniCoords.width * 9 / 16;
                            offsetWight = 10;
                            fixingOffset = -10;
                            break;
                        case 3:
                            lineOffset = -40;
                            offsetWight = -5;
                            fixingOffset = 5;
                            offset = bkusniCoords.width * 13 / 16;
                            break;
                        case 10:
                            lineOffset = -40;
                            offsetWight = 5;
                            fixingOffset = -5;
                            offset = bkusniCoords.width * 13 / 16;
                            break;
                    }
                }
                else {
                    switch (squareIndex) {
                        case 0:
                            lineOffset = 40;
                            offset = bkusniCoords.width * 3 / 16;
                            break;
                        case 7:
                            lineOffset = 40;
                            offset = bkusniCoords.width * 3 / 16;
                            break;
                        case 1:
                            lineOffset = 10;
                            offset = (bkusniCoords.width * 7 / 16) - lineOffset;
                            break;
                        case 8:
                            lineOffset = 10;
                            offset = (bkusniCoords.width * 7 / 16) - lineOffset;
                            break;
                        case 2:
                            lineOffset = 10;
                            fixingOffset = 5;
                            offset = (bkusniCoords.width * 11 / 16) - lineOffset;
                            break;
                        case 9:
                            lineOffset = 10;
                            fixingOffset = -5;
                            offset = (bkusniCoords.width * 11 / 16) - lineOffset;
                            break;
                        case 3:
                            lineOffset = -10;
                            fixingOffset = 5;
                            offset = bkusniCoords.width * 15 / 16;
                            break;
                        case 10:
                            lineOffset = -10;
                            fixingOffset = -5;
                            offset = bkusniCoords.width * 15 / 16;
                            break;
                        case 4:
                            lineOffset = 5;
                            break;
                        case 6:
                            lineOffset = 5;
                            break;
                    }
                }
                if (squareIndex != 4 && squareIndex != 5 && squareIndex != 6) {
                    if (squareIndex === 1 || squareIndex === 2) { // TOP MID
                        lineCoords = {
                            x1: "".concat(bkusniCoords.x + offset),
                            y1: "".concat(bkusniTop[1]),
                            x2: "".concat(bkusniCoords.x + offset),
                            y2: "".concat(bkusniTop[1] + (bkusniTop[1] - bkusniBot[1]) / 2 + offsetWight + fixingOffset),
                            x3: "".concat(squareBot[0] + lineOffset),
                            y3: "".concat(bkusniTop[1] + (bkusniTop[1] - bkusniBot[1]) / 2 + offsetWight + fixingOffset),
                            x4: "".concat(squareBot[0] + lineOffset),
                            y4: "".concat(squareBot[1])
                        };
                    }
                    else if (squareIndex === 0 || squareIndex === 3) { // TOP FACE
                        lineCoords = {
                            x1: "".concat(bkusniCoords.x + offset),
                            y1: "".concat(bkusniTop[1]),
                            x2: "".concat(bkusniCoords.x + offset),
                            y2: "".concat(bkusniTop[1] + (bkusniTop[1] - bkusniBot[1]) / 2 - (bkusniTop[1] - bkusniBot[1]) / 4 + offsetWight + fixingOffset),
                            x3: "".concat(squareBot[0] + lineOffset),
                            y3: "".concat(bkusniTop[1] + (bkusniTop[1] - bkusniBot[1]) / 2 - (bkusniTop[1] - bkusniBot[1]) / 4 + offsetWight + fixingOffset),
                            x4: "".concat(squareBot[0] + lineOffset),
                            y4: "".concat(squareBot[1])
                        };
                    }
                    else if (squareIndex === 7 || squareIndex === 10) { // BOT FACE
                        lineCoords = {
                            x1: "".concat(bkusniCoords.x + offset),
                            y1: "".concat(bkusniBot[1]),
                            x2: "".concat(bkusniCoords.x + offset),
                            y2: "".concat(bkusniBot[1] + (bkusniBot[1] - bkusniTop[1]) / 2 - (bkusniBot[1] - bkusniTop[1]) / 4 + offsetWight + fixingOffset),
                            x3: "".concat(squareTop[0] + lineOffset),
                            y3: "".concat(bkusniBot[1] + (bkusniBot[1] - bkusniTop[1]) / 2 - (bkusniBot[1] - bkusniTop[1]) / 4 + offsetWight + fixingOffset),
                            x4: "".concat(squareTop[0] + lineOffset),
                            y4: "".concat(squareTop[1])
                        };
                    }
                    else if (squareIndex === 8 || squareIndex === 9) { // BOT MID
                        lineCoords = {
                            x1: "".concat(bkusniCoords.x + offset),
                            y1: "".concat(bkusniBot[1]),
                            x2: "".concat(bkusniCoords.x + offset),
                            y2: "".concat(bkusniBot[1] + (bkusniBot[1] - bkusniTop[1]) / 2 + offsetWight + fixingOffset),
                            x3: "".concat(squareBot[0] + lineOffset),
                            y3: "".concat(bkusniBot[1] + (bkusniBot[1] - bkusniTop[1]) / 2 + offsetWight + fixingOffset),
                            x4: "".concat(squareTop[0] + lineOffset),
                            y4: "".concat(squareTop[1])
                        };
                    }
                }
                else if (squareIndex === 4) {
                    lineCoords = {
                        x1: "".concat(bkusniLSide[0]),
                        y1: "".concat(bkusniLSide[1] + lineOffset),
                        x2: "".concat(bkusniLSide[0]),
                        y2: "".concat(bkusniLSide[1] + lineOffset),
                        x3: '',
                        y3: '',
                        x4: "".concat(squareRSide[0]),
                        y4: "".concat(squareRSide[1] + lineOffset)
                    };
                }
                else if (squareIndex === 6) {
                    lineCoords = {
                        x1: "".concat(bkusniRSide[0]),
                        y1: "".concat(bkusniRSide[1] + lineOffset),
                        x2: "".concat(bkusniRSide[0]),
                        y2: "".concat(bkusniRSide[1] + lineOffset),
                        x3: '',
                        y3: '',
                        x4: "".concat(squareLSide[0]),
                        y4: "".concat(squareLSide[1] + lineOffset)
                    };
                }
                return lineCoords;
            };
            CyclogramModel.prototype.calcSVGSquareWidth = function () {
                var containerWidth = document.getElementById("SVG").offsetWidth;
                var squareWidth = (containerWidth - 30) / 5;
                if (squareWidth > 165) {
                    return squareWidth;
                }
                else if (squareWidth < 115) {
                    return squareWidth;
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
            CyclogramModel.prototype.buildSVGsquares = function () {
                var self = this;
                var elemFigure = document.getElementById("figure");
                var fragment = document.createDocumentFragment();
                var elemDiv = document.createElement("div");
                elemDiv.setAttribute("id", "squares");
                var svgns = "http://www.w3.org/2000/svg";
                self.mnemoSquares().forEach(function (square) {
                    var elemSVG = document.createElementNS(svgns, "svg");
                    elemSVG.setAttribute("viewBox", "0 0 160 75");
                    var svgBinding = "style: { 'position': 'absolute', 'top': top, 'left': left, 'width': width, 'height': height }";
                    elemSVG.setAttribute("id", square.Title);
                    elemSVG.setAttribute("data-bind", svgBinding);
                    var svgBindingContext = {
                        top: square.top,
                        left: square.left,
                        width: square.width,
                        height: square.height
                    };
                    ko.applyBindings(svgBindingContext, elemSVG);
                    var elemGroup = document.createElementNS(svgns, "g");
                    var groupElements = [];
                    var elemRect = document.createElementNS(svgns, "rect");
                    var elemCircle = document.createElementNS(svgns, "circle");
                    var elemTextTitle = document.createElementNS(svgns, "text");
                    var elemForeignObject = document.createElementNS(svgns, "foreignObject");
                    var elemTextInObject = document.createElement("text");
                    elemRect.setAttribute("x", "0");
                    elemRect.setAttribute("y", "0");
                    elemRect.setAttribute("width", "155");
                    elemRect.setAttribute("height", "70");
                    elemRect.setAttribute("rx", "5");
                    elemRect.setAttribute("ry", "5");
                    var rectBinding = "attr: { 'fill': fill, 'stroke': stroke }";
                    elemRect.setAttribute("data-bind", rectBinding);
                    var rectBindingContext = {
                        fill: square.fill,
                        stroke: square.stroke
                    };
                    ko.applyBindings(rectBindingContext, elemRect);
                    elemCircle.setAttribute("cx", "140");
                    elemCircle.setAttribute("cy", "10");
                    elemCircle.setAttribute("r", "5");
                    elemCircle.setAttribute("stroke", "black");
                    elemCircle.setAttribute("strokeWidth", "1");
                    var circleBinding = "attr: { 'fill': fill }";
                    elemCircle.setAttribute("data-bind", circleBinding);
                    var circleBindingContext = {
                        fill: square.Circle.css
                    };
                    ko.applyBindings(circleBindingContext, elemCircle);
                    elemTextTitle.setAttribute("text-anchor", "middle");
                    elemTextTitle.setAttribute("x", "75");
                    elemTextTitle.setAttribute("y", "18");
                    elemTextTitle.textContent = square.Title;
                    elemForeignObject.setAttribute("x", "5");
                    elemForeignObject.setAttribute("y", "25");
                    elemForeignObject.setAttribute("width", "145");
                    elemForeignObject.setAttribute("height", "50");
                    elemForeignObject.setAttribute("style", "font-size: 14px; line-height: 20px;");
                    var textInObjBinding = "text: text";
                    elemTextInObject.setAttribute("data-bind", textInObjBinding);
                    var bindingContext = {
                        text: square.text
                    };
                    ko.applyBindings(bindingContext, elemTextInObject);
                    elemForeignObject.appendChild(elemTextInObject);
                    groupElements.push(elemRect, elemCircle, elemTextTitle, elemForeignObject);
                    //if (square.Title === "ГАЛС") {
                    //    let elemLine = document.createElementNS(svgns, "line");
                    //    elemLine.setAttribute("x1", "0");
                    //    elemLine.setAttribute("y1", `${square.height() / 2}`);
                    //    elemLine.setAttribute("x2", `${square.width()}`);
                    //    elemLine.setAttribute("y2", `${square.height() / 2}`);
                    //    elemLine.setAttribute("stroke", "black");  
                    //    elemLine.setAttribute("stroke-width", "1");
                    //    groupElements.push(elemLine);
                    //}
                    for (var _i = 0, groupElements_1 = groupElements; _i < groupElements_1.length; _i++) {
                        var element = groupElements_1[_i];
                        elemGroup.appendChild(element);
                    }
                    elemSVG.appendChild(elemGroup);
                    elemDiv.appendChild(elemSVG);
                });
                fragment.appendChild(elemDiv);
                elemFigure.appendChild(fragment);
            };
            CyclogramModel.prototype.calcSVGSquares = function () {
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
                            top: "".concat(25 + 10, "%"),
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
                            top: "".concat(top, "%"),
                            left: "".concat(left, "%"),
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
                                    top: "".concat(25 + 10, "%"),
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
                                    top: "".concat(25 + 10, "%"),
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
                var svgLines = document.getElementById("lines");
                var divSqaures = document.getElementById("squares");
                rlab.services.Request({
                    url: "../services/StateMachine.svc/CalculationNI?sequence=".concat(guid),
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
                        });
                        self.calcSVGSquares();
                        if (divSqaures) {
                            divSqaures.remove();
                        }
                        self.buildSVGsquares();
                        if (svgLines) {
                            self.updBKUSNIlines();
                        }
                        else {
                            self.drawBKUSNILines();
                        }
                        self.updSVGSquareState();
                        self.updTimeLine();
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
                    url: "../services/Sequences.svc/sequenceitemNI?guidsequence=".concat(guid, "&rows=10000&page=1&sidx=Offset&sord=asc"),
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