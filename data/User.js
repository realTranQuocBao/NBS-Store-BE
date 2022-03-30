import bcrypt from "bcryptjs";

const users = [
  {
    name: "Admin",
    email: "nbs.admin@quocbaoit.com",
    password: bcrypt.hashSync("123456", 10),
    isAdmin: true,
  },
  {
    name: "User",
    email: "nbs.user@quocbaoit.com",
    password: bcrypt.hashSync("123456", 10),
  },
];

export default users;
