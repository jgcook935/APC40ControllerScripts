const BUTTON_DEVICE = 0x3b;

DeviceHandler = device => {
  this.device = device;
};

// this handler is intended to control devices with the "device control" section of the controller.
// the device on/off control should toggle the currently selected device on/off
// the arrow keys should toggle between the devices in the currently selected track's device chain/bank

DeviceHandler.prototype.handleMidi = (status, data1, data2) => {
  if (data2 == 0) return true;

  switch (data1) {
    case BUTTON_DEVICE:
      this.device.isEnabled().toggle();
      return true;

    default:
      return false;
  }
};
