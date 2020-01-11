load("Constants.js");

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
                this.hardware.updateLed(!this.transport.isMetronomeEnabled().get(), BUTTON_METRO);
                return true;

            case BUTTON_OVERDUB:
                this.transport.isArrangerOverdubEnabled().toggle();
                this.hardware.updateLed(!this.transport.isArrangerOverdubEnabled().get(), BUTTON_OVERDUB);
                return true;

            default:
                return false;
        }
    }
    if (isChannelController(status)) {
        switch (data1) {
            case CROSSFADE:
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
