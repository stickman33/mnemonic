///<reference path="../lib/typing/knockout.d.ts" />
///<reference path="../lib/rlab.nkpori.config.ts" />
var rlab;
(function (rlab) {
    var nkpori;
    (function (nkpori) {
        var CyclogramModel = /** @class */ (function () {
            function CyclogramModel(params) {
                var _this = this;
                this.subscriptions = [];
                this.timers = [];
                this.timeLineCatregories = ko.observableArray([
                    {
                        "title": "ПЭС",
                        "field": "iosph0-instr-pes_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "ЛАЭРТ",
                        "field": "iosph0-instr-laert_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "МАЯК",
                        "field": "iosph0-instr-mayak_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "БКУСНИ",
                        "field": "iosph0-instr-bkusni_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "НВК2",
                        "field": "iosph0-instr-nvk2_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "ОЗОНОМЕТР",
                        "field": "iosph0-instr-ozonometr_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "СГ/1",
                        "field": "iosph0-instr-sg1_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "ГАЛС",
                        "field": "iosph0-instr-gals_value",
                        "style": "event",
                        "width": 2
                    },
                    {
                        "title": "СПЭР",
                        "field": "iosph0-instr-sper_value",
                        "style": "event",
                        "width": 2
                    }
                ]); //[];
                this.spaceCraft = ko.observable(nkpori.SCs[0].key);
                this.definitions = ko.observableArray([]);
                this.instruments = ko.observableArray([]);
                this.cyclograms = ko.observableArray([]);
                this.selectedCyclogramGUID = ko.observable(null);
                this.cyclogramEditable = {
                    GUID: ko.observable(""),
                    Created: ko.observable(new Date("0001-01-01T00:00:00.000Z")),
                    Modified: ko.observable(new Date("0001-01-01T00:00:00.000Z")),
                    SIPID: ko.observable(-1),
                    comment: ko.observable(""),
                    Type: ko.observable(""),
                    StartTime: ko.observable(null)
                };
                this.commands = ko.observableArray([]);
                this.isAllCommandsCheck = ko.pureComputed({
                    read: function () {
                        var _this = this;
                        var isAll = true;
                        if (this.commands().length == 0)
                            return false;
                        /// check is all children is checked ??
                        this.commands().forEach(function (ch) { return isAll = isAll && (_this.commandsChecked().indexOf(ch.GUID) >= 0); });
                        return isAll;
                    },
                    write: function (value) {
                        var _this = this;
                        /// add / remove  all children into checked array
                        if (this.commands().length > 0)
                            if (value)
                                this.commands().forEach(function (ch) {
                                    if (_this.commandsChecked().indexOf(ch.GUID) == -1)
                                        _this.commandsChecked.push(ch.GUID);
                                });
                            else
                                this.commands().forEach(function (ch) { _this.commandsChecked.remove(ch.GUID); });
                    },
                    owner: this
                });
                this.isAllCommandsIndeterminate = ko.computed(function () {
                    var _this = this;
                    var cnt = 0;
                    this.commands().forEach(function (ch) {
                        if (_this.commandsChecked().indexOf(ch.GUID) >= 0)
                            cnt++;
                    });
                    return cnt > 0 && cnt < this.commands().length;
                }, this);
                this.comandsCGGuid = ko.observable("");
                this.commandsChecked = ko.observableArray([]);
                this.time_represent = ko.observable(nkpori.TimeRepresentType[0].key);
                this.time_cascade = ko.observable(nkpori.TimeCascadeType[0].key);
                this.commandEditable = {
                    GUID: ko.observable(""),
                    GUIDCommand_def: ko.observable(""),
                    GUIDCyclogram: ko.observable(""),
                    //Code: ko.observable (""),
                    Created: ko.observable(new Date("0001-01-01T00:00:00.000Z")),
                    ID: ko.observable(""),
                    Code: ko.observable(""),
                    //SendingTime: ko.observable(new Date("0001-01-01T00:00:00.000Z")),
                    //Status: ko.observable (""),
                    //Title: ko.observable (""),
                    //dataRate: ko.observable (""),
                    dataWord: ko.observable(""),
                    //power: ko.observable (""),
                    time: ko.observable(-1)
                };
                this.subscriptions.push(this.commandEditable.GUIDCommand_def.subscribe(function (nv) {
                    if (nv !== "") {
                        _this.definitions().forEach(function (def) {
                            if (def.GUID === nv) {
                                _this.commandEditable.Code(def.Code);
                                _this.commandEditable.ID(def.ID);
                            }
                        });
                    }
                }, this));
                this.dateLimitParams = ko.observable({
                    begin: ko.observable(new Date(0)),
                    end: ko.observable(new Date(10 * 60 * 1000))
                });
                //let timeLineCatregories = [];
                //Instr.forEach(instr => timeLineCatregories.push(
                //    { title: instr.title, field: instr.key + "_value", style: "event", width: 2 }
                //));
                //let timeLineCatregories = [];
                //this.instruments().forEach(instr => timeLineCatregories.push({ title: instr.Title, style: "event", width: 2 }));
                //timeLineCatregories.push({ title: "2132131", style: "event", width: 2 });
                //fetch('/0/services/Sequences.svc/instrument')
                //.then(response => response.text())
                //.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
                //.then(data => data);
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
                            fields: this.timeLineCatregories
                            //fields: ko.observableArray([])
                        }
                    ],
                    selectedItems: ko.observableArray([]),
                    selectedTime: ko.observable()
                };
                this.GetInstruments();
                //console.log(this.instruments());
                //console.log(this.instruments().length);
                //console.log(this.qqq());
                //console.log(this.timeLineCatregories);
                this.subscriptions.push(this.spaceCraft.subscribe(function (newValue) {
                    _this.GetCyclogram();
                }, this));
                console.log("CyclogramModel: constructed");
                this.GetCommandDefinition();
                this.GetCyclogram();
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
            CyclogramModel.prototype.GetCommandDefinition = function () {
                var self = this;
                rlab.services.Request({
                    url: "/services/Planning.svc/command_def",
                    request: {
                        spacecraft: self.spaceCraft(),
                    },
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (def) {
                            tmp_data.push({
                                GUID: def.GUID,
                                Created: new Date(def.Created),
                                Code: def.Code,
                                ID: def.ID,
                                Title: def.Title,
                                dataRate: def.dataRate,
                                dataWord: def.dataWord,
                                power: def.power,
                            });
                        });
                        self.definitions(tmp_data);
                        console.log("список определений комманд загружен");
                    },
                    error: function (data) {
                        self.cyclograms([]);
                        console.log("Ошибка загрузки списка определений комманд");
                    }
                });
            };
            CyclogramModel.prototype.FindCyclogramByGUID = function (self) {
                return self.cyclograms().filter(function (cg) { return cg.GUID === self.selectedCyclogramGUID(); })[0];
            };
            CyclogramModel.prototype.GetCyclogram = function () {
                var self = this;
                rlab.services.Request({
                    url: "/services/Planning.svc/cyclogram",
                    request: {
                        spacecraft: self.spaceCraft(),
                    },
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (cyc) {
                            tmp_data.push({
                                GUID: cyc.GUID,
                                Created: new Date(cyc.Created),
                                Modified: new Date(cyc.Modified),
                                SIPID: cyc.SIPID,
                                comment: cyc.comment,
                                Type: cyc.Type,
                                StartTime: (cyc.Type === nkpori.CyclogramTypes[0].key) ? new Date(cyc.StartTime) : null
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
                    contentType: "application/xml",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (instr) {
                            var item = {
                                SecurityGroup: instr.SecurityGroup,
                                Title: instr.Title,
                            };
                            tmp_data.push(item);
                            //self.instruments.push(item);
                            //self.qqq("aaa");
                            //                         self.timeLineCatregories.push({ title: item.Title, field: item.SecurityGroup + "_value", style: "event", width: 2 });
                        });
                        self.instruments(tmp_data);
                        //console.log(self.instruments());
                        //console.log(self.instruments().length);
                        //console.log(self.qqq());
                        //self.instruments(tmp_data);
                        //self.instruments(tmp_data);
                        //self.instruments().forEach(inst => console.log(inst.Title));
                        //console.log(self.instruments());
                    },
                    error: function (data) {
                        self.instruments([]);
                        console.log("Ошибка загрузки ");
                    }
                });
            };
            CyclogramModel.prototype.CommandsGet = function (guid) {
                var self = this;
                rlab.services.Request({
                    url: "/services/Planning.svc/command",
                    request: {
                        spacecraft: self.spaceCraft(),
                        guidCyclogram: guid
                    },
                    type: "GET",
                    contentType: "application/json",
                    success: function (data) {
                        var tmp_data = [];
                        data.forEach(function (com) {
                            ///kostyl' !!!!!!
                            com.Instrument = nkpori.Instr[0].key;
                            var item = {
                                GUID: com.GUID,
                                GUIDCommand_def: com.GUIDCommand_def,
                                GUIDCyclogram: com.GUIDCyclogram,
                                Created: new Date(com.Created),
                                Code: com.Code,
                                ID: com.ID,
                                SendingTime: com.SendingTime === "0001-01-01T00:00:00.000Z" ? null : new Date(com.SendingTime),
                                Status: com.Status,
                                Title: com.Title,
                                //dataRate: com.dataRate,
                                dataWord: com.dataWord,
                                //power: com.power,
                                time: ko.observable(com.time * 1000),
                                begin: new Date(com.time * 1000)
                            };
                            item[com.Instrument + "_value"] = com.Code;
                            tmp_data.push(item);
                        });
                        self.dateLimitParams().end(new Date(tmp_data[tmp_data.length - 1].time() * 1.2));
                        self.dateLimitParams.valueHasMutated();
                        self.commands(tmp_data);
                        console.log("список комманд загружен");
                    },
                    error: function (data) {
                        self.cyclograms([]);
                        console.log("Ошибка загрузки списка комманд");
                    }
                });
            };
            CyclogramModel.prototype.CommandsDelete = function (self) {
                var elems = self.commands().filter(function (e) { return self.commandsChecked().filter(function (ch) { return e.GUID === ch; }).length == 0; });
                self.commandsChecked([]);
                self.commands(elems);
            };
            CyclogramModel.prototype.ComandsPost = function (self) {
                var requestData = [];
                self.commands().forEach(function (cmd) { return requestData.push({
                    //Code: String content,
                    //Created: String content,
                    GUID: cmd.GUID,
                    GUIDCommand_def: cmd.GUIDCommand_def,
                    GUIDCyclogram: cmd.GUIDCyclogram,
                    ID: cmd.ID,
                    Code: cmd.Code,
                    //SendingTime: String content,
                    //Status: String content,
                    //Title: String content,
                    //dataRate: cmd.dataRate,
                    dataWord: cmd.dataWord,
                    //power: cmd.power,
                    time: cmd.time() / 1000 /// convert tics to seconds
                }); });
                rlab.services.Request({
                    url: "/services/Planning.svc/command?spacecraft=" + self.spaceCraft() + "&guidCyclogram=" + self.comandsCGGuid(),
                    request: JSON.stringify(requestData),
                    type: "POST",
                    contentType: "application/json",
                    success: function (data) {
                        console.log("список комманд обновлён");
                        self.CommandsGet(self.comandsCGGuid());
                    },
                    error: function (data) {
                        self.cyclograms([]);
                        console.log("Ошибка обновления списка комманд");
                    }
                });
            };
            CyclogramModel.prototype.CommandsClear = function () {
                var self = this;
                self.commands([]);
            };
            CyclogramModel.prototype.CommandEdit = function (cmd, self) {
                //self.commandEditable.Code(cmd.Code);
                self.commandEditable.Created(cmd.Created);
                self.commandEditable.GUID(cmd.GUID);
                self.commandEditable.GUIDCommand_def(cmd.GUIDCommand_def);
                self.commandEditable.GUIDCyclogram(cmd.GUIDCyclogram);
                self.commandEditable.ID(cmd.ID);
                self.commandEditable.Code(cmd.Code);
                //self.commandEditable.SendingTime(cmd.SendingTime);
                //self.commandEditable.Status(cmd.Status);
                //self.commandEditable.Title(cmd.Title);
                //self.commandEditable.dataRate(cmd.dataRate);
                self.commandEditable.dataWord(cmd.dataWord);
                //self.commandEditable.power(cmd.power);
                self.commandEditable.time(cmd.time());
            };
            CyclogramModel.prototype.CommandAdd = function (self) {
                self.commandEditable.GUID("00000000-0000-0000-0000-000000000000");
                self.commandEditable.GUIDCommand_def(self.definitions()[0].GUID);
                self.commandEditable.GUIDCyclogram(self.comandsCGGuid());
                self.commandEditable.Created(new Date());
                self.commandEditable.Code(self.definitions()[0].Code);
                self.commandEditable.ID(self.definitions()[0].ID);
                //self.commandEditable.dataRate(self.definitions()[0].dataRate);
                self.commandEditable.dataWord(self.definitions()[0].dataWord);
                //self.commandEditable.power(self.definitions()[0].power);
                self.commandEditable.time(0);
            };
            CyclogramModel.prototype.CommandCansel = function (self) {
                //self.commandEditable.Code("");
                self.commandEditable.Created(new Date("0001-01-01T00:00:00.000Z"));
                self.commandEditable.GUID("");
                self.commandEditable.GUIDCommand_def("");
                self.commandEditable.GUIDCyclogram("");
                self.commandEditable.ID("");
                self.commandEditable.Code("");
                //self.commandEditable.SendingTime(new Date("0001-01-01T00:00:00.000Z"));
                //self.commandEditable.Status("");
                //self.commandEditable.Title("");
                //self.commandEditable.dataRate("");
                self.commandEditable.dataWord("");
                //self.commandEditable.power("");
                self.commandEditable.time(-1);
            };
            CyclogramModel.prototype.CommandSave = function (self) {
                var command_new = {
                    GUID: self.commandEditable.GUID(),
                    GUIDCommand_def: self.commandEditable.GUIDCommand_def(),
                    GUIDCyclogram: self.commandEditable.GUIDCyclogram(),
                    Created: new Date(),
                    Code: self.commandEditable.Code(),
                    ID: self.commandEditable.ID(),
                    //dataRate: self.commandEditable.dataRate(),
                    dataWord: self.commandEditable.dataWord(),
                    //power: self.commandEditable.power(),
                    time: ko.observable(self.commandEditable.time()),
                    SendingTime: null,
                    Status: null,
                    begin: new Date(self.commandEditable.time()),
                    Title: ""
                };
                ///get title from definition
                var def = self.definitions().filter(function (def) { return (def.GUID === command_new.GUIDCommand_def); })[0];
                command_new.Title = def.Title;
                /// try to find editable item
                var try_to_find = self.commands().filter(function (cmd) { return (cmd.GUID === command_new.GUID); });
                if (try_to_find.length > 0) {
                    ///command exsist, replace and time cascades
                    self.commands.replace(try_to_find[0], command_new);
                    switch (self.time_cascade()) {
                        case "up":
                            {
                                var index = self.commands.indexOf(command_new);
                                var tics = command_new.time() - try_to_find[0].time();
                                for (var iii = 0; iii < index; iii++) {
                                    self.commands()[iii].time(self.commands()[iii].time() + tics);
                                    self.commands()[iii].begin = new Date(self.commands()[iii].time());
                                }
                            }
                            break;
                        case "down":
                            {
                                var index = self.commands.indexOf(command_new);
                                var tics = command_new.time() - try_to_find[0].time();
                                for (var iii = index + 1; iii < self.commands().length; iii++) {
                                    self.commands()[iii].time(self.commands()[iii].time() + tics);
                                    self.commands()[iii].begin = new Date(self.commands()[iii].time());
                                }
                            }
                            break;
                        case "selected":
                            {
                                var tics = command_new.time() - try_to_find[0].time();
                                for (var iii = 0; iii < self.commands().length; iii++) {
                                    if (self.commandsChecked().indexOf(self.commands()[iii].GUID) >= 0 && self.commands()[iii].GUID !== command_new.GUID) {
                                        self.commands()[iii].time(self.commands()[iii].time() + tics);
                                        self.commands()[iii].begin = new Date(self.commands()[iii].time());
                                    }
                                }
                            }
                            break;
                    }
                }
                else {
                    /// command not exsist, push 
                    command_new.GUID = self.uuidv4();
                    self.commands().push(command_new);
                }
                self.CommandCansel(self);
                self.commands(self.commands().sort(function (a, b) { return a.time() - b.time(); }));
                self.commands.valueHasMutated();
            };
            CyclogramModel.prototype.Tics2Str = function (tics) {
                var newValue = '';
                var isPositive = tics >= 0;
                if (!isPositive)
                    tics = -tics;
                ///milliseconds
                newValue = ((tics % 1000) == 0) ? '' : '.' + ('000' + tics % 1000).substr(-3);
                tics = Math.floor(tics / 1000);
                /// seconds
                newValue = (((tics % 60 == 0) && (newValue.length == 0)) ? ':00' : ':' + ('00' + tics % 60).substr(-2)) + newValue;
                tics = Math.floor(tics / 60);
                /// minutes
                newValue = ':' + ('0' + tics % 60).substr(-2) + newValue;
                tics = Math.floor(tics / 60);
                /// hours
                newValue = ('0' + tics % 24).substr(-2) + newValue;
                /// days
                newValue = ((Math.floor(tics / 24) == 0) ? '' : Math.floor(tics / 24) + '.') + newValue;
                if (!isPositive)
                    newValue = "-" + newValue;
                return newValue;
            };
            CyclogramModel.prototype.Tics2begin = function (cmd, root) {
                return root.Tics2Str(cmd.time());
            };
            CyclogramModel.prototype.Tics2prev = function (cmd, root) {
                var i = root.commands().indexOf(cmd);
                if (i == 0)
                    return root.Tics2Str(0);
                else {
                    var t = (cmd.time() - root.commands()[i - 1].time());
                    return root.Tics2Str(t);
                }
            };
            CyclogramModel.prototype.uuidv4 = function () {
                return (1e7 + '-' + 1e3 + '-' + 4e3 + '-' + 8e3 + '-' + 1e11).replace(/[018]/g, function (c) {
                    return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
                });
            };
            return CyclogramModel;
        }());
        nkpori.CyclogramModel = CyclogramModel;
    })(nkpori = rlab.nkpori || (rlab.nkpori = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.nkpori.cyclogram.js.map