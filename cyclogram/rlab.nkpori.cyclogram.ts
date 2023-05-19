///<reference path="../lib/typing/knockout.d.ts" />
///<reference path="../lib/rlab.nkpori.config.ts" />


namespace rlab.nkpori {

    interface CommandDef {
        GUID: string,
        GUIDInstrument: string,
        ID: string,
        Title: string
    }

    interface Command {
        GUID: string,
        GUIDSequenceItemDef: string,
        GUIDSequence: string,
        Offset: ko.Observable<number>,

        /// need for timeline
        begin: Date
    }

    interface State {
        GUID: string,
        GUIDInstrument: string,
        Title: string
    }


    interface Instrument {
        GUID: string,
        SecurityGroup: string,
        Title: string
    }


    interface ElementPos {
        x: number,
        y: number,
        width: number,
        height: number
    }

    interface LineCoords {
        x1: string,
        y1: string,
        x2: string,
        y2: string
    }


    export class CyclogramModel {
        subscriptions: ko.Subscription[];
        timers: number[];

        spaceCraft: ko.Observable<string>;

        dateLimitParams: ko.Observable<{ begin: ko.Observable<Date>, end: ko.Observable<Date> }>;
        timeLineOptions: any;

        isTimeLineVisible: ko.Observable<boolean> = ko.observable(false);
        isSVGvisible: ko.Observable<boolean> = ko.observable(false);


        definitions: ko.ObservableArray<CommandDef>;
        cyclograms: ko.ObservableArray<Cyclogram>;
        instruments: ko.ObservableArray<Instrument>;
        selectedCyclogramGUID: ko.Observable<string>;
        commands: ko.ObservableArray<Command>;

        cycTablePage = 1;

        mnemoSquares: ko.ObservableArray<Square>;

        states: Array<State>;

        intervals: Array<any>;




        constructor(params: any) {

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

        dispose() {
            while (this.timers.length > 0) {
                clearInterval(this.timers.shift());
            }
            while (this.subscriptions.length > 0) {
                this.subscriptions.shift().dispose();
            }
            console.log("CyclogramModel: disposed");
        }

        ShowCyclogramContent(self: CyclogramModel) {
            self.dispose();
            let GUID = self.selectedCyclogramGUID();


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

            
            this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(newValue => {
                this.updSVGSquareState();
            }, this));
        }


        updateLegendWidth() {
            const legend = document.getElementById("legend");

            if (legend) {
                const legendWidth = window.innerWidth * 0.1;
                legend.style.width = `${legendWidth}px`;
            }
        }


        getRectPos(id: string) {
            let SVGSquarePos: ElementPos;
            let svg = document.getElementById(id);
            let div = document.getElementById("figure").getBoundingClientRect();
            let rect = svg.querySelector('g > rect');
            let boundingClientRect = rect.getBoundingClientRect();
            
            SVGSquarePos = {
                x: boundingClientRect.x - div.x,
                y: boundingClientRect.y - div.y,
                width: boundingClientRect.width,
                height: boundingClientRect.height
            };
            return SVGSquarePos;
        }

        countMiddleCoord(id: string, side: string) {
            let self = this;
            let coordinates = self.getRectPos(id);

            if (side == "top") {
                let x = coordinates.x + (coordinates.width / 2);
                let y = coordinates.y;
                return [x, y];
            }
            else if (side == "lside") {
                let x = coordinates.x;
                let y = coordinates.y + (coordinates.height / 2);
                return [x, y];
            }
            else if (side == "rside") {
                let x = coordinates.x + coordinates.width;
                let y = coordinates.y + (coordinates.height / 2);
                return [x, y];
            }
            else if (side == "bot") {
                let x = coordinates.x + (coordinates.width / 2);
                let y = coordinates.y + coordinates.height;
                return [x, y];
            }
        }

        drawBKUSNILines() {
            let self = this;
            //svgLines.remove();

            const svgDiv = document.getElementById("figure");

            
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("id", "lines");


            self.mnemoSquares().forEach(square => {
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
                const kbvLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                kbvLine.setAttribute("stroke", "green");
                kbvLine.setAttribute("stroke-width", "2");

                kbvLine.setAttribute("x1", "0px");
                kbvLine.setAttribute("y1", "0px");

                kbvLine.setAttribute("x2", "0px");
                kbvLine.setAttribute("y2", "0px");
                kbvLine.setAttribute("id", `KbvLine_${square.index}`);

                const pollLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                pollLine.setAttribute("stroke", "blue");
                pollLine.setAttribute("stroke-width", "2");

                pollLine.setAttribute("x1", "0px");
                pollLine.setAttribute("y1", "0px");

                pollLine.setAttribute("x2", "0px");
                pollLine.setAttribute("y2", "0px");
                pollLine.setAttribute("id", `PollLine_${square.index}`);

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
        }


        updBKUSNIlines() {
            let self = this;


            self.mnemoSquares().forEach(square => {
                let kbvLine = document.getElementById(`KbvLine_${square.index}`);
                let pollLine = document.getElementById(`PollLine_${square.index}`);
                //const pollLine = document.getElementById("PollLine");

                if (square.Title != "БКУСНИ") {

                    let kbvLineCoords = self.calcLineCoordinates(square.index, square.Title, "kbv");
                    kbvLine.setAttribute("x1", kbvLineCoords.x1);
                    kbvLine.setAttribute("y1", kbvLineCoords.y1);
                    kbvLine.setAttribute("x2", kbvLineCoords.x2);
                    kbvLine.setAttribute("y2", kbvLineCoords.y2);

                    let pollLineCoords = self.calcLineCoordinates(square.index, square.Title, "poll");
                    pollLine.setAttribute("x1", pollLineCoords.x1);
                    pollLine.setAttribute("y1", pollLineCoords.y1);
                    pollLine.setAttribute("x2", pollLineCoords.x2);
                    pollLine.setAttribute("y2", pollLineCoords.y2);


                }

            });

        }

        calcLineCoordinates(squareIndex: number, squareTitle: string, lineType: string) {
            let self = this;
            let offset = 0;
            let lineOffset = 0;

            let bkusniCoords = self.getRectPos("БКУСНИ");
            //let bkusniTop = self.countMiddleCoord("БКУСНИ", "top");
            let bkusniTop = self.countMiddleCoord("БКУСНИ", "top");
            let bkusniBot = self.countMiddleCoord("БКУСНИ", "bot");
            let bkusniLSide = self.countMiddleCoord("БКУСНИ", "lside");
            let bkusniRSide = self.countMiddleCoord("БКУСНИ", "rside");

            let squareBot = self.countMiddleCoord(squareTitle, "bot");
            let squareTop = self.countMiddleCoord(squareTitle, "top");
            let squareLSide = self.countMiddleCoord(squareTitle, "lside");

            let squareRSide = self.countMiddleCoord(squareTitle, "rside");
            let lineCoords: LineCoords = {
                x1: "",
                y1: "",
                x2: "",
                y2: ""
            }

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
                        x1: `${bkusniCoords.x + offset}px`,
                        y1: `${bkusniTop[1]}px`,
                        x2: `${squareBot[0] + lineOffset}px`,
                        y2: `${squareBot[1]}px`
                    }
                    
                } else {
                    lineCoords = {
                        x1: `${bkusniCoords.x + offset}px`,
                        y1: `${bkusniBot[1]}px`,
                        x2: `${squareTop[0] + lineOffset}px`,
                        y2: `${squareTop[1]}px`
                    }
                }
            } else if (squareIndex === 4) {
                lineCoords = {
                    x1: `${bkusniLSide[0]}px`,
                    y1: `${bkusniLSide[1] + lineOffset}px`,
                    x2: `${squareRSide[0]}px`,
                    y2: `${squareRSide[1] + lineOffset}px`
                }
            } else if (squareIndex === 6) {
                lineCoords = {
                    x1: `${bkusniRSide[0]}px`,
                    y1: `${bkusniRSide[1] + lineOffset}px`,
                    x2: `${squareLSide[0]}px`,
                    y2: `${squareLSide[1] + lineOffset}px`
                }
            }

            return lineCoords
        }

        calcSVGSquareWidth() {
            let containerWidth = document.getElementById("SVG").offsetWidth;
            let squareWidth = (containerWidth - 30) / 5;

            if (squareWidth > 165) {
                return 165;
            }
            else if (squareWidth < 115) {
                return 115;
            }
            else {
                return (containerWidth - 30) / 5;
            }
        }

        resizeSVGSquare() {
            let self = this;
            let squareWidth = self.calcSVGSquareWidth();
            //console.log(squareWidth);
            self.mnemoSquares().forEach(square => {
                square.height(squareWidth * 0.4375);
            });
            self.updBKUSNIlines();
        }

        buildSVGsquares() {
            let self = this;
            const elemFigure = document.getElementById("figure");
            let fragment = document.createDocumentFragment();
            let elemDiv = document.createElement("div");
            elemDiv.setAttribute("id", "squares")
            let svgns = "http://www.w3.org/2000/svg";

            self.mnemoSquares().forEach(square => {
                let elemSVG = document.createElementNS(svgns, "svg");
                elemSVG.setAttribute("viewBox", "0 0 160 75");
                let svgBinding = "style: { 'position': 'absolute', 'top': top, 'left': left, 'width': width, 'height': height }";
                elemSVG.setAttribute("id", square.Title);
                elemSVG.setAttribute("data-bind", svgBinding);
                let svgBindingContext = {
                    top: square.top,
                    left: square.left,
                    width: square.width,
                    height: square.height
                };
                ko.applyBindings(svgBindingContext, elemSVG);

                let elemGroup = document.createElementNS(svgns, "g");
                let groupElements = [];
                let elemRect = document.createElementNS(svgns, "rect");
                let elemCircle = document.createElementNS(svgns, "circle");
                let elemTextTitle = document.createElementNS(svgns, "text");
                let elemForeignObject = document.createElementNS(svgns, "foreignObject");
                let elemTextInObject = document.createElement("text");

                elemRect.setAttribute("x", "0");
                elemRect.setAttribute("y", "0");
                elemRect.setAttribute("width", "155");
                elemRect.setAttribute("height", "70");
                elemRect.setAttribute("rx", "5");
                elemRect.setAttribute("ry", "5");
                let rectBinding = "attr: { 'fill': fill, 'stroke': stroke }";
                elemRect.setAttribute("data-bind", rectBinding);
                let rectBindingContext = {
                    fill: square.fill,
                    stroke: square.stroke
                };
                ko.applyBindings(rectBindingContext, elemRect);

                elemCircle.setAttribute("cx", "140");
                elemCircle.setAttribute("cy", "10");
                elemCircle.setAttribute("r", "5");
                elemCircle.setAttribute("stroke", "black");
                elemCircle.setAttribute("strokeWidth", "1");
                let circleBinding = "attr: { 'fill': fill }";
                elemCircle.setAttribute("data-bind", circleBinding);
                let circleBindingContext = {
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

                let textInObjBinding = `text: text`;
                elemTextInObject.setAttribute("data-bind", textInObjBinding);
                let bindingContext = {
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

                for (let element of groupElements) {
                    elemGroup.appendChild(element);
                }
                elemSVG.appendChild(elemGroup);
                elemDiv.appendChild(elemSVG);
            });

            fragment.appendChild(elemDiv);
            elemFigure.appendChild(fragment);
        }

        calcSVGSquares() {
            let self = this;
            let squares = [];
            let squareWidth = self.calcSVGSquareWidth();
            let top = 0;
            let left = 0;
            let countSquare = 0;
            let countRow = 0;
            let square: Square;
            let squareIndex = 0;

            self.instruments().forEach(instr => {
                if (instr.Title.toString() == "БКУСНИ") {
                    square = ({
                        GUID: instr.GUID.toString(),
                        Title: instr.Title.toString(),
                        Circle: { css: ko.observable("#ebebeb") },
                        fill: ko.observable("#ebebeb"),
                        stroke: ko.observable("black"),
                        text: ko.observable("Расчет недоступен"),
                        top: `${25 + 10}%`,
                        left: "37.5%",
                        width: ko.observable(squareWidth),
                        height: ko.observable(squareWidth * 0.4375), // 70/140 ratio
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
                        top: `${top}%`,
                        left: `${left}%`,
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
                                top: `${25 + 10}%`,
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
                                top: `${25 + 10}%`,
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
        }



        GetStates() {
            let self = this;

            rlab.services.Request({
                url: "../services/StateMachine.svc/state",
                //request: {
                //    spacecraft: self.spaceCraft(),
                //},
                type: "GET",
                contentType: "application/json",
                success: function (data: any[]) {
                    let tmp_data: State[] = [];
                    data.forEach(state => {
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
        }

        updSVGSquareState() {
            let self = this;

            for (var key in self.intervals) {
                var value = self.intervals[key];

                //var selectedTime = 254;
                var selectedTime = self.timeLineOptions.selectedTime() / 1000;

                //console.log("Instrument GUID: " + key);
                value.forEach(val => {
                    if (value.length == 1) {
                        self.mnemoSquares().forEach(square => {
                            if (key == square.GUID) {
                                square.text("Расчет недоступен");
                                square.fill("#ebebeb");
                                square.Circle.css("#ebebeb");
                            }
                        })
                    }
                    else {
                        if (selectedTime > val.startOffset && selectedTime < val.stopOffset) {
                            self.states.forEach(state => {
                                if (val.GUIDState == state.GUID) {
                                    //console.log("State: " + state.Title);
                                    self.mnemoSquares().forEach(square => {
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
                

        }


        updTimeLine() {
            let self = this;
            let count = 1;

            for (var key in self.intervals) {
                var value = self.intervals[key];
                //value.forEach(val => {
                self.timeLineOptions.panels[1].fields.forEach(instr => {
                    if (key == instr.guidInstr) {
                        //instr.data = { begin: new Date(), end: new Date(), value: count + 1 };
                        if (value.length > 1) { 
                            let startOffset = value[0].startOffset;
                            let stopOffset = value[value.length - 1].stopOffset;

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

        }

        GetIntervals(guid: string) {
            let self = this;
            var svgLines = document.getElementById("lines");
            var divSqaures = document.getElementById("squares");


            rlab.services.Request({
                url: `../services/StateMachine.svc/CalculationNI?sequence=${guid}`,
                //request: {
                //    spacecraft: self.spaceCraft(),
                //},
                type: "GET",
                contentType: "application/json",
                success: function (data: any[]) {
                    //let tmp_dict: {};
                    let tmp_intervals: interval[] = [];
                    data.forEach(instr => {
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
        }

        GetCommandDefinition() {
            let self = this;
            
            rlab.services.Request({
                url: "../services/Sequences.svc/sequenceitemdefinition",
                //request: {
                //    spacecraft: self.spaceCraft(),
                //},
                type: "GET",
                contentType: "application/json",
                success: function (data: any[]) {
                    let tmp_data: CommandDef[] = [];
                    data.forEach(def => {
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
        }
        
       

      GetInstruments() {
            let self = this;

            rlab.services.Request({
                url: "../services/Sequences.svc/instrument",
   
                type: "GET",
                contentType: "application/json",
                success: function (data: any[]) {
                    //let tmp_data: Instrument[] = [];
                     data.forEach(instr => {
                         let item = {
                            GUID: instr.GUID,
                            SecurityGroup: instr.SecurityGroup,
                            Title: instr.Title,
                        }
                         self.timeLineOptions.panels[0].fields.push({ title: item.Title, field: item.SecurityGroup + "_value", style: "event", width: 2 });
                         self.timeLineOptions.panels[1].fields.push({ title: item.Title, field: "value", style: "segment", width: 10, data: ko.observableArray([]), guidInstr: item.GUID });
                         //self.timeLineOptions.panels[1].fields.push({ title: item.Title, field: "value", style: "segment", width: 5 });

                         self.instruments.push(item);
                     });


                    self.dateLimitParams.valueHasMutated();
                    self.isTimeLineVisible(true);
                    console.log("список приборов загружен");
                    //console.log(self.instruments());

                    self.instruments().forEach(instr => {
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
        }

        
        

        CommandsGet(guid: string) {
            let self = this;
            rlab.services.Request({
                //url: "/services/Planning.svc/command",
                url: `../services/Sequences.svc/sequenceitemNI?guidsequence=${guid}&rows=10000&page=1&sidx=Offset&sord=asc`,
                //request: {
                //    spacecraft: self.spaceCraft(),
                //    guidCyclogram: guid
                //},
                type: "GET",
                contentType: "application/json",
                //success: function (data: any[]) {
                success: function (data) {
                    let tmp_data: Command[] = [];
                    data.forEach(com => {

                        ///kostyl' !!!!!!
                        //com.Instrument = Instr[0].key 

                        let item = {
                            GUID: com.GUID,
                            GUIDSequenceItemDef: com.GUIDSequenceItemDef,
                            GUIDSequence: com.GUIDSequence,
                            Offset: ko.observable(com.Offset * 1000),

                            begin: new Date(com.Offset * 1000)
                        }

                        /*item[com.Instrument + "_value"] = com.Code*//*;*/

                        //self.definitions().forEach(def => { if (def.GUID == com.GUIDSequenceItemDef) { console.log(def.GUIDInstrument) } });
                        self.definitions().forEach(def => {
                            if (def.GUID == com.GUIDSequenceItemDef)
                            {
                                self.instruments().forEach(instr => {
                                    if (def.GUIDInstrument == instr.GUID.toString()) {
                                        //console.log(instr.Title);
                                        item[instr.SecurityGroup + "_value"] = def.Title;
                                    }
                                })
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
        }

    }
    
}