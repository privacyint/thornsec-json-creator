//By default save to JSON file and propose export
function saveConfig(exportType){
	var network = {};
	var foundNetwork = 0;

	for(i=1;i<=lastNetworkId;i++){
		//Get the network properties
		var tmpNetwork = $('#networkLayout_' + i).data('settings');
		if(tmpNetwork){
			foundNetwork++;
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
								$.extend(servers[deviceName], copyParams(tmpVM, true));
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


			//To avoid size issues (cookies can allow take some much data) we split the network in different cookies and compress the JSON
			if(exportType == 'cookie'){		
				Cookies.set('network_servers_' + foundNetwork, JSON.stringify(JSONC.compress(servers)));
				Cookies.set('network_internalonly_' + foundNetwork, JSON.stringify(JSONC.compress(internalDevices)));
				Cookies.set('network_externalonly_' + foundNetwork, JSON.stringify(JSONC.compress(externalDevices)));
				Cookies.set('network_users_' + foundNetwork, JSON.stringify(JSONC.compress(users)));
				Cookies.set('network_name_' + foundNetwork, JSON.stringify(networkName));
			}
		}
	}

	if(exportType == 'cookie'){		
		Cookies.set('config', foundNetwork);
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
function copyParams(source, isRouter){
	var destination = {};
	$.each(source, function(key, value){
		if(value && !$.isEmptyObject(value)){
			//if we are copying router params to the server we only copy a few
			if(isRouter){
				if(key == 'extconfig' || key == 'extconnection' || key == 'extiface'){
					destination[key] = value;
				}
			}else{
				destination[key] = value;
			}
		}
	})

	return destination;
}