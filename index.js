// load the mysql library
var mysql = require('mysql');
var util = require("util");

//Connect to the database server with 'mysql-ctl start' before running any function

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'takanarisasaki', // CHANGE THIS :)
  password : '',
  database: 'reddit'	//we haven't created this yet
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);


function createUser () {
	// It's request time!
	redditAPI.createUser({
	  username: 'JohnSmith',
	  password: 'xxx'
	}, function(err, user) {
	  if (err) {
		console.log(err);
	  }
	  else {
		redditAPI.createPost({
		  title: 'hi iphone!',
		  url: 'https://www.iphone.com',
		  userId: user.id
		}, function(err, post) {
		  if (err) {
			console.log('There is an error', err);
		  }
		  else {
			console.log(post);
		  }
		});
	  }
	});

}

//createUser();


function getAllPosts() {
	redditAPI.getAllPosts({}, function(err, posts) {
		if (err) {
			console.log(err);
		}
		else {
			console.log("HELLO", posts);
		}
		
	});
}

//getAllPosts();


function createPost(inputPost, subredditId) {

	redditAPI.createPost(inputPost, subredditId, function(err, post) {
		if (err) {
			console.log(err);
		}
		else {
			console.log("MOON", post);
		}
		
	});
	
}

//createPost({userId: 5, title: 'mew', url: 'www.mew.com'}, 1);


function getAllPostsForUser(inputUserId) {
	redditAPI.getAllPostsForUser(inputUserId, {}, function(err, userPosts) {
		if (err) {
			console.log(err);
		}
		else {
			console.log("SUN", userPosts);
		}
	});
}

//getAllPostsForUser(1);


function getSinglePost(inputPostId) {
	redditAPI.getSinglePost(inputPostId, function(err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log('MERCURY', response);
		}
	});
}

//getSinglePost(1);


function createSubreddit(subredditObj) {

	redditAPI.createSubreddit(subredditObj, function(err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log("MARS", response);
		}
	});

}

//createSubreddit({name: 'Vegeta', description: 'Vegeta is strong!'});


function getAllSubreddits() {
	redditAPI.getAllSubreddits(function (err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(response);
		}
	});
}

//getAllSubreddits();


function createComment(commentObj) {
	redditAPI.createComment(commentObj, function(err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log("JUPITER", response);
		}
	});
}

//createComment({text: 'how much is a pen', userId: 4, postId: 1, commentId: 8});


function getCommentsForPost(postId) {
	
	//can replace getCommentForPost function int
	redditAPI.getCommentsForPost(postId, function(err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(util.inspect(response, {showHidden: true, depth: null, colors: true }));
		}
	});
	
}

//getCommentsForPost(1);


function createVote(inputVoteObj) {
	
	redditAPI.createOrUpdateVote(inputVoteObj, function(err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(response);
		}
		
	});
	
}

//createVote({userId: 4, postId: 5, vote: 1});


function getFivePosts(userId) {
	redditAPI.getFivePosts(userId, function(err, response) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(response);
		}
	});
}

//getFivePosts(5);