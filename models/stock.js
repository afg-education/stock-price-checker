const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Stock = new Schema({
  //title, _id, & an array of comments
  stock: {
    type: String,
    required: true
  },
  ips: {
    type: [],
    //required: true
  }
})

module.exports = mongoose.model('Stock', Stock);