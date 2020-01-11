Apc40Hardware = (outputPort, inputPort, inputCallback) => {
    this.portIn = inputPort;
    this.portOut = outputPort;

    this.portIn.setMidiCallback(inputCallback);

    // send mode to enable akai version 2 (ableton alternate)
    this.portOut.sendSysex([0xf0, 0x47, 0x00, 0x73, 0x60, 0x00, 0x04, 0x42, 0x08, 0x04, 0x01, 0xf7]);
};

Apc40Hardware.prototype.updateLed = (isOn, id) => {
    this.portOut.sendMidi(isOn ? 0x90 : 0x80, id, isOn ? 1 : 0);
};

Apc40Hardware.prototype.updateChannelLed = (isOn, channel, id) => {
    this.portOut.sendMidi((isOn ? 0x90 : 0x80) + channel, id, isOn ? 1 : 0);
};

Apc40Hardware.prototype.updateDeviceKnobLedFrom = (id, data) => {
    this.portOut.sendMidi(0xb0, id, data * 127);
};

Apc40Hardware.prototype.updateDeviceKnobLedTo = (id, data) => {
    this.portOut.sendMidi(0xb0, id, data);
};
