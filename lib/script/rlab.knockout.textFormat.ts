(<any>ko.bindingHandlers['text']) = {
    'init': function () {
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor, allBindings) {
        var value = valueAccessor();
        try {
            var format = allBindings.get('format');
            value = ko.unwrap(value).format(format);
        }
        catch (ex) {
        }
        ko.utils.setTextContent(element, value);
    }
};