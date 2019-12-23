const BUTTON_DETAIL = 0x3e;
const BUTTON_CLIP_TRACK = 0x3a;
const BUTTON_DEVICE = 0x3b;

ApplicationHandler = application => {
  this.application = application;
};

ApplicationHandler.prototype.handleMidi = (status, data1, data2) => {
  if (!isNoteOn(status) && data1 == BUTTON_DETAIL) return false; // hack

  if (data2 == 0) return true;

  switch (data1) {
    case BUTTON_DETAIL:
      this.application.toggleAutomationEditor();
      return true;

    case BUTTON_CLIP_TRACK:
      this.application.nextPanelLayout();
      return true;

    default:
      return false;
  }
};
