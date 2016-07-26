var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'takanarisasaki', // CHANGE THIS :)
  password : '',
  database: 'reddit'	//we haven't created this yet
});
// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

app.use(bodyParser.urlencoded({ extended: false }));

//Click on Run to get the URL link

//npm install --global nodemon
//On command line: nodeman express.js (keep it running so that you just have to save to automatically change the server)

//Nodemon is a utility that will monitor for any changes in your source and automatically 
//restart your server. Perfect for development. Install it using npm. Just use nodemon 
//instead of node to run your code, and now your process will automatically restart when 
//your code changes.





//Exercise 1: Create a web server that can listen to requests 

// app.get('/hello', function(request, response) {
// 	response.send('<h1> Hello World! </h1>');
// });


//Just practice
app.get('/buy/water', function(request, response) {
	response.send('<h1> I need to buy water </h1');
});


app.get('/hello', function(request, response) {

	console.log(request.query);
	////https://reddit-nodejs-api-takanarisasaki.c9users.io/hello?name=firstName
	var firstName = request.query.name;
	response.send('<h1> Hello ' + firstName + '! </h1>');

	//https://reddit-nodejs-api-takanarisasaki.c9users.io/hello?name=takanari&&lastname=sasaki
	//var lastName = request.query.lastname;
	//response.send('<h1> Hello ' + firstName + ' ' + lastName + '! </h1>');
});


app.get('/op/:operation', function(request, response) {

	var operation = request.params.operation;
	var num1 = request.query.num1;
	var num2 = request.query.num2;

	var calculationObj = {};

	//https://reddit-nodejs-api-takanarisasaki.c9users.io/op/add?num1=31&num2=11
	if (operation === 'add') {
		calculationObj.operator = 'add';
		calculationObj.firstOperand = num1;
		calculationObj.secondOperand = num2;
		calculationObj.solution = JSON.parse(num1) + JSON.parse(num2);
	}
	//https://reddit-nodejs-api-takanarisasaki.c9users.io/op/sub?num1=31&num2=11
	else if (operation === 'sub') {
		calculationObj.operator = 'subtract';
		calculationObj.firstOperand = num1;
		calculationObj.secondOperand = num2;
		calculationObj.solution = JSON.parse(num1) - JSON.parse(num2);
	}
	//https://reddit-nodejs-api-takanarisasaki.c9users.io/op/mult?num1=31&num2=11
	else if (operation === 'mult') {
		calculationObj.operator = 'multiply';
		calculationObj.firstOperand = num1;
		calculationObj.secondOperand = num2;
		calculationObj.solution = JSON.parse(num1) * JSON.parse(num2);
	}
	//https://reddit-nodejs-api-takanarisasaki.c9users.io/op/div?num1=31&num2=11
	else if (operation === 'div') {
		calculationObj.operator = 'divide';
		calculationObj.firstOperand = num1;
		calculationObj.secondOperand = num2;
		calculationObj.solution = JSON.parse(num1) / JSON.parse(num2);
	}
	//command-option-i: open developer tool, click network, click error
	//I am the one choosing the error, not the computer, so I have to know the error code,
	//which in this case I put 500
	else {
		response.status(500).send('END OF WORLD!');
	}

	response.send(calculationObj);
});


//I used userId = 5 rather than userId = 1, or else I would have to drop my whole database
redditAPI.getFivePosts(1, function(err, posts) {
	if (err) {
		console.log(err);
	}
	else {
		//console.log("HELLO", response);

		//create a function that takes a post and returns an <li></li> with the data from the post.
		function createLi(post) {
			return `
				<li>
					<p> Post Title: ${post.title} </p>
					<a href=${post.url}> ${post.url} </a>
					<p> Post UserId: ${post.userId} </p>
					<p> Post Username:: ${post.username} </p>
					<p> Post Created at: ${post.createdAt} </p>
				</li>
			`
		}

		//I WANT A FUNCTION THAT MAPS OVER THE POSTS AND RETURNS AN ARRAY OF <li></li>
		//DONT FORGET TO JOIN AT THE END BECAUSE WE CANNOT PASS AN ARRAY JOIN array will create a string.
		var html = `
			  <div id="contents">
			    <h1>List of contents</h1>
				  <ul class="contents-list">
				  
				  ${posts.map(function(post) {
					return createLi(post);
				  }).join("")}

				  </ul>
			  </div>
			`;


		app.get('/posts', function(request, result) {
			result.send(html);
		});

	}
});


var sendHtml = `
	<form action="/createContent" method="POST"> 
		<div>
    		<input type="text" name="url" placeholder="Enter a URL to content">
		</div>
		<div>
			<input type="text" name="title" placeholder="Enter the title of your content">
		</div>
		<button type="submit">Create!</button>
	</form>
`;

app.get('/createContent', function(request, result) {
	result.send(sendHtml);
});


app.post('/createContent', function(request, response){
	//console.log(request.body);
	redditAPI.createPostUsingExpress(request.body, function(err, result) {
		if (err) {
			console.log(err);
		}
		
		//https://reddit-nodejs-api-takanarisasaki.c9users.io/createContent
		//Enter URL and title in the URL above
		
		//1,2.Use response.send to send the actual post object that was created (received from the createPost function)
		//cannot have two send, so need to make an object 
		// else {
		// 	var toSend = {
		// 		status: 'Successfully created!',
		// 		content: result
		// 	};
		// 	response.send(toSend);
		// }
		
		//3.Use response.redirect to send the user back to the /posts page you setup in a previous exercise
		else {
			response.redirect('https://reddit-nodejs-api-takanarisasaki.c9users.io/createContent');
		}
		
		//4.Using a response.redirect, redirect the user to the URL /posts/:ID where :ID is the ID of 
		//the newly created post.
		// else {
		// 	redditAPI.getSinglePost(1, function(err, result2) {
		// 		if (err) {
		// 			console.log(err);
		// 		}
		// 		else {
		// 			//console.log(response);
		// 			response.redirect(`/posts/` + result2.id);
		// 		}
		// 	});
		// }

	});
});

app.get('/posts/:id', function(request, response) {
	redditAPI.getSinglePost(request.params.id, function(err, post){ 
		response.send(post);
	});
});

//server always at the bottom of the code
// Boilerplate code to start up the web server
var server = app.listen(process.env.PORT, process.env.IP, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});