namespace rlab.nkpori {


    export interface Sip {
        GUID: string;
        SpaceCraft: string;
        ID: number;
        Orbit: number,
        FileName: string,
        StartDate: string;
        StopDate: string;
        Created: string;
        isPredicted: boolean;
    }

    export interface Cuclogram {
        GUID: string,
        Created: Date,
        Modified: Date,
        SIPID: number,
        comment: string,
        Type: string
    }

    export interface CyclogramInFlight extends Cuclogram {
        StartTime: Date,
    }

    export interface CyclogamInPass extends Cuclogram {

    }

        //export interface Instrument{
    //    GUID: string,
    //    SecurityGroup: string;
    //    Title: string;
    //}
}