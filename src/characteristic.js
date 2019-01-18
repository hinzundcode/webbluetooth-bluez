"use strict";
const EventEmitter = require("events");

class BluetoothRemoteGATTCharacteristic extends EventEmitter {
	constructor(service, bluezCharacteristic) {
		super();
		this.service = service;
		this._bluezCharacteristic = bluezCharacteristic;
		this.value = new DataView(new Uint8Array(this._bluezCharacteristic.props.Value).buffer);
		this._bluezCharacteristic.on("change.Value", () => {
			this.value = new DataView(new Uint8Array(this._bluezCharacteristic.props.Value).buffer);
			this.emit("characteristicvaluechanged", { target: this });
		});
	}
	
	async readValue() {
		let value = await this._bluezCharacteristic.call("ReadValue", {});
		this.value = new DataView(new Uint8Array(value).buffer);
		return this.value;
	}
	
	async writeValue(value) {
		let payload = [...new Uint8Array(value)];
		await this._bluezCharacteristic.call("WriteValue", payload, {});
	}
	
	async startNotifications() {
		await this._bluezCharacteristic.call("StartNotify");
	}
	
	async stopNotifications() {
		await this._bluezCharacteristic.call("StopNotify");
	}
}

module.exports = {
	BluetoothRemoteGATTCharacteristic,
};
