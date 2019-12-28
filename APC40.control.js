loadAPI(10);
load("Apc40Hardware.js");
load("ApplicationHandler.js");
load("MasterTrackHandler.js");
load("TrackHandler.js");
load("TransportHandler.js");

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
// host.setShouldFailOnDeprecatedUse(true);
host.defineController("Akai", "Apc 40 Mk1", "0.1", "4e845965-c7c3-4a5f-8a19-c7eed3dc80ea", "jgcook935");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Akai APC40"], ["Akai APC40"]);

var application = null;
var hardware = null;
var transport = null;
var master = null;

init = () => {
    hardware = new Apc40Hardware(host.getMidiOutPort(0), host.getMidiInPort(0), handleMidi);
    applicationHandler = new ApplicationHandler(host.createApplication());
    masterHandler = new MasterTrackHandler(host.createMasterTrack(8));
    transportHandler = new TransportHandler(host.createTransport());
    trackHandler = new TrackHandler(
        host.createMainTrackBank(8, 3, 5),
        host.createCursorTrack("APC40_CURSOR_TRACK", "Cursor Track", 3, 5, true)
    );

    println("Apc 40 Mk1 initialized!");
    host.showPopupNotification("Apc 40 Mk1 initialized!");
};

handleMidi = (status, data1, data2) => {
    printMidi(status, data1, data2);
    if (trackHandler.handleMidi(status, data1, data2)) return;
    if (transportHandler.handleMidi(status, data1, data2)) return;
    if (applicationHandler.handleMidi(status, data1, data2)) return;
    if (masterHandler.handleMidi(status, data1, data2)) return;
};

flush = () => {
    // hardware.updateLED(BUTTON_PLAY, transportHandler.transport.isPlaying().get());
};

exit = () => {};
