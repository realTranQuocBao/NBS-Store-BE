import bcryptjs from "bcryptjs";

const users = [
    {
        name: 'NBS admin',
        email: 'nbsadmin@gmail.com',
        password: bcryptjs.hashSync("12345nbs", 10),
        isAdmin: true
    },
    {
        name: 'user demo',
        email: 'nbsuser@gmail.com',
        password: bcryptjs.hashSync("12345user", 10)
    },
]
export default users;