const express = require("express");
const cors = require("cors");
const IOService = require("./services/IOService")
const bodyParser = require("body-parser");
const {config} = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const {ParseToken} = require("./middleware/ParseToken");
const {ParseTokenAdmin} = require("./middleware/ParseTokenAdmin");
const io = require("socket.io")
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

config({
  path: path.resolve(__dirname, ".env"),
});

mongoose.connect(process.env.MONGODB_URI, () =>
  console.log("Connected to MongoDB")
);

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(ParseToken);
app.use(ParseTokenAdmin)
app.use(require("./routes/index"));


const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for JSONPlaceholder',
    version: '1.0.0',
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = process.env.PORT;
const httpServer = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

const ioServer = io(httpServer)
const ioService = new IOService(ioServer)
ioService.init()
