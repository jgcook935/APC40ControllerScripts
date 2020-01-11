RemoteControlHandler = (cursorDevice, hardware) => {
    this.cursorDevice = cursorDevice;
    this.remoteControlsBank = this.cursorDevice.createCursorRemoteControlsPage(8);
    this.hardware = hardware;

    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        const param = this.remoteControlsBank.getParameter(i);
        param.markInterested();
    }

    this.cursorDevice.isEnabled().markInterested();
    this.cursorDevice.isWindowOpen().markInterested();
};

RemoteControlHandler.prototype.updateParameterLeds = () => {
    for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        const param = this.remoteControlsBank.getParameter(i);
        value = param.get();
        this.hardware.updateDeviceKnobLedFrom(0x10 + i, value);
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

    if (isChannelController(status) && inRange(data1, 0x10, 0x17)) {
        this.remoteControlsBank.getParameter(data1 - 0x10).set(data2, 128);
        this.hardware.updateDeviceKnobLedTo(data1 + 0x10, data2);
        return true;
    }

    return false;
};
