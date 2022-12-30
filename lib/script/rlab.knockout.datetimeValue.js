ko.bindingHandlers['datetimeValue'] = {
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
            elementValueBeforeEvent = null;
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            var tics = Date.parse(elementValue);
            if (!isNaN(tics)) {
                element.classList.remove("bad-datetime-format");
                modelValue(new Date(tics));
            }
            else {
                element.classList.add("bad-datetime-format");
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
            var newValue = ko.utils.unwrapObservable(valueAccessor());
            var elementValue = ko.selectExtensions.readValue(element);
            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                setTimeout(updateFromModel, 0);
                return;
            }
            if (newValue != null) {
                if (newValue.toISOString() !== elementValue) {
                    ko.selectExtensions.writeValue(element, newValue.toISOString());
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
//# sourceMappingURL=rlab.knockout.datetimeValue.js.map