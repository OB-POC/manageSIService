var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../data/config');
var serviceUrlConfig  = require("../data/serviceURL's");
var request = require('request');

/* GET home page. */
router.get('/si/suggestions', function(req, res, next) {
  var token = req.headers['x-access-token'];
  jwt.verify(token, config.secret , function(err, decodedObj){
    if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
    var userName = decodedObj.username;
    request.get(serviceUrlConfig.dbUrl+'/'+userName+'-debit', function(err, response, body){
      if(err) return res.status(500).json({ message: 'Failed to load data'})
      // console.log(body);
      var accountsArray = JSON.parse(body)['banks'].map((bank)=>{
        bank.accounts[0].bankName = bank.bankName;
        return bank.accounts[0]
      })
      var sortedArray = accountsArray.sort((a,b)=>{
        return a.interestRate-b.interestRate;
      });
      console.log(sortedArray);
      res.status(200).json({
        senders: [
          {
            senderBank: sortedArray[0].bankName,
            senderAccountNumber: sortedArray[0].accountNumber,
            senderAer: sortedArray[0].interestRate,
            amount: sortedArray[1] && Math.abs(parseInt(sortedArray[1].balance) - parseInt(sortedArray[1].minBalance) - parseInt(sortedArray[1].standingInst))
          }
        ],
        receiver: {
          receiverBank: sortedArray[1] && sortedArray[1].bankName,
          receiverAccountNumber: sortedArray[1] && sortedArray[1].accountNumber,
          receiverAer: sortedArray[1] && sortedArray[1].interestRate
        }
      })
    })
  });
});


router.post('/si/suggestions', function(req, res, next) {
  var token = req.headers['x-access-token'];
  var postData = req.body;
  jwt.verify(token, config.secret , function(err, decodedObj){
    if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
    var userName = decodedObj.username;
    request.get(serviceUrlConfig.dbUrl+'/'+userName+'-debit', function(err, response, body){
      if(err) return res.status(500).json({ message: 'Failed to load data'})
      // console.log(body, postData.transfers);
      var data = JSON.parse(body);
      postData.senders.map((obj)=>{
        var filteredSenderBank = data.banks.filter((bank)=>{
          return bank.bankName == obj.senderBank;
        })[0];
        var filteredReceiverBank = data.banks.filter((bank)=>{
          return bank.bankName == postData.receiver.receiverBank
        })[0];
        var restBankDetails = data.banks.filter((bank)=>{
          return bank.bankName != postData.receiver.receiverBank && bank.bankName != obj.senderBank;
        });
        filteredSenderBank.accounts[0].balance = parseInt(filteredSenderBank.accounts[0].balance) - parseInt(obj.amount);
        filteredReceiverBank.accounts[0].balance = parseInt(filteredReceiverBank.accounts[0].balance) + parseInt(obj.amount);
        filteredReceiverBank.accounts[0].availableBalance = 0
        filteredReceiverBank.accounts[0].standingInstructions.map((obj)=>obj.canClear=true);
        data.banks = [...restBankDetails, filteredReceiverBank, filteredSenderBank];
      });
      request.patch({
        url: serviceUrlConfig.dbUrl+'/'+userName+'-debit',
        body: {
          'banks': data.banks
        },
        json: true
      }, function(err, response, body){
        if(err) return res.status(500).json({ message: 'Failed to patch data'})
        console.log(body);
        res.status(200).json(body);
      })
    })
  });
})


module.exports = router;
