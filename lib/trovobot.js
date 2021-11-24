const reqclass = require('./requestsclass');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const types = require('../utils/typeConversion');

module.exports = class Bot extends reqclass {
  constructor(settings) {
    super(settings);
    this.viewport = { width: 1920, height: 1080 };
  
    if(settings) {
      this.login_cred = settings.login;
      this.client_id = settings.client_id;
      this.client_secret = settings.client_secret;
      this.chat_username = settings.chat_username;
      this.prefix = settings.prefix;
      this.headless = settings.headless;
    }

    if(types) {
      this.types = types;
    }

  }

  async init() {
    this.login = await super.login();
    this.OAuth = await super.getOAuth();
    this.channel_id = await super.getChannelId([this.chat_username]);
    this.chat_token = await super.getChannelChatToken();
    if(this.OAuth) {
      console.log('logged in');
    }
  }

  async sendMessage(message) {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/chat/send';
    const body = {
        'content': message,
        'channel_id': this.channel_id
    }
    try {
        const res = await fetch(url, {
            method:'POST',
            body:JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Client-ID': this.client_id,
                'Authorization': `OAuth ${this.OAuth}`
            }
        })
        return await res.json(); //returns empty object on success
    } catch (err) {
        console.error(err);
    }
  }

  async performCommand(command) {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/channels/command';

    const body = {
      channel_id: this.channel_id,
      command: command
    }
    try {
        const res = await fetch(url, {
            method:'POST',
            body:JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Client-ID': this.client_id,
                'Authorization': `OAuth ${this.OAuth}`
            }
        })
        return await res.json();
    } catch (err) {
        console.error(err);
    }
  }

  async getChannelInfoById(channel_id) {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/channels/id';

    const body = {
      channel_id: channel_id
    }
    try {
        const res = await fetch(url, {
            method:'POST',
            body:JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Client-ID': this.client_id
            }
        })
        return await res.json();
    } catch (err) {
        console.error(err);
    }
  }

  async getOwnChannelInfo() {
    return await this.getChannelInfoById(this.channel_id);
  }

  async searchCategories(category) {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/searchcategory';

    const body = {
      query: category,
      limit: 3
    }
    try {
        const res = await fetch(url, {
            method:'POST',
            body:JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Client-ID': this.client_id
            }
        })
        return await res.json();
    } catch (err) {
        console.error(err);
    }
  }

  async on(response) {
    const token = this.chat_token;
    const data =             
        JSON.stringify({
            "type": "AUTH",
            "nonce": "connection",
            "data": {
                "token": token
            }
        });
    const ping = 
        JSON.stringify({
          "type": "PING",
          "nonce": "ping"
        });

    const ws = new WebSocket('wss://open-chat.trovo.live/chat');
    //Keep connection alive
    //Trovo API docs recommend sending ping every 30 seconds
    let sendPing = setInterval(function() {
      ws.send(ping);
    }, 1*30*1000); //30 seconds

    ws.on('open', function open() {
        ws.send(data);
    });

    ws.on("close", function(code) {
      clearInterval(sendPing);
      console.log('disconnected code: ',code);
    })

    ws.on('error', function (error) {
      console.log("error", error);
    })

    ws.on('message', message => {
      //console.log("%s", message);
      message = JSON.parse(message);
      if(message.type === "CHAT") {
        const eidArr = message.data.eid.split("_");
        if(eidArr[1] === "0") {
          //previous chats (before starting the bot)
          return;
        }
        message.data.chats.map(chat => {
          response(chat);
        });
      }
    });

  }

}
