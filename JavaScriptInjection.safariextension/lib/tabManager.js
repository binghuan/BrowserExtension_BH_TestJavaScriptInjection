var DBG = true;
exports.TabManager = {
	tabReferenceTable : {},

	init : function(tabs){
		for(var idx in tabs){
			this.addTabIdIntoReferenceTable(tabs[idx]);
		}
	},

	getRandomInt : function() {
		return Math.floor(Math.random() * 1000) + 1;
	},

	addTabIdIntoReferenceTable : function(tab) {
		var newIndex = (new Date().getTime()) * 10000 + this.getRandomInt();
		this.tabReferenceTable[newIndex] = tab;
		if(DBG)console.log("addTabIdIntoReferenceTable newTabId = " + newIndex + ", length : ");
		return newIndex;
	},

	removeTabIdFromReferenceTable : function (tab) {
		var existedTabId = this.getTabIdFromReferenceTable(tab);
		delete this.tabReferenceTable[existedTabId];
		return existedTabId;
		//if(DBG)console.log(JSON.stringify(this.tabReferenceTable));
		// if(DBG)console.log("after removeTabIdFromReferenceTable, length ->");
	},

	getTabIdFromReferenceTable : function (tab) {
		var result = -1;
		for (var tabId in this.tabReferenceTable) {
			if(tab == this.tabReferenceTable[tabId]){
				result = tabId;
				break;
			}
		}
		if(DBG)console.log("getTabIdFromReferenceTable(" + result);
		return result;
	},

	getBrowserTabIdByIndex :function (index) {
		return Object.keys(this.tabReferenceTable)[index];
	},

	getBrowserTabFromReferenceTableById : function(id) {
		var result = null;
		for (var tabId in this.tabReferenceTable) {
			if(id == tabId){
				result = this.tabReferenceTable[id];
				break;
			}
		}
		if(DBG)console.log("getBrowserTabFromReferenceTableById with result :" + result);
		return result;
	},

	showTabsInfo : function(){
		console.log("tab reference table : "+ JSON.stringify(this.tabReferenceTable));
	},
	getAllTabId : function(){
		return Object.keys(this.tabReferenceTable);
	}
};

