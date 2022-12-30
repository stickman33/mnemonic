namespace rlab.services {
    //export function GetData(url: string, callback?: any, request?: any) { SendRequest("GET", url, callback, request); }
    //export function PostData(url: string, callback?: any, request?: any) { SendRequest("POST", url, callback, request); }
    //export function PutData(url: string, callback?: any, request?: any) { SendRequest("PUT", url, callback, request); }
    //export function DeleteData(url: string, callback?: any, request?: any) { SendRequest("DELETE", url, callback, request); }

    export function Request(options: any) {
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

        let urlGet = (options.type == "get" && options.request != null) ?
            "?" + Object.keys(options.request).map(function (prop) { return [prop, options.request[prop]]/*.map(encodeURIComponent)*/.join("="); }).join("&") :
            "";

        //console.log(urlGet);
        let acceptHeader = {
            //"*": allTypes,
            "text": "text/plain",
            "html": "text/html",
            "xml": "application/xml, text/xml",
            "json": "application/json, text/javascript", //*/*; q=0.01
            "script": "application/javascript", //text/javascript"
            "stream": "application/octet-stream"

        };

        let xhr = getXMLHttpRequest();
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
                        let result = xhr.responseText;
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

    function getXMLHttpRequest()
    {
        //try { return new XMLHttpRequest(); }
        //catch (e) {
        //    try { return new ActiveXObject("MSXML2.XMLHTTP"); }
        //    catch (e) {
        //        try { return new ActiveXObject("Microsoft.XMLHTTP"); }
        //        catch (e) { return null; }
        //    }
        //}
        try { return new XMLHttpRequest(); } catch (ex) { }
        try { return new ActiveXObject("Msxml3.XMLHTTP"); } catch (e0) { }
        try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e1) { }
        try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e2) { }
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e3) { }
        try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e4) { }
    }
}
