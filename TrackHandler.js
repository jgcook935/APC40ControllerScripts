load("Helpers.js");

// for bank select buttons, these will move the trackbank forward and back
const SELECT_RIGHT = 0x60;
const SELECT_LEFT = 0x61;

// for the block of activator/solo/cue/arm buttons
const MUTE = 0x32;
const SOLO = 0x31;
const ARM = 0x30;

let currentChannel = null;
let panSelected = null;

let volumeCache = [0, 0, 0, 0, 0, 0, 0, 0];
let panCache = [0, 0, 0, 0, 0, 0, 0, 0];
let muteCache = [0, 0, 0, 0, 0, 0, 0, 0];
let soloCache = [0, 0, 0, 0, 0, 0, 0, 0];
let armCache = [0, 0, 0, 0, 0, 0, 0, 0];

TrackHandler = (trackbank, cursorTrack, hardware) => {
    this.trackbank = trackbank;
    this.cursorTrack = cursorTrack;
    this.hardware = hardware;

    for (i = 0; i < this.trackbank.getSizeOfBank(); i++) {
        this.panSelected = false;
        const track = this.trackbank.getItemAt(i);

        const pan = track.pan();
        pan.markInterested();
        pan.setIndication(true);
        panCache[i] = pan.get();

        const volume = track.volume();
        volume.markInterested();
        volume.setIndication(true);
        volumeCache[i] = volume.get();

        const solo = track.solo();
        solo.markInterested();
        soloCache[i] = solo.get();

        const arm = track.arm();
        arm.markInterested();
        armCache[i] = arm.get();

        const mute = track.mute();
        mute.markInterested();
        muteCache[i] = mute.get();
    }

    this.trackbank.followCursorTrack(this.cursorTrack);
};

TrackHandler.prototype.updateTrackLeds = () => {
    for (i = 0; i < this.trackbank.getSizeOfBank(); i++) {
        // grab the current track
        const track = this.trackbank.getTrack(i);

        // grab the track's attributes we care about
        const volume = track.volume().get();
        const pan = track.pan().get();
        const mute = track.mute().get();
        const solo = track.solo().get();
        const arm = track.arm().get();

        // update volume knobs
        if (volumeCache[i] != volume && !this.panSelected) {
            this.hardware.updateDeviceKnobLedFrom(0x30 + i, volume);
            volumeCache[i] = volume;
        }

        // update pan knobs
        if (panCache[i] != pan && this.panSelected) {
            this.hardware.updateDeviceKnobLedFrom(0x30 + i, pan);
            panCache[i] = pan;
        }

        // update mute button leds
        if (muteCache[i] != mute) {
            this.hardware.updateChannelLed(mute, i, 0x32);
            muteCache[i] = mute;
        }

        // update solo button leds
        if (soloCache[i] != solo) {
            this.hardware.updateChannelLed(solo, i, 0x31);
            soloCache[i] = solo;
        }

        // update arm button leds
        if (armCache[i] != arm) {
            this.hardware.updateChannelLed(arm, i, 0x30);
            armCache[i] = arm;
        }
    }
};

TrackHandler.prototype.handleMidi = (status, data1, data2) => {
    // handles pan selection
    if (isNoteOn(status) && data1 == 0x57) {
        this.panSelected = !this.panSelected;
        this.hardware.updateLed(this.panSelected, 0x57);
    }

    // handles track control knobs
    if (isChannelController(status) && inRange(data1, 0x30, 0x37)) {
        if (this.panSelected) {
            this.trackbank
                .getItemAt(data1 - 0x30)
                .pan()
                .set(data2, 128);
            panCache[data1 - 0x30] = data2;
        } else {
            this.trackbank
                .getItemAt(data1 - 0x30)
                .volume()
                .set(data2, 128);
            volumeCache[data1 - 0x30] = data2;
        }
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

    // handles track selection buttons on
    if (inRange(status, 0x90, 0x97) && data1 == 0x33) {
        // grab the channel coming in
        let channel = status - 0x90;

        // if we're selecting a channel for the first time
        if (currentChannel == null) {
            this.trackbank.getTrack(status - 0x90).selectInMixer();
            this.hardware.updateChannelLed(true, channel, 0x33);
            currentChannel = channel;
        }

        // if we are selecting the same channel as before, do nothing
        if (currentChannel == channel) {
            // no op
            return false;
        }

        // if we select a new channel
        if (currentChannel == null || currentChannel != channel) {
            // unselect previous track
            this.hardware.updateChannelLed(false, currentChannel, 0x33);

            // select new track
            this.trackbank.getTrack(channel).selectInMixer();
            this.hardware.updateChannelLed(true, channel, 0x33);

            currentChannel = channel;
            return true;
        }
        return false;
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

    // handles track pages
    if (isNoteOn(status)) {
        switch (data1) {
            case SELECT_LEFT:
                this.trackbank.scrollPageBackwards();
                return true;
            case SELECT_RIGHT:
                this.trackbank.scrollPageForwards();
                return true;
        }
    }

    // handles clip launch
    if (inRange(status, 0x90, 0x97) && inRange(data1, 0x35, 0x39) && data2 == 0x7f) {
        this.trackbank
            .getItemAt(status - 0x90)
            .getClipLauncherSlots()
            .launch(data1 - 0x35);
        return true;
    }

    // handles mute/solo/arm buttons
    if (inRange(status, 0x90, 0x97) && inRange(data1, 0x30, 0x32)) {
        channel = status - 0x90;

        switch (data1) {
            case MUTE:
                mute = this.trackbank.getItemAt(channel).mute();
                mute.toggle();
                muteCache[channel] = mute.get();
                return true;

            case SOLO:
                solo = this.trackbank.getItemAt(channel).solo();
                solo.toggle();
                soloCache[channel] = solo.get();
                return true;

            case ARM:
                arm = this.trackbank.getItemAt(channel).arm();
                arm.toggle();
                armCache[channel] = arm.get();
                return true;

            default:
                return false;
        }
    }
    return false;
};
