load("Helpers.js");

// for bank select buttons, these will move the trackbank forward and back
const SELECT_RIGHT = 0x60;
const SELECT_LEFT = 0x61;

// for the block of activator/solo/cue/arm buttons
const MUTE = 0x32;
const SOLO = 0x31;
const ARM = 0x30;

// for the track control knobs
// TODO: add variables to track whether the user has selected pan/sendA/sendB/sendC
const KNOB_1 = 0x30;
const KNOB_2 = 0x31;
const KNOB_3 = 0x32;
const KNOB_4 = 0x33;
const KNOB_5 = 0x34;
const KNOB_6 = 0x35;
const KNOB_7 = 0x36;
const KNOB_8 = 0x37;

TrackHandler = (trackbank, cursorTrack) => {
    this.trackbank = trackbank;
    this.cursorTrack = cursorTrack;

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

// i need to go through these values and cache their op codes to reflect the ones on the APC40
// the main bank will be the 8 by 5 grid. the activator buttons will set the mute on each track
// the solo/cue will handle those, and record arm will handle that. the knobs in the top right
// corner of the controller will handle panning and i hope to set up sends as well. i should
// eventually be able to hook up the scene and clip launching here too

TrackHandler.prototype.handleMidi = function(status, data1, data2) {
    let channel;
    if (isChannelController(status) && inRange(data1, 0x30, 0x37)) {
        // TODO: check whether pan, or any of the sends are selected here
        this.trackbank
            .getItemAt(data1 - 0x30)
            .pan()
            .set(data2, 128);
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

//   if (isChannelController(status)) {
//     switch (data1) {
//       // Absolute values
//       case MOXF_KNOB_1:
//         this.trackbank
//           .getItemAt(0)
//           .pan()
//           .set(data2, 128);
//         return true;

//       case MOXF_KNOB_2:
//         this.trackbank
//           .getItemAt(1)
//           .pan()
//           .set(data2, 128);
//         return true;

//       case MOXF_KNOB_3:
//         this.trackbank
//           .getItemAt(2)
//           .pan()
//           .set(data2, 128);
//         return true;

//       case MOXF_KNOB_4:
//         this.trackbank
//           .getItemAt(3)
//           .pan()
//           .set(data2, 128);
//         return true;

//       // Relative values
//       case MOXF_KNOB_5:
//         var value = data2 > 64 ? 64 - data2 : data2;
//         this.trackbank
//           .getItemAt(0)
//           .volume()
//           .inc(value, 128);
//         return true;

//       case MOXF_KNOB_6:
//         var value = data2 > 64 ? 64 - data2 : data2;
//         this.trackbank
//           .getItemAt(1)
//           .volume()
//           .inc(value, 128);
//         return true;

//       case MOXF_KNOB_7:
//         var value = data2 > 64 ? 64 - data2 : data2;
//         this.trackbank
//           .getItemAt(2)
//           .volume()
//           .inc(value, 128);
//         return true;

//       case MOXF_KNOB_8:
//         var value = data2 > 64 ? 64 - data2 : data2;
//         this.trackbank
//           .getItemAt(3)
//           .volume()
//           .inc(value, 128);
//         return true;

//       default:
//         return false;
//     }
//   }

//   return false;
// };
