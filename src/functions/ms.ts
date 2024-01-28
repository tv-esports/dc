function formatTime(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${(+seconds < 10 ? '0' : '') + seconds}`;
};

function msToTimeObj(ms: number) {
    return {
        days: Math.floor(ms / 86400000),
        hours: Math.floor(ms / 3600000) % 24,
        minutes: Math.floor(ms / 60000) % 60,
        seconds: Math.floor(ms / 1000) % 60
    };
};

export { formatTime, msToTimeObj };