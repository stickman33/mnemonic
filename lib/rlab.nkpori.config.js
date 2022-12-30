var rlab;
(function (rlab) {
    var nkpori;
    (function (nkpori) {
        nkpori.PPIs = [
            { key: "MSC", title: "ЕЦ", },
            { key: "NVK", title: "СЦ", },
            { key: "HBK", title: "ДЦ", },
        ];
        nkpori.SCs = [
            { key: "IOSPH1", title: "1", },
            { key: "IOSPH2", title: "2", },
        ];
        nkpori.Instr = [
            { key: "BKUSNI", title: "БКУСНИ", },
            { key: "GALS", title: "ГАЛС", },
            { key: "LAERT", title: "ЛАЭРТ", },
            { key: "MAYAK", title: "МАЯК", },
            { key: "NVK2", title: "НВК-2", },
            { key: "PES", title: "ПЕС", },
            { key: "SG1", title: "СГ-1", },
            { key: "SPER", title: "СПЕР", },
        ];
        nkpori.CyclogramTypes = [
            { key: "FLIGHT", title: "FLIGHT", },
            { key: "SEANCE", title: "SEANCE", },
        ];
        nkpori.TimeRepresentType = [
            { key: "fromBegin", title: "от начала", },
            { key: "fromPrevious", title: "от предыдущей", },
        ];
        nkpori.TimeCascadeType = [
            { key: "none", title: "нет", },
            { key: "up", title: "вверх", },
            { key: "down", title: "вниз", },
            { key: "selected", title: "выбор" },
        ];
    })(nkpori = rlab.nkpori || (rlab.nkpori = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.nkpori.config.js.map