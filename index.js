require('dotenv').config();
var bodyParser = require("body-parser");
let mongoose=require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  short: { type: Number, required: true }
})

let shortLink = mongoose.model("Shortlink", urlSchema);

const createAndSaveLink = (url, count,done) => {
  var link = new shortLink({
    url: url,
    short: count,
  });

  link.save(function(err, data) {
    if (err) return console.error(err);
    //done(null, data)
  });
};


function findUrl(url, done) {
  shortLink.find({url: url}, (err,data)=>{
    if (err) return console.error(err);
    done(null, data)
  })
};

app.get('/api/hello2', function(req, res) {
  createAndSaveLink("www.test.com", 1)
  res.json({ greeting: 'hello API' });
});


const lookupdns = (url, done)=>{
  dns.lookup(url, (err, address, family) => {
    //if (err) return console.error(err);
    if (err) {
      done(null, { error: 'invalid url' });
    }
    else{
      done(null, address)
    }
  });
}

const stripUrl = (url, done)=>{
  const hostname = url
  .replace(/http[s]?\:\/\//, '')
  .replace(/\/(.+)?/, '');
  done(null, hostname)
}

app.post("/api/shorturl", function(req, res) {
  // Handle the data in the request
  var string = req.body.url;
  //console.log(string)
  //strip url of http etc
  stripUrl(string, function (err,data){
    let url2=data
    //console.log(url2)
    //check if url valid
    lookupdns(url2, function (err, data){
      //console.log(data)
      if (data.error){
        res.json(data)
      }
      else{
        //check if url in mongodb
        findUrl(url2, function (err, data){
        //console.log(data)
        if (data.length){
          //if it is return shorturl
          //res.json({original_url: data[0].url, short_url: data[0].short})
          let short_out=parseInt(data[0].short)
          res.json({original_url: string, short_url: short_out})
        }
        else{
          //if not find count of db values
          //add url and count+1
          shortLink.countDocuments('', (err,data)=>{
            linkToAdd = data+1
            //createAndSaveLink(url2, linkToAdd)
            createAndSaveLink(string, linkToAdd)
            //res.json({original_url: url2, short_url: linkToAdd})
            res.json({original_url: string, short_url: linkToAdd})
          })
          
        }
        });
      }
  });
  })
});

app.get("/api/shorturl/:word", (req, res) => {
  const { word } = parseInt(req.params);
  shortLink.findOne({short: req.params.word}, (err,data)=>{
    if (err) return console.error(err);
    //let resolveUrl = 'https://www.'+data[0].url
    console.log(data)
    if (data){
      console.log(data)
      //let resolveUrl = 'https://www.'+data[0].url
      let resolveUrl = data.url
      res.redirect(resolveUrl);
    }
    else{
      res.json({
       error: 'invalid url' 
    });
    }
    
    //res.json({
    //  echo: data[0].url
    //});
  }) 
});