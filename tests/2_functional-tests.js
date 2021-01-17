const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadIdToDelete
let replyIdToDelete

suite ('Functional Tests', function() {
  test ('Creating a new thread: POST request to /api/threads/{board}', done => {
    chai.request(server)
      .post('/api/threads/board_test')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        board: 'board_test',
        text: 'Some text.',
        delete_password: 'secret'
      })
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        threadIdToDelete = res.body._id

        done()
      })
  })

  test ('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', done => {
    chai.request(server)
      .get('/api/threads/board_test')
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.isArray(res.body, 'Response should be an Array')
        // assert.equal(res.body.length, 10, 'Response length should be 10')
        assert.isArray(res.body[0].replies, 'replies property of the Response should be an Array')
        // assert.equal(res.body[0].replies.length, 3, 'replies property of Response should be 3 in length')

        done()
      })
  })

  test ('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', done => {
    chai.request(server)
      .delete('/api/threads/board_test?thread_id='+threadIdToDelete+'&delete_password=asdf')
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.equal(res.body, 'incorrect password', 'Response should be "incorrect password"')
        assert.isString(res.body, 'Response should be a String')

        done()
      })
  })

  test ('Reporting a thread: PUT request to /api/threads/{board}', done => {
    chai.request(server)
      .put('/api/threads/board_test?thread_id='+threadIdToDelete)
      .send({
        reported: true
      })
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.isString(res.body, 'Response should be a String')
        assert.equal(res.body, 'success', 'Response should be \'success\'')

        done()
      })
  })

  test ('Creating a new reply: POST request to /api/replies/{board}', done => {
    chai.request(server)
    .post('/api/replies/board_test')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      thread_id: threadIdToDelete,
      text: 'Some test text for a New Reply',
      delete_password: 'secret_reply'
    })
    .end((err, res) => {
      assert.equal(res.status, 200, 'Response should be successful')
      replyIdToDelete = res.body._id
      assert.isObject(res.body, 'Response should be an Object')
      assert.property(res.body, '_id', 'Response should have \'_id\' as a property')
      assert.property(res.body, 'reported', 'Response should have \'reported\' as a property')
      assert.property(res.body, 'created_on', 'Response should have \'bumped_on\' as a property')

      done()
    })
  })

  test ('Viewing a single thread with all replies: GET request to /api/replies/{board}', done => {
    chai.request(server)
      .get('/api/replies/board_test?thread_id='+threadIdToDelete)
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.isObject(res.body, 'Response should be an Object')
        assert.property(res.body, '_id', 'Response should have \'_id\' as a property')
        assert.property(res.body, 'replies', 'Response should have \'replies\' as a property')
        assert.isArray(res.body.replies, 'Response\'s property \'replies\' should be an Array')
        assert.property(res.body.replies[0], '_id', 'Response\'s property \'replies\' should have \'_id\' as a property')
        assert.property(res.body.replies[0], 'reported', 'Response\'s property \'replies\' should have \'reported\' as a property')

        done()
      })
  })

  test ('Deleting a reply with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', done => {
    chai.request(server)
      .delete('/api/replies/board_test?thread_id='+threadIdToDelete+'&reply_id='+replyIdToDelete+'&delete_password=secret_reply_invalid')
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.isString(res.body, 'Response should be a String')
        assert.equal(res.body, 'incorrect password')

        done()
      })
  })

  test ('Reporting a reply: PUT request to /api/replies/{board}', done => {
    chai.request(server)
      .put('/api/replies/board_test?reply_id='+replyIdToDelete)
      .send({
        reported: true
      })
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response shoule be successful')
        assert.isString(res.body, 'Response should be a String')
        assert.equal(res.body, 'success', 'Response should be \'success\'')

        done()
      })
  })

  // DELETE test after updating as to ensure the 'testIdToDelete' variable still represents a Reply record that ain't deleted!
  test ('Deleting a reply with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', done => {
    chai.request(server)
      .delete('/api/replies/board_test?thread_id='+threadIdToDelete+'&reply_id='+replyIdToDelete+'&delete_password=secret_reply')
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.isString(res.body, 'Response should be a String')
        assert.equal(res.body, 'success')

        done()
      })
  })

  /* Writing the test for DELETE method after all other tests, because 'threadIdToDelete' variable contains the Thread Id we need to update and delete,
  both for Thread and Replies: so, once updated/deleted, we can't use the Id for others! Just keeping it clean with a single Id for all the operations! */
  test ('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', done => {
    chai.request(server)
      .delete('/api/threads/board_test?thread_id='+threadIdToDelete+'&delete_password=secret')
      .end((err, res) => {
        assert.equal(res.status, 200, 'Response should be successful')
        assert.equal(res.body, 'success', 'Response body should be \'success\'')
        assert.isString(res.body, 'Response should be a String')
        
        done()
      })
  })
});
