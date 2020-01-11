let paramCache = [0, 0, 0, 0, 0, 0, 0, 0];

RemoteControlHandler = (cursorDevice, hardware) => {
    this.cursorDevice = cursorDevice;
    this.remoteControlsBank = this.cursorDevice.createCursorRemoteControlsPage(8);
    this.hardware = hardware;

    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        const param = this.remoteControlsBank.getParameter(i);
        param.markInterested();
        paramCache[i] = param.get();
    }

    this.cursorDevice.isEnabled().markInterested();
    this.cursorDevice.isWindowOpen().markInterested();
};

RemoteControlHandler.prototype.updateParameterLeds = () => {
    for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        const param = this.remoteControlsBank.getParameter(i);
        value = param.get();

        if (paramCache[i] != value) {
            this.hardware.updateDeviceKnobLedFrom(0x10 + i, value);
            paramCache[i] = value;
        }
    }
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
        paramCache[channel] = data2;
        return true;
    }

    return false;
};
