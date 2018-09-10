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
								if(subDevice.types[0] == "router" || subDevice.types[0] == "metal"){
									createDevice(subDevice.types[0], newNetwork, subDeviceKey, subDevice);
								}else{
									createDevice('service', $('#' + subDevice.metal), subDeviceKey, subDevice);
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
									})									
									createDevice('metal', newNetwork, subDeviceKey, subDevice);
									createDevice('router', $('#' + subDeviceKey), 'router', router);
								}
							}
							//console.log(subDevice.types[0]);
							//createDevice('metal', '', paramsKey, params);
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