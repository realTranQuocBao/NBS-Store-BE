# Setup backend
```javascript
npm init
npm i bcryptjs dotenv express express-async-handler jsonwebtoken mongoose morgan swagger-ui-express
npm i --dev concurrently nodemon
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