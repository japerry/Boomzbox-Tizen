/*
 *      Copyright 2012  Samsung Electronics Co., Ltd
 *
 *      Licensed under the Flora License, Version 1.1 (the "License");
 *      you may not use this file except in compliance with the License.
 *      You may obtain a copy of the License at
 *
 *              http://floralicense.org/license
 *
 *      Unless required by applicable law or agreed to in writing, software
 *      distributed under the License is distributed on an "AS IS" BASIS,
 *      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *      See the License for the specific language governing permissions and
 *      limitations under the License.
 */

var app = tizen.application.getCurrentApplication();
var gServiceAppId = "r9vrpxzuyp.HybridServiceApp";
var gServicePortName = "SAMPLE_PORT";
var gLocalMessagePortName = "SAMPLE_PORT_REPLY";

var gLocalMessagePort;
var gRemoteMessagePort;

var gLocalMessagePortWatchId;

var isStarting = false;

$(document).delegate("#main", "pageinit", function() {
	$("#btn-start").bind("vclick", function(){

		if(gLocalMessagePort) {
			alert("Already running.");
		} else if(isStarting){
			alert("Now starting...");
		} else {
			isStarting = true;
			start();
		}
		return false;
	});
	$("#btn-stop").bind("vclick", function(){
		if(gRemoteMessagePort) {
			sendCommand("stop");
		} else {
			alert("Not running.");
		}
		return false;
	});
	$("#btn-clear").bind("vclick", function(){
		$("#logs").empty().listview("refresh");
		return false;
	});
	$(window).on('tizenhwkey', function (e) {
		if (e.originalEvent.keyName === "back") {
			if ($.mobile.activePage.attr('id') === 'main') {
				tizen.application.getCurrentApplication().exit();
			} else {
				history.back();
			}
		}
	});
});

function startMessagePort() {
	try {
		gLocalMessagePort = tizen.messageport.requestLocalMessagePort(gLocalMessagePortName);
		gLocalMessagePortWatchId = gLocalMessagePort.addMessagePortListener( function(data, remote) {
			onReceive(data, remote);
		});
	} catch (e) {
		writeToScreen(e.name);
	}

	try {
		gRemoteMessagePort = tizen.messageport.requestRemoteMessagePort(gServiceAppId, gServicePortName);
	} catch (e) {
		writeToScreen(e.name);
	}

	isStarting = false;

	sendCommand("connect");
}

function sendCommand(command){
	var jsondata = '{"command" : "' + command + '"}';

	gRemoteMessagePort.sendMessage([ { key:"command", value:command } ], gLocalMessagePort);
	writeToScreen("Sending: " + command);
}

function onReceive(data, remote) {
	var message;

	for(var i in data) {
		if(data[i].key == "server")
			message = data[i].value;
	}

	writeToScreen("Received : " + message);

	if(message == "WELCOME"){
		sendCommand("start");
	}else if(message == "stopped"){
		sendCommand("exit");
	}else if(message == "exit"){
		if(gRemoteMessagePort)
			gRemoteMessagePort = null;
		if(gLocalMessagePort) {
			gLocalMessagePort.removeMessagePortListener(gLocalMessagePortWatchId);
			gLocalMessagePort = null;
		}
	}
}

function writeToScreen(message) {
	var today = new Date(),
		time = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + " "
				+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + "." + today.getMilliseconds(),
		str = '<li class="ui-li-has-multiline ui-li-text-ellipsis">'
				+ message
				+ '<span class="ui-li-text-sub">'
				+ time
				+ '</span></li>';

	$("#logs").append(str).listview("refresh");
}

function start() {
	try {
		tizen.application.getAppsContext(onGetAppsContextSuccess, onGetAppsContextError);
	} catch (exc) {
		writeToScreen("Get AppContext Error");
	}
}

function onGetAppsContextSuccess(contexts) {
	for (var i = 0; i < contexts.length; i++) {
		var appInfo = tizen.application.getAppInfo(contexts[i].appId);
		if(appInfo.id == gServiceAppId){
			console.log("Running Service App found");
			break;
		}
	}
	if (i >= contexts.length) {
		console.log("Running Service App not found. Trying to launch it");
		launchServiceApp();
		//listInstalledApps();
	}else{
		startMessagePort();
	}
}

function onGetAppsContextError(err) {
	console.log("getAppsContext exc");
}

function listInstalledApps() {
	try {
		tizen.application.getAppsInfo(getAppsInfoSuccessCB, getAppsInfoErrorCB);
	} catch (exc) {
		writeToScreen("Get Installed App Info Error");
	}
}

function getAppsInfoSuccessCB(apps) {
	for (var i = 0; i < apps.length; i++) {
		if(apps[i].id == gServiceAppId){
			console.log("Found installed Service App")
			break;
		}
	}
	if(i >= apps.length){
		writeToScreen("Service App not installed");
		isStarting = false;
		return;
	}
	launchServiceApp();
}

function getAppsInfoErrorCB(err) {
	console.log("getAppsInfo failed");
	isStarting = false;
}

function launchServiceApp() {
	function onSuccess() {
		console.log("Service App launched successfully!");
		console.log("Restart...");
		start();
	}

	function onError(err) {
		console.log("Service Applaunch failed");
		isStarting = false;
		alert("Failed to launch HybridServiceApp!");
	}

	try {
		console.log("Launching [" + gServiceAppId + "] ...");
		tizen.application.launch(gServiceAppId, onSuccess, onError);
	} catch (exc) {
		alert("launch exc:" + exc.message);
	}
}
