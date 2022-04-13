# Setup backend
```javascript
npm i bcryptjs dotenv express express-async-handler jsonwebtoken mongoose morgan swagger-ui-express yamljs
npm i --save-dev concurrently nodemon
```
# Note
| Module            | PORT          | Port  |
| ----------------- |:-------------:| -----:|
| BE (API)          | /api/v1/*     | 5000  |
| FE web (client)   | /*            | 3000  |
| FE web (admin)    | /admin/*      | 3000  |

# .env file
```
PORT=<port_here>
NODE_ENV=<development||production>
JWT_SECRET=<jwt_secret_key>
PAYPAL_CLIENT_ID=<bảo cute vl>
MONGO_URL=<mongo_uri_here>
```

# Database tables
```
<!-- Origin -->
product
user
order
<!-- New -->
producer
category
<!-- Future -->
config (for email)
slider (for slide on homepage)
discount
```