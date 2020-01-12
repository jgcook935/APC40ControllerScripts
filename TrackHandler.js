load("Constants.js");
load("Helpers.js");

let currentChannel = undefined;
let panSelected;

TrackHandler = (trackbank, cursorTrack, hardware) => {
    this.trackbank = trackbank;
    this.cursorTrack = cursorTrack;
    this.hardware = hardware;

    for (i = 0; i < this.trackbank.getSizeOfBank(); i++) {
        this.panSelected = true;
        const track = this.trackbank.getItemAt(i);

        const knobChannel = 0x30 + i;
        const buttonChannel = i;

        const pan = track.pan();
        pan.markInterested();
        pan.setIndication(true);
        pan.addValueObserver(pan => {
            hardware.updateDeviceKnobLedFrom(knobChannel, pan);
        });

        const volume = track.volume();
        volume.markInterested();
        volume.setIndication(true);
        volume.addValueObserver(volume => {
            hardware.updateDeviceKnobLedFrom(knobChannel, volume);
        });

        const solo = track.solo();
        solo.markInterested();
        solo.addValueObserver(solo => {
            hardware.updateChannelLed(solo, buttonChannel, SOLO);
        });

        const arm = track.arm();
        arm.markInterested();
        arm.addValueObserver(arm => {
            hardware.updateChannelLed(arm, buttonChannel, ARM);
        });

        const mute = track.mute();
        mute.markInterested();
        mute.addValueObserver(mute => {
            hardware.updateChannelLed(mute, buttonChannel, MUTE);
        });
    }

    this.trackbank.followCursorTrack(this.cursorTrack);
    println("pan selected " + this.panSelected);
    this.hardware.updateLed(this.panSelected, SELECT_PAN);
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

TrackHandler.prototype.updateVolOrPan = panSelected => {
    for (i = 0; i < this.trackbank.getSizeOfBank(); i++) {
        const knobChannel = 0x30 + i;
        const track = this.trackbank.getItemAt(i);

        if (panSelected) {
            const pan = track.pan().get();
            this.hardware.updateDeviceKnobLedFrom(knobChannel, pan);
        } else {
            const volume = track.volume().get();
            this.hardware.updateDeviceKnobLedFrom(knobChannel, volume);
        }
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
            } else {
                this.trackbank
                    .getItemAt(data1 - 0x30)
                    .volume()
                    .set(data2, 128);
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
                this.updateVolOrPan(this.panSelected);
                return true;

            case MUTE:
                mute = this.trackbank.getItemAt(status - 0x90).mute();
                mute.toggle();
                return true;

            case SOLO:
                solo = this.trackbank.getItemAt(status - 0x90).solo();
                solo.toggle();
                return true;

            case ARM:
                arm = this.trackbank.getItemAt(status - 0x90).arm();
                arm.toggle();
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
