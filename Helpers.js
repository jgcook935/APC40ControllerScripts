const inRange = (value, a, b) => {
    return value >= a && value <= b;
};

const isControl = status => {
    return inRange(status, 0xb0, 0xb7);
};
