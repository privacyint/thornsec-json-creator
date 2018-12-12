function processJson(json){
	//prepare an array if there are multplie networks
	var newNetworks = [];

	//iterate the networks
	$.each(json, function(key, network){
		//create the network
		newNetwork = createNetwork(key);

		//give the network a name
		$('#networkLayout_' + lastNetworkId).data('settings')['name'] = key;

		//init network properties before devices 
		$.each(network, function(deviceKey, device){
			if(!$.isPlainObject(device)){
				$('#networkLayout_' + lastNetworkId).data('settings')[deviceKey] = device;
			}
		});

		//Circle throught devices on the network
		$.each(network, function(deviceKey, device){
			if($.isPlainObject(device)){
				switch (deviceKey){
					case 'servers':
						$.each(device, function(subDeviceKey, subDevice){
							if(subDevice.types.length == 1){
								if(subDevice.types[0] == "router" || subDevice.types[0] == "metal" || subDevice.types[0] == "dedicated"){
									createDevice(subDevice.types[0], newNetwork, subDeviceKey, subDevice);
								}else{
									createDevice('service', $('#' + subDevice.metal), subDeviceKey, subDevice);
								}
								//Updating the last subnet 
								if(subDevice.subnet > networkOptions['network_' + lastNetworkId].lastSubnet){
									networkOptions['network_' + lastNetworkId].lastSubnet = subDevice.subnet;
									updateNetworkOptions(lastNetworkId, 'lastSubnet', subDevice.subnet);
								}
							}else{
								//if router in on server
								if(($.inArray("router", subDevice.types) !== -1) && ($.inArray("metal", subDevice.types) !== -1)){
									var router = {};
									$.each(subDevice, function(key, value){
										if(key == 'extconfig' || key == 'extconnection' || key == 'extiface'){
											router[key] = value.slice(0);
											delete subDevice[key];
										}								
										if(key == 'subnet'){
											router[key] = value;
										}		
									})									
									createDevice('metal', newNetwork, subDeviceKey, subDevice);
									createDevice('router', $('#' + subDeviceKey), 'router', router);
								}
							}
						})	
						break;
					case 'users':
						$.each(device, function(paramsKey, params){
							createDevice('user', $('#userLayout_' + lastNetworkId), paramsKey, params);
						})	
						break;			
					case 'internaldevices':
						$.each(device, function(paramsKey, params){
							createDevice('internalonly', $('#deviceLayout_' + lastNetworkId), paramsKey, params);
						})	
						break;
					case 'externaldevices':
						$.each(device, function(paramsKey, params){
							createDevice('externalonly', $('#deviceLayout_' + lastNetworkId), paramsKey, params);
						})	
						break;
				}
			}
		});
	});

	//select the latest tab
	//make tabs selectable
	$('#networkTab_' + lastNetworkId).tab('show');
}