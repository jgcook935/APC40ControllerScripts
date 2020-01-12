load("Constants.js");

var detailState = false;

ApplicationHandler = (application, hardware) => {
    this.application = application;
    this.hardware = hardware;
};

ApplicationHandler.prototype.handleMidi = (status, data1, data2) => {
    if (data2 == 0) return true;

    if (isNoteOn(status)) {
        switch (data1) {
            case BUTTON_DETAIL:
                detailState ? this.application.toggleDevices() : this.application.toggleNoteEditor();
                this.hardware.updateChannelLed(true, 0, BUTTON_DETAIL);
                detailState = !detailState;
                return true;

            case BUTTON_CLIP_TRACK:
                this.application.nextPanelLayout();
                this.hardware.updateChannelLed(true, 0, BUTTON_CLIP_TRACK);
                return true;

            default:
                return false;
        }
    }

    if (isNoteOff(status)) {
        switch (data1) {
            case BUTTON_DETAIL:
                this.hardware.updateChannelLed(false, 0, BUTTON_DETAIL);
                return true;

            case BUTTON_CLIP_TRACK:
                this.hardware.updateChannelLed(false, 0, BUTTON_CLIP_TRACK);
                return true;

            default:
                return false;
        }
    }
};
