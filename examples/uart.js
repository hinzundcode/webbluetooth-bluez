"use strict";
const dbus = require("dbus");
const { getBluetoothDevice } = require("..");
const { Duplex } = require("stream");

const serviceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const txUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const rxUuid = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const chunkSize = 20;

async function openUartStream(device) {
	let server = await device.gatt.connect();
	let service = await server.getPrimaryService(serviceUuid);
	
	let tx = await service.getCharacteristic(txUuid);
	let rx = await service.getCharacteristic(rxUuid);
	
	let stream = new Duplex({
		write(data, encoding, callback) {
			// end stream on Ctrl-C or Ctrl-D
			if (data[0] == 3 || data[0] == 4) {
				this.destroy();
				return;
			}
			
			(async () => {
				for (let i = 0; i < data.length; i += chunkSize) {
					let chunk = data.slice(i, i + chunkSize);
					await tx.writeValue(chunk);
				}
			})().then(() => callback()).catch(e => callback(e));
		},
		
		read(size) {},
		
		destroy(err, callback) {
			console.error("disconnecting...");
			
			(async () => {
				try {
					await rx.stopNotifications();
				} catch (e) {}
				
				try {
					await server.disconnect();
				} catch (e) {}
				
				this.push(null);
			})().then(() => callback(err))
			.catch(e => callback(err));
		},
	});
	
	rx.on("characteristicvaluechanged", e => {
		stream.push(Buffer.from(e.target.value.buffer));
	});
	
	await rx.startNotifications();
	
	return stream;
}

(async () => {
	let address = process.argv[2];
	if (!address) {
		console.error("Usage: node uart.js <device address>");
		process.exit(1);
	}
	
	console.error("connecting...");
	
	let bus = dbus.getBus("system");
	let device = await getBluetoothDevice(bus, address);
	let uart = await openUartStream(device);
	
	console.error("connected");
	
	uart.pipe(process.stdout);
	process.stdin.setRawMode(true);
	process.stdin.pipe(uart);
	
	uart.on("error", e => {
		console.error(e);
		uart.destroy();
	});
	
	uart.on("end", () => {
		process.stdin.setRawMode(false);
		bus.disconnect();
		process.exit(0);
	});
})();
