// IMPORT
const express = require("express");
const nunjucks = require("nunjucks");
const crypto = require("crypto-js")
const SHA256 = require("crypto-js/sha256");
const CryptoJS = require("crypto-js")
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const AWS = require("aws-sdk");
const fs = require("fs");
const useragent = require('express-useragent');
const bodyParser = require ('body-parser');
const SoDB = require("@sojs_coder/sodb");

function titleToPosts(title){
  return title.split(" ").join("_").replace(/\W+/g,"")
}
function json2array(json){
  var result = [];
  var keys = Object.keys(json);
  keys.forEach(function(key){
    json[key].key = key
    result.push(json[key]);
  });
  return result;
}
class Sort{
  constructor(data){
    if(!Array.isArray(data)){
      data = json2array(data);
    }
    this.data = data;
  }
  sortByNewest(){
    
    this.data = this.data.sort((a,b)=>{
      if (a.timestamp > b.timestamp) {
        return -1;
      }
      if (a.timestamp < b.timestamp) {
        return 1;
      }
      return 0;
    });
    return this.data
    
  }
  sortByScore(){
    this.data = this.data.sort((a,b)=>{
      if (a.score > b.score) {
        return -1;
      }
      if (a.score < b.score) {
        return 1;
      }else{
        if (a.timestamp > b.timestamp) {
        return -1;
      }
      if (a.timestamp < b.timestamp) {
        return 1;
      }
      }
    });
    var newData = [];
    this.data.forEach((d)=>{
      if (d.score > 0){
        d.percent = ((d.score / this.totalScore) * 100).toFixed(1);
        newData.push(d)
      }
    })
    return newData;
  }
  search(keyword){
    var totalScore=0
    keyword = keyword.toLowerCase();
    var keywords = keyword.split(' ');
    this.data = this.data.map(item=>{
      var itemKeys = Object.keys(item);
      var itemScore = 0;
      itemKeys.forEach(key=>{
        var dataString = item[key].toString();
        dataString = dataString.toLowerCase();
        keywords.forEach(keyword=>{
          dataString.split(" ").forEach(testString=>{
            if(testString.indexOf(keyword) !== -1){
              itemScore++;
              totalScore++;
            }
          })
        })
      });
      item["score"] = itemScore;
      return item;
    });
    this.totalScore = totalScore;
    //this.data = this.sortByNewest();
    this.data = this.sortByScore();

    return this.data
  }
  filterIn(under){
    this.data = this.data.filter(item=>{
      return (item.under == under);
    });
    return this.data;
  }
}



const so_db = new SoDB.Database("SoSearch",true)
const cache = new SoDB.Database("SoSearch_cache",true);
const cache_ttl = new SoDB.Database("cache_ttl",true)
const unpub = new SoDB.Database("unpub",true);





/*
CryptoJS.AES.encrypt(data,process.env.SO_SEARCH_KEY);
CryptoJS.AES.decrypt(data,process.env.SO_SEARCH_KEY);
*/
class Search{
  constructor(cacheResults = true,encrypt = false,logs = false){
    this.cache = cacheResults;
    this.encrypt = encrypt;
    this.logs = logs;
  }
  middleSearch(query){
    return new Promise((r,rr)=>{
      so_db.dump().then((dump)=>{
        var sort = new Sort(dump);
        let results = sort.search(query);
        r(results);
      })
    })
  }
  search(query){
    return new Promise((r,rr)=>{
      if(this.cache){
        cache.getDoc(query.split(" ").join("_")).then((data)=>{
          if(data && (new Date().getTime() - data.timestamp)/60000/60 <= 1){
            var results = data.results.map(elem=>{
                return {
                  posts: elem.key,
                  title: elem.title,
                  percent: elem.percent,
                  des: elem.des,
                  author: elem.author,
                  timestamp: elem.timestamp
                }
              })
            r(data.results);
          }else{
            this.middleSearch(query).then((results)=>{
              results = results.map(elem=>{
                return {
                  posts: elem.key,
                  title: elem.title,
                  percent: elem.percent,
                  des: elem.des,
                  author: elem.author,
                  timestamp: elem.timestamp
                }
              })
              var map = {
                results,
                timestamp: new Date().getTime()
              }
              cache.addDoc(query.split(" ").join("_"),map);
              
              r(results)
            })
          }
        })
      }else{
        this.middleSearch(query).then((results)=>{
          var results = results.map(elem=>{
                return {
                  posts: elem.key,
                  title: elem.title,
                  percent: elem.percent,
                  authro: elem.author,
                  des: elem.des,
                  timestamp: elem.timestamp
                }
              })
          r(results);
        })
      }
    })
  }
}

const enc = (data)=>{
  return CryptoJS.AES.encrypt(data,process.env.SO_DB_KEY).toString();
}
const dec = (data)=>{
  return CryptoJS.AES.decrypt(data,process.env.SO_DB_KEY).toString(CryptoJS.enc.Utf8);
}
AWS.config.update({
  region: "us-west-2", // replace with your region in AWS account
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const DynamoDB = new AWS.DynamoDB();
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "SoJS_posts";
const T2 = "people";
async function resetDB(){
  getEveryPost(TABLE_NAME).then(data=>{
    var items = data.Items;
    so_db.__initCrypto();
    cache.__initCrypto();
    unpub.__initCrypto();
    items = json2array(items);
    items.forEach((item)=>{
      so_db.addDoc(titleToPosts(item.title),{
        title: item.title,
        author: item.author,
        timestamp: item.timestamp,
        des: item.des,
        content: item.content
      });
      if(!item.published){
        unpub.addDoc(titleToPosts(item.title),{
          title: item.title,
          des: item.des,
          under: item.under,
          posts: titleToPosts(item.title)
        });
      }
    })
  })
}

async function getAllSubs(){
  const params = {
    TableName: T2,
    IndexName: "subscribed-index"
  }
  try {
    const data = await dynamoClient.scan(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
}
async function emailSub(email){
  const params = {
    TableName: T2,
    Key: {
      email
    },
    UpdateExpression: "set subscribed = :sub",
    ExpressionAttributeValues: {
      ":sub": "true"
    }
  }
  try{
    const data = await dynamoClient.update(params).promise();
  } catch (err){
    console.log(err)
  }
}
async function unSub(email){
  const params = {
    TableName: T2,
    Key: {
      email,
    },
    UpdateExpression: "remove subscribed"
  }
  try{
    const data = await dynamoClient.update(params).promise();
  } catch (err){
    console.log(err)
  }
}
const insertPost = async (postId, author,content,des, title,under, published) => {
  var timestamp = new Date().getTime();
  const params = {
    TableName: TABLE_NAME,
    Item: {
      posts: postId,
      author,
      content,
      des,
      title,
      under,
      published,
      timestamp
    }
  };
  so_db.addDoc(postId,{
    author,
    content,
    des,
    title,
    timestamp
  })
  try {
    const data = await dynamoClient.put(params).promise();
  } catch (err) {
    console.log(err);
  }
};
const updatePost = async (postId, title,des,content,under,published) => {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      posts: postId,
      title,
      content,
      des,
      under,
      published
    }
  };
  so_db.addDoc(postId,{
    author,
    content,
    des,
    title,
  })
  try {
    const data = await dynamoClient.put(params).promise();
  } catch (err) {
    console.log(err);
  }
};
const getPostById = async (table,keyObj) => {
  const params = {
    TableName: table,
    Key: keyObj
  };
  try {
    const data = await dynamoClient.get(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
};
const scanPosts = async (table,keyObj) => {
  const params = {
    TableName: table,
    IndexName: "published-index",
    Key: keyObj
  };
  try {
    const data = await dynamoClient.scan(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
};
const getEveryPost = async (table) => {
  const params = {
    TableName: table
  };
  try {
    const data = await dynamoClient.scan(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
};
const getAllPosts = async (table) => {
  const params = {
    TableName: table,
    IndexName: "published-index"
  };
  try {
    const data = await dynamoClient.scan(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
};
const setUnpublished = async (postID)=>{
  const params = {
    TableName: TABLE_NAME,
    Key: {
      posts: postID
    },
    UpdateExpression: "remove published",
  }
  try {
    const data = await dynamoClient.update(params).promise();
    return data;
  } catch (err) {
    console.log(err);
  }
}



const app = express();

const KEY = SHA256(process.env.KEY).toString();
app.use(morgan('dev'));
app.use(cookieParser());
app.use(useragent.express());
app.use(session({
	secret: process.env.SECRET,
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
  limit: "1mb",
  extended: false
}));
app.use(bodyParser.json({limit: "1mb"}));

nunjucks.configure('views', {
    autoescape:  true,
    express:  app
})


app.set('view engine', 'njk');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index.html');
  if((cache_ttl.getDoc("t") - new Date().getTime()/1000/60/60/24/30) >=1){
  resetDB()
  }
});
app.get('/projects', (req, res) => {
  res.render('projects.html');
});
app.get('/contact', (req, res) => {
  res.render('contact.html');
});
app.get('/blog', (req, res) => {
  getAllPosts(TABLE_NAME).then(data =>{
    res.render('blog.html',{isMobile:req.useragent.isMobile,sortedByNewest: new Sort(data.Items).sortByNewest()});
  })
  
});
app.get('/blog/:s',(req,res)=>{
  getAllPosts(TABLE_NAME).then(data =>{
    var sort = new Sort(data.Items);
    var posts = sort.sortByNewest();
    if(req.params["s"] !== "s"){
      posts = sort.filterIn(req.params["s"])
    }
    res.render('stream.html',{ posts: posts});
  })

});
app.get('/update/:id',(req,res)=>{
  if(req.session.user && req.session.user.email != "undefined"){
  var posts = req.params["id"];
  getPostById(TABLE_NAME,{ posts: posts }).then(post => {

    post = post.Item;
    res.render('update_post.html',{ post: post,loggedIn: req.session.user.name });
  })
  }else{
    req.session.goto = "/update/"+req.params.id;
    res.redirect("/login")
  }
})
app.get('/login',(req,res)=>{
	console.log(req.cookies)
	console.log(req.session);
  if(req.cookies["so-auth-user"] && req.cookies["so-auth-user"] != "undefined"){
    req.session.user = {
      username: req.cookies["so-auth-user"],
      email: req.cookies["so-auth-email"],
      name: req.cookies["so-auth-name"],
      pfp: req.cookies["so-auth-pfp"],
      verified: req.cookies["so-auth-verified"]
    }
  }
  if(req.session.user && req.session.user.email && process.env.VALID_NAMES.split(",").indexOf(req.session.user.username) !== -1){
    res.redirect('/dashboard')
  }else{
    res.render('login.html');
  }
});
app.get('/post',(req,res)=>{
  if(req.session.user && req.session.user.email != "undefined"){
    res.render('post.html',{author: req.session.name});
  }else{
    req.session.goto = "/post";
    res.redirect('/login');
  }
});
app.get('/post/:id',(req,res)=>{
  var posts = req.params["id"];
  getPostById(TABLE_NAME,{ posts: posts }).then(post => {
    post = post.Item;
    res.render('post_view.html',{ post: post,loggedIn: (req.session.user) ? req.session.user.name : false });
  })
  
});
app.get('/search',(req,res)=>{
  var time1 = performance.now()
  new Search(true).search(req.query["q"]).then(data =>{
    var sort = new Sort(data);
    if(req.query["in"] !== "s"){
      data = sort.filterIn(req.query["in"])
    }
    // add score percenr solver here
    res.render('search.html',{posts: data,params: {q: req.query.q,in:req.query.in}, optime: ((performance.now() - time1)/1000).toFixed(4), numr: data.length})
  })
  
});
app.get('/unsub',(req,res)=>{
  res.render('unsub.html')
})
app.get("/thank-you",(req,res)=>{
  res.render('thank-you.html')
});
app.get('/dashboard',(req,res)=>{
  if(req.session.user && req.session.user.email && req.session.user.email != "undefined"){
    unpub.dump().then((data)=>{
      res.render('dashboard.html',{isMobile:req.useragent.isMobile,sortedByNewest: new Sort(data).sortByNewest(), user: req.session.user });
    })
    
  }else{
    res.redirect('/login')
  }
})

app.post('/post',(req,res)=>{
  if(req.session.user && req.session.user.username != "undefined"){
    if(req.body.published){
  insertPost(titleToPosts(req.body.title),req.body.author,req.body.content,req.body.des,req.body.title,req.body.under,req.body.published.toString()).then((data)=>{
    if(unpub.getDoc(titleToPosts(req.body.title))){
      unpub.deleteDoc(titleToPosts(req.body.title)).then((data)=>{
        res.json({"status":200})
      })
    }else{
      res.json({"status":200})
    }
    
  });
    }else{
      unpub.addDoc(titleToPosts(req.body.title),{
        title: req.body.title,
        des: req.body.des,
        under: req.body.under,
        posts: titleToPosts(req.body.title)
      })
      insertPost(titleToPosts(req.body.title),req.body.author,req.body.content,req.body.des,req.body.title,req.body.under,req.body.published.toString()).then((data)=>{
  });
      setUnpublished(titleToPosts(req.body.title)).then((data)=>{
        res.json({status: 200});
      })
    }
  }else{
    res.json({"status": 401})
  }
  
})
app.post('/update',(req,res)=>{
  if(req.session.user && req.session.user.email !=="undefined"){
    if(req.body.published){
  updatePost(titleToPosts(req.body.title),req.body.title,req.body.des,req.body.content,req.body.under,req.body.published.toString()).then((data)=>{
    if(unpub.getDoc(titleToPosts(req.body.title))){
      unpub.deleteDoc(titleToPosts(req.body.title)).then(d=>{
        res.json({"status":200})
      })
    }else{
    res.json({"status":200})
    }
  });
    
    }else{
      unpub.addDoc(titleToPosts(req.body.title),{
        title: req.body.title,
        des: req.body.des,
        under: req.body.under,
        posts: titleToPosts(req.body.title)
      })
      updatePost(titleToPosts(req.body.title),req.body.title,req.body.des,req.body.content,req.body.under,req.body.published.toString()).then((data)=>{

  });
      setUnpublished(titleToPosts(req.body.title)).then((data)=>{
        res.json({status: 200});
      })
    }
  }else{
    res.json({"status": 401})
  }
  
});
app.post("/email-sign",(req,res)=>{
  emailSub(req.body.email);
  res.redirect('/thank-you');
});
app.post("/unsub",(req,res)=>{
  unSub(req.body.email);
  res.redirect('/blog');
})

app.listen(3000, () => {
  console.log('server started');
});

resetDB()

