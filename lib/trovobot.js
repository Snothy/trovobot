const req = require('./requests');
const reqclass = require('./requestsclass');
//const commands = require('./commands');
const WebSocket = require('ws');
const fetch = require('node-fetch');

module.exports = class Bot {
  constructor(settings) {
    this.viewport = { width: 1920, height: 1080 };
    this.headless = true;
    
    if(settings) {
      this.login_cred = settings.login;
      this.client_id = settings.client_id;
      this.client_secret = settings.client_secret;
      this.chat_username = settings.chat_username;
      this.prefix = settings.prefix;
    }
  }

  async init() {
    /**
     * 
     */
    this.auth_code = await req.login(this.login_cred, this.client_id, this.headless, this.viewport);
    this.OAuth = await req.getOAuth(this.auth_code, this.client_id, this.client_secret);
    this.channel_id = await req.getChannelId(this.client_id, [this.chat_username]);
    this.chat_token = await req.getChannelChatToken(this.client_id, this.channel_id);
  }

  async initTwo() {
    let req = new reqclass();
    req.login_cred = this.login_cred;
    req.client_id = this.client_id;
    req.client_secret = this.client_secret;
    req.chat_username = this.chat_username;
    req.viewport = this.viewport;
    req.headless = this.headless;

    this.auth_code = await req.login();
    req.auth_code = this.auth_code;
    this.OAuth = await req.getOAuth();
    req.OAuth = this.OAuth;
    this.channel_id = await req.getChannelId([this.chat_username]);
    req.channel_id = this.channel_id;
    this.chat_token = await req.getChannelChatToken();
    req.chat_token = this.chat_token;
    if(this.OAuth) {
      console.log('logged in');
    }
    return req;
  }

  async connect(commands, Bot) {
    const token = this.chat_token;
    const prefix = this.prefix;
    const ws = new WebSocket('wss://open-chat.trovo.live/chat');
    ws.on('open', function open() {
        const data =             
        {
            "type": "AUTH",
            "nonce": "connection",
            "data": {
                "token": token
            }
        }
        ws.send(JSON.stringify(data))
    })

    ws.on('message', function incoming(message) {
        const message_object = JSON.parse(message);
        //First message received is the response from the server to the data we sent in the 'open' method
        //Second message received is a list of currently visible messages in chat
        //Third+ are new messages so chats[] should have one value
        //console.log('%s', message);
        let message_data;
        if(message_object.type === 'CHAT') {
          if(message_object.data.chats) {
            if(message_object.data.chats.length > 1) {
              //ignoring the load of visible messages
              return
          }
          message_data = message_object.data.chats[0];
          }

        } else {
            return;
        }
        //console.log(message_data);
        let message_content = message_data.content;
        //console.log(message_content);

        if(message_data) {
          if (message_content.startsWith(prefix)) {
            message_content = message_content.substring(1); //remove prefix
            message_content = message_content.split(" ");
            commands(message_content, Bot);
          }
        }



        
      });
  }
  
}