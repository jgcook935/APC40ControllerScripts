// transport op codes
const BUTTON_PLAY = 0x5b;
const BUTTON_STOP = 0x5c;
const BUTTON_RECORD = 0x5d;
const BUTTON_TAP = 0x63;
const BUTTON_METRO = 0x41;
const BUTTON_OVERDUB = 0x40;

TransportHandler = (transport, hardware) => {
    this.transport = transport;
    this.hardware = hardware;

    this.transport.isPlaying().markInterested();
    this.transport.isArrangerRecordEnabled().markInterested();
    this.transport.isMetronomeEnabled().markInterested();
    this.transport.isArrangerOverdubEnabled().markInterested();
};

TransportHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isNoteOn(status)) {
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
                this.hardware.updateLed(!this.transport.isMetronomeEnabled().get(), 0x41);
                return true;

            case BUTTON_OVERDUB:
                this.transport.isArrangerOverdubEnabled().toggle();
                this.hardware.updateLed(!this.transport.isArrangerOverdubEnabled().get(), 0x40);
                return true;

            default:
                return false;
        }
    }
    if (isControl(status)) {
        switch (data1) {
            case 0x0f:
                this.transport
                    .crossfade()
                    .value()
                    .set(data2, 128);
                return true;
            default:
                return false;
        }
    }
};
