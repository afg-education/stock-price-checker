/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
const Stock = require("../models/stock");
const fetch = require("node-fetch");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {
  app.route("/api/stock-prices").get(function(req, res) {
    let ip = req.ip;
    let stock = req.query.stock;
    let isLike = req.query.like;
    if (isLike == undefined) {
      isLike = false;
    }
    processStock(ip, stock, isLike).then(stockData => {
      res.json(stockData);
    });
  });

  app.route("/api/compare-stocks").get(function(req, res) {
    let ip = req.ip;
    let stock1 = req.query.stock1;
    let stock2 = req.query.stock2;
    let isLike = req.query.like;
    if (isLike == undefined) {
      isLike = false;
    }
    console.log(ip, stock1, stock2, isLike);
    processStock(ip, stock1, isLike).then(result => {
      processStock(ip, stock2, isLike).then(result2 => {
        //TODO : compare returned objects 
        console.log(result, result2);
        res.json({stockData: [{
          stock: result.stock,
          price: result.price,
          rel_likes: result.likes-result2.likes
        },{
          stock: result2.stock,
          price: result2.price,
          rel_likes: result2.likes-result.likes
        }]});
      });
    });
  });

  function processStock(ip, stock, isLike) {
    return new Promise(function(resolve, reject) {
      let likeCount;
      let stockUrl =
        "https://repeated-alpaca.glitch.me/v1/stock/" + stock + "/quote";

      Stock.findOne({ stock: stock }, (err, doc) => {
        if (err) {
          console.log(err);
          reject(err);
        }

        if (!doc) {
          let newStock = new Stock({
            stock: stock,
            ips: []
          });
          if (isLike) {
            newStock.ips.push(ip);
          }
          newStock.save((err, result) => {
            if (err) {
              console.log(err);
            } else {
              //console.log(result);
              likeCount = result.ips.length;
              getPrice(stockUrl, likeCount, ip);
            }
          });
        } else {
          if (!doc.ips.includes(ip) && isLike) {
            doc.ips.push(ip);
          }

          if (doc.ips.includes(ip) && !isLike) {
            doc.ips = doc.ips.filter(item => item !== ip);
          }
          doc.save();
          //console.log(doc.ips);
          //console.log(doc.ips.length);
          likeCount = doc.ips.length;
          getPrice(stockUrl, likeCount, ip).then(stockData => resolve(stockData));
        }
      });
    });
  }

  async function getPrice(stockUrl, likeCount, ip) {
    const response = await fetch(stockUrl);
    const body = await response.json();
    return {
      stock: body.symbol,
      price: body.latestPrice,
      likes: likeCount
    };
  }
};