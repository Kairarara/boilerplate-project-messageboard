/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
let MongoClient=require('mongodb').MongoClient;
let ObjectId=require('mongodb').ObjectId
const MONGO_URL=process.env.DB;

let threads=[];

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    /*
      I can POST a thread to a specific message board by passing form data text and delete_password to /api/threads/{board}.
      (Recomend res.redirect to board page /b/{board}) Saved will be _id, text, created_on(date&time), bumped_on(date&time, starts same as created_on),
      reported(boolean), delete_password, & replies(array).
    */
    .post((req,res)=>{
      if(req.params.board&&req.body.hasOwnProperty('text')&&req.body.hasOwnProperty('delete_password')){
        MongoClient.connect(MONGO_URL,{useNewUrlParser: true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards')
          db.collection(req.params.board).insertOne({
            text:req.body.text,
            created_on:new Date(),
            bumped_on:new Date(),
            reported:false,
            delete_password:req.body.delete_password,
            replies:[]
          },  (err,result)=>{
            if(err) throw err;
            res.redirect('/b/'+req.params.board+'/');
            client.close();
          })
        })
      } else {
        res.send("missing thread field")
      }
  })
  
  /*
    I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies from /api/threads/{board}.
    The reported and delete_passwords fields will not be sent.
  */
    .get((req,res)=>{
      if(req.params.board){
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards');
          db.collection(req.params.board)
            .find({},{_id:0, delete_password:0, replies:{slice:-5}})
            .sort({bumped_on:-1})
            .limit(10)
            .toArray((err,result)=>{
              result.forEach((ele)=>{
                ele.replies=ele.replies.slice(-3);
                delete ele.delete_password;
                delete ele.reported;
                ele.replies.forEach((reply)=>{
                  delete reply.delete_password;
                  delete reply.reported;
                })
              })
              res.json(result)
              client.close()
          });
        })
      } else {
        res.send("failed GET, request has no property board")
      }
  })
  
  /*
    I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the thread_id & delete_password.
    (Text response will be 'incorrect password' or 'success')
  */
    .delete((req,res)=>{
      if(req.body.hasOwnProperty('thread_id')&&req.body.hasOwnProperty("delete_password")){
        let thread_id=req.body.thread_id;
        let delete_password=req.body.delete_password;
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards');
          db.collection(req.params.board).deleteOne({_id: ObjectId(thread_id), delete_password:delete_password},(err,response)=>{
            if(err) throw err;
            if(response.deletedCount){
              res.send("success")
            } else {
              res.send("incorrect password")
            }
            client.close()
          })
        })
      } else {
        res.send("invalid DELETE request")
      }
  })
  
  /*
    I can report a thread and change it's reported value to true by sending a PUT request to /api/threads/{board} and pass along the thread_id. 
    (Text response will be 'success')
  */
    .put((req,res)=>{
      if(req.params.board&&req.body.thread_id.length===24){
        let thread_id=req.body.thread_id;
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards');
          db.collection(req.params.board).updateOne({_id:ObjectId(thread_id)}, {$set:{reported:true}}, (err,response)=>{
            if(err) throw err;
            if(response.result.ok){
              res.send("success")
            } else{
              res.send('Failed to report thread')
            }
            client.close();
          })
        })
      } else {
        res.send('invalid PUT request')
      }
  });
  
  
  
  app.route('/api/replies/:board')
  /*
    I can POST a reply to a thead on a specific board by passing form data text, delete_password, & thread_id to /api/replies/{board} and it will
    also update the bumped_on date to the comments date.(Recomend res.redirect to thread page /b/{board}/{thread_id}) In the thread's 'replies' 
    array will be saved _id, text, created_on, delete_password, & reported.
  */
    .post((req,res)=>{
      if(req.body.hasOwnProperty('text')&&req.body.hasOwnProperty('delete_password')&&req.body.thread_id.length==24){
        let reply={
          _id: new ObjectId(),
          text: req.body.text,
          created_on: new Date(),
          delete_password: req.body.delete_password,
          reported: false
        };
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards');
          db.collection(req.params.board)
            .updateOne({_id:ObjectId(req.body.thread_id)},{$push:{replies: reply}, $set:{bumped_on: new Date()}},(err,result)=>{
              if(err) throw err;
              res.redirect('/b/'+req.params.board+'/'+req.body.thread_id)
              client.close()
          })
        })
      } else {
        res.send("missing reply field")
      }
  })
  
  /*
    I can GET an entire thread with all it's replies from /api/replies/{board}?thread_id={thread_id}. Also hiding the same fields.
  */
    .get((req,res)=>{
      if(req.params.board&&(req.query.thread_id.length==24)){
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards')
          let board=req.params.board;
          let thread_id=req.query.thread_id;
          db.collection(board).findOne({_id:ObjectId(thread_id)},(err,result)=>{
            if(err) throw err;
            delete result.delete_password;
            delete result.reported;
            result.replies.forEach((ele)=>{
              delete ele.delete_password;
              delete ele.reported;
            })
            res.json(result)
            client.close();
          })
        })
      } else {
        res.send("could not GET thread")
      }
      
  })
  
  /*
    I can delete a post(just changing the text to '[deleted]') if I send a DELETE request to /api/replies/{board} and pass along the thread_id,
    reply_id, & delete_password. (Text response will be 'incorrect password' or 'success')
  */
    .delete((req,res)=>{
      if(req.body.thread_id.length===24&&req.body.reply_id.length===24&&req.body.hasOwnProperty("delete_password")){
        let thread_id=req.body.thread_id;
        let reply_id=req.body.reply_id;
        let delete_password=req.body.delete_password;
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards');
          db.collection(req.params.board).findOneAndUpdate({_id: ObjectId(thread_id)},
                                                    {$set: {"replies.$[ele].text": "[deleted]"}},
                                                    {arrayFilters: [{"ele._id":ObjectId(reply_id), "ele.delete_password":delete_password}],
                                                     returnNewDocument: true,
                                                     projection:{replies:{
                                                       "$elemMatch": { "_id" : ObjectId(reply_id)}
                                                     }}
                                                    },
                                                    (err,response)=>{
            if(err) throw err;
            if(response.ok&&response.value.replies[0].delete_password===delete_password){
              res.send("success")
            } else {
              res.send("incorrect password")
            }
            client.close()
          })
        })
      } else {
        res.send("invalid DELETE request")
      }
  })
  
  /*
    I can report a reply and change it's reported value to true by sending a PUT request to /api/replies/{board} and pass along the thread_id 
    & reply_id. (Text response will be 'success')
  */
    .put((req,res)=>{
      if(req.body.thread_id.length===24&&req.body.reply_id.length===24){
        let thread_id=req.body.thread_id;
        let reply_id=req.body.reply_id;
        
        MongoClient.connect(MONGO_URL,{useNewUrlParser:true},(err,client)=>{
          if(err) throw err;
          const db=client.db('boards');
          db.collection(req.params.board).updateOne({_id: ObjectId(thread_id)},
                                                    {$set: {"replies.$[id].reported": true}},
                                                    {arrayFilters: [{"id._id":ObjectId(reply_id)}]},
                                                    (err,response)=>{
            if(err) throw err;
            if(response.result.ok){
              res.send("success")
            } else {
              res.send("Failed to report thread")
            }
            client.close()
          })
        })
      } else {
        res.send("invalid DELETE request")
      }
  });

};
