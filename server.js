'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var cors = require('cors');
var pug = require('pug');

var app = express();

//console.log(process.env);

// Basic Configuration 
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Node.js listening ...');
});
app.set('view engine', 'pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

//Database configuration
mongoose.connect("some url");
var Schema = mongoose.Schema;
var SessionSchema = new Schema({
	pin: String,
	name: String,
	people: Array
});
var Session = mongoose.model('Session', SessionSchema);

//server main page
app.get("/",(req,res)=>{
	console.log("Live!")
	res.sendFile(process.cwd() + "/views/index.html");
});

//create a new session
app.get("/create", (req, res)=>{
	res.sendFile(process.cwd() + "/views/create.html");
});
app.post("/new", (req,res)=>{
	console.log(req.body)
	if (req.body.s_name == ""){
		res.render(process.cwd() + "/views/error.pug", {error: "missing_arg"});
	}else{
		Session.countDocuments((err, count)=>{
			if (err){
				res.render(process.cwd() + "/views/error", {error: "generic"});
			}else{
				var s = {
					name: req.body.s_name,
					pin: count,
					people: []
				};
				var len = Object.keys(req.body).length - 1;
				for (var i = 1; i <= len; i++){
					if(req.body["person"+i] == ""){
						res.render(process.cwd() + "/views/error.pug", {error: "missing_arg"})
					}
					s.people.push({
						name: req.body["person"+i],
						payments: []
					});
				}
				var newSession = new Session(s);
				newSession.save((err,data)=>{
					if (err){
						res.render(process.cwd() + "/views/error", {error: "generic"});
					}else{
						res.render(process.cwd() + "/views/success.pug", {type: "new", pin: data.pin})
					}
				})
			}
		})
	}	
});

//edit session
app.get("/edit", (req, res)=>{
	res.sendFile(process.cwd() + "/views/edit.html");
});
app.post("/add", (req,res)=>{
	console.log(req.body)
	if (req.body.pin == "" || req.body.name == "" || req.body.desc == "" || req.body.cost == ""){
		res.render(process.cwd() + "/views/error.pug", {error: "missing_arg"});
	}else if(isNaN(parseInt(req.body.cost))){
		res.render(process.cwd() + "/views/error.pug", {error: "cost"});
	}else{
		Session.findOne({pin: req.body.pin}, (err, data)=>{
			if(err){
				res.render(process.cwd() + "/views/error.pug", {error: "missing_arg"});
			}else if(data === null){
				res.render(process.cwd() + "/views/error.pug", {error: "pin"});
			}else{
				var i = 0;
				while (i < data.people.length){
					if (data.people[i].name == req.body.name){
						var newPayment = {
						desc : req.body.desc,
						date : new Date(),
						cost : parseInt(req.body.cost)
						};
						data.people[i].payments.push(newPayment);
						i = data.people.length + 1;
					}
					i++;
				}
				if(i == data.people.length){
					res.render(process.cwd() + "/views/error.pug", {error: "name"});
				}else{
					data.markModified("people");
					data.save((err, data)=>{
						if(err){
							res.render(process.cwd() + "/views/error.pug", {error: "generic"})
						}else{
							res.render(process.cwd() + "/views/success.pug", {type: "edit"})
						}
					});
				}
			}
		});
	}
});

//Splitting function
app.get("/split", (req,res)=>{
	res.sendFile(process.cwd() + "/views/split.html");
});
function create_balances(people){
	var balances = []
	for (var i = 0; i < people.length; i++){
		var sum = 0;
		for (var j = 0; j < people[i].payments.length; j++){
			sum += people[i].payments[j].cost;
		}
		balances.push([sum, i]);
	}
	var total = 0;
	for(var i = 0; i < people.length; i++){
		total += balances[i][0];
	}
	var fee = total / people.length
	for(var i = 0; i < people.length; i++){
		balances[i][0] -= fee;
	}
	balances.sort(); //check if correct!!!
	var debts = [];
	i = 0;
	j = balances.length - 1;
	while (i < j){
		if (-balances[i][0] < balances[j][0]){
			debts.push([balances[i][1], balances[j][1], -balances[i][0]]);
			balances[j][0] += balances[i][0];
			i++;
		}else{
			balances[i][0] += balances[j][0];
			debts.push([balances[i][1], balances[j][1], balances[j][0]]);
			j--;
		}
	}
	return debts;
}
function parse_debts(debts, people){
	var ans = [];
	for (var i = 0; i < debts.length; i++){
		ans.push(people[debts[i][0]].name + " owes " + people[debts[i][1]].name + " $" + debts[i][2] + ".");
	}
	return ans;
}
app.get("/split-this", (req,res)=>{
	console.log("splitting asked... pin: ", req.query.pin);
	if(req.query.pin == ""){
		res.render(process.cwd() + "/views/error.pug", {error: "missing_arg"});
	}else{
		Session.findOne({pin: req.query.pin}, (err,data)=>{
			if(err){
				res.render(process.cwd() + "/views/error.pug", {error: "generic"});
			}else if(data === null){
				res.render(process.cwd() + "/views/error.pug", {error: "pin"});
			}else{
				var debts = create_balances(data.people);
				console.log(debts);
				var debts_parsed = parse_debts(debts, data.people);
				console.log(debts_parsed);
				res.render(process.cwd() + "/views/session-balance" , {debts: debts_parsed, people: data.people});
			}
		});
	}
});


//serve help page
app.get("/help", (req,res)=>{
	res.sendFile(process.cwd() + "/views/help.html");
});