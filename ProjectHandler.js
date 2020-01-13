load("Constants.js");

ProjectHandler = project => {
    this.project = project;
};

ProjectHandler.prototype.handleMidi = (status, data1, data2) => {
    switch (data1) {
        case CUE_LEVEL:
            value = data2 > 64 ? 64 - data2 : data2;
            this.project.cueVolume().inc(value, 128);
            return true;
        default:
            return false;
    }
};
