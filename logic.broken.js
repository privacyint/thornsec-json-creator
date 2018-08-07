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
		.addClass('draggable');
	});

	//Make everything with the class "draggable" be actually draggable
	$( function() {
		$('.draggable').draggable({
			helper: 'clone',
			revert: 'invalid',
		});
	});
	
    //Make sure we can drop properly
	$('#networkLayout').droppable();

	//Networks have properties too
    $('#networkLayout').data(
    	'settings', networkData
    )
    .click(function() {
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
    $('#wizard').steps({
        headerTag: 'h2',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        stepsOrientation: 'vertical'
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

function updateDetailsPane(device) {
	$('#infoPane').html('');

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