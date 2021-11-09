const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

exports.login = async function login(login_credentials, client_id, headless, viewport) {
  /**
   * 
   */

  const scope = "channel_details_self+channel_update_self+user_details_self+chat_send_self+chat_connect+send_to_my_channel+manage_messages"
  const url = `https://open.trovo.live/page/login.html?client_id=${client_id}&response_type=code&scope=${scope}&redirect_uri=https%3A%2F%2Ftrovo.live&state=statedata`;

  const browser = await puppeteer.launch({headless: headless});
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0' });


  const emailPath = 'div.login-box > div.content-box > div.content-left > div > div:nth-child(2) > div > input';
  await page.type(emailPath, login_credentials.email);
  
  
  const passPath = 'div.login-box > div.content-box > div.content-left > div > div:nth-child(4) > div > input';
  await page.type(passPath, login_credentials.password);


  await page.click('div.login-box > div.content-box > div.content-left > div > button');
  await page.waitForNavigation({ timeout: 20000 });

  let auth_code = await page.url();
  auth_code = auth_code.split('?code=');
  auth_code = auth_code[1].split('&expire');
  auth_code = auth_code[0];
  
  await browser.close();

  return auth_code;

}

exports.getOAuth = async function getOAuth(auth_code, client_id, client_secret) {
  /**
   * 
   */
  const url = 'https://open-api.trovo.live/openplatform/exchangetoken';
  const body = {
      "client_secret": client_secret,
      "grant_type": "authorization_code",
      "code": auth_code,
      "redirect_uri": "https%3A%2F%2Ftrovo.live"
  }

  try {
      res = await fetch(url, {
          method:'POST',
          body: JSON.stringify(body),
          headers: {
              'Accept': 'application/json',
              'client-id': client_id,
              'Content-Type': 'application/json'
          }
      })
      result = await res.json();   //contains oauth token, expiry date..
      return result.access_token;  //oauth token
  } catch(err) {
      console.error(err);
  }
}

exports.getChannelId = async function getChannelId(client_id, listOfUsernames) {
  /**
   * 
   */
  const url = 'https://open-api.trovo.live/openplatform/getusers';
  body = {
      'users': listOfUsernames
  }
  try {
      res = await fetch(url, {
          method:'POST',
          body:JSON.stringify(body),
          headers: {
              'Accept': 'application/json',
              'Client-ID': client_id
          }
      })
      const response = await res.json();
      const id = response.users[0].channel_id;
      return id;
  } catch (err) {
      console.error(err);
  }
}

exports.getChannelChatToken = async function getChannelChatToken(client_id, channel_id) {
  /**
   * 
  */
  const url = `https://open-api.trovo.live/openplatform/chat/channel-token/${channel_id}`;
  try {
     res = await fetch(url, {
         method:'GET',
         headers: {
             'Accept': 'application/json',
             'Client-ID': client_id
         }
     })
     const response = await res.json();
     const token = response.token;
     return token;
  } catch (err) {
      console.error(err);
  }
}

exports.getOwnChatToken = async function getOwnChatToken(client_id, OAuth) {
  /**
   * 
   */
  const url = 'https://open-api.trovo.live/openplatform/chat/token';
  try {
      res = await fetch(url, {
          method:'GET',
          headers: {
              'Accept': 'application/json',
              'Client-ID': client_id,
              'Authorization': `OAuth ${OAuth}`
          }
      })
      const response = await res.json();
      const token = response.token;
      return token;
  } catch (err) {
      console.error(err);
  }
}

exports.sendMessage = async function sendMessage(client_id, OAuth, message) {
  /**
   * 
   */
  const url = 'https://open-api.trovo.live/openplatform/chat/send';
  body = {
      'content': message,
      'channel_id': '101396358'
  }
  try {
      res = await fetch(url, {
          method:'POST',
          body:JSON.stringify(body),
          headers: {
              'Accept': 'application/json',
              'Client-ID': client_id,
              'Authorization': `OAuth ${OAuth}`
          }
      })
  } catch (err) {
      console.error(err);
  }
}