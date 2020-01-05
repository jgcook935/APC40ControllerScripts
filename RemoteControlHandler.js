RemoteControlHandler = (cursorDevice, remoteControlsBank) => {
    this.cursorDevice = cursorDevice;
    this.remoteControlsBank = remoteControlsBank;

    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        this.remoteControlsBank.getParameter(i).markInterested();
    }

    this.cursorDevice.isEnabled().markInterested();
    this.cursorDevice.isWindowOpen().markInterested();
};

RemoteControlHandler.prototype.setIndication = enable => {
    for (let i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
        this.remoteControlsBank.getParameter(i).setIndication(enable);
    }
};

RemoteControlHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isNoteOn(status) || isNoteOff(status)) {
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
                return true;

            case 0x11:
                this.remoteControlsBank.getParameter(1).set(data2, 128);
                return true;

            case 0x12:
                this.remoteControlsBank.getParameter(2).set(data2, 128);
                return true;

            case 0x13:
                this.remoteControlsBank.getParameter(3).set(data2, 128);
                return true;

            case 0x14:
                this.remoteControlsBank.getParameter(4).set(data2, 128);
                return true;

            case 0x15:
                this.remoteControlsBank.getParameter(5).set(data2, 128);
                return true;

            case 0x16:
                this.remoteControlsBank.getParameter(6).set(data2, 128);
                return true;

            case 0x17:
                this.remoteControlsBank.getParameter(7).set(data2, 128);
                return true;

            default:
                return false;
        }
    }

    return false;
};
