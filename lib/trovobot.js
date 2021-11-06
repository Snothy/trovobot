


module.exports = class Bot {
  constructor(settings) {
    this.viewport = { width: 1920, height: 1080 };
    this.headless = true;
    this.chat_channel_id = "";
    this.auth_code = "";
    this.OAuth = "";
    
    if(settings) {
      this.login = settings.login;
      this.client_id = settings.client_id;
      this.client_secret = settings.client_secret;
      this.chat_username = settings.chat_username;
    }
  }
  
}