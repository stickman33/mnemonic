///<reference path="../lib/typing/knockout.d.ts" />
///<reference path="../lib/rlab.nkpori.common.ts" />
///<reference path="../lib/script/rlab.services.ts" />
///<reference path="../lib/script/rlab.mnemonic.ts" />


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
        GUIDInstrument: string,
        Offset: ko.Observable<number>,
        /// need for timeline
        begin: Date,
        bitParameters: Array<parameter>
    }

    interface parameter {
        paramNumber: number,
        value: boolean
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
        isSVGvisible: ko.Observable<boolean> = ko.observable(false);


        definitions: ko.ObservableArray<CommandDef>;
        cyclograms: ko.ObservableArray<Cyclogram>;
        instruments: ko.ObservableArray<Instrument>;
        selectedCyclogramGUID: ko.Observable<string>;
        commands: ko.ObservableArray<Command>;

        cycTablePage = 1;

        mnemoRects: ko.ObservableArray<instrumentRect>;

        dataBusLines: ko.ObservableArray<dataBusLine>;

        states: Array<State>;

        intervals: Array<any>;

        coordinatesByGuid = {
            //ПЭС
            "8efe9b57-f117-ed11-8ed8-00155d09ea1d": ["330,130 330,108 80,108 80,80", "335,130 335,104 85,104 85,80"],
            //ЛАЭРТ
            "bb103bd9-f417-ed11-8ed8-00155d09ea1d": ["350,130 350,80", "355,130 355,80"],
            //МАЯК
            "d7bacbb4-a848-ed11-8edc-00155d09ea1d": ["445,130 445,80", "450,130 450,80"],
            //НВК2
            "e7c4e462-3b67-ed11-8edf-00155d09ea1d": ["460,130 460,104 720,104 720,80", "465,130 465,108 725,108 725,80"],
            //ОЗОНОМЕТР
            "5f1500d5-4a72-ed11-8edf-00155d09ea1d": ["323,168 156,168", "323,173 156,173"],
            //СГ/ 1
            "078471e5-4a72-ed11-8edf-00155d09ea1d": ["478,168 643,168", "478,173 643,173"],
            //ГАЛС
            "10da8efb-4a72-ed11-8edf-00155d09ea1d": ["330,210 330,234 80,234 80,260", "335,210 335,238 85,238 85,260"],
            //СПЭР
            "ccde500c-4b72-ed11-8edf-00155d09ea1d": ["350,210 350,260", "355,210 355,260"],
            //ЭСИП ПК1
            "1c0cbce0-1ebf-ed11-8eec-00155d09ea1d": ["445,210 445,260", "450,210 450,260"],
            //ЭСИП ПК2
            "8252d6c9-74c2-ed11-8eed-00155d09ea1d": ["460,210 460,238 720,238 720,260", "465,210 465,234 725,234 725,260"]
        };

        kbvPollIntervals = [];





        constructor(params: any) {

            this.subscriptions = [];
            this.timers = [];
            this.mnemoRects = ko.observableArray([]);
            this.dataBusLines = ko.observableArray([]);
            this.states = [];
            this.intervals = [];
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
                    },
                    {
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

            //self.createRectsAndLines();

            if (!self.timeLineOptions.isZoom()) {
                self.timeLineOptions.isZoom(true);

            }

            //if (!self.isSVGvisible()) {
            //    self.isSVGvisible(true);
            //}

            this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(newValue => {
                this.updSVGRectState();
                this.updBusLines();
                this.updBkusniIndicators();
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


        createRectsAndLines() {
            let self = this;
            let rectangles = [];
            let lines = [];

            let x = 1;
            let y = 0;
            let countSquare = 0;
            let countRow = 0;
            let rect: instrumentRect;
            let busLine: dataBusLine;

            self.instruments().forEach((instr, index: number) => {
                const instrGUID = instr.GUID.toString();
                let instrTitle = instr.Title.toString();

                // Укорачиваем название прибора, чтобы влезал в прямоугольник
                if (instrTitle.length > 8) {
                    instrTitle = self.shortenTitle(instrTitle);
                }


                if (instr.Title.toString() == "БКУСНИ") {
                    rect = ({
                        GUID: instrGUID,
                        title: instrTitle,
                        position: "translate(323,130)",
                        visibility: ko.observable("disabled"),
                        kbv: ko.observable(),
                        poll: ko.observable(),
                        status: ko.observable("Расчет недоступен"),
                        statusLight: ko.observableArray([])
                    });

                    return rectangles.push(rect);
                }
                else {
                    rect = ({
                        GUID: instrGUID,
                        title: instrTitle,
                        position: `translate(${x},${y})`,
                        visibility: ko.observable("disabled"),
                        kbv: ko.observable(false),
                        poll: ko.observable(false),
                        status: ko.observable("Расчет недоступен"),
                        statusLight: ko.observableArray([])
                    });


                    //create bus lines
                    busLine = ({
                        GUID: instrGUID,
                        title: instrTitle,
                        cmdCoords: self.coordinatesByGuid[instrGUID][0],
                        dataCoords: self.coordinatesByGuid[instrGUID][1],
                        mainCmdVis: ko.observable(false),
                        mainDataVis: ko.observable(false),
                        reserveCmdVis: ko.observable(false),
                        reserveDataVis: ko.observable(false)
                    });

                    lines.push(busLine);

                }


                if (countSquare < 3) {
                    if (countRow != 1) {
                        countSquare++;
                        x = x + 214;
                    }
                    else {
                        if (countSquare == 0) {
                            rect = ({
                                GUID: instrGUID,
                                title: instrTitle,
                                position: "translate(1,130)",
                                visibility: ko.observable("disabled"),
                                kbv: ko.observable(false),
                                poll: ko.observable(false),
                                status: ko.observable("Расчет недоступен"),
                                statusLight: ko.observableArray([])
                            });
                            countSquare++;

                        }
                        else if (countSquare == 1) {
                            rect = ({
                                GUID: instrGUID,
                                title: instrTitle,
                                position: "translate(643,130)",
                                visibility: ko.observable("disabled"),
                                kbv: ko.observable(false),
                                poll: ko.observable(false),
                                status: ko.observable("Расчет недоступен"),
                                statusLight: ko.observableArray([])
                            });

                            countRow++;
                            countSquare = 0;
                            x = 1;
                            y += 130;
                        }
                    }
                }

                else {
                    x = 1;
                    y += 130;
                    countSquare = 0;
                    countRow++;
                }

                rectangles.push(rect);
            });
            self.mnemoRects(rectangles);
            self.dataBusLines(lines);
        }


        getLastConsonantIndex(str: string): number {
            const vowels = ['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я'];
            for (let i = 4; i >= 0; i--) {
                if (!vowels.some((vowel) => str[i].toLowerCase() === vowel) && /[a-zA-Zа-яА-Я]/.test(str[i])) {
                    return i;
                }
            }
            return -1;
        }


        shortenTitle(title: string): string {
            let self = this;

            const words = title.split(' ');
            const shortenedWords = words.map((word) => {
                if (word.length > 4) {
                    const lastVowelIndex = self.getLastConsonantIndex(word);
                    if (lastVowelIndex !== -1) {
                        return word.substring(0, lastVowelIndex + 1);
                    } else {
                        return word.substring(0, 4);
                    }
                }
                return word;
            });
            return shortenedWords.join(' ');
        }

        updSVGRectState() {
            let startTime = Date.now() / 1000;
            let self = this;
            var selectedTime = self.timeLineOptions.selectedTime() / 1000;

            for (var key in self.intervals) {
                var value = self.intervals[key];
                value.forEach(val => {


                    if (selectedTime > val.startOffset) {
                        self.states.forEach(state => {
                            if (val.GUIDState == state.GUID) {
                                self.mnemoRects().forEach(rect => {
                                    let title = "";
                                    if (rect.GUID == state.GUIDInstrument) {

                                        title = state.Title;
                                        if (state.Title.length > 20) {
                                         title = self.shortenTitle(state.Title);
                                        }

                                        rect.status(title);
                                        rect.visibility("enabled");

                                        if (state.Title === "Отключен") {
                                            rect.visibility("disabled");
                                        }
                                    }
                                });
                            }

                        });
                    }
                });

                //костыль 2, потому что первый интервал имеет startOffset "-1"
                if (selectedTime < value[0].startOffset) {
                    self.states.forEach(state => {
                        value.forEach(val => {
                            if (val.GUIDState == state.GUID) {
                                self.mnemoRects().forEach(rect => {
                                    rect.status("Отключен");
                                    rect.visibility("disabled");
                                });
                            }
                        });

                    });
                }
            }
        }

        updBkusniIndicators() {
            const self = this;

            // Получаем выбранное время и переводим в секунды
            const selectedTime = self.timeLineOptions.selectedTime() / 1000;

            // Маппинг GUIDSequenceItemDef на соответствующее свойство видимости
            const visibilityMapping = {
                "356768d1-ba5a-ed11-8edc-00155d09ea1d": "poll",
                "346768d1-ba5a-ed11-8edc-00155d09ea1d": "poll",
                "f235ecf3-a861-ed11-8edd-00155d09ea1d": "kbv",
                "db5debd7-645b-ed11-8edc-00155d09ea1d": "kbv"
            };

            // Функция для установки видимости и состояния
            const visibilitySetter = (rect, visibilityProperty, value) => {
                if (rect[visibilityProperty] !== undefined) {
                    // Устанавливаем видимость
                    rect[visibilityProperty](value);
                }
            };

            //костыль 3, для обнуления статусов лампочек
            self.mnemoRects().forEach(rect => {
                if (rect.GUID != "5ebdec99-ba5a-ed11-8edc-00155d09ea1d") {
                    rect.kbv(false);
                    rect.poll(false);
                }
            });

            // Проверяем, есть ли ошибка в интервалах
            let exists = self.kbvPollIntervals.some(
                (interval) => interval.GUIDState === "00000000-0000-0000-0000-000000000000"
            );

            if (exists) {
                self.mnemoRects()[3].visibility("error");
                self.mnemoRects()[3].status("Ошибка мат модели");
            }

            else {
                // Проход по всем интервалам БКУСНИ и командам циклограммы
                self.kbvPollIntervals.forEach(interval => {
                    self.commands().forEach(cmd => {
                        let cmdOffset = cmd.Offset() / 1000;


                        if (selectedTime > cmdOffset && cmdOffset === interval.startOffset) {

                            // Получаем соответствующее свойство видимости из маппинга
                            const visibilityProperty = visibilityMapping[cmd.GUIDSequenceItemDef];

                            // Проходимся по параметрам команды
                            cmd.bitParameters.forEach(param => {
                                const rect = param.paramNumber > 2 ? self.mnemoRects()[param.paramNumber + 1] : self.mnemoRects()[param.paramNumber];
                                const value = param.value;

                                // Проверяем значение параметра и применяем видимость в зависимости от GUID команды
                                if (param.value) {
                                    // Включить опрос, включить КБВ
                                    if (cmd.GUIDSequenceItemDef === "356768d1-ba5a-ed11-8edc-00155d09ea1d" || cmd.GUIDSequenceItemDef === "f235ecf3-a861-ed11-8edd-00155d09ea1d") {
                                        //console.log(`found suitable cmd with GUID ${cmd.GUID}`);
                                        if (value) {
                                            visibilitySetter(rect, visibilityProperty, true);
                                        }
                                    // Включить опрос, включить КБВ
                                    } else if (cmd.GUIDSequenceItemDef === "346768d1-ba5a-ed11-8edc-00155d09ea1d" || cmd.GUIDSequenceItemDef === "db5debd7-645b-ed11-8edc-00155d09ea1d") {
                                        if (value) {
                                            visibilitySetter(rect, visibilityProperty, false);
                                        }
                                    }
                                }
                            });
                        }
                    });

                });
            }
            
        }

        getLightIntervals() {
            // Сохраняем ссылку на текущий контекст
            const self = this;
            self.kbvPollIntervals = [];

            // Массив GUID, с которыми мы будем работать
            const targetGuids = [
                "356768d1-ba5a-ed11-8edc-00155d09ea1d",
                "346768d1-ba5a-ed11-8edc-00155d09ea1d",
                "f235ecf3-a861-ed11-8edd-00155d09ea1d",
                "db5debd7-645b-ed11-8edc-00155d09ea1d"
            ];

            //Получаем интервалы БКУСНИ
            self.intervals["5ebdec99-ba5a-ed11-8edc-00155d09ea1d"].forEach(interval => {
                self.commands().forEach(cmd => {
                    let cmdOffset = cmd.Offset() / 1000;

                    if ((targetGuids.indexOf(cmd.GUIDSequenceItemDef) !== -1) && cmdOffset === interval.startOffset && cmdOffset < interval.stopOffset) {
                        self.kbvPollIntervals.push(interval);
                    }
                });
            });
        }


        updBusLines() {
            let self = this;

            // Получаем выбранное время и переводим в секунды
            const selectedTime = self.timeLineOptions.selectedTime() / 1000;

            // Массив GUID, с которыми мы будем работать
            const targetGuids = [
                "e24320fd-c870-ed11-8edf-00155d09ea1d",
                "39925129-c970-ed11-8edf-00155d09ea1d",
                "38ec6c56-c970-ed11-8edf-00155d09ea1d",
                "2ea7ad67-c970-ed11-8edf-00155d09ea1d"
            ];

            // Маппинг GUIDSequenceItemDef на соответствующее свойство видимости
            const visibilityMapping = {
                "e24320fd-c870-ed11-8edf-00155d09ea1d": "mainCmdVis",
                "39925129-c970-ed11-8edf-00155d09ea1d": "reserveCmdVis",
                "38ec6c56-c970-ed11-8edf-00155d09ea1d": "mainDataVis",
                "2ea7ad67-c970-ed11-8edf-00155d09ea1d": "reserveDataVis",
            };

            // Функция для установки видимости в зависимости от параметров
            const visibilitySetter = (param, visibilityProperty, value) => {
                // Изменяем видимость свойства для соответствующей строки данных
                const busLine = self.dataBusLines()[param.paramNumber];
                if (busLine && typeof busLine[visibilityProperty] === 'function') {
                    busLine[visibilityProperty](value);
                }
            };

            // Обходим все команды
            self.commands().forEach(cmd => {
                // Проверяем, превышает ли время Offset команды выбранное время
                const isTimeGreaterThanOffset = selectedTime > (cmd.Offset() / 1000);

                // Проверяем, есть ли GUID команды в массиве targetGuids
                if (targetGuids.indexOf(cmd.GUIDSequenceItemDef) !== -1) {
                    // Получаем соответствующее свойство видимости из маппинга
                    const visibilityProperty = visibilityMapping[cmd.GUIDSequenceItemDef];
                    // Обходим параметры команды
                    cmd.bitParameters.forEach(param => {
                        // Определяем значение видимости в зависимости от времени
                        const value = isTimeGreaterThanOffset ? Boolean(param.value) : false;
                        // Устанавливаем видимость с помощью функции visibilitySetter
                        visibilitySetter(param, visibilityProperty, value);
                    });
                }
            });
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
            

            rlab.services.Request({
                url: `../services/StateMachine.svc/CalculationNI?sequence=${guid}`,
                type: "GET",
                contentType: "application/json",
                success: function (data: any[]) {
                    let tmp_intervals: interval[] = [];
                    data.forEach(instr => {
                        tmp_intervals = instr.Value;
                        self.intervals[instr.Key] = tmp_intervals;
                    });

                    // Добавить функцию обнуления значений, при открытии новой циклограммы!
                    self.createRectsAndLines();

                    self.updSVGRectState();
                    self.updBusLines();
                    self.updBkusniIndicators();

                    if (!self.isSVGvisible()) {
                        self.isSVGvisible(true);
                    }
                    self.updTimeLine();
                    self.getLightIntervals();



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

                    self.createRectsAndLines();
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
                            GUIDInstrument: "",
                            bitParameters: com.bitParameters,
                            Offset: ko.observable(com.Offset * 1000),
                            begin: new Date(com.Offset * 1000)
                        }

                        self.definitions().forEach(def => {
                            if (def.GUID == com.GUIDSequenceItemDef)
                            {
                                item.GUIDInstrument = def.GUIDInstrument;
                                self.instruments().forEach(instr => {
                                    if (def.GUIDInstrument == instr.GUID.toString()) {
                                        //console.log(instr.Title);
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

                },
                error: function (data) {
                    self.cyclograms([]);
                    console.log("Ошибка загрузки списка команд");
                }
            });
        }

    }
    
}