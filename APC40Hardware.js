Apc40Hardware = (outputPort, inputPort, inputCallback) => {
    this.portOut = outputPort;
    this.portIn = inputPort;

    this.ledCache = initArray(-1, 128);

    this.portIn.setMidiCallback(inputCallback);
};

Apc40Hardware.prototype.updateLed = (isOn, id) => {
    this.portOut.sendMidi(isOn ? 0x90 : 0x80, id, isOn ? 1 : 0);
};

Apc40Hardware.prototype.updateChannelLed = (isOn, channel, id) => {
    this.portOut.sendMidi((isOn ? 0x90 : 0x80) + channel, id, isOn ? 1 : 0);
};

Apc40Hardware.prototype.updateDeviceKnobLed = (id, data) => {
    this.portOut.sendMidi(0xb0, id, data);
};

Apc40Hardware.prototype.sendMode = mode => {
    this.portOut.sendSysex([0xf0, 0x47, 0x00, 0x73, 0x60, 0x00, 0x04, mode, 0x08, 0x04, 0x01, 0xf7]);
};
