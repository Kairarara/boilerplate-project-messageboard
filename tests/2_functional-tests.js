/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let reply={
    text: "reply test",
    delete_password: "delete"
  }
  
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    const thread={
      text: 'this is a test',
      delete_password: 'password'
    }
    
    suite('POST', function() {
      
      test("POST",(done)=>{
        chai.request(server)
          .post('/api/threads/tests')
          .send({text:thread.text,delete_password:thread.delete_password})
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert.equal(res.req.path,"/b/tests/");
            done();
        });
      })
      
    });
    
    suite('GET', function() {
      
      test("GET",(done)=>{
        chai.request(server)
          .get("/api/threads/tests")
          .send({})
          .end((err,res)=>{
            assert.equal(res.status,200)
            assert.isArray(res.body)
            assert.equal(res.body[0].text,thread.text)
            assert.notExists(res.body[0].reported)
            assert.notExists(res.body[0].delete_password)
            assert.isArray(res.body[0].replies)
            thread._id=res.body[0]._id;
            reply.thread_id=res.body[1]._id;
            done();
        });
      })
      
    });
    
    
    
    suite('PUT', function() {
      
      test("PUT",(done)=>{
        chai.request(server)
          .put("/api/threads/tests")
          .send({thread_id:thread._id})
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert.equal(res.text,"success");
            done();
        });
      })
      
    });
    
    suite('DELETE', function() {
      
      test("DELETE",(done)=>{
        chai.request(server)
          .delete("/api/threads/tests")
          .send({delete_password:thread.delete_password,thread_id:thread._id})
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert.equal(res.text,"success");
            done();
        });
      })
      
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      //res.redirect('/b/'+req.params.board+'/'+req.body.thread_id)
      test("POST",(done)=>{
        chai.request(server)
          .post("/api/replies/tests")
          .send(reply)
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert.equal(res.req.path,'/b/tests/'+reply.thread_id)
            done();
        });
      })
      
    });
    
    suite('GET', function() {
      
      test("GET",(done)=>{
        chai.request(server)
          .get("/api/replies/tests?thread_id="+reply.thread_id)
          .send()
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert.equal(res.body._id,reply.thread_id);
            assert.notExists(res.body.reported);
            assert.isArray(res.body.replies)
            reply._id=res.body.replies[0]._id
            done();
        });
      })
      
    });
    
    suite('DELETE', function() {
      console.log(reply)
      test("DELETE",(done)=>{
        chai.request(server)
          .delete("/api/replies/tests")
          .send({thread_id:reply.thread_id, reply_id:reply._id, delete_password:reply.delete_password})
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert(res.text,"success");
            done();
        });
      })
    });
    
    suite('PUT', function() {
      
      test("PUT",(done)=>{
        chai.request(server)
          .put("/api/replies/tests")
          .send({thread_id:reply.thread_id, reply_id:reply._id})
          .end((err,res)=>{
            assert.equal(res.status,200);
            assert(res.text,"success");
            done();
        });
      })
    });
    
  });

});

    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
