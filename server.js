const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');  
const cookieParser = require('cookie-parser');
const port = 3000
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req,res,next) => {
    if (req.is('text/*')) {
        req.text = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ req.text += chunk });
        req.on('end', next);
      } else {
        next();
      }
})
app.use(cookieParser());

var jwtSecret = "sJT7Nbn5"
var token = null
var totalWords = 0
var lastLines = []

app.get('/test',(req, res) => {
    res.json({"test":"ok"});
})

app.post('/api/justify', (req, res) => {
    var text = req.text
    text = formatLinesBreaks(text)
    totalWords += text.length
    if(totalWords <= 80000){
        token = req.cookies.token
        if(token !== null){
            var decoded = jwt.verify(token, jwtSecret);  
            if(decoded.email == "foo@bar.com"){
                
                var nbCharacter = 0
                var currentRow = ''
                var arrayText = []
                var arrayWords = text.split(' ')
                var row = 0
                
                for (i in arrayWords){
                    if(currentRow === ''){
                        nbCharacter += arrayWords[i].length 
                    }
                    else{
                        //add space character before this character
                        nbCharacter += arrayWords[i].length + 1
                    }

                    if(nbCharacter > 80){
                        nbCharacter = arrayWords[i].length
                        arrayWords[i] = '--linebreak--' + arrayWords[i]
                        arrayText.push(currentRow)
                        currentRow = arrayWords[i]
                        row ++
                    }
                    else if(arrayWords[i] ===  '-linebreak-'){
                        nbCharacter = 0
                        arrayWords[i] = '--linebreak--'
                        arrayText.push(currentRow)
                        currentRow = arrayWords[i]
                        row ++
                        lastLines.push(row)
                    }
                    else{
                        if(currentRow === ''){
                            currentRow += arrayWords[i]
                        }
                        else{
                            currentRow += ' ' + arrayWords[i] 
                        }
                    }

                    if(parseInt(i)+1 === arrayWords.length){
                        arrayText.push(currentRow)
                    }
                }
                lastLines.push(arrayText.length - 1)
                for (i in arrayText){
                    var arrLength
                    if(parseInt(i) === 0){
                        arrLength = arrayText[i].length
                    }
                    else{
                        // my line length without --linebreak--
                        arrLength = arrayText[i].length - 13
                    }
                    count = 0
                    if(arrLength < 80 && !lastLines.includes(i)){
                        while(arrLength < 80) {
                            arraySplit = arrayText[i].split(' ')
                            arraySplit.splice(getRandomInt(arraySplit.length), 0,  '')
                            arrayText[i] = arraySplit.join(' ') 
                            arrLength ++
                            count ++
                        }
                    }
                    
                }
                formatText = arrayText.join(' ')
                formatText = formatText.replace(/--linebreak--/g, '\n')
                res.send(formatText)
            }
            else{
                res.send(401);
            }
        }
        else{
            res.send(401);
        }
    }
    else{
        res.send(402)
    }
})

app.post('/api/token', (req,res) => {
    token = jwt.sign(req.body, jwtSecret, { expiresIn: '24h' })
    console.log(req.cookies)
    jwt.verify(token, jwtSecret, (err, decode) => {
        if (err) throw new Error(err)
    })
    res.cookie('token', token);
    totalWords = 0
    res.send(token)
})

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})

function formatLinesBreaks(text) {
    text = text.replace('\n\n', ' -linebreak- ')
    text = text.replace('\n', '')
    return text
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }