load("Constants.js");

DeviceHandler = (device, hardware) => {
    this.device = device;
    this.hardware = hardware;

    this.device.isEnabled().addValueObserver(isEnabled => {
        hardware.updateLed(isEnabled, BUTTON_DEVICE);
    });
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
