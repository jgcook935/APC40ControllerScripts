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

        const volume = track.volume();
        volume.markInterested();
        volume.setIndication(true);

        const solo = track.solo();
        solo.markInterested();
        isSolo = solo.get();

        const arm = track.arm();
        arm.markInterested();
        isArm = arm.get();

        const mute = track.mute();
        mute.markInterested();
        isMute = mute.get();
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

        // update track knob leds
        this.hardware.updateDeviceKnobLedFrom(0x30 + i, this.panSelected ? pan : volume);

        // updating these in flush cause the knobs to be glitchy. i need to find a way to only update them in
        // in flush when necessary.

        // // update mute button leds
        // this.hardware.updateChannelLed(mute, i, 0x32);

        // // // update solo button leds
        // this.hardware.updateChannelLed(solo, i, 0x31);

        // // // update arm button leds
        // this.hardware.updateChannelLed(arm, i, 0x30);
    }
};

TrackHandler.prototype.handleMidi = (status, data1, data2) => {
    // handles track control knobs
    if (isChannelController(status) && inRange(data1, 0x30, 0x37)) {
        if (this.panSelected) {
            this.trackbank
                .getItemAt(data1 - 0x30)
                .pan()
                .set(data2, 128);
        } else {
            this.trackbank
                .getItemAt(data1 - 0x30)
                .volume()
                .set(data2, 128);
        }
        this.hardware.updateDeviceKnobLedTo(data1, data2);

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

    // handles pan selection
    if (isNoteOn(status) && data1 == 0x57) {
        this.panSelected = !this.panSelected;
        this.hardware.updateLed(this.panSelected, 0x57);
    }

    if (inRange(status, 0x90, 0x97) && inRange(data1, 0x30, 0x32)) {
        channel = status >= 0x90 ? status - 0x90 : status - 0x80;

        switch (data1) {
            case MUTE:
                this.trackbank
                    .getItemAt(channel)
                    .mute()
                    .toggle();

                this.hardware.updateChannelLed(
                    !this.trackbank
                        .getItemAt(channel)
                        .mute()
                        .get(),
                    channel,
                    0x32
                );
                return true;

            case SOLO:
                this.trackbank
                    .getItemAt(channel)
                    .solo()
                    .toggle();

                this.hardware.updateChannelLed(
                    !this.trackbank
                        .getItemAt(channel)
                        .solo()
                        .get(),
                    channel,
                    0x31
                );
                return true;

            case ARM:
                this.trackbank
                    .getItemAt(channel)
                    .arm()
                    .toggle();

                this.hardware.updateChannelLed(
                    !this.trackbank
                        .getItemAt(channel)
                        .arm()
                        .get(),
                    channel,
                    0x30
                );
                return true;

            default:
                return false;
        }
    }

    return false;
};
