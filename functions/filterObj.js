module.exports.filterObj = (obj, value, user) => {
    let filteredObj = {};
    for (let key in obj) {
        if (obj[key][user].id === value) {
            filteredObj[key] = obj[key];
        }
    }
    return filteredObj;
}