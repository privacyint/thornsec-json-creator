function generateJson(){
	var network = [];

	$('#userLayout').children().each(function(key, device){
		console.log($(device).data('settings'));
		console.log(JSON.stringify($(device).data('settings')));

		//This is good but need to do something about the name param
		JSON.stringify($(device).data('settings'));
	});
}