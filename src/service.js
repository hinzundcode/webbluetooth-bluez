"use strict";
const { findObject } = require("./dbus");
const { BluetoothRemoteGATTCharacteristic } = require("./characteristic");

class BluetoothRemoteGATTService {
	constructor(device, bluezService) {
		this.device = device;
		this._bluezService = bluezService;
	}
	
	async getCharacteristic(characteristic) {
		let bus = this._bluezService._iface.bus;
		let prefix = this._bluezService._iface.objectPath+"/";
		
		let bluezCharacteristic = await findObject(bus, "org.bluez", "org.bluez.GattCharacteristic1",
			(path, props) => path.startsWith(prefix) && props.UUID == characteristic);
		
		return new BluetoothRemoteGATTCharacteristic(this, bluezCharacteristic);
	}
}

module.exports = {
	BluetoothRemoteGATTService,
};
