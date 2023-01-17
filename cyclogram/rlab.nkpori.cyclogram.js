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
                this.backButton = document.getElementById("back");
                this.nextButton = document.getElementById("next");
                this.subscriptions = [];
                this.timers = [];
                //let m: Circle = { css: ko.observable("grey") };
                //let i: Square[] = [{ GUID: "", Title: "PES", Circle: m, fill: ko.observable("#a8c6f7"), stroke: ko.observable("black"), x: 0, y: 0, position: `translate(${40},${80})`, text: ko.observable("status") }];
                this.mnemoSquares = ko.observableArray([]);
                this.states = [];
                this.intervals = {};
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
                            isAxis: false,
                            fields: []
                        }
                    ],
                    selectedItems: ko.observableArray([]),
                    selectedTime: ko.observable(new Date(0))
                };
                this.backButton.disabled = true;
                //this.subscriptions.push(this.spaceCraft.subscribe(newValue => {
                //    this.GetCyclogram(this.cycTablePage);
                //}, this));
                //this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(newValue => {
                //    //this.GetIntervals(this.selectedCyclogramGUID());
                //    this.updSVGSquares();
                //}, this));
                console.log("CyclogramModel: constructed");
                this.GetInstruments();
                this.GetCommandDefinition();
                this.GetCyclogram(this.cycTablePage);
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
                var cyc = self.FindCyclogramByGUID(self);
                self.CommandsGet(cyc.GUID);
                self.timeLineOptions.selectedTime(new Date(0));
                self.GetIntervals(cyc.GUID);
                if (!self.timeLineOptions.isZoom()) {
                    self.timeLineOptions.isZoom(true);
                }
                if (!self.isSVGvisible()) {
                    self.isSVGvisible(true);
                }
                this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(function (newValue) {
                    _this.updSVGSquares();
                }, this));
            };
            CyclogramModel.prototype.buildSVGSquares = function () {
                var self = this;
                var sqaures = [];
                var countX = 40;
                var countY = 80;
                var countSquare = 0;
                self.instruments().forEach(function (instr) {
                    //let circle: Circle = { css: ko.observable("grey") };
                    var square = ({
                        GUID: instr.GUID.toString(),
                        Title: instr.Title.toString(),
                        Circle: { css: ko.observable("grey") },
                        fill: ko.observable("grey"),
                        stroke: ko.observable("black"),
                        position: "translate(" + countX + "," + countY + ")",
                        text: ko.observable("None")
                    });
                    sqaures.push(square);
                    if (countSquare < 3) {
                        countY = countY + 100;
                        countSquare++;
                    }
                    else {
                        countX = countX + 200;
                        countY = 80;
                        countSquare = 0;
                    }
                });
                self.mnemoSquares(sqaures);
            };
            //GetIntervals(guid: string) {
            //    let self = this;
            //    rlab.services.Request({
            //        url: `/0/services/StateMachine.svc/CalculationNI?sequence=${guid}`,
            //        //request: {
            //        //    spacecraft: self.spaceCraft(),
            //        //},
            //        type: "GET",
            //        contentType: "application/json",
            //        success: function (data: any[]) {
            //            let tmp_data: interval[] = [];
            //            data.forEach(instr => {
            //                tmp_data.push(instr.Value);
            //                //console.log(instr.Key);
            //                //console.log(instr.Value);
            //            });
            //            self.intervals = tmp_data;
            //            console.log(new Date(self.intervals[0][0].startOffset * 1000));
            //            console.log(new Date(self.intervals[0][0].stopOffset * 1000));
            //        },
            //        error: function (data) {
            //            console.log("Ошибка");
            //        }
            //    });
            //}
            CyclogramModel.prototype.GetStates = function () {
                var self = this;
                rlab.services.Request({
                    url: "/0/services/StateMachine.svc/state",
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
            CyclogramModel.prototype.updSVGSquares = function () {
                var self = this;
                for (var key in self.intervals) {
                    var value = self.intervals[key];
                    //var selectedTime = 254;
                    var selectedTime = self.timeLineOptions.selectedTime() / 1000;
                    //console.log("Instrument GUID: " + key);
                    value.forEach(function (val) {
                        if (selectedTime > val.startOffset && selectedTime < val.stopOffset) {
                            self.states.forEach(function (state) {
                                if (val.GUIDState == state.GUID) {
                                    //console.log("State: " + state.Title);
                                    self.mnemoSquares().forEach(function (square) {
                                        if (square.GUID == state.GUIDInstrument) {
                                            square.text(state.Title);
                                            if (state.Title == "Выключен" || state.Title == null) {
                                                square.fill("grey");
                                            }
                                            else {
                                                square.fill("#a8c6f7");
                                            }
                                            if (val.GUIDState == "2e85bad5-6a49-ed11-8edc-00155d09ea1d") {
                                                square.Circle.css("lightgreen");
                                            }
                                            else {
                                                square.Circle.css("grey");
                                            }
                                        }
                                    });
                                }
                            });
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
                                var startOffset = value[0].stopOffset;
                                var stopOffset = value[value.length - 2].stopOffset;
                                instr.data.push({ begin: new Date(startOffset * 1000), end: new Date(stopOffset * 1000), value: count + 1 });
                            }
                            else {
                                instr.data.removeAll();
                            }
                        }
                    });
                    count++;
                    //});
                }
                self.dateLimitParams.valueHasMutated();
                //self.dataArray.push({ begin: new Date(1), end: new Date(50000), value: 1 });
            };
            CyclogramModel.prototype.GetIntervals = function (guid) {
                var self = this;
                rlab.services.Request({
                    url: "/0/services/StateMachine.svc/CalculationNI?sequence=" + guid,
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
                        self.buildSVGSquares();
                        self.updSVGSquares();
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
                    url: "/0/services/Sequences.svc/sequenceitemdefinition",
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
            CyclogramModel.prototype.FindCyclogramByGUID = function (self) {
                return self.cyclograms().filter(function (cg) { return cg.GUID === self.selectedCyclogramGUID(); })[0];
            };
            CyclogramModel.prototype.nextCyclogramPage = function () {
                this.cycTablePage++;
                if (this.cycTablePage == 3) {
                    this.nextButton.disabled = true;
                }
                this.backButton.disabled = false;
                this.GetCyclogram(this.cycTablePage);
                //console.log(this.cycTablePage);
            };
            CyclogramModel.prototype.prevCyclogramPage = function () {
                this.cycTablePage--;
                if (this.cycTablePage == 1) {
                    this.backButton.disabled = true;
                }
                this.nextButton.disabled = false;
                this.GetCyclogram(this.cycTablePage);
                //console.log(this.cycTablePage);
            };
            CyclogramModel.prototype.GetCyclogram = function (page) {
                var self = this;
                rlab.services.Request({
                    //url: "/0/services/Sequences.svc/sequenceNI?rows=5&page=1",
                    url: "/0/services/Sequences.svc/sequenceNI?rows=5&page=" + page,
                    //request: {
                    //    spacecraft: self.spaceCraft(),
                    //},
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        //console.log(data.rows);
                        var tmp_data = [];
                        data.rows.forEach(function (cyc) {
                            tmp_data.push({
                                Title: cyc.Title,
                                GUID: cyc.GUID,
                                UIModified: cyc.UIModified,
                                comment: cyc.Comment,
                                Editor: cyc.Editor
                            });
                        });
                        self.cyclograms(tmp_data);
                        console.log("список ЦГ загружен");
                    },
                    error: function (data) {
                        self.cyclograms([]);
                        console.log("Ошибка загрузки списка ЦГ");
                    }
                });
            };
            CyclogramModel.prototype.GetInstruments = function () {
                var self = this;
                rlab.services.Request({
                    url: "/0/services/Sequences.svc/instrument",
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
                        //self.buildSVGSquares();
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
                    url: "/0/services/Sequences.svc/sequenceitemNI?guidsequence=" + guid + "&rows=10000&page=1&sidx=Offset&sord=asc",
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
                        self.dateLimitParams().begin(new Date(-1 * 1000 * 30));
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