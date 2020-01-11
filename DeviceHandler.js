load("Constants.js");

DeviceHandler = (device, hardware) => {
    this.device = device;
    this.hardware = hardware;
};

DeviceHandler.prototype.updateDeviceLeds = () => {
    this.hardware.updateLed(this.device.isEnabled().get(), 0x3b);
};

DeviceHandler.prototype.handleMidi = (status, data1, data2) => {
    switch (data1) {
        case BUTTON_DEVICE:
            if (isNoteOff(status)) this.device.isEnabled().toggle();
            return true;
        default:
            return false;
    }
};
