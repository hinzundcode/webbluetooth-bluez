"use strict";
const { BluetoothRemoteGATTServer } = require("./server");
const { getObject } = require("./dbus");

class BluetoothDevice {
	constructor(bluezDevice) {
		this._bluezDevice = bluezDevice;
		this.gatt = new BluetoothRemoteGATTServer(this);
	}
}

async function getBluetoothDevice(bus, address) {
	let path = "/org/bluez/hci0/dev_" + address.toUpperCase().replace(/:/g, "_");
	
	let bluezDevice;
	
	try {
		bluezDevice = await getObject(bus, "org.bluez", path, "org.bluez.Device1");
	} catch (e) {
		if (e.message == "No such interface")
			throw new Error("can't find device with address "+address);
		else
			throw e;
	}
	
	return new BluetoothDevice(bluezDevice);
}

module.exports = {
	BluetoothDevice,
	getBluetoothDevice,
};
