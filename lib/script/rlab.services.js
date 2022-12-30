var rlab;
(function (rlab) {
    var services;
    (function (services) {
        //export function GetData(url: string, callback?: any, request?: any) { SendRequest("GET", url, callback, request); }
        //export function PostData(url: string, callback?: any, request?: any) { SendRequest("POST", url, callback, request); }
        //export function PutData(url: string, callback?: any, request?: any) { SendRequest("PUT", url, callback, request); }
        //export function DeleteData(url: string, callback?: any, request?: any) { SendRequest("DELETE", url, callback, request); }
        function Request(options) {
            options.type = (options.type || "get").toLowerCase();
            options.url = options.url || "";
            options.contentType = options.contentType || "application/x-www-form-urlencoded";
            options.accept = (options.accept || "json").toLowerCase();
            //options.request
            //options.callback
            if (options.sync != undefined && options.sync.xhr != undefined) {
                options.sync.xhr.abort();
                //console.log("abort");
                delete options.sync.xhr;
            }
            var urlGet = (options.type == "get" && options.request != null) ?
                "?" + Object.keys(options.request).map(function (prop) { return [prop, options.request[prop]] /*.map(encodeURIComponent)*/.join("="); }).join("&") :
                "";
            //console.log(urlGet);
            var acceptHeader = {
                //"*": allTypes,
                "text": "text/plain",
                "html": "text/html",
                "xml": "application/xml, text/xml",
                "json": "application/json, text/javascript",
                "script": "application/javascript",
                "stream": "application/octet-stream"
            };
            var xhr = getXMLHttpRequest();
            xhr.open(options.type, options.url + urlGet, true);
            xhr.setRequestHeader("Accept", acceptHeader[options.accept]);
            xhr.setRequestHeader("Content-Type", options.contentType);
            //xhr.setRequestHeader("X-Requested-With", XMLHttpRequest);
            xhr.onreadystatechange = function () {
                //let sss = options.sync || { xhr: "NO!!!" };
                //console.log("onreadystatechange: " + xhr.readyState + ", " + sss + ", " + sss.xhr);
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        if (options.success && options.success.call) {
                            var result = xhr.responseText;
                            if (xhr.responseText.length > 0) {
                                result = (options.accept == "json") ? JSON.parse(xhr.responseText) : result;
                                result = (options.accept == "xml") ? xhr.responseXML : result;
                            }
                            options.success(result);
                        }
                    }
                    else {
                        if (options.error && options.error.call) {
                            options.error({
                                status: xhr.status,
                                statusText: xhr.statusText,
                                responseType: xhr.responseType,
                                response: xhr.response,
                                responseText: xhr.responseText
                            });
                        }
                    }
                    if (options.sync && options.sync.xhr) {
                        delete options.sync.xhr;
                    }
                }
            };
            //if (options.request != null && typeof options.request === "object") {
            //    options.request = JSON.stringify(options.request);
            //}
            //console.log(options.request);
            xhr.send((options.type == "get") ? null : options.request);
            if (options.sync != undefined) {
                options.sync.xhr = xhr;
            }
        }
        services.Request = Request;
        function getXMLHttpRequest() {
            //try { return new XMLHttpRequest(); }
            //catch (e) {
            //    try { return new ActiveXObject("MSXML2.XMLHTTP"); }
            //    catch (e) {
            //        try { return new ActiveXObject("Microsoft.XMLHTTP"); }
            //        catch (e) { return null; }
            //    }
            //}
            try {
                return new XMLHttpRequest();
            }
            catch (ex) { }
            try {
                return new ActiveXObject("Msxml3.XMLHTTP");
            }
            catch (e0) { }
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.6.0");
            }
            catch (e1) { }
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
            }
            catch (e2) { }
            try {
                return new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (e3) { }
            try {
                return new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (e4) { }
        }
    })(services = rlab.services || (rlab.services = {}));
})(rlab || (rlab = {}));
//# sourceMappingURL=rlab.services.js.map