var browserType= {
	isSafari: function() {
		return ((window.safari != undefined) && (safari.application != undefined));
	},
	isChrome: function() {
		return ((window.chrome != undefined) && (chrome.webRequest != undefined));
	}
}

var DP_DOMAIN_OF_URL = "";
var DP_SCRIPT_SRC = "";
var DP_FRAME_SRC = "";

function setScriptUrl(url) {
	localStorage.ORIGIN_OF_CONTENT_SCRIPT = url;
}

function getScriptUrl() {
	var result = localStorage.ORIGIN_OF_CONTENT_SCRIPT;
	if(result == null) {
		result = "https://10.1.201.174/extensionFrame/content_script.js";
		setScriptUrl(result);
	}

	return result;
}

function parseDomainUrl(url) {

	console.log("+ parseDomainUrl:", url);

	var urlParts = url.split("/");
	DP_DOMAIN_OF_URL = urlParts[0] + '//' + urlParts[2];
	DP_SCRIPT_SRC = urlParts[2];
	DP_FRAME_SRC = urlParts[2];
}

console.log("running background.js");

function MessageHandler(event) {
	console.log(">> MessageHandler: " , event);
	if (event.name === "MESSAGE_BACKUP_PDATA") {

		console.log(">> Retrieve Msg: backupPdata");

		localStorage.pdata1 = event.message.pdata1;
		localStorage.pdata2 = event.message.pdata2;
	} else if (event.name === "canLoad") {

		var msgObj = {
			pdata1: localStorage.pdata1,
			pdata2: localStorage.pdata2
		}

		if( msgObj.pdata1 != undefined) {
			console.log("storeback: pdata1", msgObj.pdata1);
			event.message = JSON.stringify(msgObj);
		}
	} else if (event.name === "MSG_SRC_OF_CONTENT_SCRIPT") {
		console.log(">> Retrieve Msg: MSG_SRC_OF_CONTENT_SCRIPT");
		var srcOfContentScript = safari.extension.settings.getItem("SRC_CONTENT_SCRIPT");
		event.target.page.dispatchMessage("MSG_SRC_OF_CONTENT_SCRIPT",srcOfContentScript);
	}
}



function activateExistedUrlTab(mappingUrl) {
    var isHit = false;
    var j;

    if(browserType.isSafari() === true) {

		for(j =0; j <  safari.application.browserWindows.length; j++) {
			console.log("After initializing: windows[" + j);
			var tabs = safari.application.browserWindows[j].tabs;
			var i;
			for(i =0; i < tabs.length ; i++) {
				if(tabs[i].url && tabs[i].url === mappingUrl) {
					console.log("hit URL: " + tabs[i].url);
					tabs[i].activate();
					tabs[i].url = tabs[i].url;
					isHit = true;
					break;
				}
			}
		}

    }


	return isHit;
}


function openNewTabWithUrl(url) {
	if(activateExistedUrlTab(url) !== true) {
		if(browserType.isSafari() === true) {
			safari.application.activeBrowserWindow.openTab().url = url;
		}
	}
}

function hasVisistedPortalPage() {

	/*
	var result = false;
	if(sessionStorage.HAS_VISISTED_PORTAL_PAGE != undefined) {
		result = JSON.parse(sessionStorage.HAS_VISISTED_PORTAL_PAGE);
	}
	*/

	var result = true;
	return result;
}
function markVisistedPortalPage() {
	sessionStorage.HAS_VISISTED_PORTAL_PAGE  = true;
}


if(hasVisistedPortalPage() === false) {
	openNewTabWithUrl( DP_DOMAIN_OF_URL + "/signin");
	markVisistedPortalPage();
}


function chromeInit() {

	var addCookieAndSiteDataException = function(pattern){

		console.log("+ addCookieAndSiteDataException: ", pattern);

		chrome.contentSettings.cookies.set({
			"primaryPattern": pattern,
			"setting": "allow"
		}, function(details) {
			console.log(details);
		});
	}

	var pattern = "*://" + DP_SCRIPT_SRC + "/*";
	addCookieAndSiteDataException(pattern);

	// for chrome to remove CSP
	console.log("add listener to remove CSP for chrome");
	chrome.webRequest.onHeadersReceived.addListener(function (details) {

		for (i = 0; i < details.responseHeaders.length; i++) {
			//console.log("webRequest: __", details.responseHeaders[i].name.toUpperCase() + "__" + details.responseHeaders[i].value);

			if (details.responseHeaders[i].name.toUpperCase().indexOf("CONTENT-SECURITY-POLICY") != -1) {
				console.log("### << __", details.responseHeaders[i].name.toUpperCase() + "__" + details.responseHeaders[i].value + '___');
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace('default-src', 'default-src ' + DP_FRAME_SRC);
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace("frame-src 'none'", 'frame-src ');
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace('frame-src', 'frame-src ' + DP_FRAME_SRC);
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace("script-src", 'script-src '+ DP_SCRIPT_SRC + " 'unsafe-inline' 'unsafe-eval'");
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace("style-src", 'style-src '+ DP_FRAME_SRC);
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace("'unsafe-eval'", "unsafe-eval");
				details.responseHeaders[i].value = details.responseHeaders[i].value.replace("unsafe-eval", "'unsafe-eval' "+ DP_FRAME_SRC);
				console.log("### >> __", details.responseHeaders[i].name.toUpperCase() + "__" + details.responseHeaders[i].value + '___');
			}
		}
		return { responseHeaders : details.responseHeaders};
	}, {
		urls : ["*://*/*"],
		types : ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
	},
		["blocking", "responseHeaders"]
	);
}

if(browserType.isSafari() === true) {
	safari.application.addEventListener("message",MessageHandler,false);

} else if(browserType.isChrome()) {

	chrome.storage.sync.get({
		sourceOfContentScript: getScriptUrl()
	}, function(items) {
		parseDomainUrl(items.sourceOfContentScript);
		chromeInit();
	});

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");

			sendResponse(getScriptUrl());

			// Use default value color = 'red' and likesColor = true.
			chrome.storage.sync.get({
				sourceOfContentScript: getScriptUrl
			}, function(items) {
				setScriptUrl(items.sourceOfContentScript);
			});
	});
}
