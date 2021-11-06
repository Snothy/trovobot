const req = require('./requests');
const ws = require('ws');

module.exports = class Bot {
  constructor(settings) {
    this.viewport = { width: 1920, height: 1080 };
    this.headless = true;
    //this.channel_id = ""
    //this.chat_token = "";
    //this.auth_code = "";
    //this.OAuth = "";
    
    if(settings) {
      this.login = settings.login;
      this.client_id = settings.client_id;
      this.client_secret = settings.client_secret;
      this.chat_username = settings.chat_username;
    }
  }

  async init() {
    /**
     * 
     */
    this.auth_code = await req.login(this.login, this.client_id, headless, viewport);
    this.OAuth = await req.getOAuth(this.auth_code, this.client_id, this.client_secret);
    this.channel_id = await req.getChannelId(this.client_id, [this.chat_username]);
    this.chat_token = await req.getChannelChatToken(this.client_id, this.channel_id);
  }

  async connect() {
    const ws = new WebSocket('wss://open-chat.trovo.live/chat');
    ws.on('open', function open() {
        const data =             
        {
            "type": "AUTH",
            "nonce": "connection",
            "data": {
                "token": this.chat_token
            }
        }
        ws.send(JSON.stringify(data))

        //a
    })

    ws.on('message', function incoming(message) {
        const message_object = JSON.parse(message);
        //First message received is the response from the server to the data we sent in the 'open' method
        //Second message received is a list of currently visible messages in chat
        //Third+ are new messages so chats[] should have one value
        let message_data;
        if(message_object.type === 'CHAT') {
            if(message_object.data.chats.length > 1) {
                //ignoring the load of visible messages
                return
            }
            message_data = message_object.data.chats[0];
        } else {
            return;
        }
        //console.log(message_data);
        const message_content = message_data.content;
        console.log(message_content);
        //setup prefix...
        //if msg.content.startswith(prefix) => ....
      });
  }
  
}