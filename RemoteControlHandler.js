RemoteControlHandler = (cursorDevice, hardware) => {
    this.cursorDevice = cursorDevice;
    this.remoteControlsBank = this.cursorDevice.createCursorRemoteControlsPage(8);
    this.hardware = hardware;

    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        const channel = 0x10 + i;
        const param = this.remoteControlsBank.getParameter(i);
        param.markInterested();
        param.addValueObserver(value => {
            hardware.updateDeviceKnobLedFrom(channel, value);
        });
    }

    this.cursorDevice.isEnabled().markInterested();
    this.cursorDevice.isWindowOpen().markInterested();
};

RemoteControlHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isNoteOn(status)) {
        switch (data1) {
            case ARROW_LEFT:
                this.cursorDevice.selectPrevious();
                return true;
            case ARROW_RIGHT:
                this.cursorDevice.selectNext();
                return true;
            default:
                return false;
        }
    }

    if (isChannelController(status) && inRange(data1, 0x10, 0x17)) {
        const channel = data1 - 0x10;
        this.remoteControlsBank.getParameter(channel).set(data2, 128);
        return true;
    }

    return false;
};
