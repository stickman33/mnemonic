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
                this.coordinatesByGuid = {
                    "8efe9b57-f117-ed11-8ed8-00155d09ea1d": ["330,130 330,108 80,108 80,80", "335,130 335,104 85,104 85,80"],
                    "bb103bd9-f417-ed11-8ed8-00155d09ea1d": ["350,130 350,80", "355,130 355,80"],
                    "d7bacbb4-a848-ed11-8edc-00155d09ea1d": ["445,130 445,80", "450,130 450,80"],
                    "e7c4e462-3b67-ed11-8edf-00155d09ea1d": ["460,130 460,104 720,104 720,80", "465,130 465,108 725,108 725,80"],
                    "5f1500d5-4a72-ed11-8edf-00155d09ea1d": ["323,168 155,168", "323,173 155,173"],
                    "078471e5-4a72-ed11-8edf-00155d09ea1d": ["478,168 644,168", "478,173 644,173"],
                    "10da8efb-4a72-ed11-8edf-00155d09ea1d": ["330,210 330,234 80,234 80,260", "335,210 335,238 85,238 85,260"],
                    "ccde500c-4b72-ed11-8edf-00155d09ea1d": ["350,210 350,260", "355,210 355,260"],
                    "1c0cbce0-1ebf-ed11-8eec-00155d09ea1d": ["445,210 445,260", "450,210 450,260"],
                    "8252d6c9-74c2-ed11-8eed-00155d09ea1d": ["460,210 460,238 720,238 720,260", "465,210 465,234 725,234 725,260"]
                };
                this.kbvPollIntervals = [];
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
                self.createRectsLines();
                if (!self.timeLineOptions.isZoom()) {
                    self.timeLineOptions.isZoom(true);
                }
                if (!self.isSVGvisible()) {
                    self.isSVGvisible(true);
                }
                this.subscriptions.push(this.timeLineOptions.selectedTime.subscribe(function (newValue) {
                    _this.updSVGRectState();
                    _this.updBusLines();
                    _this.updBkusniLights();
                }, this));
            };
            CyclogramModel.prototype.GetStates = function () {
                var self = this;
                rlab.services.Request({
                    url: "../services/StateMachine.svc/state",
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
                        console.log("список состояний загружен");
                    }
                });
            };
            CyclogramModel.prototype.createRectsLines = function () {
                var self = this;
                var rectangles = [];
                var lines = [];
                var x = 1;
                var y = 0;
                var countSquare = 0;
                var countRow = 0;
                var rect;
                var busLine;
                self.instruments().forEach(function (instr, index) {
                    var instrGUID = instr.GUID.toString();
                    var instrTitle = instr.Title.toString();
                    //возможно стоит по-другому укорачивать название
                    if (instrTitle == "ОЗОНОМЕТР") {
                        instrTitle = "ОЗОН";
                    }
                    if (instr.Title.toString() == "БКУСНИ") {
                        rect = ({
                            GUID: instrGUID,
                            title: instrTitle,
                            position: "translate(323,130)",
                            disabled: ko.observable(true),
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
                            position: "translate(" + x + "," + y + ")",
                            disabled: ko.observable(true),
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
                                    disabled: ko.observable(true),
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
                                    disabled: ko.observable(true),
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
            };
            CyclogramModel.prototype.getLastConsonantIndex = function (str) {
                var vowels = ['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'a', 'e', 'i', 'o', 'u'];
                var _loop_1 = function (i) {
                    if (!vowels.some(function (vowel) { return str[i] === vowel; }) && /[a-zA-Zа-яА-Я]/.test(str[i])) {
                        return { value: i };
                    }
                };
                for (var i = 4; i >= 0; i--) {
                    var state_1 = _loop_1(i);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
                return -1;
            };
            CyclogramModel.prototype.shortenTitle = function (title) {
                var self = this;
                var words = title.split(' ');
                var shortenedWords = words.map(function (word) {
                    if (word.length > 4) {
                        var lastVowelIndex = self.getLastConsonantIndex(word);
                        if (lastVowelIndex !== -1) {
                            return word.substring(0, lastVowelIndex + 1);
                        }
                        else {
                            return word.substring(0, 4);
                        }
                    }
                    return word;
                });
                return shortenedWords.join(' ');
            };
            CyclogramModel.prototype.updSVGRectState = function () {
                var self = this;
                var selectedTime = self.timeLineOptions.selectedTime() / 1000;
                for (var key in self.intervals) {
                    var value = self.intervals[key];
                    value.forEach(function (val) {
                        if (value.length == 1) {
                            self.mnemoRects().forEach(function (rect) {
                                if (key == rect.GUID) {
                                    //rect.text("Расчет недоступен");
                                    //rect.fill("#ebebeb");
                                    //rect.Circle.css("#ebebeb");
                                }
                            });
                        }
                        else {
                            if (selectedTime > val.startOffset && selectedTime < val.stopOffset) {
                                self.states.forEach(function (state) {
                                    if (val.GUIDState == state.GUID) {
                                        self.mnemoRects().forEach(function (rect) {
                                            var title = "";
                                            if (rect.GUID == state.GUIDInstrument) {
                                                //rect.text(state.Title);
                                                title = state.Title;
                                                if (state.Title.length > 20) {
                                                    title = self.shortenTitle(state.Title);
                                                }
                                                rect.status(title);
                                                rect.disabled(false);
                                                if (state.Title == "Отключен") {
                                                    //rect.fill("#ebebeb");
                                                    rect.disabled(true);
                                                }
                                                else {
                                                    //rect.fill("#a8c6f7");
                                                }
                                                if (val.GUIDState == "2e85bad5-6a49-ed11-8edc-00155d09ea1d") {
                                                    //rect.Circle.css("lightgreen");
                                                }
                                                else {
                                                    //rect.Circle.css("#ebebeb");
                                                }
                                            }
                                        });
                                    }
                                    else if (val.GUIDState == "00000000-0000-0000-0000-000000000000") {
                                    }
                                });
                            }
                        }
                    });
                }
            };
            CyclogramModel.prototype.updBkusniLights = function () {
                // Сохраняем ссылку на текущий контекст
                var self = this;
                // Получаем выбранное время и переводим в секунды
                var selectedTime = self.timeLineOptions.selectedTime() / 1000;
                // Массив GUID, с которыми мы будем работать
                var targetGuids = [
                    "356768d1-ba5a-ed11-8edc-00155d09ea1d",
                    "346768d1-ba5a-ed11-8edc-00155d09ea1d",
                    "f235ecf3-a861-ed11-8edd-00155d09ea1d",
                    "db5debd7-645b-ed11-8edc-00155d09ea1d"
                ];
                // Маппинг GUIDSequenceItemDef на соответствующее свойство видимости
                var visibilityMapping = {
                    "356768d1-ba5a-ed11-8edc-00155d09ea1d": "poll",
                    "346768d1-ba5a-ed11-8edc-00155d09ea1d": "poll",
                    "f235ecf3-a861-ed11-8edd-00155d09ea1d": "kbv",
                    "db5debd7-645b-ed11-8edc-00155d09ea1d": "kbv"
                };
                // Функция для установки видимости и состояния
                var visibilitySetter = function (rect, visibilityProperty, value) {
                    if (rect[visibilityProperty] !== undefined) {
                        // Устанавливаем видимость
                        rect[visibilityProperty](value);
                        // Если есть состояние "disabled", обновляем его
                        if (rect.disabled) {
                            rect.disabled(false);
                        }
                    }
                };
                // Проход по всем интервалам БКУСНИ и командам циклограммы
                self.kbvPollIntervals.forEach(function (interval) {
                    self.commands().forEach(function (cmd) {
                        var cmdOffset = cmd.Offset() / 1000;
                        if (selectedTime > cmdOffset && cmdOffset === interval.startOffset) {
                            // Получаем соответствующее свойство видимости из маппинга
                            var visibilityProperty_1 = visibilityMapping[cmd.GUIDSequenceItemDef];
                            console.log("selectedTime " + selectedTime + ", cmdOffset " + cmdOffset + ",  val.startOffset " + interval.startOffset + ", val.stopOffset " + interval.stopOffset + ",");
                            console.log("Found suitable command with GUID " + cmd.GUID);
                            // Проходимся по параметрам команды
                            cmd.bitParameters.forEach(function (param) {
                                var rect = param.paramNumber > 2 ? self.mnemoRects()[param.paramNumber + 1] : self.mnemoRects()[param.paramNumber];
                                var value = param.value;
                                // Проверяем значение параметра и применяем видимость в зависимости от GUID команды
                                if (param.value) {
                                    if (cmd.GUIDSequenceItemDef === "356768d1-ba5a-ed11-8edc-00155d09ea1d" || cmd.GUIDSequenceItemDef === "f235ecf3-a861-ed11-8edd-00155d09ea1d") {
                                        if (value) {
                                            visibilitySetter(rect, visibilityProperty_1, true);
                                            console.log("\u0437\u0430\u0441\u0435\u0442\u0438\u043B " + rect.title);
                                        }
                                    }
                                    else if (cmd.GUIDSequenceItemDef === "346768d1-ba5a-ed11-8edc-00155d09ea1d" || cmd.GUIDSequenceItemDef === "db5debd7-645b-ed11-8edc-00155d09ea1d") {
                                        if (value) {
                                            visibilitySetter(rect, visibilityProperty_1, false);
                                        }
                                    }
                                }
                            });
                        }
                    });
                });
                //Если выбранное время меньше первой команды опроса/КБВ либо больше последней, отключить
                if (selectedTime < self.kbvPollIntervals[0].startOffset || selectedTime > self.kbvPollIntervals[self.kbvPollIntervals.length - 1].stopOffset) {
                    self.mnemoRects().forEach(function (rect) {
                        rect.kbv(false);
                        rect.poll(false);
                    });
                }
            };
            CyclogramModel.prototype.getLightIntervals = function () {
                // Сохраняем ссылку на текущий контекст
                var self = this;
                self.kbvPollIntervals = [];
                // Массив GUID, с которыми мы будем работать
                var targetGuids = [
                    "356768d1-ba5a-ed11-8edc-00155d09ea1d",
                    "346768d1-ba5a-ed11-8edc-00155d09ea1d",
                    "f235ecf3-a861-ed11-8edd-00155d09ea1d",
                    "db5debd7-645b-ed11-8edc-00155d09ea1d"
                ];
                //Получаем интервалы БКУСНИ
                self.intervals["5ebdec99-ba5a-ed11-8edc-00155d09ea1d"].forEach(function (interval) {
                    self.commands().forEach(function (cmd) {
                        var cmdOffset = cmd.Offset() / 1000;
                        if ((targetGuids.indexOf(cmd.GUIDSequenceItemDef) !== -1) && cmdOffset === interval.startOffset && cmdOffset < interval.stopOffset) {
                            self.kbvPollIntervals.push(interval);
                        }
                    });
                });
            };
            CyclogramModel.prototype.updBusLines = function () {
                var self = this;
                // Получаем выбранное время и переводим в секунды
                var selectedTime = self.timeLineOptions.selectedTime() / 1000;
                // Массив GUID, с которыми мы будем работать
                var targetGuids = [
                    "e24320fd-c870-ed11-8edf-00155d09ea1d",
                    "39925129-c970-ed11-8edf-00155d09ea1d",
                    "38ec6c56-c970-ed11-8edf-00155d09ea1d",
                    "2ea7ad67-c970-ed11-8edf-00155d09ea1d"
                ];
                // Маппинг GUIDSequenceItemDef на соответствующее свойство видимости
                var visibilityMapping = {
                    "e24320fd-c870-ed11-8edf-00155d09ea1d": "mainCmdVis",
                    "39925129-c970-ed11-8edf-00155d09ea1d": "reserveCmdVis",
                    "38ec6c56-c970-ed11-8edf-00155d09ea1d": "mainDataVis",
                    "2ea7ad67-c970-ed11-8edf-00155d09ea1d": "reserveDataVis",
                };
                // Функция для установки видимости в зависимости от параметров
                var visibilitySetter = function (param, visibilityProperty, value) {
                    // Изменяем видимость свойства для соответствующей строки данных
                    var busLine = self.dataBusLines()[param.paramNumber];
                    if (busLine && typeof busLine[visibilityProperty] === 'function') {
                        busLine[visibilityProperty](value);
                    }
                };
                // Обходим все команды
                self.commands().forEach(function (cmd) {
                    // Проверяем, превышает ли время Offset команды выбранное время
                    var isTimeGreaterThanOffset = selectedTime > (cmd.Offset() / 1000);
                    // Проверяем, есть ли GUID команды в массиве targetGuids
                    if (targetGuids.indexOf(cmd.GUIDSequenceItemDef) !== -1) {
                        // Получаем соответствующее свойство видимости из маппинга
                        var visibilityProperty_2 = visibilityMapping[cmd.GUIDSequenceItemDef];
                        // Обходим параметры команды
                        cmd.bitParameters.forEach(function (param) {
                            // Определяем значение видимости в зависимости от времени
                            var value = isTimeGreaterThanOffset ? Boolean(param.value) : false;
                            // Устанавливаем видимость с помощью функции visibilitySetter
                            visibilitySetter(param, visibilityProperty_2, value);
                        });
                    }
                });
            };
            CyclogramModel.prototype.updTimeLine = function () {
                var self = this;
                var count = 1;
                for (var key in self.intervals) {
                    var value = self.intervals[key];
                    self.timeLineOptions.panels[1].fields.forEach(function (instr) {
                        if (key == instr.guidInstr) {
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
                }
                self.dateLimitParams.valueHasMutated();
            };
            CyclogramModel.prototype.GetIntervals = function (guid) {
                var self = this;
                rlab.services.Request({
                    url: "../services/StateMachine.svc/CalculationNI?sequence=" + guid,
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_intervals = [];
                        data.forEach(function (instr) {
                            tmp_intervals = instr.Value;
                            self.intervals[instr.Key] = tmp_intervals;
                        });
                        self.updSVGRectState();
                        self.updTimeLine();
                        self.getLightIntervals();
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
                        data.forEach(function (instr) {
                            var item = {
                                GUID: instr.GUID,
                                SecurityGroup: instr.SecurityGroup,
                                Title: instr.Title,
                            };
                            self.timeLineOptions.panels[0].fields.push({ title: item.Title, field: item.SecurityGroup + "_value", style: "event", width: 2 });
                            self.timeLineOptions.panels[1].fields.push({ title: item.Title, field: "value", style: "segment", width: 10, data: ko.observableArray([]), guidInstr: item.GUID });
                            self.instruments.push(item);
                        });
                        self.dateLimitParams.valueHasMutated();
                        self.isTimeLineVisible(true);
                        console.log("список приборов загружен");
                        self.instruments().forEach(function (instr) {
                            self.intervals[instr.GUID] = {};
                        });
                        console.log("приборы на мнемосхеме построены");
                    },
                    error: function (data) {
                        self.timeLineOptions.panels[0].fields([]);
                        console.log("Ошибка загрузки ");
                    }
                });
            };
            CyclogramModel.prototype.CommandsGet = function (guid) {
                var self = this;
                rlab.services.Request({
                    url: "../services/Sequences.svc/sequenceitemNI?guidsequence=" + guid + "&rows=10000&page=1&sidx=Offset&sord=asc",
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (com) {
                            var item = {
                                GUID: com.GUID,
                                GUIDSequenceItemDef: com.GUIDSequenceItemDef,
                                GUIDSequence: com.GUIDSequence,
                                GUIDInstrument: "",
                                bitParameters: com.bitParameters,
                                Offset: ko.observable(com.Offset * 1000),
                                begin: new Date(com.Offset * 1000)
                            };
                            self.definitions().forEach(function (def) {
                                if (def.GUID == com.GUIDSequenceItemDef) {
                                    item.GUIDInstrument = def.GUIDInstrument;
                                    self.instruments().forEach(function (instr) {
                                        if (def.GUIDInstrument == instr.GUID.toString()) {
                                            //console.log(instr.Title);
                                            item[instr.SecurityGroup + "_value"] = def.Title;
                                        }
                                    });
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
            };
            return CyclogramModel;
        }());
        nkpori.CyclogramModel = CyclogramModel;
    })(nkpori = rlab.nkpori || (rlab.nkpori = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.nkpori.cyclogram.js.map