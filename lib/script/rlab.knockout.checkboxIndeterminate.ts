///<reference path="../typing/knockout.d.ts" />

namespace rlab.knockout {
    if (ko) {
        ko.bindingHandlers['checkboxIndeterminate'] = {
            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                element.indeterminate = value;
            }
        };
    }
}