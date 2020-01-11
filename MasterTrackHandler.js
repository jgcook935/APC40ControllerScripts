load("Constants.js");

MasterTrackHandler = master => {
    this.master = master;

    // might need to mark some things as interested here
};

MasterTrackHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isChannelController(status)) {
        switch (data1) {
            case MASTER_VOLUME:
                this.master.getVolume().set(data2, 128);
                return true;
            default:
                return false;
        }
    }

    if (isNoteOn(status) && data1 == MASTER_TRACK) {
        this.master.selectInMixer();
        return true;
    }

    return false;
};
