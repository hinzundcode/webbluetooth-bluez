"use strict";
const { call } = require("./utils");
const EventEmitter = require("events");
const debug = require("debug")("bluez:dbus");

async function getObject(bus, service, path, interfaceName) {
	let iface = await call(bus, "getInterface", service, path, interfaceName);
	
	let propsIface = null;
	let props = null;
	
	try {
		propsIface = await call(bus, "getInterface", service, path, "org.freedesktop.DBus.Properties");
	} catch (e) {
		if (e.message != "No such interface")
			throw e;
	}
	
	if (propsIface != null)
		props = await call(propsIface, "GetAll", interfaceName);
	
	let object = new DbusObject(iface, propsIface, props);
	
	debug("object", service, path, interfaceName, props);
	
	if (propsIface != null) {
		propsIface.on("PropertiesChanged", (iface, props) => {
			debug("properties changed", service, path, iface, props);
			if (iface != interfaceName) return;
			
			for (let key in props)
				object.props[key] = props[key];
			
			object.emit("change");
			
			for (let key in props)
				object.emit("change."+key);
		});
	}
	
	return object;
}

async function findObject(bus, service, interfaceName, predicate) {
	let objectManager = await call(bus, "getInterface", service, "/", "org.freedesktop.DBus.ObjectManager");
	let objects = await call(objectManager, "GetManagedObjects");
	objects = Object.keys(objects).map(path => [path, objects[path]]);
	
	let object = objects.find(([path, props]) => interfaceName in props && predicate(path, props[interfaceName]));
	if (object == null)
		throw new Error("can't find object");
	
	return await getObject(bus, service, object[0], interfaceName);
}

class DbusObject extends EventEmitter {
	constructor(iface, propsIface, props) {
		super();	
		this._iface = iface;
		this._propsIface = propsIface;
		this.props = props;
	}
	
	async call(method, ...args) {
		return call(this._iface, method, ...args);
	}
	
	async waitFor(key, value) {
		if (this.props[key] == value)
			return;
		
		return new Promise(resolve => {
			let listener = () => {
				if (this.props[key] == value) {
					this.removeListener("change."+key, listener);
					resolve();
				}
			};
			
			this.on("change."+key, listener);
		});
	}
	
	onSignal(signal, listener) {
		this._iface.on(signal, listener);
	}
}

module.exports = {
	getObject,
	findObject,
};
