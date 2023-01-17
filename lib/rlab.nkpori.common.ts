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

    export interface Cyclogram {
        GUID: string,
        UIModified: Date,
        comment: string,
        Title: string,
        Editor: string
    }

    export interface CyclogramInFlight extends Cyclogram {
        StartTime: Date,
    }

    export interface CyclogamInPass extends Cyclogram {

    }

}