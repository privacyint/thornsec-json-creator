var networkDevices = { 'router'  :'Router',
					   'metal'   :'Server',
					   'service' :'VM',
					   'internal':'Internal Only Device',
					   'external':'External Only Device',
					   'user'    :'User'
					 };

var serverDevices = { 'router'  :'Router',
					   'service' :'VM',
					 };

var networkData = new Network('');

var defaultServerData = new Machine('', '');

$( function() {
	//Import function
    $("#importButton").click(function(){
	    importJson();
	});

	//Make add buttons clickable
	$(".model").click(function(event){
		createDevice($(this).attr("value"));
	});

	//Network is droppable (only for routers coming from servers)
	$('#networkLayout').droppable( {
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
    $('#networkLayout').data(
    	'settings', networkData
    )
    .click(function(e) {
    	//If the target is not the networkLayout, do not update details
    	if(e.target != this) return;
		updateDetailsPane($('#networkLayout'));
    });

    //Show the wizard!
    var wizardModal = $('#wizard-modal').modal('show');
    var wizardForm = $('#wizard-form');
    wizardForm.steps({
        headerTag: 'h2',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        stepsOrientation: 'vertical',
        onStepChanging: function (event)
	    {
	        wizardForm.validate().settings.ignore = ":disabled,:hidden";
	        return wizardForm.valid();
	    },
        onFinishing: function (event, currentIndex){
	        return wizardForm.valid();
	    },
	    onFinished: function (event, currentIndex){
	        wizardModal.modal('hide');
	    }
    });

    $('[title]').tooltip({
		position: {
			my: 'left top',
			at: 'right+5 top-5',
			collision: 'none'
		}
	});

	$('#networkDefaultsForm').on('input', function(e) {
		var property = ((e.target.id).split('_')[1]);
		networkData[property] = e.target.value;
	});

	//populating the defaultServerData with pre-entered info
	$('#serverDefaultsForm :input').each(function(e) {
		var property = (this.id.split('_')[1]);
		defaultServerData[property] = $(this).val();
	});

	$('#serverDefaultsForm').on('input', function(e) {
		var property = ((e.target.id).split('_')[1]);
		defaultServerData[property] = e.target.value;
	});

    //$( "<button>" )
    //  .text( "Show help" )
    //  .button()
    //  .on( "click", function() {
    //   tooltips.tooltip( "open" );
    //  })
    //.insertAfter( "form" );
  //} );

});

function createDevice(device, parent, name, parameters){
	//Zou can't have more than one router
	if(device == 'router' && $('#addRouterBtn').hasClass('disabled')){
		alert('you cannot have more than one router');
		return false;
	}

	//If there is no params we ask the basics
	if(!parameters){
		var name = prompt('give me a name!');
		//Cancel if no name entered
		if(name == null || name == ""){ return false;}

		var subnet = prompt('give me a subnet!');
	}

	//Creating the div 
	var newDiv = $("#defaultDevice").clone(false)
		.data('clone', true)
		.attr('id', name)
		.addClass('added device ' + device)
		.show();

	//If there is a parent it means this is inside a metal and should and have a different look
	if(parent){
		newDiv.addClass('bg-secondary server-device m-1').removeClass('mb-1 p-1 bg-dark shadow added card model');
	}

	//If it is inside a server OR is a router, it should be draggable
	if(newDiv.hasClass('router') || parent){
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

	//Else we put it on the network by default
	if(!parent){
		var parent = $('#networkLayout');
	}

	//Defining classes and properties for each device
	if (device == 'router') { 
		newDiv.addClass('bg-warning').removeClass('bg-secondary bg-dark');
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.router + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Router(name, subnet)));
		$('#addRouterBtn').addClass('disabled');
	}
	else if (device == 'metal') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.metal + ')</i></div><div class="metalLayout"></div>');
		newDiv.data('settings', serverInheritDefault(new Metal(name, subnet)));
	}
	else if (device == 'service') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.service + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Service(name, subnet)));
	}
	else if (device == 'internalonly') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.internal + ')</i></div>');
		newDiv.data('settings', new InternalOnlyDevice(name));
		parent = $('#deviceLayout');
	}
	else if (device == 'externalonly') { 
		newDiv.html('<div class="card-header">' + name + '<i> (' + networkDevices.external + ')</i></div>');
		newDiv.data('settings', new ExternalOnlyDevice(name));
		parent = $('#deviceLayout');
	}
	else if (device == 'user') { 
		newDiv.html('<div class="card-body">' + name + '<i> (' + networkDevices.user + ')</i></div>');
		newDiv.data('settings', new UserDevice(name));
		parent = $('#userLayout');
	}

	//Update objects if there are parameters (import)
	if(parameters){
		$.each(parameters, function(key, value){
			newDiv.data('settings')[key] = value;
		})
		// console.log(parameters);
		// console.log(newDiv);
	}

	//Make the new device selectable
	newDiv.on('click', function() {
		updateDetailsPane($(this));
		//avoid the triggering of parent element
		return false;
    });

	//If the device is a server  allow creation of service and router on it
	if(newDiv.hasClass('metal')){
		createServer(newDiv);
	}

	parent.append(newDiv);
	updateDetailsPane(newDiv);
}

function createServer(server){
	//Add the option to add VM or router to a server
	$.each(serverDevices, function(key, val) {
		$('<div class="btn btn-info server-device p-1 m-1"><div>Add ' + val + '</div>')
		.appendTo(server.children('.metalLayout'))
		.addClass(key)
		.addClass('model')
		.click(function(event){
			createDevice(key, server);
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

			//if coming form the network
			if($(ui.draggable).hasClass('bg-warning')){
				ui.draggable.addClass('m-1 server-device').removeClass('mb-1 p-1 shadow added card model device');
				ui.draggable.css("position", "relative");
			}
		}
	});
}

function updateDetailsPane(device) {
	$('#infoPane').html('<h3>' + device.attr('id') + '</h3>');

	$.each($(device).data('settings'), function (setting, val) {
		var settingTextBox = $(document.createElement('div'));

		if (val === Object(val)) {
			//$.each(e, function (f, g) {
    		//	$('#infoPane').append(document.createTextNode( setting + ':' + g ));
			//	$('#infoPane').append('<br>');
			//});
		}
		else {
			settingTextBox.after().html('<label>' + setting + ': </label><input type="text" name="textbox_' + setting + '" id="textbox_' + setting + '" value="' + val + '" >');

			//update device's setting when modified
			settingTextBox.on('input', 'input', function(e) {
				$(device).data('settings')[setting] = this.value;
			});
    		
    		// $('#infoPane').on('change', '#textbox_' + setting, function() {
	     	//		$(device).data('settings')[setting] = this.value;
	    	// });
			
			settingTextBox.appendTo('#infoPane');
		}		
	});

	//Adding a button to delete a device (not the network)
	if(device.attr('id') != 'networkLayout'){
		var deleteDeviceButton = $('<button/>', {
	        text: "Delete this device",
	        id: 'delete_button',
	        class: 'btn btn-danger',
			click: function(){
				deleteDevice(device);
			}
	    });
		deleteDeviceButton.appendTo('#infoPane');	
	}
}

function deleteDevice(device)
{	
	device.remove();
	$('#infoPane').empty();
	if(device.hasClass('router')){
		$('#addRouterBtn').removeClass('disabled');
	}
}


function importJson(elemId) {
	var newNetworks = [];

	//Avoid errors https://stackoverflow.com/questions/2618959/not-well-formed-warning-when-loading-client-side-json-in-firefox-via-jquery-aj/4234006
	$.ajaxSetup({beforeSend: function(xhr){
		if (xhr.overrideMimeType)
		{
			xhr.overrideMimeType("application/json");
		}
	}});

	//For testing purpose import local file
	$.getJSON("pi.json", function(json) {
	    newNetworks = processJson(json);

	    //for now we just accept one network but there should be a possibility to exploit the multplie networks of a json file
		networkData = newNetworks[0];

		//Update the object and display
		$('#networkLayout').data(
	    	'settings', networkData
	    )
	    updateDetailsPane($('#networkLayout'));
	});

	// var elem = document.getElementById(elemId);
	// if(elem && document.createEvent) {
	//   var evt = document.createEvent("MouseEvents");
	//   evt.initEvent("click", true, false);
	//   elem.dispatchEvent(evt);
	// }
}

function serverInheritDefault(server) {
	var skip = [ 'hostname',
				 'subnet'
			   ];

	$.each($(server).data('settings'), function (setting, val) {
		if (val === Object(val)) {
		}
		else {
			if (val != $(defaultServerData).data('settings')[setting]) {				
				$(server).data('settings')[setting] = $(defaultServerData).data('settings')[setting];
			}
		}		
	});

	return server;
}