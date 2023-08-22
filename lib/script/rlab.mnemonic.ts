namespace rlab.nkpori {

    export interface instrumentRect {
        GUID: string,
        title: string,
        position: string,
        disabled: ko.Observable<boolean>,
        kbv: ko.Observable<boolean>,
        poll: ko.Observable<boolean>,
        status: ko.Observable<string>,
        statusLight: ko.ObservableArray<instrumentLight>
    }

    export interface dataBusLine {
        GUID: string,
        title: string,
        cmdCoords: string,
        dataCoords: string,
        mainCmdVis: ko.Observable<boolean>,
        mainDataVis: ko.Observable<boolean>,
        reserveCmdVis: ko.Observable<boolean>,
        reserveDataVis: ko.Observable<boolean>
    }

    export interface instrumentLight {
        title: string,
        //всего может быть до трёх лампочек! иначе не поместятся
        position: string,
        class: ko.Observable<string>
    }

    export interface interval {
        GUID: string,
        GUIDState: string,
        startOffset: number,
        stopOffset: number
    }
}