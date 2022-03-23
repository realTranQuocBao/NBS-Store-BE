import bcrypt from "bcryptjs";

const users = [
  {
    name: "Admin",
    email: "admin@quocbaoit.com",
    password: bcrypt.hashSync("123456", 10),
    isAdmin: true,
  },
  {
    name: "User",
    email: "bao.bithu@cn19b.xyz",
    password: bcrypt.hashSync("123456", 10),
  },
];

export default users;
