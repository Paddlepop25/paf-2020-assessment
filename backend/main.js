require('dotenv').config()

const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const bodyParser = require('body-parser')
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
const sha1 = require('sha1')
const multer = require('multer')

const upload = multer({ dest: './imagetemp ' }) // select folder

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

// get username and password from SQL
// const SQL_QUERY_ALL = `SELECT * FROM user where user_id=? and password=?`
// const getAuthentication = makeSQLQuery(SQL_QUERY_ALL, pool)

// app.get('/sql/:username/:password', (req, res) => {
//   await getAuthentication([])
//     .then((results) => {
//       // console.info(results[0])
//       res.status(200).json(results)
//     })
//     .catch((error) => {
//       console.error('Error in reading from SQL >>> ', error)
//       res.status(500).end()
//     })
// })

const SQL_QUERY_ALL = `SELECT * FROM user where user_id=? and password=?`
const getAuthentication = makeSQLQuery(SQL_QUERY_ALL, pool)

app.post('/', async (req, res) => {
  // console.log(req.body) // { username: 'afsd', password: '22' }
  let username = req.body['username'] // { username: 'afsd', password: '22' }
  let password = sha1(req.body['password']) // { username: 'afsd', password: '22' }

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

app.post('/postForm', upload.single('image'), (req, res) => {
  console.log('req.body >>>>> ', req.body) // can log
  console.log('req.file >>>>> ', req.file) // can log

  // authenticate user again with the pw
})

let p0 = startApp(app, pool)

Promise.all([p0])
  .then(() => {
    app.listen(PORT, (req, res) => {
      console.info(`Application started on port ${PORT} at ${new Date()}`)
    })
  })
  .catch((error) => {
    console.error('Error in connecting to database >>> ', error)
  })
