var networkDevices = { 'router'  :'Router',
					   'metal'   :'Server',
					   'service' :'VM',
					   'internal':'Internal Only Device',
					   'external':'External Only Device',
					   'user'    :'User'
					 };

var serverDevices = {  'router'   :'Router',
					   'service'  :'VM'
					 };

var networkData = new Network('');

var wizardNetworkData = new Network('');

var defaultServerData = new Machine('', '');

var lastNetworkId = 0;

var networkOptions = [] ;

$( function() {
	//Import button triggers file select which will parse the file
    $("#importButton").click(function(){
	    $("#configFile").click();
	});

	$("#exportButton").click(function(){
	    saveConfig();
	});

	$("#saveButton").click(function(){
	    saveConfig('cookie');
	});

	//Create default values for MAC and subnet enabling autopopulate
	networkOptions['network_0'] = {	'autoMacAddress' : true,
									'autoSubnet' : true,
									'defaultMacAddress': '08:00:27:00:00:00',
									'lastSubnet' : 0,
									'lastMac' :  '08:00:27:00:00:00' };

	//Check if there is a config in cookie
	if(Cookies.get('config')){
		var savedNetworks = Cookies.get('config');
		var savedConfig = {};
		//we need to rebuild the object from saved info
		for(i=1;i<=savedNetworks;i++){
			savedConfig[$.parseJSON(Cookies.get('network_name_' + i))] = {};
			savedConfig[$.parseJSON(Cookies.get('network_name_' + i))]['servers'] = JSONC.decompress($.parseJSON(Cookies.get('network_servers_' + i)));
			savedConfig[$.parseJSON(Cookies.get('network_name_' + i))]['internalonly'] = JSONC.decompress($.parseJSON(Cookies.get('network_internalonly_' + i)));
			savedConfig[$.parseJSON(Cookies.get('network_name_' + i))]['externalonly'] = JSONC.decompress($.parseJSON(Cookies.get('network_externalonly_' + i)));
			savedConfig[$.parseJSON(Cookies.get('network_name_' + i))]['users'] = JSONC.decompress($.parseJSON(Cookies.get('network_users_' + i)));
		}
		processJson(savedConfig);
	}else{
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

		        //Create new network when ckicking finish
		        var newNetwork = createNetwork($('#network_name').val());

		        $.extend(defaultServerData, wizardNetworkData);

		        //setting the right format for some params
		        if (!$.isArray(defaultServerData['dns'])){
		        	defaultServerData['dns'] = defaultServerData['dns'].split(';');	        
		        }
		        delete defaultServerData['subnet'];

		        //copy datas from input to the freshly created network
		        $('#networkLayout_' + lastNetworkId).data('settings', defaultServerData);

		        //clean the default
		        defaultServerData = new Machine('', '');
		        wizardNetworkData = new Network('');

		        //ugly reset because Jquery Steps is abandonned and doesn't have one
		        wizardForm.steps('previous');
		        wizardForm.steps('previous');
		        wizardForm.steps('previous');

		        //Cleaning basic values of the forms
		        $('#network_name').val('');
		        $('#network_domain').val('');
		    }
	    });
	}

	$('#networkDefaultsForm').on('input', function(e) {
		var property = ((e.target.id).split('_')[1]);
		if(e.target.type == "checkbox"){
			wizardNetworkData[property] = e.target.checked;
		}else{
			wizardNetworkData[property] = e.target.value;
		}
	});

	//populating the defaultServerData with pre-entered info
	$('#serverDefaultsForm :input').not(':input[type=button]').each(function(e) {
		var property = (this.id.split('_')[1]);
		if($(this)[0].type == "checkbox"){
			defaultServerData[property] = $(this)[0].checked;
		}else{
			defaultServerData[property] = $(this).val();
		}
	});

	$('#serverDefaultsForm').on('input', function(e) {
		var property = ((e.target.id).split('_')[1]);
		if(e.target.type == "checkbox"){
			defaultServerData[property] = e.target.checked;
		}else{
			defaultServerData[property] = e.target.value;
		}
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

		//check if the param is required
		var required = '';
		if($.inArray(setting, mandatoryFields) !== -1){
			required = 'required';
		}

		//Check if the setting is an object or just a string
		if (val === Object(val)) {
			var input = '<select multiple name="textbox_' + setting + '" id="textbox_' + device.attr('id') + '_' + setting + '" data-role="tagsinput" class="' + required + '"/>';
			settingTextBox.after().html('<label>' + setting + ': </label>' + input);

			settingTextBox.appendTo('#infoPane_' + networkId);

			//init tagsinput
			$('#textbox_' + device.attr('id') + '_' + setting).tagsinput({ delimiter: '|' });
			$.each(val, function(k,v){
				if(typeof v == "string"){
					$('#textbox_' + device.attr('id') + '_' + setting).tagsinput('add', v);
				}else{
					//Tihs is for settings which object inside arrays. We deal with it differently according to what it is
					//NOT FOR NOW, KILLING COOKIES
					/*if(v.destination){
						$('#textbox_' + device.attr('id') + '_' + setting).tagsinput('add', v.destination + ':' + v.ports);	
					}else{*/
					$('#textbox_' + device.attr('id') + '_' + setting).tagsinput('add', JSON.stringify(v));	
					
				}
			})

			//updating object when adding and removing items
			$('#textbox_' + device.attr('id') + '_' + setting).on('itemAdded', function(e) {
				$(device).data('settings')[setting] = $('#textbox_' + device.attr('id') + '_' + setting).val();
				saveConfig('cookie');
			});

			$('#textbox_' + device.attr('id') + '_' + setting).on('itemRemoved', function(e) {
				$(device).data('settings')[setting] = $('#textbox_' + device.attr('id') + '_' + setting).val();
				saveConfig('cookie');
			});
		}
		else {
			settingTextBox.after().html('<label>' + setting + ': </label><input class="settingInput ' + required + '" type="text" name="textbox_' + setting + '" id="textbox_' + setting + '" value="' + val + '" >');

			//update device's setting when modified
			settingTextBox.on('input', 'input', function(e) {
				$(device).data('settings')[setting] = this.value;
				saveConfig('cookie');
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

		json = $.parseJSON(stripJsonComments(file.target.result));
   		//processing
		processJson(json);
	};

	fr.readAsText(configFile);

	//For testing purpose import local file
	// $.getJSON("pi.json", function(json) {
	   
	// });
}