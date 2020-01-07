RemoteControlHandler = (cursorDevice, remoteControlsBank, hardware) => {
    this.cursorDevice = cursorDevice;
    this.remoteControlsBank = remoteControlsBank;
    this.hardware = hardware;

    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        this.remoteControlsBank.getParameter(i).markInterested();
        println("paramter at index " + i + " has value " + this.remoteControlsBank.getParameter(i).displayedValue());
        // this.hardware.updateDeviceKnobLed(0x10 + i, 50);
    }

    this.cursorDevice.isEnabled().markInterested();
    this.cursorDevice.isWindowOpen().markInterested();
};

// i don't think this is necessary. should remove
RemoteControlHandler.prototype.setIndication = enable => {
    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        this.remoteControlsBank.getParameter(i).setIndication(enable);
    }
};

RemoteControlHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isNoteOn(status)) {
        switch (data1) {
            case 0x3c:
                this.cursorDevice.selectPrevious();
                return true;
            case 0x3d:
                this.cursorDevice.selectNext();
                return true;
            default:
                return false;
        }
    }

    if (isChannelController(status)) {
        switch (data1) {
            case 0x10:
                this.remoteControlsBank.getParameter(0).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x10, data2);
                return true;

            case 0x11:
                this.remoteControlsBank.getParameter(1).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x11, data2);
                return true;

            case 0x12:
                this.remoteControlsBank.getParameter(2).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x12, data2);
                return true;

            case 0x13:
                this.remoteControlsBank.getParameter(3).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x13, data2);
                return true;

            case 0x14:
                this.remoteControlsBank.getParameter(4).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x14, data2);
                return true;

            case 0x15:
                this.remoteControlsBank.getParameter(5).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x15, data2);
                return true;

            case 0x16:
                this.remoteControlsBank.getParameter(6).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x16, data2);
                return true;

            case 0x17:
                this.remoteControlsBank.getParameter(7).set(data2, 128);
                this.hardware.updateDeviceKnobLed(0x17, data2);
                return true;

            default:
                return false;
        }
    }

    return false;
};
