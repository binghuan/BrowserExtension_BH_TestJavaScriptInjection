var data       = require('sdk/self').data;
var winUtils   = require('sdk/window/utils');
var windows    = require('sdk/windows');
var Request    = require('sdk/request').Request;
var xhrRequest = require('sdk/net/xhr');
var tabs       = require('sdk/tabs');
var pageMod    = require("sdk/page-mod");
var _		   = require("sdk/l10n").get;
var system     = require("sdk/system");
var system     = require("sdk/system");
var panel      = require("sdk/panel").Panel;
var prefs = require("sdk/simple-prefs").prefs;
//Cu.import('resource://gre/modules/Services.jsm');

var contentScript = pageMod.PageMod({
	include : "*",
	attachTo: ["existing", "frame", "top"],
	contentScriptFile: [
		data.url("content_script.js")
		],
	contentScriptWhen: "end",
	onAttach : function(worker){
			worker.port.on("MSG_SRC_OF_CONTENT_SCRIPT", function(event) {
			console.log("@@@@@@@@@ main.js get MSG_SRC_OF_CONTENT_SCRIPT");

			worker.port.emit("MSG_SRC_OF_CONTENT_SCRIPT", prefs.sourceOfContentScript);
		});
	}
});

// create main console popup
var popover;

//var urlOfPopup = "http://127.0.0.1/popup.html";
var urlOfPopup = data.url("popover.html");
function createPanel() {
    console.log(">> createPanel: " + urlOfPopup);
    popover = panel({
        height: 513,
        width: 380,
        contentURL: urlOfPopup,
        onShow : function(){
            console.log("--> onShow: ", urlOfPopup);
        },
        onHide : function(){
            console.log("--> onHide");
        }
    });

    popover.port.on("closePanel", function(){
        console.log("hide panel");
        popover.hide();
    });
}

createPanel();

// new windows listener for create new window
var wins = windows.browserWindows;
wins.on('open', function(window){
	if(require("sdk/private-browsing").isPrivate(winUtils.getMostRecentBrowserWindow())){
    	console.log("------------------------------ private -----------------------------");
    	addToolbarButton(winUtils.getFocusedWindow().document, true);
    	require("promptManager").alert(_("tooltip"), _("message"));
    }else{
    	console.log("------------------------------ not private -----------------------------");
    	addToolbarButton(winUtils.getFocusedWindow().document, false);
    }
});

wins.on('close', function(window){
    console.log("A window was closed", popover);
});

var gBtns = [];

// exports.main is called when extension is installed or re-enabled
exports.main = function(options, callbacks) {
    if(require("sdk/private-browsing").isPrivate(winUtils.getMostRecentBrowserWindow())){
    	console.log("------------------------------ private -----------------------------");
    	addToolbarButton(winUtils.getMostRecentBrowserWindow().document, true);
    	require("promptManager").alert(_("tooltip"), _("message"));
    }else{
    	console.log("------------------------------ not private -----------------------------");
    	addToolbarButton(winUtils.getMostRecentBrowserWindow().document, false);
    }
};
// exports.onUnload is called when Firefox starts and when the extension is disabled or uninstalled
exports.onUnload = function(reason) {
	removeToolbarButton(winUtils.getMostRecentBrowserWindow().document);
};

// add our button
function addToolbarButton(document, disabled) {
    console.log(">> addToolbarButton");
	// this document is an XUL document
	var navBar = document.getElementById('nav-bar');
	if (!navBar) {
		return;
	}
	var btn = document.createElement('toolbarbutton');
	btn.setAttribute('id', 'mybutton-id');
	btn.setAttribute('type', 'button');
	// the toolbarbutton-1 class makes it look like a traditional button
	btn.setAttribute('class', 'toolbarbutton-1');
	// the data.url is relative to the data folder
	btn.setAttribute('image', data.url('images/Icon-16.png'));
	btn.setAttribute('orient', 'horizontal');
	// this text will be shown when the toolbar is set to text or text and iconss
	btn.setAttribute('label', _("tooltip"));
	btn.setAttribute('tooltiptext', _("tooltip"));
	/*
	if(gInited && !disabled){
		btn.setAttribute('disabled', false);
	}else{
		btn.setAttribute('disabled', true);
	}
	*/

	btn.setAttribute('disabled', false);

	if( disabled === false){
		btn.addEventListener('click', function() {
		    console.log("------> BHO has been clicked !!:");
		    var verNum = parseInt(system.version, 10);
		    if(verNum <= 26){
		    	popover.contentURL = urlOfPopup;
		    }else{
		    	console.log("fix version 27 cannot show panel: " + urlOfPopup);
		    	popover.contentURL = urlOfPopup;
		    }

			createPanel();

			console.log(">>> showPanel");
			popover.show(btn);

		}, false);
		gBtns.push(btn);
	}
	navBar.appendChild(btn);
}

function removeToolbarButton(document) {
	// this document is an XUL document
	var navBar = document.getElementById('nav-bar');
	var btn = document.getElementById('mybutton-id');
	if (navBar && btn) {
		navBar.removeChild(btn);
	}
}

// modify CSP for DPV3.1 for firefox

const {components, Cc, Ci} = require("chrome");
var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);

var url = prefs.sourceOfContentScript;
var urlParts = url.split("/");
var DP_DOMAIN_OF_URL = urlParts[0] + '//' + urlParts[2];
var DP_SCRIPT_SRC = urlParts[2];
var DP_FRAME_SRC = urlParts[2];

var httpResponseObserver = {
  observe: function(subject, topic, data) {
  	if(topic === "http-on-examine-response") {
	  	var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
		var url = httpChannel.originalURI.spec;
		//console.log("#### httpResponseObserver:observe - " + url + " :: " + topic);
		var headerValue = "";
		try {
			headerValue = httpChannel.getResponseHeader("Content-Security-Policy");
			console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ \nheaderValue : ___" +
			headerValue + "___");
			headerValue = headerValue.replace('default-src', 'default-src ' + DP_FRAME_SRC);
			headerValue = headerValue.replace("frame-src 'none'", 'frame-src ');
			headerValue = headerValue.replace('frame-src', 'frame-src ' + DP_FRAME_SRC);
			headerValue = headerValue.replace("script-src", 'script-src '+ DP_SCRIPT_SRC + " 'unsafe-inline' 'unsafe-eval'");
			headerValue = headerValue.replace("style-src", 'style-src '+ DP_FRAME_SRC);
			headerValue = headerValue.replace("'unsafe-eval'", "unsafe-eval");
			headerValue = headerValue.replace("unsafe-eval", "'unsafe-eval' "+ DP_FRAME_SRC);
			httpChannel.setResponseHeader("Content-Security-Policy", headerValue, false);
		} catch (e) {

		}
  	}
  }
};

function makeURI(aURL, aOriginCharset, aBaseURI) {
  var ioService = Cc["@mozilla.org/network/io-service;1"]
                  .getService(Ci.nsIIOService);
  return ioService.newURI(aURL, aOriginCharset, aBaseURI);
}

observerService.addObserver(httpResponseObserver, 'http-on-examine-response', false);
console.log("+++ permissionManager : ___" + Ci.nsIPermissionManager.ALLOW_ACTION);

// reference: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPermissionManager

var permissionManager = Cc["@mozilla.org/permissionmanager;1"]
	.getService(Ci.nsIPermissionManager);
permissionManager.add(makeURI(DP_DOMAIN_OF_URL, null, null), "cookie",
	Ci.nsIPermissionManager.ALLOW_ACTION,
	Ci.nsIPermissionManager.EXPIRE_NEVER,null);

console.log("--- permissionManager : ___");
