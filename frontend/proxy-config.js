module.exports = [
  {
    context: ["/"], // anything that starts with /
    target: "http://localhost:3000", // this is the express server
    secure: false, // not using https
    logLevel: "debug", // so can see messages in terminal
  },
];
