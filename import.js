function processJson(json){
	//prepare an array if there are multplie networks
	var newNetworks = [];

	//iterate the networks
	$.each(json, function(key, network){
		//create the network
		var newNetwork = new Network();
		newNetwork.name = key;

		//Circle throught devices on the network
		$.each(network, function(deviceKey, device){
			if($.isPlainObject(device)){
				switch (deviceKey){
					case 'servers':
						$.each(device, function(subDeviceKey, subDevice){
							if(subDevice.types.length == 1){
								if(subDevice.types[0] == "router" || subDevice.types[0] == "metal"){
									createDevice(subDevice.types[0], '', subDeviceKey, subDevice);
								}else{
									createDevice('service', $('#' + subDevice.metal), subDeviceKey, subDevice);
								}
							}
							//console.log(subDevice.types[0]);
							//createDevice('metal', '', paramsKey, params);
						})	
						break;
					case 'users':
						$.each(device, function(paramsKey, params){
							createDevice('user', '', paramsKey, params);
						})	
						break;			
					case 'internaldevices':
						$.each(device, function(paramsKey, params){
							createDevice('internalonly', '', paramsKey, params);
						})	
						break;
					case 'externaldevices':
						$.each(device, function(paramsKey, params){
							createDevice('externalonly', '', paramsKey, params);
						})	
						break;
				}
			}else{
				//Network parameters
				newNetwork[deviceKey] = device;
			}
		});

		newNetworks.push(newNetwork);
	});

	return newNetworks;
}