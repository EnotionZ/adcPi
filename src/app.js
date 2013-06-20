var gpio = require('gpio'), async = require('async');

var
SPICLK  = 18,
SPIMISO = 23,
SPIMOSI = 24,
SPICS   = 25;

var pins = {}, cspin, clockpin, mosipin, misopin;

var setup = function(callback) {
	mosipin = pins[SPIMOSI] = gpio.export(SPIMOSI, { direction: 'out' });
	misopin = pins[SPIMISO] = gpio.export(SPIMISO, { direction: 'in' });
	clockpin = pins[SPICLK] = gpio.export(SPICLK, { direction: 'out' });
	cspin = pins[SPICS] = gpio.export(SPICS, {
		direction: 'out',
		ready: function() {
			if(typeof callback === 'function') callback();
		}
	});
};

/**
 * Reads digital values from a MCP3004 ADC.
 * @param {Number} channel - the ADC channel to read
 * @return {Number} the read value between 0 and 1023
 */
var readAdc = function(channel, callback) {
	var cmdOut, adcOut;
	if (channel < 0 || channel > 3) throw new Error('adc channel number must be in the range of 0--3');

	cspin.set();
	clockpin.set(0);
	cspin.set(0);

	cmdOut = channel | 0x18;
	cmdOut <<= 3;

	for (var i = 0; i < 5; i++) {
		if (cmdOut & 0x80) {
			mosipin.set(1);
		} else {
			mosipin.set(0);
		}
		cmdOut <<= 1;
		clockpin.set(1);
		clockpin.set(0);
	}

	adcOut = 0;
	for (i = 0; i < 12; i++) {
		clockpin.set(1);
		clockpin.set(0);
		adcOut <<= 1;
		if (misopin.value) {
			adcOut |= 0x1;
		}
	}
	cspin.set(1);
	adcOut >>= 1;
	callback(adcOut);
};

setup(function() {
	setInterval(function() {
		readAdc(0, function(value) {
			console.log(value);
		});
	}, 500);
});