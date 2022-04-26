const searchConstants = {
    price: {
        asc: 'asc',
        desc: 'desc',
    },
    date: {
        newest: 'desc',
        latest: 'asc',
    },
    totalSales: {
        true: 'desc',
    }
}
const validateConstants = function(constant, constantField) {
    if (!constant) {
        return {};
    }
    return searchConstants[constant].hasOwnProperty(constantField) 
    ? {
        [constant]: searchConstants[constant][constantField],
    }
    : {};
}

export {searchConstants, validateConstants};