require('dotenv').config()

const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const bodyParser = require('body-parser')
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
const sha1 = require('sha1')
const multer = require('multer')
const AWS = require('aws-sdk')
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient

// MongoDB configuration
const MONGO_URL = 'mongodb://localhost:27017'
const mongoClient = new MongoClient(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const DATABASE = process.env.MONGO_DATABASE
const COLLECTION = process.env.MONGO_COLLECTION

// AWS config
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(process.env.AWS_ENDPOINT),
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESSKEY,
})

const upload = multer({ dest: './imagetemp ' }) // select folder

// save to mongoDB
const mkImage = (params, imageFile) => {
  return {
    title: params.title,
    comments: params.comments,
    image: imageFile,
    timestamp: new Date(),
  }
}

const pool = mysql.createPool({
  host: process.env.MYSQL_SERVER || 'localhost',
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: process.env.MYSQL_CON_LIMIT || 4,
  timezone: '+08:00',
})

const startApp = async (app, pool) => {
  const conn = await pool.getConnection()
  try {
    console.info('Pinging database...')
    await conn.ping()
  } catch (err) {
    console.error('Cannot ping database >>> ', err)
  } finally {
    conn.release
  }
}

const makeSQLQuery = (sql, pool) => {
  return async (args) => {
    const conn = await pool.getConnection()
    try {
      let results = await conn.query(sql, args || [])
      return results[0] // index0 = data, index1 = metadata
    } catch (error) {
      console.error('Error in making SQL query >>>', error)
    } finally {
      conn.release()
    }
  }
}

const app = express()

app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }))
app.use(bodyParser.json({ limit: '20mb' }))
app.use(cors())
app.use(morgan('combined'))

// test homepage
// app.get('/', (req, res) => {
//   res.status(200)
//   res.json({ Hello: 'Kitty' })
// })

const SQL_QUERY_ALL = `SELECT * FROM user where user_id=? and password=?`
const getAuthentication = makeSQLQuery(SQL_QUERY_ALL, pool)

app.post('/', async (req, res) => {
  let username = req.body['username']
  let password = sha1(req.body['password'])

  // console.info(password) // can log hash

  await getAuthentication([username, password])
    .then((result) => {
      console.log('result >>> ', result[0])
      let sql_userId = result[0].user_id
      let sql_password = result[0].password

      if (username == sql_userId && password == sql_password) {
        res.status(200)
        res.json('You are authenticated!')
      } else {
        res.status(401)
        res.json('Please fill in the correct login and password')
      }
    })
    .catch((error) => {
      console.error('Error in authentication >>> ', error)
      res.status(401)
      res.json('Error in authentication >>> ', error)
    })
})

app.post('/postForm', upload.single('image'), async (req, res) => {
  console.log('req.body >>>>> ', req.body) // can log
  console.log('req.file >>>>> ', req.file) // can log

  const formUsername = req.body.username
  const formPassword = sha1(req.body.password)

  await getAuthentication([formUsername, formPassword])
    .then((result) => {
      console.log('result >>> ', result)
      let sqlUsername = result[0].user_id
      let sqlPassword = result[0].password

      // authenticate form user + pw again with database
      if (formUsername == sqlUsername && formPassword == sqlPassword) {
        // console.log("YABADABADOO!!")

        // read the file and upload to S3
        fs.readFile(req.file.path, (err, imageFile) => {
          if (err) {
            console.error('>>>>> ERROR in reading image file', err)
          }

          // set the params
          const params = {
            // 1st 3 are required by AWS
            Bucket: process.env.AWS_S3_BUCKETNAME,
            Key: req.file.filename,
            Body: imageFile, // from paramenters, the actual file, buffer type
            ACL: 'public-read',
            ContentType: req.file.mimetype,
            ContentLength: req.file.size,
            Metadata: {
              originalName: req.file.originalname,
              author: 'paddlepop',
            },
          }

          const doc = mkImage(req.body, req.file.filename)

          // req.file >>>>>  {
          // 	fieldname: 'image',
          // 	originalname: 'blob',
          // 	encoding: '7bit',
          // 	mimetype: 'image/jpeg',
          // 	destination: './imagetemp ',
          // 	filename: '0e0c40fb46bb7fda7cccfff9734aa412',
          // 	path: 'imagetemp /0e0c40fb46bb7fda7cccfff9734aa412',
          // 	size: 255962
          // }

          // function to upload image to S3
          s3.putObject(params, (error, result) => {
            if (error) {
              console.error('ERROR in uploading image to S3 >>>>> ', error)
              res.status(500)
              res.json('ERROR in uploading image to S3 >>> ', error)
            }
            console.log('result of upload to S3 >>>>> ', result)

            // insert document into mongo
            mongoClient
              .db(DATABASE)
              .collection(COLLECTION)
              .insertOne(doc)
              .then((result) => {
                // console.log('insert document to mongoDB ---> ', result) // can log
                res.status(200)
                res.type('application/json')
                res.send({
                  Message: 'inserted document to MongoDB',
                })
              })
              .catch((error) => {
                console.error(
                  'ERROR inserting document to MongoDB >>>>> ',
                  error
                )
                res.status(500)
                res.json({ Error: error })
              })
            // delete all temporary files
            res.on('finish', () => {
              console.info('response ended. temp images deleted')

              // delete the temp image files
              fs.unlink(req.file.path, () => {
                console.info('temp images are DESTROYED')
              })
            })
          })
        })
      } else {
        res.status(401)
        res.end()
      }
    })
    .catch((error) => {
      console.error('Error in authentication >>> ', error)
      res.status(401)
      res.end()
    })
})

let p0 = startApp(app, pool)
let p1 = mongoClient.connect()

Promise.all([p0, p1])
  .then(() => {
    app.listen(PORT, (req, res) => {
      console.info(`Application started on port ${PORT} at ${new Date()}`)
    })
  })
  .catch((error) => {
    console.error('Error in connecting to database >>> ', error)
  })
