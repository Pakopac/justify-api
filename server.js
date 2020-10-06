const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');  
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000

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
var lastLines = []
var email = null

app.post('/api/justify', (req, res) => {
    var idToken = `${email}-token`
    var idTotalWords = `${email}-totalWords`
    var text = req.text
    text = formatLinesBreaks(text)
    var incrementWords = parseInt(req.cookies[idTotalWords]) + parseInt(text.length)
    res.cookie(idTotalWords, incrementWords)

    if(req.cookies[idTotalWords] <= 80000){
        token = req.cookies[idToken]
        if(token !== null){
            jwt.verify(token, jwtSecret, function(err, decoded) {
                if (err) {res.send(401, 'token is expired, please reconnect');}
                var nbCharacter = 0
                var currentRow = ''
                var arrayText = []
                var arrayWords = text.split(' ')
                var row = 0
                
                for (i in arrayWords){
                    if(currentRow === ''){
                        //add word length without space (first word per lines)
                        nbCharacter += arrayWords[i].length 
                    }
                    else{
                        //add word length with space character before
                        nbCharacter += arrayWords[i].length + 1
                    }

                    if(nbCharacter > 80){
                        nbCharacter = arrayWords[i].length
                        // here set --linebreak-- instead of \n because it's iterpreting in array 
                        arrayWords[i] = '--linebreak--' + arrayWords[i]
                        arrayText.push(currentRow)
                        //start next row
                        currentRow = arrayWords[i]
                        row ++
                    }
                    // if there is \n\n in text send: don't wait 80 char
                    else if(arrayWords[i] ===  '-linebreak-'){
                        nbCharacter = 0
                        arrayText.push(currentRow)
                        currentRow = '--linebreak--'
                        row ++
                        lastLines.push(row - 1)
                    }
                    else{
                        //add space before if the word isn't the first word of line
                        if(currentRow === '' || currentRow === '--linebreak--'){
                            currentRow += arrayWords[i]
                        }
                        else{
                            currentRow += ' ' + arrayWords[i] 
                        }
                    }

                    // when line is full push in other array
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
                    // lastLines contains the lines that don't need to be filled with 80 characters  
                    if(arrLength < 80 && !lastLines.includes(parseInt(i))){
                        while(arrLength < 80) {
                            arraySplit = arrayText[i].split(' ')
                            arraySplit.splice(getRandomInt(2, arraySplit.length - 1), 0,  '')
                            arrayText[i] = arraySplit.join(' ') 
                            arrLength ++
                            count ++
                        }
                    }
                    
                }
                    formatText = arrayText.join(' ')
                    formatText = formatText.replace(/--linebreak--/g, '\n')
                    res.send(formatText)
             
            
            })
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
    email = req.body.email
    var idToken = `${email}-token`

    if(typeof req.cookies[idToken] === 'undefined'){
        addToken(req,res)
    }
    else{
        jwt.verify(req.cookies[idToken], jwtSecret, function(err, decoded) {
            if (err) {
                addToken(req,res)
            }
            else{
                res.send(req.cookies[idToken])
            }
        })
    }
})

app.listen(port, () => {
  console.log(`app listening`)
})

function formatLinesBreaks(text) {
    text = text.replace('\n\n', ' -linebreak- ')
    text = text.replace('\n', '')
    return text
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function addToken(req,res){
    var token = jwt.sign(req.body, jwtSecret, { expiresIn: '24h'})
    res.cookie(`${req.body.email}-token`, token);
    res.cookie(`${req.body.email}-totalWords`, 0);
    res.send(token)
}