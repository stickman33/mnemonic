///<reference path="../lib/typing/knockout.d.ts" />
///<reference path="../lib/rlab.nkpori.config.ts" />




namespace rlab.nkpori {

    interface CommandDef {
        GUID: string,
        GUIDInstrument: string,
        ID: string,
        Title: string
    }

    interface SqrAndLines {
        Title: string,
        KBVLineMode: ko.Observable<number>, // Between [0,2], where 0 - off, 1 - dash and 2 - on
        POLLLineMode: ko.Observable<number>, // Between [0,2], where 0 - off, 1 - dash and 2 - on
        Param1: void,
        Param2: void,
        Param3: void,
        CurState: ko.Observable<string> // "Включен" and "Отключен" only
    }

    interface Command {
        GUID: string,
        GUIDSequenceItemDef: string,
        GUIDSequence: string,
        Offset: ko.Observable<number>,

        /// need for timeline
        begin: Date,
        bitParameters: object
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
        y2: string,
        x3: string,
        y3: string,
        x4: string,
        y4: string
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

        squareStatus: ko.ObservableArray<boolean>;

        cycTablePage = 1;

        mnemoSquares: ko.ObservableArray<Square>;

        states: Array<State>;

        intervals: Array<any>;




        constructor(params: any) {

            this.subscriptions = [];
            this.timers = [];


            this.mnemoSquares = ko.observableArray([]);

            this.states = [];

            this.squareStatus = ko.observableArray([])

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


            
            this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(newValue => {
                this.updSVGSquareState();
            }, this));
        }

        GetStates() {
            let self = this;

            rlab.services.Request({
                url: "../services/StateMachine.svc/state",
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

                    console.log("список состояний загружен");
                }
            });
        }

        updSVGSquareState() {
            let self = this;
            self.squareStatus.destroy;

            for (var key in self.intervals) {
                var value = self.intervals[key];

                var selectedTime = self.timeLineOptions.selectedTime() / 1000;

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
                                    self.mnemoSquares().forEach(square => {
                                        if (square.GUID == state.GUIDInstrument) {
                                            square.text(state.Title);

                                            if (state.Title == "Отключен") {
                                                square.fill("#ebebeb");
                                                console.log(square);
                                                self.squareStatus.push(false);
                                            }
                                            else {
                                                square.fill("#a8c6f7");
                                                self.squareStatus.push(true);

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
                            });
                        }
                            else if (val.GUIDState == "00000000-0000-0000-0000-000000000000") {
                                self.updBKUSNIlines();
                            }

                        }
                    }

                );


            }
                

        }

        updBKUSNIlines() {
            return "RYAN GOSLING";
        }


        updTimeLine() {
            let self = this;
            let count = 1;


            for (var key in self.intervals) {
                var value = self.intervals[key];
                self.timeLineOptions.panels[1].fields.forEach(instr => {
                    if (key == instr.guidInstr) {
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


            }
            self.dateLimitParams.valueHasMutated();


        }

        GetIntervals(guid: string) {
            let self = this;
            var svgLines = document.getElementById("lines");
            var divSqaures = document.getElementById("squares");


            rlab.services.Request({
                url: `../services/StateMachine.svc/CalculationNI?sequence=${guid}`,
                type: "GET",
                contentType: "application/json",
                success: function (data: any[]) {
                    //let tmp_dict: {};
                    let tmp_intervals: interval[] = [];
                    data.forEach(instr => {
                        tmp_intervals = instr.Value;
                        self.intervals[instr.Key] = tmp_intervals;
                    });
                    
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
                     data.forEach(instr => {
                         let item = {
                            GUID: instr.GUID,
                            SecurityGroup: instr.SecurityGroup,
                            Title: instr.Title,
                        }
                         self.timeLineOptions.panels[0].fields.push({ title: item.Title, field: item.SecurityGroup + "_value", style: "event", width: 2 });
                         self.timeLineOptions.panels[1].fields.push({ title: item.Title, field: "value", style: "segment", width: 10, data: ko.observableArray([]), guidInstr: item.GUID });
                         self.instruments.push(item);
                     });


                    self.dateLimitParams.valueHasMutated();
                    self.isTimeLineVisible(true);
                    console.log("список приборов загружен");

                    self.instruments().forEach(instr => {
                        self.intervals[instr.GUID] = {};
                    });

                    console.log("приборы на мнемосхеме построены");
                },

                error: function (data) {
                    self.timeLineOptions.panels[0].fields([]);
                    console.log("Ошибка загрузки ");
                }
            });
        }

        
        

        CommandsGet(guid: string) {
            let self = this;
            rlab.services.Request({
                url: `../services/Sequences.svc/sequenceitemNI?guidsequence=${guid}&rows=10000&page=1&sidx=Offset&sord=asc`,
                type: "GET",
                contentType: "application/json",
                success: function (data) {
                    let tmp_data: Command[] = [];
                    data.forEach(com => {

                        let item = {
                            GUID: com.GUID,
                            GUIDSequenceItemDef: com.GUIDSequenceItemDef,
                            GUIDSequence: com.GUIDSequence,
                            Offset: ko.observable(com.Offset * 1000),
                            begin: new Date(com.Offset * 1000),
                            bitParameters: com.bitParameters


                        }

                        self.definitions().forEach(def => {
                            if (def.GUID == com.GUIDSequenceItemDef)
                            {
                                self.instruments().forEach(instr => {
                                    if (def.GUIDInstrument == instr.GUID.toString()) {
                                        item[instr.SecurityGroup + "_value"] = def.Title;
                                    }
                                })
                            }
                        });
                        
                        tmp_data.push(item);
                    });

                    self.timeLineOptions.isSelectTime(true);
                    self.dateLimitParams().begin(new Date(-1 * 1000 * 5));
                    self.dateLimitParams().end(new Date(tmp_data[tmp_data.length - 1].Offset() * 1.2));
                    self.commands(tmp_data);

                    self.dateLimitParams.valueHasMutated();
                    console.log("список команд загружен");

                    console.log(self.commands());

                },
                error: function (data) {
                    self.cyclograms([]);
                    console.log("Ошибка загрузки списка команд");
                }
            });
        }

    }
    
}