const fs = require('fs');
const path = require("path");

const run = ({database, username, mysqlPassword}) => {
  let wpConfigSample = fs.readFileSync(path.join(__dirname, "../data/website_conf")).toString()
  wpConfigSample = wpConfigSample.replace(/\#include \/etc\/nginx\/phpbb.conf;/g, "include /etc/nginx/phpbb.conf;")
/*    .replace("define( 'DB_USER', 'username_here' );", `define( 'DB_USER', '${username}' );`)
    .replace("define( 'DB_PASSWORD', 'password_here' );", `define( 'DB_PASSWORD', '${mysqlPassword}' );`)*/
  console.log(wpConfigSample)

  fs.writeFileSync(path.join(__dirname, "..", "data/website_conf_phpbb"), wpConfigSample)

/*  fs.readFile(someFile, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(/string to be replaced/g, 'replacement');

    fs.writeFile(someFile, result, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });*/
}

run({
  database: process.argv[2],
  username: process.argv[3],
  mysqlPassword: process.argv[4]
})