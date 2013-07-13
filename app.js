
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , util = require('util')
  , fs = require('fs')
  , execFile = require('child_process').execFile;    

var app = express();

// all environments
app.set('port', process.env.PORT || 4444);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/diff/:id', function(req, res) {
  if (fs.existsSync(__dirname + "/public/images/"+req.params.id+"_diff")) {
    res.send("<html><body><img src='/images/"+req.params.id+"'/>&nbsp;<img src='/images/"+req.params.id+"_diff'/>&nbsp;<img src='/images/"+req.params.id+".gif'/></body><br/><a href='/diff/"+req.params.id+"/accept'>Accept changes</a></html>");
  }
  else 
    res.send(404);
});

app.get('/diff/:id/accept', function(req, res) {  
  if (fs.existsSync(__dirname + "/public/images/"+req.params.id+"_diff")) {
	fs.unlinkSync(__dirname + "/public/images/"+req.params.id);
	fs.renameSync(__dirname + "/public/images/"+req.params.id+"_diff", __dirname + "/public/images/"+req.params.id);
	res.send("Accepted!");
  }
  else
    res.send(404);
});

app.post('/diff/:id', function(req, res) {
  fs.readFile(req.files.image.path, function (err, data) {	  	  
    var idPath = __dirname + "/public/images/"+req.params.id;
    if (!fs.existsSync(idPath)) {
      fs.writeFile(idPath, data, function (err) {
        res.json({ status: 'new' })
      });
    }
	else {
	  fs.writeFile(idPath+"_diff", data, function (err) {
	    execFile(process.env.IMAGE_MAGICK_HOME+'/compare.exe', ['-metric','AE', idPath, idPath+"_diff", 'diff.png'], function(err,tmp,difference){
		  if (difference == 0)
		    res.json({ status: 'same' })
		  else
		  {
			execFile(process.env.IMAGE_MAGICK_HOME+'/convert.exe', ['-delay','25', idPath, idPath+"_diff", '-loop', '0', __dirname + "/public/images/"+req.params.id+".gif"], function(err){		  
			  res.json({ status: 'different', difference:difference })
			});
		  }
		});        
      });
	}
  });
});
 
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
