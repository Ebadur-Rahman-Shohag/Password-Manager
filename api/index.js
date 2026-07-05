const serverless = require("serverless-http");
const { connectDb } = require("../backend/dist/config/db");
const { app } = require("../backend/dist/app");

let dbReady = false;

async function prepare() {
  if (!dbReady) {
    await connectDb();
    dbReady = true;
  }
}

const handler = serverless(app);

module.exports = async (req, res) => {
  await prepare();
  return handler(req, res);
};
