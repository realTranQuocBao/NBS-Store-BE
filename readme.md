# Setup backend
```javascript
npm i bcryptjs dotenv express express-async-handler jsonwebtoken mongoose morgan swagger-ui-express yamljs multer uuid sharp cors
npm i --save-dev concurrently nodemon

multer: để xử lí phần multipart/form-data.
uuid: UUID là viết tắt của Universally Unique IDentifier, hiểu nôm na là nó sẽ random ra một định danh duy nhất.
sharp: đây là thư viện image resize libraries.
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