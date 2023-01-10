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

    interface CommandEditable {
        GUID: ko.Observable<string>,
        GUIDCommand_def: ko.Observable<string>,
        GUIDCyclogram: ko.Observable<string>,
        Created: ko.Observable<Date>,
        Code: ko.Observable<string>,
        ID: ko.Observable<string>,
        //SendingTime: ko.Observable<Date>,
        //Status: ko.Observable<string>,
        //Title: ko.Observable<string>,
        //dataRate: ko.Observable<string>,
        dataWord: ko.Observable<string>,
        //power: ko.Observable<string>,
        time: ko.Observable<number>
    }

    interface CyclogramEditable {
        GUID: ko.Observable<string>,
        Created: ko.Observable<Date>,
        Modified: ko.Observable<Date>,
        SIPID: ko.Observable<number>,
        comment: ko.Observable<string>,
        Type: ko.Observable<string>,
        StartTime: ko.Observable<Date>
    }

    interface Instrument {
        GUID: ko.Observable<string>,
        SecurityGroup: ko.Observable<string>,
        Title: ko.Observable <string>
    }


  


    export class CyclogramModel {
        subscriptions: ko.Subscription[];
        timers: number[];

        spaceCraft: ko.Observable<string>;

        dateLimitParams: ko.Observable<{ begin: ko.Observable<Date>, end: ko.Observable<Date> }>;
        timeLineOptions: any;
        isTimeLineVisible: ko.Observable<boolean> = ko.observable(false);


        definitions: ko.ObservableArray<CommandDef>;

        cyclograms: ko.ObservableArray<Cyclogram>;

        instruments: ko.ObservableArray<Instrument>;

        selectedCyclogramGUID: ko.Observable<string>;
        cyclogramEditable: CyclogramEditable;

        commands: ko.ObservableArray<Command>;

        comandsCGGuid: ko.Observable<string>;
        commandsChecked: ko.ObservableArray<string>;
        isAllCommandsCheck: ko.PureComputed<boolean>;
        isAllCommandsIndeterminate: ko.PureComputed<boolean>;

        commandEditable: CommandEditable;


        time_represent: ko.Observable<string>;
        time_cascade: ko.Observable<string>;

        cycTablePage = 1;

        backButton = document.getElementById("back") as HTMLButtonElement;
        nextButton = document.getElementById("next") as HTMLButtonElement;



        constructor(params: any) {
            
            this.subscriptions = [];
            this.timers = [];

            this.spaceCraft = ko.observable(SCs[0].key);

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
            }

            
            this.commands = ko.observableArray([]);
            this.isAllCommandsCheck = ko.pureComputed({
                read: function () {
                    let isAll: boolean = true;
                    if (this.commands().length == 0)
                        return false;
                    /// check is all children is checked ??
                    this.commands().forEach(ch => isAll = isAll && (this.commandsChecked().indexOf(ch.GUID) >= 0))
                    return isAll;
                },
                write: function (value) {
                    /// add / remove  all children into checked array
                    if (this.commands().length > 0)
                        if (value)
                            this.commands().forEach(ch => {
                                if (this.commandsChecked().indexOf(ch.GUID) == -1)
                                    this.commandsChecked.push(ch.GUID);
                            })
                        else
                            this.commands().forEach(ch => { this.commandsChecked.remove(ch.GUID); })

                },
                owner: this
            });
            this.isAllCommandsIndeterminate = ko.computed(function () {
                let cnt = 0;

                this.commands().forEach(ch => {
                    if (this.commandsChecked().indexOf(ch.GUID) >= 0)
                        cnt++;
                })

                return cnt > 0 && cnt < this.commands().length;
            }, this);


            this.comandsCGGuid = ko.observable<string>("");

            


            this.commandsChecked = ko.observableArray([]);
    

            this.time_represent = ko.observable(TimeRepresentType[0].key);
            this.time_cascade = ko.observable(TimeCascadeType[0].key);

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
                dataWord: ko.observable (""),
                //power: ko.observable (""),
                time: ko.observable(-1)
            }



            //this.subscriptions.push(this.commandEditable.GUIDCommand_def.subscribe(nv => {
            //    if (nv !== "") {
            //        this.definitions().forEach(def => {
            //            if (def.GUID === nv) {
            //                this.commandEditable.Code(def.Code);
            //                this.commandEditable.ID(def.ID);
            //            }
            //        })
            //    }
            //}, this))

            



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
                        fields: []
                        //IsVisible: false
                    }
                ],
                selectedItems: ko.observableArray([]),
                selectedTime: ko.observable()
            };

            this.backButton.disabled = true;


            //this.timeLineOptions.panels[0].fields.valueHasMutated();
            //console.log(this.timeLineOptions.panels[0].fields);


            //this.timeLineOptions.panels[0].IsVisible = false;
            //console.log(this.instruments());
            //console.log("IsVisible: " + this.timeLineOptions.panels[0].IsVisible);
            //console.log(this.instruments().length);


            //console.log(this.timeLineCatregories);

            
            

            this.subscriptions.push(this.spaceCraft.subscribe(newValue => {
    
                this.GetCyclogram(this.cycTablePage);
            }, this));


            console.log("CyclogramModel: constructed");

            this.GetInstruments();
            this.GetCommandDefinition();
            this.GetCyclogram(this.cycTablePage);

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

            let cyc = self.FindCyclogramByGUID(self);

            //self.comandsCGGuid(cyc.GUID);
            self.CommandsGet(cyc.GUID);
        }


        GetCommandDefinition() {
            let self = this;
            
            rlab.services.Request({
                url: "/0/services/Sequences.svc/sequenceitemdefinition",
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
                    
                    console.log("список определений комманд загружен");
                },
                error: function (data) {
                    self.cyclograms([]);
                    console.log("Ошибка загрузки списка определений комманд");
                }
            });
        }

        FindCyclogramByGUID(self: CyclogramModel): Cyclogram {
            return self.cyclograms().filter(cg => cg.GUID === self.selectedCyclogramGUID())[0];
        
        }

        
    

        nextCyclogramPage() {
            this.cycTablePage++;
            if (this.cycTablePage == 3) {
                this.nextButton.disabled = true;
            }
            this.backButton.disabled = false;
            this.GetCyclogram(this.cycTablePage);
            console.log(this.cycTablePage);
            
        }
        

        prevCyclogramPage() {
            this.cycTablePage--;
            if (this.cycTablePage == 1) {
                this.backButton.disabled = true;
            }
            this.nextButton.disabled = false;
            this.GetCyclogram(this.cycTablePage);
            console.log(this.cycTablePage);
        }

        GetCyclogram(page) {
            let self = this;
            rlab.services.Request({
                //url: "/0/services/Sequences.svc/sequenceNI?rows=5&page=1",
                url: `/0/services/Sequences.svc/sequenceNI?rows=5&page=${page}`,
                //request: {
                //    spacecraft: self.spaceCraft(),
                //},
                type: "GET",
                contentType: "application/json",
                success: function (data) {
                    //console.log(data.rows);
                    let tmp_data: (Cyclogram)[] = [];
                    data.rows.forEach(cyc => {
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
        }

        
       

      GetInstruments() {
            let self = this;

            rlab.services.Request({
                url: "/0/services/Sequences.svc/instrument",
   
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
                         self.instruments.push(item);
                     });

                    self.dateLimitParams.valueHasMutated();
                    self.isTimeLineVisible(true);
                    console.log("список приборов загружен");
                    //console.log(self.instruments());
                   
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
                url: `/0/services/Sequences.svc/sequenceitemNI?guidsequence=${guid}&rows=10000&page=1&sidx=Offset&sord=asc`,
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

                    self.dateLimitParams().end(new Date(tmp_data[tmp_data.length - 1].Offset() * 1.2));
                    self.dateLimitParams.valueHasMutated();
                    self.commands(tmp_data);
                    console.log("список комманд загружен");
                    //console.log(self.commands());

                },
                error: function (data) {
                    self.cyclograms([]);
                    console.log("Ошибка загрузки списка комманд");
                }
            });
        }



        //CommandsDelete(self: CyclogramModel) {

        //    let elems = self.commands().filter(e =>  self.commandsChecked().filter(ch =>   e.GUID === ch ).length == 0);
        //    self.commandsChecked([]);
        //    self.commands(elems);


        //}

        //ComandsPost(self: CyclogramModel) {

        //    let requestData = [];

        //    self.commands().forEach(cmd => requestData.push({
        //        //Code: String content,
        //        //Created: String content,
        //        GUID: cmd.GUID,
        //        GUIDCommand_def: cmd.GUIDCommand_def,
        //        GUIDCyclogram: cmd.GUIDCyclogram,
        //        ID: cmd.ID,
        //        Code: cmd.Code,
        //        //SendingTime: String content,
        //        //Status: String content,
        //        //Title: String content,
        //        //dataRate: cmd.dataRate,
        //        dataWord: cmd.dataWord,
        //        //power: cmd.power,
        //        time: cmd.time()/1000 /// convert tics to seconds
        //    }));

        //    rlab.services.Request({
        //        url: "/services/Planning.svc/command?spacecraft=" + self.spaceCraft()+"&guidCyclogram=" + self.comandsCGGuid(),
        //        request: JSON.stringify(requestData), 
        //        type: "POST",
        //        contentType: "application/json",
        //        success: function (data: any[]) {
                    

                   
        //            console.log("список комманд обновлён");
        //            self.CommandsGet(self.comandsCGGuid());
        //        },
        //        error: function (data) {
        //            self.cyclograms([]);
        //            console.log("Ошибка обновления списка комманд");
        //        }
        //    });
        //}

        //CommandsClear() {
        //    let self = this;
        //    self.commands([]);
        //}





        //CommandEdit(cmd: Command, self: CyclogramModel): void {
        //    //self.commandEditable.Code(cmd.Code);
        //    self.commandEditable.Created(cmd.Created);
        //    self.commandEditable.GUID(cmd.GUID);
        //    self.commandEditable.GUIDCommand_def(cmd.GUIDCommand_def);
        //    self.commandEditable.GUIDCyclogram(cmd.GUIDCyclogram);
        //    self.commandEditable.ID(cmd.ID);
        //    self.commandEditable.Code(cmd.Code);
        //    //self.commandEditable.SendingTime(cmd.SendingTime);
        //    //self.commandEditable.Status(cmd.Status);
        //    //self.commandEditable.Title(cmd.Title);
        //    //self.commandEditable.dataRate(cmd.dataRate);
        //    self.commandEditable.dataWord(cmd.dataWord);
        //    //self.commandEditable.power(cmd.power);
        //    self.commandEditable.time(cmd.time());
        //}

        //CommandAdd(self: CyclogramModel):void {
        //    self.commandEditable.GUID("00000000-0000-0000-0000-000000000000");
        //    self.commandEditable.GUIDCommand_def(self.definitions()[0].GUID);
        //    self.commandEditable.GUIDCyclogram(self.comandsCGGuid());
        //    self.commandEditable.Created(new Date());


        //    self.commandEditable.Code(self.definitions()[0].Code);
        //    self.commandEditable.ID(self.definitions()[0].ID);

        //    //self.commandEditable.dataRate(self.definitions()[0].dataRate);
        //    self.commandEditable.dataWord(self.definitions()[0].dataWord);
        //    //self.commandEditable.power(self.definitions()[0].power);
        //    self.commandEditable.time(0);
        //}

        //CommandCansel(self: CyclogramModel): void {
        //    //self.commandEditable.Code("");
        //    self.commandEditable.Created(new Date("0001-01-01T00:00:00.000Z"));
        //    self.commandEditable.GUID("");
        //    self.commandEditable.GUIDCommand_def("");
        //    self.commandEditable.GUIDCyclogram("");
        //    self.commandEditable.ID("");
        //    self.commandEditable.Code("");
        //    //self.commandEditable.SendingTime(new Date("0001-01-01T00:00:00.000Z"));
        //    //self.commandEditable.Status("");
        //    //self.commandEditable.Title("");
        //    //self.commandEditable.dataRate("");
        //    self.commandEditable.dataWord("");
        //    //self.commandEditable.power("");
        //    self.commandEditable.time(-1);
        //}

        //CommandSave(self: CyclogramModel) {

        //    let command_new: Command = {
        //        GUID: self.commandEditable.GUID(),
        //        GUIDCommand_def: self.commandEditable.GUIDCommand_def(),
        //        GUIDCyclogram: self.commandEditable.GUIDCyclogram(),
        //        Created: new Date(),
        //        Code: self.commandEditable.Code(),
        //        ID: self.commandEditable.ID(),
        //        //dataRate: self.commandEditable.dataRate(),
        //        dataWord: self.commandEditable.dataWord(),
        //        //power: self.commandEditable.power(),
        //        time: ko.observable(self.commandEditable.time()),

        //        SendingTime: null,
        //        Status: null,

        //        begin: new Date(self.commandEditable.time()),
        //        Title: ""
        //    }

        //    ///get title from definition
        //    let def = self.definitions().filter(def => (def.GUID === command_new.GUIDCommand_def) )[0]

        //    command_new.Title = def.Title;

        //    /// try to find editable item
        //    let try_to_find: Command[] = self.commands().filter((cmd) => (cmd.GUID === command_new.GUID))

        //    if (try_to_find.length > 0) {
        //        ///command exsist, replace and time cascades
        //        self.commands.replace(try_to_find[0], command_new);
        //        switch (self.time_cascade()) {
        //            case "up":
        //                {
        //                    let index: number = self.commands.indexOf(command_new);
        //                    let tics: number = command_new.time() - try_to_find[0].time();
        //                    for (let iii = 0; iii < index; iii++) {
        //                        self.commands()[iii].time(self.commands()[iii].time() + tics);
        //                        self.commands()[iii].begin = new Date(self.commands()[iii].time());
        //                    }
        //                }
        //                break;

        //            case "down":
        //                {
        //                    let index: number = self.commands.indexOf(command_new);
        //                    let tics: number = command_new.time() - try_to_find[0].time();
        //                    for (let iii = index + 1; iii < self.commands().length; iii++) {
        //                        self.commands()[iii].time(self.commands()[iii].time() + tics);
        //                        self.commands()[iii].begin = new Date(self.commands()[iii].time());
        //                    }
        //                }
        //                break;

        //            case "selected":
        //                {
        //                    let tics: number = command_new.time() - try_to_find[0].time();
        //                    for (let iii = 0; iii < self.commands().length; iii++) {
        //                        if (self.commandsChecked().indexOf(self.commands()[iii].GUID) >=0 && self.commands()[iii].GUID !== command_new.GUID) {
        //                            self.commands()[iii].time(self.commands()[iii].time() + tics);
        //                            self.commands()[iii].begin = new Date(self.commands()[iii].time());
        //                        }
        //                    }
        //                }
        //                break;
        //        }

        //    }
        //    else {
        //        /// command not exsist, push 
        //        command_new.GUID = self.uuidv4();
        //        self.commands().push(command_new);
        //    }


        //    self.CommandCansel(self);
        //    self.commands(self.commands().sort((a, b) => a.time() - b.time()));
        //    self.commands.valueHasMutated();


        //}

        
        //Tics2Str(tics: number): string {
        //    let newValue = '';
        //    let isPositive = tics >= 0;
        //    if (!isPositive)
        //        tics = -tics;
        //    ///milliseconds
        //    newValue = ((tics % 1000) == 0) ? '' : '.' + ('000' + tics % 1000).substr(-3);
        //    tics = Math.floor(tics / 1000);
        //    /// seconds
        //    newValue = (((tics % 60 == 0) && (newValue.length == 0)) ? ':00' : ':' + ('00' + tics % 60).substr(-2)) + newValue;
        //    tics = Math.floor(tics / 60);
        //    /// minutes
        //    newValue = ':' + ('0' + tics % 60).substr(-2) + newValue;
        //    tics = Math.floor(tics / 60);
        //    /// hours
        //    newValue = ('0' + tics % 24).substr(-2) + newValue;
        //    /// days
        //    newValue = ((Math.floor(tics / 24) == 0) ? '' : Math.floor(tics / 24) + '.') + newValue;

        //    if (!isPositive)
        //        newValue = "-" + newValue
        //    return newValue;
        //}

        //Tics2begin(cmd: Command, root: CyclogramModel) {
        //    return root.Tics2Str(cmd.time());
        //}



        //Tics2prev(cmd: Command, root: CyclogramModel) {
        //    let i: number = root.commands().indexOf(cmd);
        //    if (i == 0)
        //        return root.Tics2Str(0);
        //    else {
        //        let t = (cmd.time() - root.commands()[i - 1].time());
        //        return root.Tics2Str(t);
        //    }
        //}

        uuidv4() {
            return (1e7 + '-' + 1e3 + '-' + 4e3 + '-' + 8e3 + '-' + 1e11).replace(/[018]/g, c =>
                (<any>c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> <any>c / 4).toString(16)
            );
        }
    }
    
}