
const mongoose = require('mongoose')

// Authenticating the MongoDB with mongoose.connect
mongoose.connect(process.env.DB, {
  useUnifiedTopology: true,
  useNewUrlParser: true
})

const { Schema } = mongoose

const threadSchema = new Schema({
  boardId: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [Object]
})

const replySchema = new Schema({
  threadId: String,
  text: String,
  created_on: Date,
  delete_password: String,
  reported: Boolean
})

const boardSchema = new Schema({
  name: String
})

const Thread = mongoose.model('Thread', threadSchema)
const Reply = mongoose.model('Reply', replySchema)
const Board = mongoose.model('Board', boardSchema)

exports.Thread = Thread
exports.Reply = Reply
exports.Board = Board
