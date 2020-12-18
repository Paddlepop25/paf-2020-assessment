const morgan = require('morgan')
const express = require('express')

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const app = express()

app.use(morgan('combined'))

// test homepage
// app.get('/', (req, res) => {
//   res.status(200)
//   res.json({ Hello: 'Kitty' })
// })

app.listen(PORT, () => {
  console.info(`Application started on port ${PORT} at ${new Date()}`)
})
