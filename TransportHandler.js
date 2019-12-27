// transport op codes
const BUTTON_PLAY = 0x5b;
const BUTTON_STOP = 0x5c;
const BUTTON_RECORD = 0x5d;
const BUTTON_TAP = 0x63;
const BUTTON_METRO = 0x41;
const BUTTON_OVERDUB = 0x40;

TransportHandler = transport => {
    this.transport = transport;

    this.transport.isPlaying().markInterested();
    this.transport.isArrangerRecordEnabled().markInterested();
    this.transport.isMetronomeEnabled().markInterested();
    this.transport.isArrangerOverdubEnabled().markInterested();
};

TransportHandler.prototype.handleMidi = (status, data1, data2) => {
    if (!isNoteOn(status)) return false;

    if (data2 == 0) return true;

    switch (data1) {
        case BUTTON_PLAY:
            this.transport.play();
            return true;

        case BUTTON_STOP:
            this.transport.stop();
            return true;

        case BUTTON_RECORD:
            this.transport.record();
            return true;

        case BUTTON_TAP:
            this.transport.tapTempo();
            return true;

        case BUTTON_METRO:
            this.transport.isMetronomeEnabled().toggle();
            return true;

        case BUTTON_OVERDUB:
            this.transport.isArrangerOverdubEnabled().toggle();
            return true;

        default:
            return false;
    }
};
