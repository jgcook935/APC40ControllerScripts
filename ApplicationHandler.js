const BUTTON_DETAIL = 0x3e;
const BUTTON_CLIP_TRACK = 0x3a;
const BUTTON_DEVICE = 0x3b;

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
