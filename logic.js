var networkDevices = { 'router'  :'Router',
					   'metal'   :'Server',
					   'service' :'VM',
					   'internal':'Internal Only Device',
					   'external':'External Only Device',
					   'user'    :'User'
					 };

var networkData = new Network('');

var defaultServerData = new Machine('', '');

$( function() {
	//Iterate through available devices, spit them out into our toolbox
	$.each(networkDevices, function(key, val) {
		$('<div>New ' + val + '</div>')
		.appendTo( '#deviceToolbox' )
		.addClass(key)
		.addClass('model')
		.dblclick(function(event){
			createDevice($('#networkLayout'),$(this));
		});
	});

	$(".model").click(function(event){
		createDevice($('#networkLayout'),$(this));
	});
	
    //Make sure we can drop properly
	$('#networkLayout').droppable( {
        over: function(event, ui) {
            var $this = $(this);
        },
		drop: function(event, ui) {
			if ($(ui.helper).hasClass('ui-dialog') || $(ui.helper).hasClass('service')) { return false; }
			if(!$(ui.helper).hasClass('dropped')){ createDevice($(this), $(ui.helper)) }
			else {
				$(this).append(ui.draggable);
			}
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

function createDevice(network, device){
	var name = prompt('give me a name!');
	//Cancel if no name entered
	if(name == null || name == ""){ return false;}

	var newDiv = device.clone(false)
		.data('clone', true)
		.attr('id', name)
		.addClass('card text-white added bg-dark shadow')
		.removeClass('model ui-draggable-dragging btn btn-primary');

	console.log(networkDevices);

	if (newDiv.hasClass('router')) { 
		newDiv.html('<div class="card-header">' + name + '<i>(' + networkDevices.router + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Router(name, prompt('give me a subnet!'))));
	}
	else if (newDiv.hasClass('metal')) { 
		newDiv.html('<div class="card-header">' + name + '<i>(' + networkDevices.metal + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Metal(name, prompt('give me a subnet!'))));
	}
	else if (newDiv.hasClass('service')) { 
		newDiv.html('<div class="card-header">' + name + '<i>(' + networkDevices.service + ')</i></div>');
		newDiv.data('settings', serverInheritDefault(new Service(name, prompt('give me a subnet!'))));
	}
	else if (newDiv.hasClass('internalonly')) { 
		newDiv.html('<div class="card-header">' + name + '<i>(' + networkDevices.internal + ')</i></div>');
		newDiv.data('settings', new InternalOnlyDevice(name));
	}
	else if (newDiv.hasClass('externalonly')) { 
		newDiv.html('<div class="card-header">' + name + '<i>(' + networkDevices.external + ')</i></div>');
		newDiv.data('settings', new ExternalOnlyDevice(name));
	}
	else if (newDiv.hasClass('user')) { 
		newDiv.html('<div class="card-header">' + name + '<i>(' + networkDevices.user + ')</i></div>');
		newDiv.data('settings', new UserDevice(name));
	}

	//Make the new device selectable
	newDiv.on('click mouseup', function() {
		updateDetailsPane($(this));
    });

	//If the device is a server or router, make things droppable on it
	if(newDiv.hasClass('metal')){
		var buttons = "<div class='server_device bg-secondary mb-1 p-1'>Add new VM</div><div class='server_device bg-secondary p-1'>Add Router</div>"
		newDiv.append(buttons);
		newDiv.droppable( {
	        over: function(event, ui) {
	            var $this = $(this);
	        },
			drop: function(event, ui) {
				if ($(ui.helper).hasClass('ui-dialog')) { return false; }
				if(!$(ui.helper).hasClass('dropped')){ createDevice($(this), $(ui.helper)) }
				else {
					$(this).append(ui.draggable);
				}
			}
		});
	}

	network.append(newDiv);
	updateDetailsPane(newDiv);
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
	        class: 'ui-button ui-widget ui-corner-all',
			click: function(){
				deleteDevice(device);
			}
	    });
		deleteDeviceButton.appendTo('#infoPane');	
	}
}

function deleteDevice(device){
	device.remove();
	$('#infoPane').empty();
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