const trovobot = require('./lib/trovobot');
const Scopes = require('./utils/Scopes');

module.exports = {
  Client: trovobot.Client,
  messageReturnType: trovobot.messageReturnType(),
  Scopes: Scopes
}
