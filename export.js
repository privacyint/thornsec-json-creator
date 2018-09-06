function generateJson(){

	var network = {};

	for(i=1;i<=lastNetworkId;i++){
		//Get the network properties
		console.log($('#network_' + i));
		var tmpNetwork = $('#network_' + i).data('settings');
		var networkName = tmpNetwork.name.slice(0);
		delete tmpNetwork.name;
		
		network[networkName] = $.extend({}, tmpNetwork);

		//prepare the user bit of the json
		var users = {};
		$('#userLayout_' + i).children().each(function(key, device){
			//Put the user in an object with its own name
			var tmpUser = $(device).data('settings');
			var name = tmpUser.name.slice(0);
			delete tmpUser.name;
			users[name] = copyParams(tmpUser);
		});

		//Getting devices
		var externalDevices = {};
		var internalDevices = {};
		$('#deviceLayout_' + i).children().each(function(key, device){
			var tmpDevice = $(device).data('settings');
			var deviceName = tmpDevice.name.slice(0);
			delete tmpDevice.name;

			if($(device).hasClass('internalonly')){
				internalDevices[deviceName] = copyParams(tmpDevice);
			}else{
				externalDevices[deviceName] = copyParams(tmpDevice);
			}
		});

		//Doing the servers/router/vms
		var servers = {};
		$('#networkLayout_' + i).children().each(function(key, device){
			if($(device).hasClass('router')){
				var tmpDevice = $(device).data('settings');
				var deviceName = tmpDevice.name.slice(0);
				delete tmpDevice.name;

				servers[deviceName] = copyParams(tmpDevice);
			}

			if($(device).hasClass('metal')){
				var tmpDevice = $(device).data('settings');
				var deviceName = tmpDevice.name.slice(0);
				delete tmpDevice.name;

				servers[deviceName] = copyParams(tmpDevice);

				//Cycle through VMs and router inside a server
				$(device).children().each(function(vmKey, VM){
					//ignore the title and buttons
					if($(VM).hasClass('server-device')){
						var tmpVM = $(VM).data('settings');
						var VMName = tmpVM.name.slice(0);
						delete tmpVM.name;

						servers[VMName] = copyParams(tmpVM);
					}
				})

			}
		});

		//Copying to the master object
		network[networkName]['servers'] = servers;
		network[networkName]['internalonly'] = internalDevices;
		network[networkName]['externalonly'] = externalDevices;
		network[networkName]['users'] = users;
	}

	//Create a hidden button to download the json 
	var uri = 'data:text/csv;charset=utf-8,' + JSON.stringify(network);

    var link = document.createElement("a");    
    link.href = uri;
    link.style = "visibility:hidden";
    link.download = "my_thornsec_config.json";


    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

//Copy function is necessary to avoid copying null values
function copyParams(source){
	var destination = {};
	$.each(source, function(key, value){
		if(value){
			destination[key] = value;
		}
	})

	return destination;
}