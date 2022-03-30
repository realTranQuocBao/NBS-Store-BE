<<<<<<< HEAD
# Build server

## setup

- SERVER DEPENDENCIES

  - `npm install bcryptjs dotenv express express-async-handler jsonwebtoken mongoose morgan`
  - `npm install -D concurrently nodemon`

- SERVER .ENV

  `PORT = NODE_ENV JWT_SECRET PAYPAL_CLIENT_ID MONGO_URL`

## database

- done connect mongoose database
- done post data product and user to mongoose database
- done get data all/single product and get data user
=======
# Setup backend
```javascript
npm init
npm i bcryptjs dotenv express express-async-handler jsonwebtoken mongoose morgan swagger-ui-express yamljs
npm i --save-dev concurrently nodemon
```
# Note
| Module            | PORT          | Port  |
| ----------------- |:-------------:| -----:|
| BE (API)          | /api/v1/*     | 3000  |
| FE web (client)   | /*            | 5000  |
| FE web (admin)    | /admin/*      | 5000  |

# .env file
```
PORT=<port_here>
NODE_ENV=<development||production>
JWT_SECRET=<jwt_secret_key>
PAYPAL_CLIENT_ID=<bảo cute vl>
MONGO_URL=<mongo_uri_here>
```
>>>>>>> 104bc0dc84a92b5bc3617059cb320a3b88efcde1
