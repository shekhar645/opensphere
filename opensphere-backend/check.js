require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Post = require('./models/Post');
  const p = await Post.findOne({ 'attachments.0': { $exists: true } });
  console.log(JSON.stringify(p.attachments[0], null, 2));
  process.exit();
});