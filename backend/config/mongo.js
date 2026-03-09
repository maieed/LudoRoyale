const mongoose = require("mongoose");

const connectMongo = async (mongoUri) => {
  await mongoose.connect(mongoUri, {
    maxPoolSize: 50,
    minPoolSize: 5
  });
  return mongoose.connection;
};

module.exports = { connectMongo };