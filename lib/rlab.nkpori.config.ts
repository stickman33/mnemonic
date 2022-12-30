namespace rlab.nkpori {

    export const PPIs: /*string[] = ["HBK", "OBK", "NVK"];*/{ key: string, title: string }[] =
        [
            { key: "MSC", title: "ЕЦ", },
            { key: "NVK", title: "СЦ", },
            { key: "HBK", title: "ДЦ", },
        ];

    export const SCs:/* string[] = ["IOSPH1", "IOSPH2"];*/{ key: string, title: string }[] =
        [
            { key: "IOSPH1", title: "1", },
            { key: "IOSPH2", title: "2", },
        ];

    export const Instr: /*string[] = ['BKUSNI', 'GALS', 'LAERT', 'MAYAK', 'NVK2', 'PES', 'SG1', 'SPER'];*/ { key: string, title: string } [] =
        [
            { key: "BKUSNI", title: "БКУСНИ", },
            { key: "GALS", title: "ГАЛС", },
            { key: "LAERT", title: "ЛАЭРТ", },
            { key: "MAYAK", title: "МАЯК", },
            { key: "NVK2", title: "НВК-2", },
            { key: "PES", title: "ПЕС", },
            { key: "SG1", title: "СГ-1", },
            { key: "SPER", title: "СПЕР", },
        ];


    export const CyclogramTypes: { key: string, title: string }[] =
        [
            { key: "FLIGHT", title: "FLIGHT", },
            { key: "SEANCE", title: "SEANCE", },
        ];

    export const TimeRepresentType: { key: string, title: string }[] =
        [

            { key: "fromBegin", title: "от начала", },
            { key: "fromPrevious", title: "от предыдущей", },
        ];

    export const TimeCascadeType: { key: string, title: string }[] =
        [
            { key: "none", title: "нет", },
            { key: "up", title: "вверх", },
            { key: "down", title: "вниз", },
            { key: "selected", title: "выбор" },
        ];
}
