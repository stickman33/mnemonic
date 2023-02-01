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

  


    export class CyclogramModel {
        subscriptions: ko.Subscription[];
        timers: number[];

        spaceCraft: ko.Observable<string>;

        dateLimitParams: ko.Observable<{ begin: ko.Observable<Date>, end: ko.Observable<Date> }>;
        timeLineOptions: any;

        isTimeLineVisible: ko.Observable<boolean> = ko.observable(false);
        isSVGvisible: ko.Observable<boolean> = ko.observable(true);


        definitions: ko.ObservableArray<CommandDef>;
        cyclograms: ko.ObservableArray<Cyclogram>;
        instruments: ko.ObservableArray<Instrument>;
        selectedCyclogramGUID: ko.Observable<string>;
        commands: ko.ObservableArray<Command>;

        cycTablePage = 1;

        //backButton = document.getElementById("back") as HTMLButtonElement;
        //nextButton = document.getElementById("next") as HTMLButtonElement;

        mnemoSquares: ko.ObservableArray<Square>;

        states: Array<State>;

        intervals: {};


        

        constructor(params: any) {

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
                        height: 200,
                        isAxis: false,
                        fields: []
                    }
                ],
                selectedItems: ko.observableArray([]),
                selectedTime: ko.observable(new Date(0))
            };



            //this.backButton.disabled = true;


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
                this.updSVGSquares();
            }, this));
        }





        buildSVGSquares() {
            let self = this;
            let sqaures = [];
            let countX = 15;
            let countY = 15;
            let countSquare = 0;

            self.instruments().forEach(instr => {
                //let circle: Circle = { css: ko.observable("grey") };
                
                let square: Square = ({
                    GUID: instr.GUID.toString(),
                    Title: instr.Title.toString(),
                    Circle: { css: ko.observable("grey") },
                    fill: ko.observable("grey"),
                    stroke: ko.observable("black"),
                    position: `translate(${countX},${countY})`,
                    text: ko.observable("None")
                });
                sqaures.push(square);

                if (countSquare < 2) {
                    countY = countY + 100;
                    countSquare++;

                }
                else {
                    countX = countX + 200;
                    countY = 15;
                    countSquare = 0;
                }

            });
            self.mnemoSquares(sqaures);
        }

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

        updSVGSquares() {
            let self = this;

            for (var key in self.intervals) {
                var value = self.intervals[key];

                //var selectedTime = 254;
                var selectedTime = self.timeLineOptions.selectedTime() / 1000;


                //console.log("Instrument GUID: " + key);
                value.forEach(val => {
                    if (selectedTime > val.startOffset && selectedTime < val.stopOffset) {
                        self.states.forEach(state => {
                            if (val.GUIDState == state.GUID) {
                                //console.log("State: " + state.Title);
                                self.mnemoSquares().forEach(square => {
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

        //FindCyclogramByGUID(self: CyclogramModel): Cyclogram {
        //    return self.cyclograms().filter(cg => cg.GUID === self.selectedCyclogramGUID())[0];
        
        //}


        //nextCyclogramPage() {
        //    this.cycTablePage++;
        //    if (this.cycTablePage == 3) {
        //        this.nextButton.disabled = true;
        //    }
        //    this.backButton.disabled = false;
        //    this.GetCyclogram(this.cycTablePage);
        //    //console.log(this.cycTablePage);
            
        //}
        

        //prevCyclogramPage() {
        //    this.cycTablePage--;
        //    if (this.cycTablePage == 1) {
        //        this.backButton.disabled = true;
        //    }
        //    this.nextButton.disabled = false;
        //    this.GetCyclogram(this.cycTablePage);
        //    //console.log(this.cycTablePage);
        //}

        //GetCyclogram(page) {
        //    let self = this;
        //    rlab.services.Request({
        //        //url: "/0/services/Sequences.svc/sequenceNI?rows=5&page=1",
        //        url: `/0/services/Sequences.svc/sequenceNI?rows=5&page=${page}`,
        //        //request: {
        //        //    spacecraft: self.spaceCraft(),
        //        //},
        //        type: "GET",
        //        contentType: "application/json",
        //        success: function (data) {
        //            //console.log(data.rows);
        //            let tmp_data: (Cyclogram)[] = [];
        //            data.rows.forEach(cyc => {
        //                tmp_data.push({
        //                    Title: cyc.Title, 
        //                    GUID: cyc.GUID,
        //                    UIModified: cyc.UIModified,
        //                    comment: cyc.Comment,
        //                    Editor: cyc.Editor

        //                });
        //            });

        //            self.cyclograms(tmp_data);

        //            console.log("список ЦГ загружен");
        //        },
        //        error: function (data) {
        //            self.cyclograms([]);



        //            console.log("Ошибка загрузки списка ЦГ");
        //        }
        //    });
        //}

        
       

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

                    //self.buildSVGSquares();
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