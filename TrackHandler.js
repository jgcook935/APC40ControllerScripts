load("Helpers.js");

// for bank select buttons, these will move the trackbank forward and back
const SELECT_RIGHT = 0x60;
const SELECT_LEFT = 0x61;

// for the block of activator/solo/cue/arm buttons
const MUTE = 0x32;
const SOLO = 0x31;
const ARM = 0x30;

TrackHandler = (trackbank, cursorTrack) => {
    this.trackbank = trackbank;
    this.cursorTrack = cursorTrack;
    // this.sceneBank = this.trackbank.sceneBank;

    for (i = 0; i < this.trackbank.getSizeOfBank(); i++) {
        var track = this.trackbank.getItemAt(i);

        var pan = track.pan();
        pan.markInterested();
        pan.setIndication(true);

        var volume = track.volume();
        volume.markInterested();
        volume.setIndication(true);

        var solo = track.solo();
        solo.markInterested();
        // solo.setIndication(true);

        var mute = track.mute();
        mute.markInterested();
        // mute.setIndication(true);
    }

    this.trackbank.followCursorTrack(this.cursorTrack);

    // this.cursorTrack.solo().markInterested();
    // this.cursorTrack.mute().markInterested();
};

TrackHandler.prototype.handleMidi = function(status, data1, data2) {
    let channel;

    // handles track control knobs
    if (isChannelController(status) && inRange(data1, 0x30, 0x37)) {
        // TODO: check whether pan, or any of the sends are selected here
        this.trackbank
            .getItemAt(data1 - 0x30)
            .pan()
            .set(data2, 128);
        return true;
    }

    // handles track faders
    if (isControl(status) && data1 == 0x07) {
        this.trackbank
            .getItemAt(status - 0xb0)
            .volume()
            .set(data2, 128);
        return true;
    }

    // handles track selection buttons
    if (isControl(status) && data1 == 0x10 && data2 == 0x00) {
        this.trackbank.getItemAt(status - 0xb0).selectInMixer();
        return true;
    }

    // handles single track stop
    if (inRange(status, 0x90, 0x97) && data1 == 0x34 && data2 == 0x7f) {
        this.trackbank.getItemAt(status - 0x90).stop();
        return true;
    }

    // handles all track stop
    if (status == 0x90 && data1 == 0x51 && data2 == 0x7f) {
        for (let i = 0; i < 8; i++) {
            this.trackbank.getItemAt(i).stop();
        }
        return true;
    }

    // handles scene launch
    if (inRange(status, 0x90, 0x97) && inRange(data1, 0x52, 0x56)) {
        this.trackbank.sceneBank().launchScene(data1 - 0x52);
        return true;
    }

    // handles clip launch
    if (inRange(status, 0x90, 0x97) && inRange(data1, 0x35, 0x39) && data2 == 0x7f) {
        this.trackbank
            .getItemAt(status - 0x90)
            .getClipLauncherSlots()
            .launch(data1 - 0x35);
    } else {
        channel = status >= 0x90 ? status - 0x90 : status - 0x80;

        switch (data1) {
            case MUTE:
                this.trackbank
                    .getItemAt(channel)
                    .mute()
                    .toggle();
                return true;
            case SOLO:
                this.trackbank
                    .getItemAt(channel)
                    .solo()
                    .toggle();
                return true;
            case ARM:
                this.trackbank
                    .getItemAt(channel)
                    .arm()
                    .toggle();
                return true;
            case SELECT_LEFT:
                this.trackbank.scrollPageBackwards();
                return true;
            case SELECT_RIGHT:
                this.trackbank.scrollPageForwards();
                return true;
            default:
                return false;
        }
    }
};
