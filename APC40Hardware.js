Apc40Hardware = (outputPort, inputPort, inputCallback) => {
  this.portOut = outputPort;
  this.portIn = inputPort;

  this.ledCache = initArray(-1, 128);

  this.portIn.setMidiCallback(inputCallback);
};

Apc40Hardware.prototype.updateLED = (note, isOn) => {
  var value = isOn ? 127 : 0;
  if (this.ledCache[note] != value) {
    this.ledCache[note] = value;
    this.portOut.sendMidi(0x90, note, value);
    println("Updated to " + this.ledCache[note]);
  } else {
    println("Not updated...");
  }
};
