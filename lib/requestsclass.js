const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

module.exports = class Requests {
  constructor(settings) {
    if(settings) {
      this.login_cred = settings.login;
      this.client_id = settings.client_id;
      this.client_secret = settings.client_secret;
      this.chat_username = settings.chat_username;
      this.prefix = settings.prefix;
      this.headless = settings.headless;
    }
  }

  async login() {
    /**
     * 
     */
  
    const scope = "channel_details_self+channel_update_self+chat_send_self+chat_connect+send_to_my_channel+manage_messages+user_details_self"
    const url = `https://open.trovo.live/page/login.html?client_id=${this.client_id}&response_type=code&scope=${scope}&redirect_uri=https%3A%2F%2Ftrovo.live&state=statedata`;
  
    const browser = await puppeteer.launch({headless: this.headless});
    const page = await browser.newPage();
    await page.setViewport(this.viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await waitTillHTMLRendered(page)
  
    const emailPath = 'div.login-box > div.content-box > div.content-left > div > div:nth-child(2) > div > input';
    await page.type(emailPath, this.login_cred.email);
    
    
    const passPath = 'div.login-box > div.content-box > div.content-left > div > div:nth-child(4) > div > input';
    await page.type(passPath, this.login_cred.password);
  
  
    await page.click('div.login-box > div.content-box > div.content-left > div > button');
    await page.waitForNavigation({ timeout: 20000 });
  
    let auth_code = await page.url();
    auth_code = auth_code.split('?code=');
    auth_code = auth_code[1].split('&expire');
    auth_code = auth_code[0];
    
    await browser.close();
    
    this.auth_code = auth_code;
    return auth_code;
  
  }

  async getOAuth() {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/exchangetoken';
    const body = {
        "client_secret": this.client_secret,
        "grant_type": "authorization_code",
        "code": this.auth_code,
        "redirect_uri": "https%3A%2F%2Ftrovo.live"
    }
  
    try {
        const res = await fetch(url, {
            method:'POST',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'client-id': this.client_id,
                'Content-Type': 'application/json'
            }
        })
        const result = await res.json();   //contains oauth token, expiry date..
        this.OAuth = result.access_token;
        return result.access_token;  //oauth token
    } catch(err) {
        console.error(err);
    }
  }

  async getChannelId(listOfUsernames) {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/getusers';
    const body = {
        'users': listOfUsernames
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
        const response = await res.json();
        //console.log(response);
        const id = response.users[0].channel_id;
        this.channel_id = id;
        return id;
    } catch (err) {
        console.error(err);
    }
  }

  async getChannelChatToken() {
    /**
     * 
    */
    const url = `https://open-api.trovo.live/openplatform/chat/channel-token/${this.channel_id}`;
    try {
       const res = await fetch(url, {
           method:'GET',
           headers: {
               'Accept': 'application/json',
               'Client-ID': this.client_id
           }
       })
       const response = await res.json();
       const token = response.token;
       this.chat_token = token;
       return token;
    } catch (err) {
        console.error(err);
    }
  }

  async getOwnChatToken() {
    /**
     * 
     */
    const url = 'https://open-api.trovo.live/openplatform/chat/token';
    try {
        const res = await fetch(url, {
            method:'GET',
            headers: {
                'Accept': 'application/json',
                'Client-ID': this.client_id,
                'Authorization': `OAuth ${this.OAuth}`
            }
        })
        const response = await res.json();
        const token = response.token;
        return token;
    } catch (err) {
        console.error(err);
    }
  }


}

const waitTillHTMLRendered = async (page, timeout = 30000) => {
  //function by Anand Mahajan on stackvoerflow: https://stackoverflow.com/questions/52497252/puppeteer-wait-until-page-is-completely-loaded
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    //console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);
    //console.log('waiting for page to load');

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitFor(checkDurationMsecs);
  }  
};