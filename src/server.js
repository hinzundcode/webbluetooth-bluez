"use strict";
const { findObject } = require("./dbus");
const { BluetoothRemoteGATTService } = require("./service");

class BluetoothRemoteGATTServer {
	constructor(device) {
		this.device = device;
		this._bluezDevice = device._bluezDevice;
	}
	
	get connected() {
		return this._bluezDevice.props.Connected;
	}
	
	async connect() {
		if (!this.connected)
			await this._bluezDevice.call("Connect");
		await this._bluezDevice.waitFor("Connected", true);
		return this;
	}
	
	async disconnect() {
		await this._bluezDevice.call("Disconnect");
		await this._bluezDevice.waitFor("Connected", false);
	}
	
	async getPrimaryService(service) {
		await this._bluezDevice.waitFor("ServicesResolved", true);
		
		let bus = this._bluezDevice._iface.bus;
		let prefix = this._bluezDevice._iface.objectPath+"/";
		
		let bluezService = await findObject(bus, "org.bluez", "org.bluez.GattService1",
			(path, props) => path.startsWith(prefix) && props.UUID == service);
		
		return new BluetoothRemoteGATTService(this.device, bluezService);
	}
}

module.exports = {
	BluetoothRemoteGATTServer,
};
