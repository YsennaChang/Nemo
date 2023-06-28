module.exports.filterObjects = ( arrayOfObjects, filterParams) => {
    return arrayOfObjects.filter(obj => {
        return filterParams.every(param => obj[param.prop] === param.value);
    });
}