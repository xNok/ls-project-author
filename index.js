const http = require("https");
const asyncEach = require('async-each');
const jsonfile  = require('jsonfile')
// Manipulate JSON
const shape   = require('shape-json');
const flatten = require('flat');
const groupBy = require('json-groupby');

var options = {
  "method": "GET",
  "hostname": "api.crossref.org",
  "port": null,
  "path": "/works/10.1002/net.10039",
};

// DEV
var file_in = './tmp/nested_array_in.json'
var file_out = './tmp/nested_array_out.json'
var file_authors_list = './tmp/file_authors_list_out.json'
var data = require('./test/data.json');

asyncEach(data.DOI,iterator,processAuthors);

/**
* Given a list of articles, provide the per author
* {"doi": str, "title": str, "author": []}
* =>
* {author: Object, article: [] }
*/
function processAuthors(error, result){

  jsonfile.writeFile(file_in, result, {spaces: 2}, (err) => {});

  result.forEach(function(item) {
      item.authors = item.author.map(function(x) {
         return x.family;
      })
  });

  finalresult = groupBy(result, ['authors']);

  Object.keys(finalresult).forEach(function (key){
    finalresult[key].forEach(function (item){
      delete item.authors
    });
  });

  jsonfile.writeFile(file_out, finalresult, {spaces: 2}, (err) => {});

  jsonfile.writeFile(file_authors_list, Object.keys(finalresult), {spaces: 2}, (err) => {});
}

/**
* Find the author(s) for a given DOI
*/
function iterator(item, next){
  options.path = "/works/" + item,

  getAuthors(options,function(res){
    next(null,{
      "doi": item,
      "title": res.message.title[0],
      "author": res.message.author
    })
  })
}

/**
* HTTP request to crossref API
*/
function getAuthors(options, callback) {

  //Asyn HTTP GET
  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      body = JSON.parse(Buffer.concat(chunks).toString())
      callback(body);
    });
  });

  req.end();
}
