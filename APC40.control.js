loadAPI(10);
load("Apc40Hardware.js");
load("ApplicationHandler.js");
load("DeviceHandler.js");
load("MasterTrackHandler.js");
load("RemoteControlHandler.js");
load("TrackHandler.js");
load("TransportHandler.js");

// host.setShouldFailOnDeprecatedUse(true);
host.defineController("Akai", "Apc 40 Mk1", "0.1", "4e845965-c7c3-4a5f-8a19-c7eed3dc80ea", "jgcook935");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Akai APC40"], ["Akai APC40"]);

let app;
let device;
let hardware;
let master;
let remote;
let track;
let transport;

init = () => {
    hardware = new Apc40Hardware(host.getMidiOutPort(0), host.getMidiInPort(0), handleMidi);
    app = new ApplicationHandler(host.createApplication());
    master = new MasterTrackHandler(host.createMasterTrack(8));

    const cursorTrack = host.createCursorTrack("APC40_CURSOR_TRACK", "Cursor Track", 3, 5, true);
    track = new TrackHandler(host.createMainTrackBank(8, 3, 5), cursorTrack, hardware);

    const cursorDevice = cursorTrack.createCursorDevice(
        "APC40_CURSOR_DEVICE",
        "Cursor Device",
        3,
        CursorDeviceFollowMode.FOLLOW_SELECTION
    );

    device = new DeviceHandler(cursorDevice, hardware);
    remote = new RemoteControlHandler(cursorDevice, hardware);
    transport = new TransportHandler(host.createTransport(), hardware);

    println("Apc 40 Mk1 initialized!");
    host.showPopupNotification("Apc 40 Mk1 initialized!");
};

handleMidi = (status, data1, data2) => {
    printMidi(status, data1, data2);
    if (track.handleMidi(status, data1, data2)) return;
    if (remote.handleMidi(status, data1, data2)) return;
    if (device.handleMidi(status, data1, data2)) return;
    if (transport.handleMidi(status, data1, data2)) return;
    if (app.handleMidi(status, data1, data2)) return;
    if (master.handleMidi(status, data1, data2)) return;
};

flush = () => {};

exit = () => {
    // TODO: reset all device leds
};
