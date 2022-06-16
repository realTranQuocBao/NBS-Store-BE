const productQueryParams = {
  price: {
    asc: { price: "asc" },
    desc: { price: "desc" },
    default: { price: "asc" },
  },
  date: {
    newest: { createdAt: "desc" },
    latest: { createdAt: "asc" },
    default: { createdAt: "desc" },
  },
  totalSales: {
    true: { totalSales: "desc" },
    default: { totalSales: "desc" },
  },
};

const commentQueryParams = {
  date: {
    newest: { createdAt: "desc" },
    latest: { createdAt: "asc" },
    default: { createdAt: "desc" },
  },
  status: {
    disabled: { isDisabled: true },
    notDisabled: { isDisabled: false },
    all: {},
    default: { isDisabled: false },
  },
};

const validateConstants = function (reference, constant, constantField) {
  return reference[constant].hasOwnProperty(constantField)
    ? reference[constant][constantField]
    : reference[constant]["default"];
};

export { productQueryParams, commentQueryParams, validateConstants };
