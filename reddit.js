var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

/*
All the functions of our API require a database connection. Instead of establishing the 
database connection inside the reddit.js file, we choose to keep it pure: we pass the 
connection to the function, and it returns to us the actual API.
*/
module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {

      // first we have to hash the password...
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          //we pass the conn.query function an array of the strings that should replace the ?s, and it puts the query together for us.
          conn.query(
            'INSERT INTO users (username, password, createdAt) VALUES (?, ?, ?)', [user.username, hashedPassword, new Date()],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                      callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    
    
    createPost: function(post, subredditId, callback) {
      conn.query(
        'INSERT INTO posts (userId, title, url, createdAt, subredditId) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, new Date(), subredditId],
        function(err, result) {
          //console.log("HELLO", result);
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id,title,url,userId, createdAt, updatedAt, subredditId FROM posts WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    
    
    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      //making alias for createdAt and UpdatedAt since we cannot have two same name with different values inside an object
      
      conn.query(`
        SELECT p.id as postId, p.title, p.url, p.createdAt as postCreatedAt, p.updatedAt as postUpdatedAt, 
               u.id as usernameId, u.username, u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt, 
               s.id as subredditId, s.name as subredditName, s.description as subredditDescription, s.createdAt as subredditCreatedAt, s.updatedAt as subredditUpdatedAt,
               sum(v.vote) as voteScore
        FROM posts as p
        JOIN users as u ON u.id = p.userId
        JOIN subreddits as s ON s.id = p.subredditId
        JOIN votes as v ON p.id = v.postId
        GROUP BY postId
        ORDER BY postCreatedAt DESC
        LIMIT ? OFFSET ?`, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            //console.log("BYE", results);

            var formatedResults = results.map(function(obj) {
              //console.log("JAPAN", obj.title);
              var formatedObj = {};
              return {
                id: obj.postId,
                title: obj.title,
                url: obj.url,
                createdAt: obj.postCreatedAt,
                updatedAt: obj.postUpdatedAt,
                userId: obj.userId,
                user: {
                  id: obj.usernameId,
                  username: obj.username,
                  createdAt: obj.userCreatedAt,
                  updatedAt: obj.userUpdatedAt
                },
                subreddit: {
                  id: obj.subredditId,
                  name: obj.subredditName,
                  description: obj.subredditDescription,
                  createdAt: obj.subredditCreatedAt,
                  updatedAt: obj.subredditUpdatedAt
                },
                votes: obj.voteScore
              };

            });

            callback(null, formatedResults);
          }
        }
      );
    },


    getAllPostsForUser: function(userId, options, callback) {
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      
      conn.query(`
      
        SELECT * FROM posts 
        JOIN users ON users.id = posts.userId
        WHERE users.id = ?
        LIMIT ? OFFSET ?`, [userId, limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, results);
          }
        }
      );

    },


    getSinglePost: function(postId, callback) {
      conn.query(`
        SELECT * FROM posts
        WHERE id = ?`, [postId],
        function(err, results) {
          //console.log("VISA", results)
          if (err) {
            callback(err);
          }
          else {
            callback(null, results[0]);
          }
        }
      );
    },


    createSubreddit: function(sub, callback) {
      conn.query(
        'INSERT INTO subreddits (name, description, createdAt) VALUES (?, ? ,?)', [sub.name, sub.description, new Date()],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            conn.query(
                `SELECT * FROM subreddits WHERE id = ?`, [result.insertId],
                function(err, result) {
                  if (err) {
                    callback(err);
                  }
                  else {
                    callback(null, result);
                  }
                }
            )
          }

        }
      );
    },
    
    
    getAllSubreddits: function(callback) {
      var query = `SELECT * FROM subreddits ORDER BY createdAt DESC`;
      conn.query(query, function (err, result) {
        //console.log(result);
        if (err) {
          callback(err);
        }
        else {
          callback(null, result);
        }
      });
      
    },
    
    
    createComment: function(comment, callback) {
      conn.query(
        `INSERT INTO comments (text, userId, postId, commentId, createdAt) VALUES (?, ?, ?, ?, ?)`, 
        [comment.text, comment.userId, comment.postId, comment.commentId, new Date()],
        function (err, result) {
          //console.log('SATURN', result);
          if (err) {
            callback(err);
          }
          else {
            conn.query(
              `SELECT * FROM comments WHERE id = ?`, [result.insertId],
              function(err, result) {
                //console.log('SATURN', result);
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        });
      
    },
    
    
    getCommentsForPost: function(postId, callback) {
      
      conn.query(`
         SELECT c.text, c.id, c.commentId FROM comments AS c
         JOIN posts AS p ON p.id = c.postId
         LEFT JOIN comments ON c.id = c.commentId
         WHERE c.postId = ?
         ORDER BY c.createdAt`, [postId],
         
         function(err, result) {
           //console.log(result, "THIS IS IT");
           if(err) {
             callback(err);
           }
           else {
             
             var data = {};

             result.forEach(function(grandParent){
               if(grandParent.commentId === null){
                 var grandParentObj = {
                   id: grandParent.id,
                   text: grandParent.text,
                   replies: []
                 };
                 
                 result.forEach(function(parent) {
                     if(parent.commentId === grandParent.id){
                       var parentObj = {
                         id: parent.id,
                         text: parent.text,
                         replies: []
                       };
                      data[grandParent.id] = grandParentObj;
                       data[grandParent.id].replies.push(parentObj);
                         result.forEach(function(child){
                        if(child.commentId === parent.id){
                          var childObj ={
                            id: child.id,
                            text: child.text,
                            replies: []
                          };
                          data[grandParent.id].replies.forEach(function(insideParent){
                            if(insideParent.id === child.commentId){
                              insideParent.replies.push(childObj)
                            }
                          });
                        }
                      });
                       
                     } 
                     else {
                        data[grandParent.id] = grandParentObj;
                     }
                 });
                 

               }
             });
             callback(null, data);
           }
         }
          
      );
      
    },
    
    
    getCommentsForPostRecursive: function(postId, callback) {
      function getComments(postId, parentIds, allComments, commentIdx, callback){
  
  var query;
  
  if(parentIds){
      if(parentIds.length === 0){
    callback(null, allComments);
    return;
  }
    query = `
          SELECT c.text, c.id, c.commentId FROM comments AS c
         WHERE c.postId = ${postId} AND c.commentId IN (${parentIds.join(',')})
         ORDER BY c.createdAt
    `;
  } else {
    query = `
      SELECT c.text, c.id, c.commentId FROM comments AS c
         WHERE c.postId = ${postId} AND c.commentId IS NULL
         ORDER BY c.createdAt
    `;
  }
  
  conn.query(query, function(err, res){
    var parentKeys = [];
    res.forEach(function(comment){
      if(commentIdx[comment.commentId]){
        commentIdx[comment.commentId].replies.push(comment);
      }

      parentKeys.push(comment.id);
      comment.replies = [];
      commentIdx[comment.id] = comment;
      if(comment.commentId === null) {
             allComments.push(comment);
      }
    })
     getComments(postId, parentKeys, allComments, commentIdx, callback);
  })
       
}     
      getComments(postId, null, [], {}, callback);
    },
    
    
    createOrUpdateVote: function(vote, callback) {
      
      if (vote.vote === -1 || vote.vote === 0 || vote.vote === 1) {
      
        conn.query(`
          INSERT INTO votes (postId, userId, vote, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) 
          ON DUPLICATE KEY UPDATE vote = ?`,
          [vote.postId, vote.userId, vote.vote, new Date(), new Date(), vote.vote],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            //console.log("GOOD VOTE!");
            
            conn.query(
            `SELECT * FROM votes`
            ,function(err, result) {
              if (err) {
                callback(err);
              }
              else {
                callback(null, result);
              }
            }
            );
            
          }
          
        });
        
      }
      
      //if the vote is not -1.0, or 1
      else {
        callback(null, 'vote properly');
      }
      
      
    },
    
    
    getFivePosts: function(userId, callback) {
      conn.query(
        `SELECT p.title, p.url, p.userId, u.username, p.createdAt FROM posts AS p
         JOIN users AS u ON u.id = p.userId
         WHERE userId=?
         ORDER BY p.createdAt DESC
         LIMIT 5`
         ,[userId]
      ,function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, result);
        }
      });
    },


    createPostUsingExpress: function(urlAndTitle, callback) {
      conn.query(
        `INSERT INTO posts (title, url, userId) VALUES (?, ?, ?)`, [urlAndTitle.title, urlAndTitle.url, 5],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
              conn.query(
                'SELECT title, url, userId FROM posts WHERE id = ?', [result.insertId],
                function(err, result) {
                  if (err) {
                    callback(err);
                  }
                  else {
                    callback(null, result[0]);
                  }
                }
              );
      
          }
    
        });
      }
  }
}

