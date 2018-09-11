function inheritPrototype(child, parent) {
	var parent = Object.create(parent.prototype);
	parent.constructor = this;
	this.prototype = parent;
}

/* Network-level settings */
function Network(name) {
	this.name             = name;      //Mandatory
	this.ip               = '';        //Mandatory
	this.gpg              = '';        //Mandatory
	this.adminemail       = '';        //Mandatory
	this.domain           = '';        //Mandatory
	this.class            = 'a';       //Optional
	this.adblocking       = false;     //Optional
	this.autogenpasswords = false;     //Optional
	this.vpnonly          = false;     //Optional
	this.dns              = '8.8.8.8'; //Optional
}

function Machine(name, subnet) {
	this.name        	 = name;
	this.subnet          = subnet;
	this.admins          = {};
	this.sshsource       = {};
	this.types           = {};
	this.cnames          = {};
	this.ports           = {};
	this.myuser          = null;
	this.connection      = null;
	this.adminport       = null;
	this.update          = null;
	this.debianisourl    = null;
	this.debianisosha512 = null;
	this.iface           = null;
	this.externalip      = null;
	this.debianmirror    = null;
	this.debiandirectory = null;
	this.adminemail      = null;
	this.mac             = null;
	this.domain          = null;	
}

function Router(name, subnet) {
	Machine.call(this, name, subnet);

	this.extiface      = null;
	this.extconnection = null;
}

function Metal(name, subnet) {
	Machine.call(this, name, subnet);

	this.extiface        = null; //Optional, inherited
	this.vmbase          = null; //Optional, inherited
}

function Service(name, subnet) {
	Machine.call(this, name, subnet);

	this.profiles        = {};   //Mandatory
	this.metal           = null; //Mandatory
	this.extiface        = null; //Optional, inherited
	this.ram             = null; //Optional, inherited
	this.disksize        = null; //Optional, inherited
	this.datadisksize    = null; //Optional, inherited
	this.cpus            = null; //Optional, inherited
}

function Device(name) {
	this.name      = name;
	this.macs      = {};
	this.ports     = {};    //Optional, default
	this.throttled = true;  //Optional, default
	this.managed   = false; //Optional, default
}

function ExternalOnlyDevice(name) {
	Device.call(this, name);
}

function InternalOnlyDevice(name) {
	Device.call(this, name);
}

function UserDevice(name) {
	Device.call(this, name);
	
	this.fullname = null;
	this.sshkey   = null;
	this.macs = [];
}

//List of mandatory fields to give visual info + force fields validation
var mandatoryFields = ['name', 'ip', 'gpg', 'adminemail', 'domain', 'profiles', 'metal', 'macs','extiface','extconnetion', 'macs'];

inheritPrototype(Router, Machine);
inheritPrototype(Metal, Machine);
inheritPrototype(Service, Machine);

inheritPrototype(ExternalOnlyDevice, Device);
inheritPrototype(InternalOnlyDevice, Device);
inheritPrototype(UserDevice, Device);