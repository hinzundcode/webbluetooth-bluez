"use strict";

function call(object, property, ...args) {
	return new Promise((resolve, reject) => {
		object[property](...args, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

module.exports = {
	call,
};
