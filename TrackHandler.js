load("Constants.js");
load("Helpers.js");

let currentChannel = undefined;
let panSelected;

TrackHandler = (trackbank, cursorTrack, hardware, master) => {
    this.trackbank = trackbank;
    this.cursorTrack = cursorTrack;
    this.hardware = hardware;
    this.master = master;

    for (i = 0; i < this.trackbank.getSizeOfBank(); i++) {
        this.panSelected = true;
        const track = this.trackbank.getItemAt(i);

        const clipLauncher = track.clipLauncherSlotBank();
        clipLauncher.setIndication(true);

        for (j = 0; j < 5; j++) {
            const noteNumber = 0x35 + j;
            const track = i;
            const slot = clipLauncher.getItemAt(j);

            // this probably won't matter since colors only represent status on mk1
            slot.color().markInterested();

            slot.isPlaybackQueued().markInterested();
            slot.isPlaybackQueued().addValueObserver(value => {
                const channel = (value ? 0x90 : 0x80) + track;
                hardware.updateLaunchLed(channel, noteNumber, value ? 2 : 0);
            });

            slot.hasContent().markInterested();
            slot.hasContent().addValueObserver(value => {
                const channel = (value ? 0x90 : 0x80) + track;
                hardware.updateLaunchLed(channel, noteNumber, value ? 5 : 0);
            });

            slot.isPlaying().markInterested();
            slot.isPlaying().addValueObserver(value => {
                const channel = (value ? 0x90 : 0x80) + track;
                hardware.updateLaunchLed(channel, noteNumber, value ? 1 : 0);
            });

            slot.isRecording().markInterested();
            slot.isRecordingQueued().markInterested();

            slot.isStopQueued().markInterested();
            // there's a bitwig bug around isStopQueued, so not using for now
            // slot.isStopQueued().addValueObserver(value => {
            //     const channel = (value ? 0x90 : 0x80) + track;
            //     hardware.updateLaunchLed(channel, noteNumber, value ? 4 : 0);
            // });

            slot.exists().markInterested();
        }

        const knobChannel = 0x30 + i;
        const buttonChannel = i;

        // i need to set indication and mark interested for master volume

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

        this.trackbank.getTrack(0).selectInMixer();
        this.hardware.updateChannelLed(true, 0, SELECT_TRACK);
        currentChannel = 0;
    }

    this.trackbank.followCursorTrack(this.cursorTrack);
    this.hardware.updateLed(this.panSelected, SELECT_PAN);
};

TrackHandler.prototype.selectTrack = (status, data1) => {
    let channel;
    if (data1 != MASTER_TRACK) {
        channel = status - 0x90;
    } else {
        channel = 8;
    }

    if (currentChannel != channel) {
        // unselect previous track
        if (inRange(currentChannel, 0, 7)) this.hardware.updateChannelLed(false, currentChannel, SELECT_TRACK);
        else this.hardware.updateLed(false, MASTER_TRACK);

        if (data1 == MASTER_TRACK) {
            this.master.selectInMixer();
            this.hardware.updateLed(true, MASTER_TRACK);
        } else {
            this.trackbank.getTrack(channel).selectInMixer();
            this.hardware.updateChannelLed(true, channel, SELECT_TRACK);
        }

        currentChannel = channel;
    }
};

// TrackHandler.prototype.flashTrackLed = channel => {
//     for (j = 0; j < 5; j++) {
//         const noteNumber = 0x35 + j;
//         hardware.updateLaunchLed(channel, noteNumber, 4);
//     }
// };

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

        if (data1 == TRACK_FADER) {
            this.trackbank
                .getItemAt(status - 0xb0)
                .volume()
                .set(data2, 128);
            return true;
        }

        if (data1 == MASTER_VOLUME) {
            this.master.getVolume().set(data2, 128);
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
                // need to figure out a way to stop the flashing after we stop
                // this.flashTrackLed(status);
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
                this.selectTrack(status, data1);
                return true;

            case MASTER_TRACK:
                this.selectTrack(status, data1);
                return true;
        }
    }

    return false;
};
