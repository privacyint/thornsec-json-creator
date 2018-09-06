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

var lastNetworkId = 0;

$( function() {
	//Import button triggers file select which will parse the file
    $("#importButton").click(function(){
	    $("#configFile").click();
	});

	$("#exportButton").click(function(){
	    generateJson();
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

	// $('[title]').tooltip({
	// 	position: {
	// 		my: 'left top',
	// 		at: 'right+5 top-5',
	// 		collision: 'none'
	// 	}
	// });

    //$( "<button>" )
    //  .text( "Show help" )
    //  .button()
    //  .on( "click", function() {
    //   tooltips.tooltip( "open" );
    //  })
    //.insertAfter( "form" );
  //} );

});

function updateDetailsPane(device, networkId) {
	$('#infoPane_' + networkId).html('<h3>' + device.data('settings')['name'] + '</h3>');

	$.each($(device).data('settings'), function (setting, val) {
		var settingTextBox = $(document.createElement('div'));


		//Check if the setting is an object or just a string
		if (val === Object(val)) {
			var input = '<select multiple name="textbox_' + setting + '" id="textbox_' + device.attr('id') + '_' + setting + '" data-role="tagsinput"/>';
			settingTextBox.after().html('<label>' + setting + ': </label>' + input);

			settingTextBox.appendTo('#infoPane_' + networkId);

			//init tagsinput
			$('#textbox_' + device.attr('id') + '_' + setting).tagsinput({ delimiter: '|' });
			$.each(val, function(k,v){
				if(typeof v == "string"){
					$('#textbox_' + device.attr('id') + '_' + setting).tagsinput('add', v);
				}else{
					//Tihs is for settings which object inside arrays. We deal with it differently according to what it is
					if(v.destination){
						$('#textbox_' + device.attr('id') + '_' + setting).tagsinput('add', v.destination + ':' + v.ports);	
					}else{
						$('#textbox_' + device.attr('id') + '_' + setting).tagsinput('add', JSON.stringify(v));	
					}
				}
			})
		}
		else {
			settingTextBox.after().html('<label>' + setting + ': </label><input class="settingInput" type="text" name="textbox_' + setting + '" id="textbox_' + setting + '" value="' + val + '" >');

			//update device's setting when modified
			settingTextBox.on('input', 'input', function(e) {
				$(device).data('settings')[setting] = this.value;
			});

			settingTextBox.appendTo('#infoPane_' + networkId);
    		
    		// $('#infoPane').on('change', '#textbox_' + setting, function() {
	     	//		$(device).data('settings')[setting] = this.value;
	    	// });
		}		
	});

	//Adding a button to delete a device (not the network)
	if(device.attr('class') != 'networkLayout'){
		var deleteDeviceButton = $('<button/>', {
	        text: "Delete this device",
	        id: 'delete_button',
	        class: 'btn btn-danger',
			click: function(){
				deleteDevice(device, networkId);
			}
	    });
		deleteDeviceButton.appendTo('#infoPane_' + networkId);	
	}
}

function importJson(event) {
	var newNetworks = [];

	//Avoid errors https://stackoverflow.com/questions/2618959/not-well-formed-warning-when-loading-client-side-json-in-firefox-via-jquery-aj/4234006
	$.ajaxSetup({beforeSend: function(xhr){
		if (xhr.overrideMimeType)
		{
			xhr.overrideMimeType("application/json");
		}
	}});

	//prepare file reader and processing
	fr = new FileReader();
	//var configFile = $('#configFile');
	var configFile = event.target.files[0];;

	fr.onload = function(file){
		//Should add a check to make sure it's a json file

		json = $.parseJSON(file.target.result)
   		//processing
		newNetworks = processJson(json);
	};

	fr.readAsText(configFile);

	//For testing purpose import local file
	// $.getJSON("pi.json", function(json) {
	   
	// });
}