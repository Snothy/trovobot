const trovobot = require('./lib/trovobot');
const requests = require('./lib/requests');

module.exports = {
  Bot: trovobot,
  req: requests
}