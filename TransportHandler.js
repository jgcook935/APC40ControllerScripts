load("Constants.js");

TransportHandler = (transport, hardware) => {
    this.transport = transport;
    this.hardware = hardware;

    this.transport.isPlaying().markInterested();
    this.transport.isArrangerRecordEnabled().markInterested();

    const metro = this.transport.isMetronomeEnabled();
    metro.markInterested();
    metro.addValueObserver(value => {
        hardware.updateLed(value, BUTTON_METRO);
    });

    const over = this.transport.isArrangerOverdubEnabled();
    over.markInterested();
    over.addValueObserver(value => {
        hardware.updateLed(value, BUTTON_OVERDUB);
    });
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
                return true;

            case BUTTON_OVERDUB:
                this.transport.isArrangerOverdubEnabled().toggle();
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
