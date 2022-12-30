///<reference path="../typing/knockout.d.ts" />
var rlab;
(function (rlab) {
    var knockout;
    (function (knockout) {
        if (ko) {
            ko.bindingHandlers['checkboxIndeterminate'] = {
                update: function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    element.indeterminate = value;
                }
            };
        }
    })(knockout = rlab.knockout || (rlab.knockout = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.knockout.checkboxIndeterminate.js.map