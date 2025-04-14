require('dotenv').config(); // load env
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");


const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: ['https://stud-mu.vercel.app'],
  methods: ['GET', 'POST', 'PUT'],
  credentials: true,
}));

app.use(express.json());


const storage = multer.memoryStorage(); 
const upload = multer({ storage });

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

const UserSchema = new mongoose.Schema({
  name: String,
  course: String,
  year: String,
  comment:Array,
  like:Number,
  dislike:Number,
  photo: {
    data: Buffer,
    contentType: String,
  },
});

const User = mongoose.model("user", UserSchema);


app.post("/register", upload.single("photo"), async (req, res) => {
  const { name, course, year, like, dislike, comment } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "Image is required" });

  try {
    const newUser = new User({
      name,
      course,
      year,
      like,
      dislike,
      comment,
      photo: {
        data: file.buffer,
        contentType: file.mimetype,
      },
    });

    await newUser.save();
    return res.status(200).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" }); 
  }
});

app.get('/', async (req, res) => {
  const users = await User.find({
  _id: { $nin: ['67fa73fbbbce95054022cbfb', '67fb4de44ed66eed0e0afe18', '67fc914a758da5dfecd32b6e'] }
});
  const usersWithBase64Photo = users.map(user => {
    const base64 = user.photo?.data?.toString('base64');
    const mime = user.photo?.contentType;
    return {
      _id: user._id,
      name: user.name,
      course: user.course,
      year: user.year,
      like: user.like,
      dislike: user.dislike,
      comment:user.comment,
      photo: `data:${mime};base64,${base64}`
    };
  });
  const shuffledUsers = usersWithBase64Photo.sort(() => Math.random() - 0.5);

    res.json(shuffledUsers);
});

// app.get('/', async (req, res) => {
//   const users = await User.find({}, '-photo'); // no base64 image
//   res.json(users);
// });



app.put('/', async (req, res)=>{

  if(req.body.comm)
  try {
    await User.updateOne(
      { _id: req.body.id },
      { $push: { comment: req.body.comm } }
    );
    res.send("Comment added");
  } catch (err) {
    res.status(500).send(err);
  }

  if('likes' in req.body){
    await User.updateOne({_id: req.body.id},  { $inc: { like: 1 } })
    res.send('like added')
  }

})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
