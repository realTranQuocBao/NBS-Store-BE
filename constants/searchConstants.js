const searchConstants = {
    price: {
        asc: 'asc',
        desc: 'desc',
    },
    date: {
        newest: 'desc',
        latest: 'asc',
    }
}
const validateConstants = function(constant, constantField) {
    return searchConstants[constant].hasOwnProperty(constantField) 
    ? constantField
    : Object.keys(searchConstants[constant])[0] 
}
export {searchConstants, validateConstants};