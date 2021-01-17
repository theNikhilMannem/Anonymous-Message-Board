'use strict';

const Thread = require('../models.js').Thread
const Reply = require('../models.js').Reply
const Board = require('../models.js').Board

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post((req, res) => {
      const { text, delete_password } = req.body
      const board = req.params.board
      console.log(text, delete_password, board)
      
      if (board) {
        console.log('The POST request to /api/threads/:board contains \'board\', and other \'req.body\' data:', board, text, delete_password)

        Board.findOne({ name: board }, (err, boardFound_first) => {
          if (err || !boardFound_first) {
            console.log('Board record not found!!')
            console.log('Creating a new board ...')
            const newBoard = new Board({
              name: board
            })
            console.log('Saving the board...')
            newBoard.save((err, boardSaved) => {
              if (err || !boardSaved) {
                console.log('Board record could not be saved: Probable Error below:\n')
                res.end()
              }
              else {
                console.log('Board record saved!!')
                console.log('Creating a new thread to the board ...')
                const thread = new Thread({
                  boardId: boardSaved._id,
                  text: text,
                  created_on: new Date(),
                  bumped_on: new Date(),
                  reported: false,
                  delete_password: delete_password
                })
                console.log('Saving the Thread record...')
                thread.save((err, threadSaved) => {
                  if (err || !threadSaved) {
                    console.log('New thread can\'t be created: Probable problem with MongooseJS or MongoDB Validation!\nError below:\n', err, threadSaved)
                    res.end()
                  }
                  else {
                    console.log('New thread saved!!')
                    res.json(threadSaved)
                    /*
                    {
                      "replies": threadSaved.replies,
                      "_id": threadSaved._id,
                      "boardId": threadSaved.boardId,
                      "text": threadSaved.text,
                      "created_on": threadSaved.created_on,
                      "bumped_on": threadSaved.bumped_on,
                      "reported": threadSaved.reported,
                      "delete_password": threadSaved.delete_password
                    }
                    */
                  }
                })
              }
            })
          }
          else {
            console.log('Board record found!!')
            console.log('Creating a new thread to the board ...')
            const thread = new Thread({
              boardId: boardFound_first._id,
              text: text,
              created_on: new Date(),
              bumped_on: new Date(),
              reported: false,
              delete_password: delete_password
            })
            console.log('Saving the Thread record...')
            thread.save((err, threadSaved) => {
              if (err || !threadSaved) {
                console.log('New thread can\'t be created: Probable problem with MongooseJS or MongoDB Validation!\nError below:\n', err, threadSaved)
                res.end()
              }
              else {
                console.log('New thread saved!!')
                res.json(threadSaved)
                /*
                {
                  "replies": threadSaved.replies,
                  "_id": threadSaved._id,
                  "boardId": threadSaved.boardId,
                  "text": threadSaved.text,
                  "created_on": threadSaved.created_on,
                  "bumped_on": threadSaved.bumped_on,
                  "reported": threadSaved.reported,
                  "delete_password": threadSaved.delete_password
                }
                */
              }
            })
          }
        })
      }
      else {
        console.log('The POST request to /api/threads/:board doesn\'t contain \'board\'!')
        res.end()
      }
    })
    .get((req, res) => {
      Board.findOne({ name: req.params.board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('Coudln\'t find the Board record: Probable Error below:\n', err, !boardFound)
        }
        else {
          Thread.find({ boardId: req.params.board._id })
            .sort('bumped_on')
            .limit(10)
            .select('-reported -delete_password')
            .exec((err, threads) => {
              console.log('Searching for the \'Thread\' records...')
              if (err || !threads) {
                console.log('Thread records could not be found: Probable Error below:\n', err, threads)
                res.end('Can\'t find threads!')
              }
              else {
                console.log('Thread records found...', threads)
                console.log('Sorting and Limiting \'thread.replies\' for each \'thread\'...')
                for (let thread of threads) {
                  Reply.find({ threadId: thread._id })
                    .sort('created_on')
                    .limit(3)
                    .exec((err, replies) => {
                      if (err || !replies) {
                        console.log('Couldn\'t sort and limit thread\'s replies: Probable Error below:\n', err, replies)
                      }
                      else {
                        console.log('Replies sorted and limited!!')
                        thread.replies = []
                        thread.replies.push(replies)
                      }
                    })
                }
                res.send(threads)
              }
            })
          }
      })
    })
    .delete((req, res) => {
      console.log(req.query)
      const { thread_id: threadId, delete_password: deletePassword } = req.query
      Board.findOne({ name: req.params.board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('Board record could not be found: Probable Error below:\n', err, boardFound)
          res.end()
        }
        else {
          console.log('Board record found!!')
          console.log('Searching for the Thread record to delete...')
          Thread.findOne({ _id: threadId }, (err, threadFound) => {
            if (err || !threadFound) {
              console.log('Thread record could not be found: Probable Error below:\n', err, threadFound)
              res.status(500).end()
              return
            }
            else {
              console.log('Thread record found!!')
              console.log('Checking if the \'req.query.delete_password\' is the same as the \'threadFound.delete_password\'...')
              if (deletePassword === threadFound.delete_password) {
                console.log('..correct password!')
                threadFound.remove()
                res.json('success')
              }
              else {
                console.log('..incorrect password!')
                res.json('incorrect password')
              }
            }
          })
        }
      })
    })
    .put((req, res) => {
      console.log('Searching for the Board record...')
      Board.findOne({ name: req.params.board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('Board record could not be found: Probable Error below:\n', err, boardFound)
          res.end()
        }
        else {
          console.log('Board record found!!')
          console.log('Searching for the Thread record...')
          Thread.findOne({ _id: req.query.thread_id }, (err, threadFound) => {
            if (err || !threadFound) {
              console.log('Thread record couild not be found: Probable Error below:\n', err, threadFound)
              res.end()
              return
            }
            else {
              console.log('Thread record found!!')
              console.log('Updating the Thread record\'s \'reported\' value to \'true\'...')
              threadFound.reported = true
              console.log('Saving the Thread record...')
              threadFound.save((err, threadFound_UpdatedSaved) => {
                if (err || !threadFound_UpdatedSaved) {
                  console.log('Thread record could not be saved: Probable Error below:\n', err, threadFound_UpdatedSaved)
                  res.end()
                  return
                }
                else {
                  console.log('Thread record saved!!')
                  res.json('success')
                }
              })
            }
          })
        }
      })
    })
    
  app.route('/api/replies/:board')
    .post((req, res) => {
      const { thread_id, text, delete_password } = req.body
      const board = req.params.board
      console.log(thread_id, text, delete_password, board)

      console.log('Checking if a \'Board\' record with the name \''+ board +'\' exists..')
      Board.findOne({ name: board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('...Nope!! No Board record found for that name: Probable Error below:\n', err, boardFound)
          res.end()
        }
        else {
          console.log('...Board record found!!')
          console.log('Now, checking for the \'Thread\' record with the given \'thread_id\'...')
          Thread.findOne({ _id: thread_id, boardId: boardFound._id }, (err, threadFound) => {
            if (err || !threadFound) {
              console.log('...Nope!! No Thread record found for that id: Probable Error below:\n', err, threadFound)
              res.end()
            }
            else {
              console.log('...Thread record found!!')
              console.log('Updating the Thread record \'bumped_on\' date...')
              threadFound.bumped_on = new Date()
              console.log('Creating a new \'Reply\' record...')
              const reply = new Reply({
                threadId: threadFound._id,
                text: text,
                created_on: new Date(),
                delete_password: delete_password,
                reported: false
              })
              console.log('...\'Reply\' record created!')
              console.log('Saving the \'Reply\' record...')
              reply.save((err, replySaved) => {
                if (err || !replySaved) {
                  console.log('Nope!! \'Reply\' record could not be saved: Probable Error below:\n', err, replySaved)
                  res.end()
                }
                else {
                  console.log('Yoo!! \'Reply\' record saved!!')
                  console.log('Now, adding the \'Reply\' record to the \'thread.replies\' list...')
                  threadFound.replies.push(replySaved)
                  console.log('...Added!!')
                  console.log('Well, let\'s go save the \'Thread\' record, now...')
                  threadFound.save((err, threadFound_Saved) => {
                    if (err || !threadFound_Saved) {
                      console.log('Nope!! Can\'t save the \'Thread\' record: Probable Error below:\n', err, threadFound_Saved)
                      res.end()
                    }
                    else {
                      console.log('Yeah!!! \'Thread\' record saved!!')
                      res.json(replySaved)
                    }
                  })
                }
              })
            }
          })
        }
      })
    })
    .get((req, res) => {
      console.log('Searching for Board record...')
      Board.findOne({ name: req.params.board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('Board record could not be found: Probable Error below:\n', err, boardFound)
          res.end()
          return
        }
        else {
          console.log('Board record found!!')
          console.log('Searching for Thread record...')
          Thread.findOne({ _id: req.query.thread_id }, (err, threadFound) => {
            if (err || !threadFound) {
              console.log('Thread record could not be found: Probable Error below:\n', err, boardFound)
              res.end()
              return
            }
            else {
              console.log('Thread record found!!')
            }
          })
          .select('-reported -delete_password')
          .exec((err, threadExec) => {
            res.json(threadExec)
          })
        }
      })
    })
    .delete((req, res) => {
      console.log('Searching for the Board record...')
      Board.findOne({ name: req.params.board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('Board record could not be found: Probable Error below:\n', err, boardFound)
          res.end()
        }
        else {
          console.log('Board record found')
          console.log('Searching for the Thread record...')
          Thread.findOne({ _id: req.query.thread_id }, (err, threadFound) => {
            if (err || !threadFound) {
              console.log('Thread record could not be found: Probable Error below:\n', err, threadFound)
              res.end()
            }
            else {
              console.log('Thread record found!!')
              console.log('Searching for the Reply record...')
              Reply.findOne({ _id: req.query.reply_id }, (err, replyFound) => {
                if (err || !replyFound) {
                  console.log('Reply record could not be found: Probable Error below:\n', err, replyFound)
                  res.end()
                }
                else {
                  console.log('Reply record found!!')
                  console.log(req.query.deletePassword, replyFound.delete_password)
                  if (req.query.delete_password === replyFound.delete_password) {
                    replyFound.remove()
                    // replyFound.text = '[deleted]'
                    res.json('success')
                  }
                  else {
                    res.json('incorrect password')
                  }
                }
              })
            }
          })
        }
      })
    })
    .put((req, res) => {
      console.log('Searching for the Board record...')
      Board.findOne({ name: req.params.board }, (err, boardFound) => {
        if (err || !boardFound) {
          console.log('Board record could not be found: Probable Error below:\n', err, boardFound)
          res.end()
        }
        else {
          console.log('Board record found!!')
          console.log('Searching for the Reply record...')
          console.log(req.query)
          Reply.findOne({ _id: req.query.reply_id }, (err, replyFound) => {
            if (err || !replyFound) {
              console.log('Reply record could not be found: Probable Error below:\n', err, replyFound)
              res.end()
              return
            }
            else {
              console.log('Reply record found!!')
              console.log('Updating the Reply record\'s \'reported\' value to \'true\'...')
              replyFound.reported = true
              console.log('Saving the Reply record...')
              replyFound.save((err, replyFound_UpdatedSaved) => {
                if (err || !replyFound_UpdatedSaved) {
                  console.log('Reply record could not be saved: Probable Error below:\n', err, replyFound_UpdatedSaved)
                  res.end()
                  return
                }
                else {
                  console.log('Reply record saved!!')
                  res.json('success')
                }
              })
            }
          })
        }
      })
    })
};
