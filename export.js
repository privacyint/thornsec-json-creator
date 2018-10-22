//By default save to JSON file and propose export
function saveConfig(exportType){

	var network = {};

	for(i=1;i<=lastNetworkId;i++){
		//Get the network properties
		var tmpNetwork = $('#networkLayout_' + i).data('settings');
		var networkName = tmpNetwork.name.slice(0);
		
		network[networkName] = $.extend({}, tmpNetwork);
		delete network.name;

		//prepare the user bit of the json
		var users = {};
		$('#userLayout_' + i).children().each(function(key, device){
			//Put the user in an object with its own name
			var tmpUser = $(device).data('settings');
			var name = tmpUser.name.slice(0);
			
			users[name] = copyParams(tmpUser);
			delete users.name;
		});

		//Getting devices
		var externalDevices = {};
		var internalDevices = {};
		$('#deviceLayout_' + i).children().each(function(key, device){
			var tmpDevice = $(device).data('settings');
			var deviceName = tmpDevice.name.slice(0);

			if($(device).hasClass('internalonly')){
				internalDevices[deviceName] = copyParams(tmpDevice);
				delete internalDevices.name;
			}else{
				externalDevices[deviceName] = copyParams(tmpDevice);
				delete externalDevices.name;
			}

		});

		//Doing the servers/router/vms
		var servers = {};
		$('#networkLayout_' + i).children().each(function(key, device){
			if($(device).hasClass('router')){
				var tmpDevice = $(device).data('settings');
				var deviceName = tmpDevice.name.slice(0);

				servers[deviceName] = copyParams(tmpDevice);
				delete servers.name;
			}

			if($(device).hasClass('metal')){
				var tmpDevice = $(device).data('settings');
				var deviceName = tmpDevice.name.slice(0);

				servers[deviceName] = copyParams(tmpDevice);
				delete servers.name;

				//Cycle through VMs and router inside a server
				$(device).children().each(function(vmKey, VM){
					//ignore the title and buttons
					if($(VM).hasClass('server-device')){

						var tmpVM = $(VM).data('settings');
						var VMName = tmpVM.name.slice(0);

						//If the router is on the server, we combine them
						if($(VM).hasClass('router')){
							servers[deviceName] = copyParams(tmpVM);
							servers[deviceName]['types'] = ['router','metal']
						}else{
							//regular VMs
							servers[VMName] = copyParams(tmpVM);
							//put the server name as the metal param of the VM
							servers[VMName]['metal']= deviceName;
						}
						delete servers.name;
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

	//By default export a file, but this method can also be used to save the config in a cookie
	if(exportType == 'cookie'){
		Cookies.set('config', JSON.stringify(network));
	}else{
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
}

//Copy function is necessary to avoid copying null values
function copyParams(source){
	var destination = {};
	$.each(source, function(key, value){
		if(value && !$.isEmptyObject(value)){
			destination[key] = value;
		}
	})

	return destination;
}