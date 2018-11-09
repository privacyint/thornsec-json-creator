function createNetwork(networkName){
	lastNetworkId++;

	var newNetwork = $("#network_0").clone(false)
		.attr('id', 'network_' + lastNetworkId)
		.attr('value', lastNetworkId)
		.show();

	newNetwork.attr('aria-labelledby', 'networkTab_' + lastNetworkId);

	//Changing the unique IDs of the layout. Could be automated in one line probably
	newNetwork.find("#networkLayout_0").attr('id', 'networkLayout_' + lastNetworkId);
	newNetwork.find("#userLayout_0").attr('id', 'userLayout_' + lastNetworkId);
	newNetwork.find("#deviceLayout_0").attr('id', 'deviceLayout_' + lastNetworkId);
	newNetwork.find("#infoPane_0").attr('id', 'infoPane_' + lastNetworkId);
	newNetwork.find("#addRouterBtn_0").attr('id', 'addRouterBtn_' + lastNetworkId);

	var newNetworkTab = '<li class="nav-item"><a class="nav-link" id="networkTab_' + lastNetworkId + '" data-toggle="tab" href="#network_' + lastNetworkId + '" role="tab" aria-controls="home" aria-selected="true">' + networkName + '</a></li>';

	$('#networksContent').append(newNetwork);
	$('#networkTabAdd').before(newNetworkTab);

	initNetwork($('#networkLayout_' + lastNetworkId));

	return newNetwork;
}

function initNetwork(network){
	//Network layout is droppable (only for routers coming from servers)
	network.droppable( {
		accept: ".router",
        over: function(event, ui) {
            var $this = $(this);
        },
		drop: function(event, ui) {
			ui.draggable.removeClass('m-1 server-device').addClass('device shadow added card');
			ui.draggable.css("position", "relative");

			$(this).append(ui.draggable);
		
			//when dropped, replace it properly
			ui.draggable.css({"top": "0", "left": "0"});
		}
	});

	//Networks have properties too
	networkData = new Network('');
    network.data(
    	'settings', networkData
    ).click(function(e) {
    	//If the target is not the networkLayout, do not update details
    	//if(e.target != this) return;
		updateDetailsPane(network, network.attr('id').slice(-1));
    });
}

function deleteAllNetworks(){
	if(!confirm("Are you sure you want to delete ALL the networks?")){
		return false;
	}

	Cookies.remove('config');

	for(i=1;i<=lastNetworkId;i++){
		deleteNetwork(i);
		
		//cleaning cookies
		Cookies.remove('network_servers_' + i);		
		Cookies.remove('network_internalonly_' + i);		
		Cookies.remove('network_externalonly_' + i);		
		Cookies.remove('network_users_' + i);		
	}

	//reinitialize count
	lastNetworkId = 0;	

	//clean view
	$('#infoPane').empty();
	$('#addRouterBtn').removeClass('disabled');

}

function deleteNetwork(id){
	//remove each device
	$('#userLayout_' + id).children().each(function(key, device){
		device.remove();
	});
	$('#networkLayout_' + id).children().each(function(key, device){
		device.remove();
	});
	$('#deviceLayout_' + id).children().each(function(key, device){
		device.remove();
	});

	//remove the main container
	$('#network_' + id).remove();

	//remove the tab
	$('#networkTab_' + id).remove();

	//clean network data
	networkData = new Network('');
	$('#networkLayout_' + id).data(
    	'settings', networkData
    )

    //cleaning cookies
    //cleaning cookies
	Cookies.remove('network_servers_' + id);		
	Cookies.remove('network_internalonly_' + id);		
	Cookies.remove('network_externalonly_' + id);		
	Cookies.remove('network_users_' + id);	

}