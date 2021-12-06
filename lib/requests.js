const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

/**
   * Performs automatic OAuth2 login for the BOT account. Prompts a login for the user if there is a need to allow certain new scopes.
   * @param {string} client_id The application's client_id
   * @param {Array<string>} scopes The scopes for which the application will be authenticated
   * @param {object} login Login details for bot account. Required to authorize the scopes for the application
   * @param {string} login.email The bot account's username
   * @param {string} login.password The bot account's password
   * @param {string} viewport Dimensions in which the puppeteer browser will run
   * @param {boolean} headless Whether the puppeteer browser will be headless or not
   * @returns {Promise<string>} Authentication code for performing OAuth2 authentication with Trovo's API.
   */
exports.login = async function login (client_id, scopes, login, viewport, headless) {
  const scopesString = scopes.join('+');
  let url = `https://open.trovo.live/page/login.html?client_id=${client_id}&response_type=code&scope=` + scopesString + '&redirect_uri=https%3A%2F%2Ftrovo.live&state=statedata';
  console.log('Launching...');

  const browser = await puppeteer.launch({ headless: headless });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url);
  // await waitTillHTMLRendered(page);
  await page.waitForNetworkIdle({ waitUntil: 'load', timeout: 7000 }).catch(() => {

  });

  const emailPath = 'div.login-box > div.content-box > div.content-left > div > div:nth-child(2) > div > input';
  await page.type(emailPath, login.email).catch(() => {
    throw new Error('Invalid client_id or page failed to load in time');
  });
  console.log('Page loaded');

  const passPath = 'div.login-box > div.content-box > div.content-left > div > div:nth-child(4) > div > input';
  await page.type(passPath, login.password);
  await page.click('div.login-box > div.content-box > div.content-left > div > button');

  // Check for paragraph, which contains the string Wrong (for wrong username/email or password)
  // if the paragraph isnt found within 1.5seconds, continue (.catch()), as the function throws on unsuccessful find
  await page.waitForXPath("//p[contains(., 'Wrong')] | //p[contains(., 'This')]", { timeout: 1500 })
    .then(() => {
      console.log('Incorrect bot login credentials');
      process.exit();
    })
    .catch(async () => {
      console.log('Logged in');
      await page.waitForNavigation({ waitUntil: 'load', timeout: 3000 }).catch(() => {

      });
    });

  let newScopes = false;
  if (await page.url() === url) {
    // Allowing scope permissions
    console.log('Allowing new scopes for bot');
    const [button] = await page.$x("//button[contains(., 'Allow')]");
    if (button) {
      await button.click();
    }
    newScopes = true;
    console.log('Allowed');
    await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {

    });
  }

  let auth_code = await page.url();
  auth_code = auth_code.split('?code=');
  auth_code = auth_code[1].split('&expire');
  auth_code = auth_code[0];
  await browser.close();

  // if there are new scopes, prompt the user to log into their account (the account linked to the chat the bot will be running in)
  // so they can allow the new scopes for the application
  if (newScopes) {
    console.log('Log into the chat_username account to allow the scopes for the app');
    url = `https://open.trovo.live/page/login.html?client_id=${client_id}&response_type=token&scope=${scopesString}&redirect_uri=https://trovo.live&state=statedata`;
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });
    // await page.waitForNetworkIdle({waitUntil: 'load', timeout: 0 });

    // wait for home button (present on the redirect url)
    await page.waitForXPath("//button[contains(., 'APP')]", { timeout: 60000 })
      .then(async () => {
      // successful login
        console.log('Allowed');
        await browser.close();
      })
      .catch(async () => {
      // timeout
        await browser.close();
        console.log('Timed out');
        process.exit();
      });
  }
  return auth_code;
};

/**
   * Use access token obtained from OAuth2 login to authenticate with trovo's API
   * @param {string} client_secret The application's client_secret
   * @param {string} client_id The application's client_id
   * @param {string} auth_code Authentication code obtained from OAuth2 login
   * @returns {Promise<string>} OAuth access token which is used to prove identity in certain requests
   */
exports.getOAuth = async function getOAuth (client_secret, client_id, auth_code) {
  const url = 'https://open-api.trovo.live/openplatform/exchangetoken';
  const body = {
    client_secret: client_secret,
    grant_type: 'authorization_code',
    code: auth_code,
    redirect_uri: 'https%3A%2F%2Ftrovo.live'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'client-id': client_id,
        'Content-Type': 'application/json'
      }
    });
    const result = await res.json(); // contains oauth token, expiry date..
    return result.access_token; // oauth token
  } catch (err) {
    console.error(err);
  }
};

/**
 * Get the channel ID of a specific user by username.
 * @param {string} client_id The application's client_id
 * @param {string} username The user's username.
 * @returns {Promise<string>|null} The user's channel ID. If an invalid username was provided, the function returns null.
 */
exports.getChannelId = async function getChannelId (client_id, username) {
  const url = 'https://open-api.trovo.live/openplatform/getusers';
  const body = {
    users: [username]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'Client-ID': client_id
      }
    });
    const response = await res.json();
    let id;
    if (response.status === 1002) {
      id = null;
    } else {
      id = response.users[0].channel_id;
    }
    return id;
  } catch (err) {
    console.error(err);
  }
};

/**
 * Get a channel's chat token. It can be used to create a connection to the chat through a websocket handshake.
 * @param {string} client_id The application's client_id
 * @param {string} channel_id The user's channel ID.
 * @returns {Promise<string>} The token which identifies the user's chat
 */
exports.getChannelChatToken = async function getChannelChatToken (client_id, channel_id) {
  const url = `https://open-api.trovo.live/openplatform/chat/channel-token/${channel_id}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Client-ID': client_id
      }
    });
    const response = await res.json();
    const token = response.token; // chat_token
    return token;
  } catch (err) {
    console.error(err);
  }
};
