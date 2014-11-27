

function loadUrlIntoIframe() {

	console.log("+++ loadUrlIntoIframe +++");

	var targetUrl = $("#target_url").val();

	if(targetUrl.indexOf("http://") === -1 &&
		targetUrl.indexOf("https://") === -1) {
		targetUrl = "http://" + targetUrl;
	}

	console.log("ready to load: " + targetUrl);

	$("#frame").attr("src", targetUrl);

	datakeeper.put("LAST_URL", targetUrl);
}

function restoreData() {
	var lastUrl = datakeeper.get("LAST_URL");
	$("#target_url").val(lastUrl);
	if(lastUrl != null && lastUrl !== "") {
		loadUrlIntoIframe();
	}
}

var datakeeper = {
	put: function(key, value) {
		localStorage[key] = value;
	},
	get: function(key) {
		return localStorage[key];
	}
}

$("document").ready(function() {
	$("#button_load").on("click", function() {
		loadUrlIntoIframe();
	});

	$('#target_url').keypress(function(e) {
	    if(e.which == 13) { // Checks for the enter key
	        console.log("!");
			loadUrlIntoIframe();
	    }
	});

	restoreData();
});

