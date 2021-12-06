const requests = require('./requests');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const types = require('../utils/typeConversion');
const Scopes = require('../utils/Scopes');

/** Client creation */
class Client {
  /**
   * Constructs a new Client object using specific options.
   * @param {object} settings Contains private information relating to the Trovo application.
   * @param {object} settings.login Login details for bot account. Required to authorize the scopes for the application
   * @param {string} settings.login.email The bot account's username
   * @param {string} settings.login.password The bot account's password
   * @param {string} settings.client_id The application's client_id
   * @param {string} settings.client_secret The application's client_secret
   * @param {string} settings.chat_username The chat you want the bot to run in (you must own this account to perform operations)
   * @param {object} options Less important options. They have default values, but each can be set to a preference.
   * @param {Array<string>} options.scopes The scopes for which the application will be authenticated.
   * @param {string} options.prefix The symbol which triggers the bot commands
   * @param {boolean} options.headless Whether the puppeteer browser will be headless or not
   * @param {object} options.viewport Dimensions in which the puppeteer browser will run
   * @param {number} options.viewport.width Corresponding width in pixels
   * @param {number} options.viewport.height Corresponding height in pixels
   */
  constructor (settings, options) {
    const defaults = {
      scopes: [
        Scopes.send_to_my_channel,
        Scopes.chat_send_self
      ],
      prefix: '!',
      headless: true,
      viewport: { width: 840, height: 800 }
    };
    const opts = Object.assign({}, defaults, options);
    this.options = opts;
    this.types = types;
    this.prefix = opts.prefix;
    if (settings) {
      this.login_cred = settings.login;
      this.client_id = settings.client_id;
      this.client_secret = settings.client_secret;
      this.chat_username = settings.chat_username;
    }
  }

  /**
   * Authorize the bot account through OAuth2 in a headless browser. If there are new scopes that require to be allowed by the user,
   * a browser window with Trovo's login screen will appear.
   *
   * This is to authorize the scopes for the chat_username account. Meaning the chat in which the bot will be running. It is
   * required to authorize your application to gain access to certain features such as the bot sending messages in your chat.
   */
  async init () {
    this.auth_code = await requests.login(this.client_id, this.options.scopes, this.login_cred, this.options.viewport, this.options.headless);
    this.OAuth = await requests.getOAuth(this.client_secret, this.client_id, this.auth_code);
    this.channel_id = await requests.getChannelId(this.client_id, this.chat_username);
    if (this.channel_id == null) {
      console.log('Invalid chat username');
      process.exit();
    }
    this.chat_token = await requests.getChannelChatToken(this.client_id, this.channel_id);
    if (this.OAuth) {
      console.log('Success');
    }
  }

  /**
   * Send a new message in chat.
   *
   * The required scopes are: chat_send_self & send_to_my_channel
   * @param {string} message The contents of the message. Manually setting new lines isn't possible as far as I know.
   * @returns {object} Empty object on success. Object with error status code and message on failed POST.
   *
   * The message is sent from the bot account and it is sent in chat_username's chat. That is as the
   * necessary scopes are allowed.
   */
  async sendMessage (message) {
    const url = 'https://open-api.trovo.live/openplatform/chat/send';
    const body = {
      content: message,
      channel_id: this.channel_id
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/json',
          'Client-ID': this.client_id,
          Authorization: `OAuth ${this.OAuth}`
        }
      });
      return await res.json(); // returns empty object on success
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Perform a chat command.
   *
   * The required scopes are: manage_messages
   * @param {string} command A chat command in the format of "command command_arguments".
   *
   * An example of a valid command: "settitle Playing League of legends."
   * @returns {object} Data on whether the command was executed successfully.
   *
   * Generally only administators, the streamer and supermods
   * have access to these commands on a certain chat so handle your permissions wisely.
   *
   * Roles can be accessed within the message object.
   */
  async performCommand (command) {
    const url = 'https://open-api.trovo.live/openplatform/channels/command';

    const body = {
      channel_id: this.channel_id,
      command: command
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/json',
          'Client-ID': this.client_id,
          Authorization: `OAuth ${this.OAuth}`
        }
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Get the channel ID of a specific user by username.
   *
   * No scope requirement.
   * @param {string} username The user's username.
   * @returns {Promise<string>|null} The user's channel ID. If an invalid username was provided, the function returns null.
   */
  async getChannelId (username) {
    const res = await requests.getChannelId(this.client_id, username);
    return res;
  }

  /**
   * Get information about a specific channel by channel_id
   *
   * No scope requirement.
   * @param {string} channel_id The user's channel_id. Also referred to as uid.
   * @returns {object} The information about the channel on success. Error code & message on failure.
   */
  async getChannelInfoById (channel_id) {
    const url = 'https://open-api.trovo.live/openplatform/channels/id';

    const body = {
      channel_id: channel_id
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/json',
          'Client-ID': this.client_id
        }
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Get the current chat owner's channel information
   *
   * No scope requirement.
   * @returns {object} The information about the channel on success. Error code & message on failure.
   */
  async getOwnChannelInfo () {
    return await this.getChannelInfoById(this.channel_id);
  }

  /**
   * Perform a search of trovo's category list. They have their own search algorithm for this
   * and we only provide an argument. If any matches are made, it returns a list.
   *
   * No scope requirement.
   *
   * Generally the first item is what you're looking for. The list is capped to 3 results.
   * @param {string} category The name of the category you want to search for.
   * @returns {object} Object containing a list of category matches for the query.
   */
  async searchCategories (category) {
    const url = 'https://open-api.trovo.live/openplatform/searchcategory';

    const body = {
      query: category,
      limit: 3
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/json',
          'Client-ID': this.client_id
        }
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Websocket connection to chat_username's chat. Kept alive by pinging the server every 30seconds.
   *
   * You can view message types by printing client.types to the console. Helps with converting the
   * type integers to a string that makes sense.
   *
   * Generally, you'll want to work with 'chat' type messages, which are of type: 0.
   *
   * You can set up auto responses to events such as follow, unfollow, mana gift etc.
   *
   * For mana gifts the gift information is JSON.stringified inside of message.content.
   *
   * @param {messageReturnType} message Represents the most recent message in chat.
   *
   */
  async on (message) {
    const token = this.chat_token;
    const data =
        JSON.stringify({
          type: 'AUTH',
          nonce: 'connection',
          data: {
            token: token
          }
        });
    const ping =
        JSON.stringify({
          type: 'PING',
          nonce: 'ping'
        });

    const ws = new WebSocket('wss://open-chat.trovo.live/chat');
    // Keep connection alive
    // Trovo API docs recommend sending ping every 30 seconds
    const sendPing = setInterval(function () {
      ws.send(ping);
    }, 1 * 30 * 1000); // 30 seconds

    ws.on('open', function open () {
      ws.send(data);
    });

    ws.on('close', function (code) {
      clearInterval(sendPing);
      console.log('disconnected code: ', code);
    });

    ws.on('error', function (error) {
      console.log('error', error);
    });

    ws.on('message', msg => {
      // console.log("%s", message);
      msg = JSON.parse(msg);
      if (msg.type === 'CHAT') {
        const eidArr = msg.data.eid.split('_');
        if (eidArr[1] === '0') {
          // previous chats (before starting the bot)
          return;
        }
        msg.data.chats.map(chat => {
          return message(chat);
        });
      }
    });
  }
}

/**
  * Message object
  * @param {object} message Represents the most recent message in chat.
  * @param {number} message.type The type of message received.
  * @param {string} message.content The content of the received message.
  * @param {string} message.nick_name The user's nick name
  * @param {string} message.avatar Link to the user's avatar
  * @param {string} message.sub_tier A number representing subscription status
  * @param {Array<string>} message.medals The medals the user possesses
  * @param {Array<string>} message.roles The roles the user possesses
  * @param {string} message.message_id The unique identifier of the message received
  * @param {number} message.sender_id The sender's channel ID
  * @param {number} message.uid The user's channel ID
  * @param {string} message.user_name The user's username
  * @param {object} message.content_data Information about the message content
  * @param {Array} message.content_data.chatroom
  * @param {string} message.content_data.normal_emote_enabled
  * @param {number} message.content_data.user_time
  * @param {string} message.custom_role Stringified object containing list of custom roles
  * @returns {message} Message object
  */
function messageReturnType (message) {
  return message;
}

module.exports = {
  Client: Client,
  messageReturnType: messageReturnType
};
