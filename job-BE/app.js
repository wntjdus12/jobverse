const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const indexRouter = require("./routes/index")

const app = express();

app.use(cors({
  origin: "http://3.39.202.109:5173", // React 개발 주소
  credentials: true,
}));

app.use(express.json()); 
app.use("/api", indexRouter);

const mongoURI = 'mongodb://admin:admin123@3.39.202.109:27017/job?authSource=admin'

mongoose.connect(mongoURI, {
  useUnifiedTopology: true
})
.then(() => {
  console.log(' mongoose connected');
})
.catch((err) => {
  console.error(' DB connection fail', err);
});

app.listen(5000, () => {
  console.log("create user controller will be here");
});
