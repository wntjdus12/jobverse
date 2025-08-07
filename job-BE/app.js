const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const indexRouter = require("./routes/index");
const path = require("path"); // ✅ 추가

const app = express();

app.use(cors({
  origin: "http://3.39.202.109:5173",
  credentials: true,
}));

app.use(express.json()); 
app.use("/api", indexRouter);

// ✅ 정적 파일 서빙
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const mongoURI = 'mongodb://admin:admin123@3.39.202.109:27017/job?authSource=admin';

mongoose.connect(mongoURI, {
  useUnifiedTopology: true
})
.then(() => {
  console.log('mongoose connected');
})
.catch((err) => {
  console.error('DB connection fail', err);
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
