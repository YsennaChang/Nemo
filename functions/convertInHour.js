exports.convertInHour = (durationInMinutes) => {
    const hours = Math.floor(durationInMinutes/60);
    const minutes = durationInMinutes%60 < 10? "0"+ durationInMinutes%60 : durationInMinutes%60;
    return hours+"h"+minutes
};