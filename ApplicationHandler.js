load("Constants.js");

var detailState = false;

ApplicationHandler = application => {
    this.application = application;
};

ApplicationHandler.prototype.handleMidi = (status, data1, data2) => {
    if (data2 == 0) return true;

    if (isNoteOn(status)) {
        switch (data1) {
            case BUTTON_DETAIL:
                detailState ? this.application.toggleDevices() : this.application.toggleNoteEditor();
                detailState = !detailState;
                return true;

            case BUTTON_CLIP_TRACK:
                this.application.nextPanelLayout();
                return true;

            default:
                return false;
        }
    }
};
