
const express = require('express')
const fs = require("fs")
const app = express()
const port = 3000

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/file', (request, response) => {
  let contentTypeHeader = request.headers["content-type"];
  let boundary = `--${contentTypeHeader.split("boundary=")[1]}`;
  let body = [];
  request.on('data', chunk => {
    body.push(chunk)
  });
  request.on('end', function() {
    const multipartData = Buffer.concat(body).toString("binary").split(boundary);
    multipartData.shift()
    multipartData.pop()

    seprateMultipart(multipartData)
    
  })
  response.send("ok")
})

function seprateMultipart(data) {
  return data.map(function(value, index) {
    const regex = /filename=".*"/g
    const fileNameArr = regex.exec(value)

    if(fileNameArr) {
      const pointSperate = /Content-Type:.*[\r\n]+/
      const contentType = pointSperate.exec(value);

      const originalFilename = fileNameArr[0].split("=")[1].replace(/"/g, "")
      const nameContent = /\sname=".*";/.exec(value)
      const path = `./upload/${Date.now()}_${originalFilename}`
      const data = value.split(pointSperate)[1].trim()
      const fileStream = fs.createWriteStream(path)
      fileStream.write(Buffer.from(data, "binary"))

      return {
        originalFilename,
        path,
        contentType: contentType ? contentType[0].split(":")[1].trim() : "",
        name: nameContent ? nameContent[0].split("=")[1].replace(/"|;/g, "") : ""
      };
    }

    const pointSperate = /\sname=".*"[\r\n]+/
    const nameContent = pointSperate.exec(value)
    const name = nameContent ? nameContent[0].split("=")[1].replace(/"|;/g, "").trim() : `field${index}`
    return {
      [name]: value.split(pointSperate)[1].trim()
    }
  })
}


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})