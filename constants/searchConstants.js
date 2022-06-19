const productQueryParams = {
    price: {
        asc: { price: "asc" },
        desc: { price: "desc" },
        default: {}
    },
    date: {
        newest: { createdAt: "desc" },
        latest: { createdAt: "asc" },
        default: {}
    },
    totalSales: {
        true: { totalSales: "desc" },
        default: {}
    },
    status: {
        disabled: { isDisabled: true },
        notDisabled: { isDisabled: false },
        all: {},
        default: { isDisabled: false }
    }
};

const commentQueryParams = {
    date: {
        newest: { createdAt: "desc" },
        latest: { createdAt: "asc" },
        default: { createdAt: "desc" }
    },
    status: {
        disabled: { isDisabled: true },
        notDisabled: { isDisabled: false },
        all: {},
        default: { isDisabled: false }
    }
};

const orderQueryParams = {
    date: {
        newest: { createdAt: "desc" },
        latest: { createdAt: "asc" },
        default: { createdAt: "desc" }
    },
    status: {
        disabled: { isDisabled: true },
        notDisabled: { isDisabled: false },
        all: {},
        default: { isDisabled: false }
    }
};

const userQueryParams = {
    date: {
        newest: { createdAt: "desc" },
        latest: { createdAt: "asc" },
        default: { createdAt: "desc" }
    },
    status: {
        disabled: { isDisabled: true },
        notDisabled: { isDisabled: false },
        all: {},
        default: { isDisabled: false }
    }
};

const categoryQueryParams = {
    date: {
        newest: { createdAt: "desc" },
        latest: { createdAt: "asc" },
        default: { createdAt: "desc" }
    },
    status: {
        disabled: { isDisabled: true },
        notDisabled: { isDisabled: false },
        all: {},
        default: { isDisabled: false }
    }
};

const producerQueryParams = {
    date: {
        newest: { createdAt: "desc" },
        latest: { createdAt: "asc" },
        default: { createdAt: "desc" }
    },
    status: {
        disabled: { isDisabled: true },
        notDisabled: { isDisabled: false },
        all: {},
        default: { isDisabled: false }
    }
};

const validateConstants = function (reference, constant, constantField) {
    return reference[constant].hasOwnProperty(constantField)
        ? reference[constant][constantField]
        : reference[constant]["default"];
};

export {
    productQueryParams,
    commentQueryParams,
    orderQueryParams,
    userQueryParams,
    categoryQueryParams,
    producerQueryParams,
    validateConstants
};
