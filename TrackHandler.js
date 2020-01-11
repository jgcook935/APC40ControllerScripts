load("Constants.js");
load("Helpers.js");

let currentChannel = undefined;
let panSelected;

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
        const track = this.trackbank.getTrack(i);
        const volume = track.volume().get();
        const pan = track.pan().get();
        const mute = track.mute().get();
        const solo = track.solo().get();
        const arm = track.arm().get();

        // update volume knobs
        if (volumeCache[i] != volume || !this.panSelected) {
            this.hardware.updateDeviceKnobLedFrom(0x30 + i, volume);
            volumeCache[i] = volume;
        }

        // update pan knobs
        if (panCache[i] != pan || this.panSelected) {
            this.hardware.updateDeviceKnobLedFrom(0x30 + i, pan);
            panCache[i] = pan;
        }

        // update mute button leds
        if (muteCache[i] != mute) {
            this.hardware.updateChannelLed(mute, i, MUTE);
            muteCache[i] = mute;
        }

        // update solo button leds
        if (soloCache[i] != solo) {
            this.hardware.updateChannelLed(solo, i, SOLO);
            soloCache[i] = solo;
        }

        // update arm button leds
        if (armCache[i] != arm) {
            this.hardware.updateChannelLed(arm, i, ARM);
            armCache[i] = arm;
        }
    }
};

TrackHandler.prototype.selectTrack = status => {
    let channel = status - 0x90;

    // if we're selecting a channel for the first time
    if (currentChannel == undefined) {
        this.trackbank.getTrack(status - 0x90).selectInMixer();
        this.hardware.updateChannelLed(true, channel, SELECT_TRACK);
        currentChannel = channel;
    }

    // if we are selecting the same channel as before, do nothing
    if (currentChannel == channel) {
        // no op
    }

    // if we select a new channel
    if (currentChannel == null || currentChannel != channel) {
        // unselect previous track
        this.hardware.updateChannelLed(false, currentChannel, SELECT_TRACK);

        // select new track
        this.trackbank.getTrack(channel).selectInMixer();
        this.hardware.updateChannelLed(true, channel, SELECT_TRACK);

        currentChannel = channel;
    }
};

TrackHandler.prototype.handleMidi = (status, data1, data2) => {
    if (isChannelController(status)) {
        if (inRange(data1, 0x30, 0x37)) {
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

        if (data1 == 0x07) {
            this.trackbank
                .getItemAt(status - 0xb0)
                .volume()
                .set(data2, 128);
            return true;
        }
    }

    if (isNoteOn(status)) {
        switch (data1) {
            case SELECT_LEFT:
                this.trackbank.scrollPageBackwards();
                return true;

            case SELECT_RIGHT:
                this.trackbank.scrollPageForwards();
                return true;

            case SELECT_UP:
                this.trackbank.scrollTracksUp();
                return true;

            case SELECT_DOWN:
                this.trackbank.scrollTracksDown();
                return true;

            case SELECT_PAN:
                this.panSelected = !this.panSelected;
                this.hardware.updateLed(this.panSelected, SELECT_PAN);
                return true;

            case MUTE:
                mute = this.trackbank.getItemAt(status - 0x90).mute();
                mute.toggle();
                muteCache[status - 0x90] = mute.get();
                return true;

            case SOLO:
                solo = this.trackbank.getItemAt(status - 0x90).solo();
                solo.toggle();
                soloCache[status - 0x90] = solo.get();
                return true;

            case ARM:
                arm = this.trackbank.getItemAt(status - 0x90).arm();
                arm.toggle();
                armCache[status - 0x90] = arm.get();
                return true;

            case CLIP_STOP:
                this.trackbank.getItemAt(status - 0x90).stop();
                return true;

            case ALL_STOP:
                for (let i = 0; i < 8; i++) {
                    this.trackbank.getItemAt(i).stop();
                }
                return true;

            case SCENE_1:
                this.trackbank.sceneBank().launchScene(0);
                return true;

            case SCENE_2:
                this.trackbank.sceneBank().launchScene(1);
                return true;

            case SCENE_3:
                this.trackbank.sceneBank().launchScene(2);
                return true;

            case SCENE_4:
                this.trackbank.sceneBank().launchScene(3);
                return true;

            case SCENE_5:
                this.trackbank.sceneBank().launchScene(4);
                return true;

            case ROW_1:
                this.trackbank
                    .getItemAt(status - 0x90)
                    .getClipLauncherSlots()
                    .launch(0);
                return true;

            case ROW_2:
                this.trackbank
                    .getItemAt(status - 0x90)
                    .getClipLauncherSlots()
                    .launch(1);
                return true;

            case ROW_3:
                this.trackbank
                    .getItemAt(status - 0x90)
                    .getClipLauncherSlots()
                    .launch(2);
                return true;

            case ROW_4:
                this.trackbank
                    .getItemAt(status - 0x90)
                    .getClipLauncherSlots()
                    .launch(3);
                return true;

            case ROW_5:
                this.trackbank
                    .getItemAt(status - 0x90)
                    .getClipLauncherSlots()
                    .launch(4);
                return true;

            case SELECT_TRACK:
                this.selectTrack(status);
                return true;
        }
    }

    return false;
};
