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
		.addClass('draggable')
		.dblclick(function(event){
			createDevice($('#networkLayout'),$(this));
		});
	});

	//Make everything with the class "draggable" be actually draggable
	$( function() {
		$('.draggable').draggable({
			helper: 'clone',
			revert: 'invalid',
		});
	});
	
    //Make sure we can drop properly
	$('#networkLayout').droppable( {
		drop: function(event, ui) {
			if ($(ui.helper).hasClass('ui-dialog')) { return false; }
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

	//As do objects on the network
    $('#networkLayout').on('click mouseup', '.dropped', function() {
		updateDetailsPane($(this));
    });

    //Annoyingly, dialogs cannot be given percentages, so calculate them up here!
    var winWidth  = $(window).width() * 0.5;
    var winHeight = $(window).height();
    //Show the wizard!
    var wizard = $('#wizard').show();
    wizard.steps({
        headerTag: 'h2',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        stepsOrientation: 'vertical',
        onStepChanging: function (event)
	    {
	        wizard.validate().settings.ignore = ":disabled,:hidden";
	        return wizard.valid();
	    },
        onFinishing: function (event, currentIndex){
	        return wizard.valid();
	    },
	    onFinished: function (event, currentIndex){
	        $(this).dialog('close');
	    }
    })
	.dialog({
    	modal: true,
    	autoOpen: true,
    	title: 'Thornsec for the masses',
    	width: winWidth,
    	height: winHeight
    });	

    $('[title]').tooltip({
		position: {
			my: 'left top',
			at: 'right+5 top-5',
			collision: 'none'
		}
	});

	$('.accordion').accordion({
		collapsible: true,
		heightStyle: "content",
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

	var newDiv = device.clone(false)
		.data('clone', true)
		.attr('id', name)
		.addClass('dropped')
		.draggable( { revert: 'invalid', } );

	if (newDiv.hasClass('router')) { 
		newDiv.html(name + ' <i>(' + networkDevices.router + ')</i>');
		newDiv.data('settings', serverInheritDefault(new Router(name, prompt('give me a subnet!'))));
	}
	else if (newDiv.hasClass('metal')) { 
		newDiv.html(name + ' <i>(' + networkDevices.metal + ')</i>');
		newDiv.data('settings', serverInheritDefault(new Metal(name, prompt('give me a subnet!'))));
	}
	else if (newDiv.hasClass('service')) { 
		newDiv.html(name + ' <i>(' + networkDevices.service + ')</i>');
		newDiv.data('settings', serverInheritDefault(new Service(name, prompt('give me a subnet!'))));

	}
	else if (newDiv.hasClass('internalonly')) { 
		newDiv.html(name + ' <i>(' + networkDevices.internalonly + ')</i>');
		newDiv.data('settings', new InternalOnlyDevice(name));
	}
	else if (newDiv.hasClass('externalonly')) { 
		newDiv.html(name + ' <i>(' + networkDevices.externalonly + ')</i>');
		newDiv.data('settings', new ExternalOnlyDevice(name));
	}
	else if (newDiv.hasClass('user')) { 
		newDiv.html(name + ' <i>(' + networkDevices.user + ')</i>');
		newDiv.data('settings', new UserDevice(name));
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
    		
    		$('#infoPane').on('change', '#textbox_' + setting, function() {
       			$(device).data('settings')[setting] = this.value;
	    	});
			
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