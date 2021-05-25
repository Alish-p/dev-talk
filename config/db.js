const mongoose = require('mongoose');
const config = require('config');
const mongoUri = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: true,
    });
    console.log(`Database connected ...`);
  } catch (error) {
    console.log('Database connection failed !!!');
    process.exit(1);
  }
};

module.exports = connectDB;
