var DP_DOMAIN_OF_URL = "https://10.1.201.174";

var hasSyncPdata = false;
var hasBackupPdata = false;

function preSyncPdata(event) {

	if(hasSyncPdata === true) {
		return;
	}

	if(event.type === "beforeload") {
		//console.log("******* hit event: beforeload !: " + location.href);

		var answerStr = safari.self.tab.canLoad(event, "");
		if(answerStr !== "" && answerStr != undefined) {
			var pdata = JSON.parse(answerStr);

			localStorage.pdata1 = pdata.pdata1;
			localStorage.pdata2 = pdata.pdata2;

			console.log("get pdata1 from ext: ", pdata.pdata1);

			hasSyncPdata = true;
		}
	}
}

function backupPdata(tag) {

		if(hasBackupPdata === true) {
			return;
		}

		// ready to bypass pdata1/2 to browser extension
		var msgObj = {
			pdata1: localStorage.pdata1,
			pdata2: localStorage.pdata2
		}

		if(msgObj.pdata1 != undefined) {
			console.log("- send message to broeser extension to backup pdata");
			safari.self.tab.dispatchMessage("MESSAGE_BACKUP_PDATA", msgObj);
			//hasBackupPdata = true;
		}
}

if( (location.href.toString().indexOf("10.1.201.174/extensionFrame/background.html") != -1 ) ) {

	document.addEventListener("beforeload", preSyncPdata, true);

	console.log("addEventListener to retrieve message from extensionFrame");
	window.addEventListener("message", function(event) {
		var eventData = {};

		try {
			eventData = JSON.parse(event.data);

			if(eventData.name === "EVENT_BACKUP_PDATA") {
				console.log("ready to backup pdata form extensionFrame: ", location.href);
				backupPdata("53");
			}

		} catch(e) {}
	}, false);

} else if( (location.href.toString().indexOf("10.1.201.174") != -1 ) &&
	(location.href.toString().indexOf( DP_DOMAIN_OF_URL + '/dp-extension/TopBar/topbar.html') == -1 )) {

	backupPdata("63");
}



