MasterTrackHandler = master => {
    this.master = master;

    // might need to mark some things as interested here
};

MasterTrackHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isControl(status)) {
        switch (data1) {
            case 0x0e:
                this.master.getVolume().set(data2, 128);
                return true;
            default:
                return false;
        }
    }

    if (isNoteOn(status) && data1 == 0x50) {
        this.master.selectInMixer();
        return true;
    }

    return false;
};
