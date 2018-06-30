var express = require('express');
var mongoose = require('mongoose');
const path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const methodOverride = require('method-override');
const Grid = require('gridfs-stream');

var app = express(); 

	let adverts;
	let gfs;

//MongoDB initialization
    var mongoURI = 'mongodb://localhost:27017/healthmanagementImages';
    const conn = mongoose.createConnection(mongoURI);
    
    conn.on('connected', () => {
        console.log('Connected to the mongodb database @ 27017');
    }); 
    
    //On error
    conn.on('error', (err) => {
        if (err) {
            console.log('Error connecting to database:' + err); 
        }
    });
//intializing the GridFS storage
    conn.once('open', () => {
        adverts = Grid(conn.db, mongoose.mongo);
        adverts.collection('adverts');
	});
	
	conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('profilePics');
  });

const advertStorage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'adverts'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const advertsUpload = multer({ advertStorage });

  const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'profilePics'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });
  //end of intializing the GridFS storage

//CORS middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/adevrtsUpload', advertsUpload.single('file'), (req, res) => {
  console.log("helloooo");
  res.json({ success: true, msg: "profile pic uploaded successfully", file: req.file });
 
});

app.post('/profilePicUpload', upload.single('file'), (req, res) => {
    console.log("helloooo");
    res.json({ success: true, msg: "profile pic uploaded successfully", file: req.file });
   
});

app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
      if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: 'Not an image'
        });
      }
    });
});

//Server port
const PORT = 4002;

//To start server
app.listen(PORT, () =>{
	console.log(" node server started at port number 4002");
})