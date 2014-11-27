var browserType= {
	isSafari: function() {
		return ((window.safari != undefined) && (safari.extension != undefined));
	},
	isChrome: function() {
		return ((window.chrome != undefined) && (chrome.extension != undefined));
	},
	isFirefox: function() {
		return ((window.self != undefined) && (self.port != undefined) && (self.port.emit != undefined));
	}
}

yamatoInfo = {proxyType:"windows"};

function messageHandler(event) {

	//console.log("+ messageHandler: " + event);

	if(browserType.isSafari() === true) {
		var msg = event.message;
		if(event.name === "MSG_SRC_OF_CONTENT_SCRIPT") {
			appendScriptOnHead(event.message);
		}
	} else if (browserType.isFirefox() === true) {
		appendScriptOnHead(event);
	}
}

function appendScriptOnHead(scriptSource) {

    var head = document.getElementsByTagName("head")[0];
    var scriptText = document.createElement("script");
    scriptText.src = scriptSource;
    head.appendChild(scriptText);

}

(function(){
	if(browserType.isSafari() === true) {
		safari.self.addEventListener("message", messageHandler, false);
		safari.self.tab.dispatchMessage("MSG_SRC_OF_CONTENT_SCRIPT", null);

	} else if(browserType.isFirefox() === true) {
		self.port.on("MSG_SRC_OF_CONTENT_SCRIPT", function(event){
			messageHandler(event);
		});
		self.port.emit("MSG_SRC_OF_CONTENT_SCRIPT", null);

	} else if(browserType.isChrome() === true) {

		chrome.runtime.sendMessage("MSG_SRC_OF_CONTENT_SCRIPT", function(response) {
		  	console.log(response);
		  	appendScriptOnHead(response);
		});

	} else {
		var DP_DOMAIN_OF_URL = "https://10.1.201.174/";
		appendScriptOnHead(DP_DOMAIN_OF_URL + "extensionFrame/content_script.js");
	}
})();


