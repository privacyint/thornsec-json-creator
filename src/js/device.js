function createDevice(device, parent, name, parameters, wizard){
	if(wizard){
		$('#addDeviceModal').modal('show');
	}

	//Parents can be the layout or a metal. If it's a metal we need to find on which network it is
	if(parent.hasClass('metal')){
		var networkId = parent.parent().attr('id').slice(-1);
	}else{
		var networkId = parent.attr('id').slice(-1);
		parent = $('#networkLayout_' + networkId);
	}

	//You can't have more than one router per network
	if(device == 'router' && $('#addRouterBtn_' + networkId).hasClass('disabled')){
		alert('you cannot have more than one router');
		return false;
	}

	//If there is no params we ask the basics
	if(!parameters){
		if(!wizard){
			var name = prompt('give me a name!');
			//Cancel if no name entered
			if(name == null || name == ""){ return false;}
		}			

		//This handles auto increment of subnet and mac for the network
		if(device == ('router') || device == ('metal') || device == ('service')){
			if(networkOptions['network_' + networkId].autoSubnet){
				//increment last subnet
				var tmpSubnet = networkOptions['network_' + networkId].lastSubnet;
				tmpSubnet++;
				//needs to be put into quote to make it a string
				var subnet = "" + tmpSubnet + "";
			}else{
				var subnet = prompt('give me a subnet!');
			}

			if(networkOptions['network_' + networkId].autoMacAddress){
				//incrementing mac address by converting last 2 digits to int and then back to hex
				var macAddressInt = parseInt(networkOptions['network_' + networkId].lastMac.slice(-2), 16);
				macAddressInt++;
				var macAddressHex = macAddressInt.toString(16);
				if(macAddressHex.length == 1){
					macAddressHex = '0' + macAddressHex;
				} 
				var tmpMacAddress = networkOptions['network_' + networkId].lastMac.slice(0,15) + macAddressHex;				
			}
		}
	}

	//Creating the div 
	var newDiv = $("#defaultDevice").clone(false)
		.data('clone', true)
		.attr('id', name)
		.addClass('added device ' + device)
		.show();

	//If there is a parent it means this is inside a metal and should and have a different look
	if(parent.hasClass('metal')){
		newDiv.addClass('bg-secondary server-device m-1').removeClass('mb-1 p-1 bg-dark shadow added card model');
	}

	//If it is inside a server OR is a router, it should be draggable
	if(newDiv.hasClass('router') || parent.hasClass('metal')){
		newDiv.draggable({
			zIndex: 100,
			revert : function(event, ui) {
				//if not dropped over another server, come back to original position
	            $(this).data("uiDraggable").originalPosition = {
	                top : 0,
	                left : 0
	            };
	            return !event;
	        }
		});
	}

	//Defining classes and properties for each device
	if (device == 'router') { 
		newDiv.addClass('bg-warning').removeClass('bg-secondary bg-dark');
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.router + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Router(name, subnet), parent));
		newDiv.data('settings')['types'] = ['router'];
		$('#addRouterBtn_' + networkId).addClass('disabled');
	}
	else if (device == 'metal') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.metal + ')</i></div><div class="metalLayout"></div>');
		newDiv.data('settings', serverInheritDefault(new Metal(name, subnet), parent));
		newDiv.data('settings')['types'] = ['metal'];
	}
	else if (device == 'service') { 
		var serviceType = networkDevices.service;
		if(parameters && parameters['profiles']){
			serviceType = parameters['profiles'];
		}
		newDiv.html('<div class="card-header">' + name + '<i> (' + serviceType + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Service(name, subnet), parent));
		newDiv.data('settings')['types'] = ['service'];
	}
	else if (device == 'internalonly') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.internal + ')</i></div>');
		newDiv.data('settings', new InternalOnlyDevice(name));
		parent = $('#deviceLayout_' + networkId);
	}
	else if (device == 'externalonly') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.external + ')</i></div>');
		newDiv.data('settings', new ExternalOnlyDevice(name));
		parent = $('#deviceLayout_' + networkId);
	}
	else if (device == 'user') { 
		newDiv.html('<div class="card-body">' + name + '<i> (' + networkDevices.user + ')</i></div>');
		newDiv.data('settings', new UserDevice(name));
		parent = $('#userLayout_' + networkId);
	}

	//Update objects if there are parameters (import)
	if(parameters){
		$.each(parameters, function(key, value){
			newDiv.data('settings')[key] = value;
		})
	}

	if(tmpMacAddress && (device == ('router') || device == ('metal') || device == ('service'))){
		newDiv.data('settings')['mac'] = tmpMacAddress;
	}

	//If the device is a server  allow creation of service and router on it
	if(newDiv.hasClass('metal')){
		createServer(newDiv);
	}

	//Make the new device selectable
	newDiv.on('click', function() {
		updateDetailsPane($(this), networkId);
		//avoid the triggering of parent element
		return false;
    });


	//If the creations come from import we create immediatly, if not we wait for the signal from the save button
	if(!wizard){
		finalizeDevice(newDiv, parent, networkId, tmpSubnet, tmpMacAddress);
	}else{
		//update when a parameter is edited
		$('#addDevice').on('input', function(e) {
			var property = ((e.target.id).split('_')[1]);
			newDiv.data('settings')[property] = e.target.value;
			if(property == "name"){
				newDiv.find(".card-header").html(e.target.value + " (VM)");
			}
		});

		//delete device if modal is closed
		$('#addDeviceModal').on('hidden.bs.modal', function (e) {
			$("#addDevicePreview").html('');
		  	delete newDiv;
		  	return false;
		})

		//populate modal


		//append to modal for preview
		$("#addDevicePreview").append(newDiv);

		//When saving, update object properties and attach to network
		$('#addDeviceSaveButton').click(function(){
			//update device info based on modal info
			$("#addDevice :input").each(function(){
				var property = ((this.id).split('_')[1]);
				newDiv.data('settings')[property] = this.value;
			});
			finalizeDevice(newDiv, parent, networkId, tmpSubnet, tmpMacAddress);
		});
	}

}

function finalizeDevice(device, parent, networkId, tmpSubnet, tmpMacAddress){
	//update network options values in modal and object
	if(tmpSubnet){
		networkOptions['network_' + networkId].lastSubnet++;
		updateNetworkOptions(networkId, 'lastSubnet', networkOptions['network_' + networkId].lastSubnet++);
	}
	if(tmpMacAddress){		
		networkOptions['network_' + networkId].lastMac = tmpMacAddress;
		updateNetworkOptions(networkId, 'lastMac', networkOptions['network_' + networkId].lastMac);	
	}

	saveConfig('cookie');

	parent.append(device);
	updateDetailsPane(device);
}


function createServer(server){
	//Add the option to add VM, proxy or router to a server
	$.each(serverDevices, function(key, val) {
		$('<div class="btn btn-info server-device p-1 m-1"><div>Add ' + val + '</div>')
		.appendTo(server.children('.metalLayout'))
		.addClass(key)
		.addClass('model')
		.click(function(event){
			createDevice(key, server, null, null, true);
		});
	});	

	//Make the servers droppable (to receive router or service from another server)
	server.droppable( {
        over: function(event, ui) {
            var $this = $(this);
        },
		drop: function(event, ui) {
			$(this).append(ui.draggable);
			
			//when dropped, replace it properly
			ui.draggable.css({"top": "0", "left": "0"});

			//if it's a router, update the design and properties
			if($(ui.draggable).hasClass('router')){
				ui.draggable.addClass('m-1 server-device').removeClass('mb-1 p-1 shadow added card model device');
				ui.draggable.css("position", "relative");

				//delete $(ui.draggable).data('settings')[subnet]	;
			}
		}
	});
}

function deleteDevice(device, networkId)
{	
	device.remove();
	$('#infoPane_' + networkId).empty();
	if(device.hasClass('router')){
		$('#addRouterBtn_' + networkId).removeClass('disabled');
	}

	saveConfig('cookie');
}

function serverInheritDefault(server, network) {
	//IS THIS ACTUALLY USEFUL?
	var skip = [ 'name',
				 'subnet'
			   ];

	$.each(server, function (setting, val) {
		//only copy server properties (and not network properties)
		if(defaultServerData.hasOwnProperty(setting)){
			if (val === Object(val)) {
			}
			else {
				//don't copy name and empty properties
				if(network.data('settings')[setting] && network.data('settings')[setting]!= null && setting != 'name'){
					//server[setting] = network.data('settings')[setting];
				}
			}
		}		
	});

	return server;
}