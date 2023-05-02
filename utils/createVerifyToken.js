import crypto from "crypto";

const createVerifyToken = () => {
  let emailVerificationToken = crypto.randomBytes(32).toString("hex");
  emailVerificationToken = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");
  return emailVerificationToken;
};

export { createVerifyToken };
