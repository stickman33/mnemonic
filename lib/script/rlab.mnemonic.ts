namespace rlab.nkpori {

    export interface Square {
        GUID: string,
        Title: string,
        Circle: Circle,
        fill: ko.Observable<string>,
        stroke: ko.Observable<string>,
        position: string,
        text: ko.Observable<string>
    }

    export interface Circle {
        css: ko.Observable<string>
    }

    export interface interval {
        GUID: string,
        GUIDState: string,
        startOffset: number,
        stopOffset: number
    }

    //export enum css {
    //    fill_blue ="#a8c6f7",
    //    fill_grey = "grey",
    //    fill_yellow = "yellow",
    //    fill_green = "green",
    //    fill_yellowgreen = "yellowgreen",

    //    stroke = "black",
    //    strokeWidth = 1
    //}
}