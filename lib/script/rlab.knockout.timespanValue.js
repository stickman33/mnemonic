ko.bindingHandlers['timespanValue'] = {
    /*
     *  биндинг для редактирования интервального значения. Возможны два варианта использования:
     *      1. фиксирование конечной даты, изменение начальной даты через интервал
     *      2. фиксирование начальной даты, изменение конечной даты через интервал
     *  синтаксические варианты строки:
     *  (+-)ЧЧ:ММ:СС
     *  (+-)Д{1-5}.ЧЧ:ММ:СС
     *  (+-)ЧЧ:ММ:СС.м{1-3}
     *  (+-)Д{1-5}.ЧЧ:ММ:СС.ззз{1-3}
     */
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindings.get("valueUpdate");
        var propertyChangedFired = false;
        var elementValueBeforeEvent = null;
        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }
        var valueUpdateHandler = function () {
            var timespanRegex = /^(-|\+)?(?:(\d*)\s)?(\d{2})\:(\d{2})\:(\d{2})(?:\.\d+)?$/;
            elementValueBeforeEvent = null;
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            var match = elementValue.match(timespanRegex); /// [fullMatch, + or - or undef, days or undef, HH, MM, SS or SS.zzz]
            if (match != null) {
                element.classList.remove("bad-timespan-format");
                var tics = 0;
                if (match[2] != null)
                    tics = parseInt(match[2]); //set days
                tics = tics * 24 + parseInt(match[3]); // set hours
                tics = tics * 60 + parseInt(match[4]); // set minutes
                tics = tics * 60 + parseFloat(match[5]); // set seconds.ms
                if (match[1] === "-")
                    tics = -tics; //set to negative value
                tics *= 1000;
                var newValue = void 0;
                if (ko.isObservable(modelValue.begin)) {
                    newValue = modelValue.end.valueOf() - tics;
                    modelValue.begin(new Date(newValue));
                }
                else {
                    newValue = modelValue.begin.valueOf() + tics;
                    modelValue.end(new Date(newValue));
                }
            }
            else {
                element.classList.add("bad-timespan-format");
            }
            ;
        };
        ko.utils.arrayForEach(eventsToCatch, function (eventName) {
            var handler = valueUpdateHandler;
            if (eventName.lastIndexOf("after", 0) === 0) {
                handler = function () {
                    elementValueBeforeEvent = ko.selectExtensions.readValue(element);
                    setTimeout(valueUpdateHandler, 0);
                };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });
        var updateFromModel = function () {
            var b = ko.utils.unwrapObservable(valueAccessor().begin);
            var e = ko.utils.unwrapObservable(valueAccessor().end);
            var tics = e.valueOf() - b.valueOf();
            var isPositive = tics >= 0;
            if (!isPositive)
                tics = -tics;
            var newValue = '';
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
                newValue = "-" + newValue

            var elementValue = ko.selectExtensions.readValue(element);
            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                setTimeout(updateFromModel, 0);
                return;
            }
            if (newValue != null) {
                if (newValue !== elementValue) {
                    ko.selectExtensions.writeValue(element, newValue);
                }
            }
            else
                ko.selectExtensions.writeValue(element, '');
        };
        ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
    },
    'update': function () { } // Keep for backwards compatibility with code that may have wrapped value binding
};
ko.expressionRewriting._twoWayBindings['value'] = true;
//# sourceMappingURL=rlab.knockout.timespanValue.js.map