import jwt from "jsonwebtoken";

const generateToken = (id, secret, expiresIn) => {
  return jwt.sign({ id }, secret, {
    expiresIn,
  });
};

export default generateToken;
