var {Cc, Ci} = require("chrome");

var promptSvc = Cc["@mozilla.org/embedcomp/prompt-service;1"].
            getService(Ci.nsIPromptService);

exports.alert = function(title, text) {
    promptSvc.alert(null, title, text);
};