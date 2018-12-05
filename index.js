'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const config = {
  channelAccessToken: 'NnnCDl7B2mwV9lgeRh682Pl+MY1OggkPdVJnYcvR2zOTAO37el5r0Z1PjqIIv1n3c9GwSQ1p/oWdiFOTPPvjKlEu+BU4+ejElMlso7ZKV2eTln8+JCAgc4//8c1BMFmMegwL8gGaVdodd+9M1bjvOgdB04t89/1O/w1cDnyilFU=',
  channelSecret: '823cb74cb02d642c94d5ce764387daa7',
};
let baseURL = 'https://api-m-line.herokuapp.com';
const client = new line.Client(config);
const app = express();
app.use('/static', express.static('static'));

app.get('/', (req, res) => {
  res.send(`<html>
  <head><title>Bot</title></head>
  <body> หน้าแรก </body>
  <html>
  `);
});

app.post('/callback', line.middleware(config), (req, res) => {
  if (req.body.destination) console.log("Destination User ID: " + req.body.destination);
  if (!Array.isArray(req.body.events)) return res.status(500).end();
  Promise
    .all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

const pushText = (to, texts) => {
  return client.pushMessage(to, { type: 'text', text: texts });
};

const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

function handleEvent(event) {
  if (event.replyToken.match(/^(.)\1*$/)) {
    return console.log(`Test hook recieved: ` + JSON.stringify(event.message));
  }
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        case 'image':
          if (event.source.type == 'group') return;
          return handleImage(message, event.replyToken);
        case 'video':
          if (event.source.type == 'group') return;
          return handleVideo(message, event.replyToken);
        case 'audio':
          if (event.source.type == 'group') return;
          return handleAudio(message, event.replyToken);
        case 'location':
          if (event.source.type == 'group') return;
          console.log("Location:");
          console.log(event);
          return handleLocation(message, event.replyToken);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'follow':
      return replyText(event.replyToken, 'ขอบคุณที่เป็นเพื่อนกับเฟรนจังนะคะ ❤');

    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
      return replyText(event.replyToken, `Joined ${event.source.type}`);

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);
    
    case 'postback':
      let data = event.postback.data;
      if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`;
      }
      return replyText(event.replyToken, `ตอบกลับ: ${data}`);

    case 'beacon':
      return replyText(event.replyToken, `Beacon: ${event.beacon.hwid}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}
/*
var nosql = {};
const firebase = require("firebase-admin");
firebase.initializeApp({
  apiKey: "AIzaSyCukCyh5YSL1Y5qZd-Q4DdGwRCUDiD2Udk",
  authDomain: "m-api-8ece6.firebaseapp.com",
  databaseURL: "https://m-api-8ece6.firebaseio.com",
  projectId: "m-api-8ece6",
  storageBucket: "m-api-8ece6.appspot.com",
  messagingSenderId: "267358136099"
});
const db = firebase.database();
const ref = db.ref("chat");
ref.on("value", (snapshot) => {
  nosql = snapshot.val();
  console.log(snapshot.val());
});
*/
let AdminID = 'U1b1284059649875eaf3b0a66d586989f';
const nosql = {
  chat: [
    {
      ask: 'ลงทะเบียนเรียน',
      ans: "ลงเรียนภาคเรียนที่ 2/2561 \nในวันที่ 11 ธันวาคม 2561"
    },
    {
      ask: 'วันเปิดภาคเรียน',
      ans: 'วันที่ 11 ธันวาคม 2561'
    }
  ],
  teach: [
    {
      id: '',
      ask: '',
      ans: ''
    }
  ]
};

function teachBot(id) {
  let database = nosql.teach;
  var teacher = false;
  database.forEach(item => {
    if (item.id == id) {
      teacher = true;
    }
  });
  return Boolean(teacher);
}

const replyTeach = (to, msg, author) => {
  let database = nosql.teach;
  var askmsg = '';
  var ansmsg = '';
  var teacher = false;
  database.forEach(item => {
    if (item.id == author.id) {
      askmsg = item.ask;
      ansmsg = item.ans;
      teacher = true;
    }
  });
  if (askmsg == '') {
    database.forEach(item => {
      if (item.id == author.id) {
        item.ask = msg;
        return replyText(to, 'แล้วจะให้ตอบคำถามว่าอะไรครับ?');
      }
    });
  } else if (ansmsg == '') {
    database.forEach(item => {
      if (item.id == author.id) {
        item.ans = msg;
        nosql.chat.push({ask: item.ask,ans: item.ans});
        return replyText(to, 'บอทได้เรียนรู้\nคำถาม: '+item.ask+'\nคำตอบ: '+item.ans+'\n')
        .then(delete nosql.teach[item]);
      }
    });
  } else return true;
};

function handleMessage(message, replyToken, author) {
  let msg = message.text; //ข้อความที่ส่งมา
  let to = replyToken; //Token สำหรับตอบกลับผู้ส่งแชทมา
  if (!to) return; //หากไม่มี Token ให้ย้อนกลับกรือจบการทำงานโค๊ด

  if (teachBot(author.id)) {
    return replyTeach(to, msg, author);
  } else if (msg.startsWith("สอน")) {
    nosql.teach.push({id: author.id, ask: '', ans: ''});
    return replyText(to, 'จะให้บอทเรียนคำถามอะไรครับ');
  }

  let database = nosql.chat;
  let reply = {};
  database.forEach(item => {
    if (msg.includes(item.ask)) {
      reply = item;
    } 
  });
  console.log(reply);
  if (msg.includes(reply.ask)) {
      return replyText(to, reply.ans);
  }
  else if (msg.includes('สวัสดี')) { //หาก ข้อความที่ส่งมา == สวัสดี
    return replyText(to, 'สวัสดีค่ะ'); //ส่งข้อความกลับไปหา Token พร้อม คำพูด
  }
  else if (msg.includes('ตำแหน่ง')) {
    return client.replyMessage(replyToken,
    {
          "id": "1",
          "type": "location",
          "title": "คณะวิทยาศาสตร์และเทคโนโลยี",
          "address": "21 ถนน เทพกระษัตรี ตำบล รัษฎา อำเภอเมืองภูเก็ต ภูเก็ต 83000 ประเทศไทย",
          "latitude": 7.910254,
          "longitude": 98.386094,
    })
  }
  else if (msg.includes('ตารางกิจกรรม')) {
    let picture_url = baseURL+'/static/picture.jpg';
    return client.replyMessage(replyToken,
    {
      type: "image",
      originalContentUrl: picture_url,
      previewImageUrl: picture_url,
    })
  }
  else if (msg.startsWith('!สอน')) {
    let teact = msg.slice(5);
    let askmsg = teact.split(' ')[0];
    let ansmsg = teact.split(' ')[1];
    database.push({ask:askmsg,ans:ansmsg});
    return replyText(to, 'คุนได้สอนบอทพูด\nคำถาม: '+askmsg+'\nคำตอบ: '+ansmsg);
  }
  else if (msg.startsWith('!eval')) { //คำสั่งพิเศษ สำหรับ Debug bot แบบ Real-Time
    let cmd = msg.slice(6);
    if (author.id != AdminID) return;
    eval(cmd).catch((err)=>{console.log(err)});
  }
  else
  {
    client.pushMessage(AdminID, {
      type: "text",
      text: "ข้อความจาก " + author.username + "\nID: " + author.id + "\nพูด: " + msg
    });
  }
}


function handleText(message, replyToken, source) {
  const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;
  switch (message.text) {
    case 'invite':
      return replyText(replyToken, `เข้ากลุ่มแชทบอท\n${botInvite}`);
    case 'profile':
      if (source.userId) {
        var profile;
        try {
          client.getProfile(source.userId)
          .then((p) => {
            profile = p;
          });
        } catch(err) {
          console.error(err);
        }
        return replyText(replyToken, `ชื่อ: ${profile.displayName}\nสถานะ: ${profile.statusMessage}`);
      } else {
        return replyText(replyToken, 'คุณไม่สามารถใช้คำสั่งนี้ได้ค่ะ');
      }
    case '!buttons':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Buttons alt text',
          template: {
            type: 'buttons',
            thumbnailImageUrl: buttonsImageURL,
            title: 'My button sample',
            text: 'Hello, my button',
            actions: [
              { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
              { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
              { label: 'Say message', type: 'message', text: 'Rice=米' },
            ],
          },
        }
      );
    case '!confirm':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Confirm alt text',
          template: {
            type: 'confirm',
            text: 'Do it?',
            actions: [
              { label: 'Yes', type: 'message', text: 'Yes!' },
              { label: 'No', type: 'message', text: 'No!' },
            ],
          },
        }
      )
    case '!carousel':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Carousel alt text',
          template: {
            type: 'carousel',
            columns: [
              {
                thumbnailImageUrl: buttonsImageURL,
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
                  { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
                ],
              },
              {
                thumbnailImageUrl: buttonsImageURL,
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
                  { label: 'Say message', type: 'message', text: 'Rice=米' },
                ],
              },
            ],
          },
        }
      );
    case '!image carousel':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Image carousel alt text',
          template: {
            type: 'image_carousel',
            columns: [
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
              },
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              },
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Say message', type: 'message', text: 'Rice=米' },
              },
              {
                imageUrl: buttonsImageURL,
                action: {
                  label: 'datetime',
                  type: 'datetimepicker',
                  data: 'DATETIME',
                  mode: 'datetime',
                },
              },
            ]
          },
        }
      );
    case '!datetime':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: 'Datetime pickers alt text',
          template: {
            type: 'buttons',
            text: 'Select date / time !',
            actions: [
              { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
              { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
              { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
            ],
          },
        }
      );
    case '.imagemap':
      return client.replyMessage(
        replyToken,
        {
          type: 'imagemap',
          baseUrl: `${baseURL}/static/rich`,
          altText: 'Imagemap alt text',
          baseSize: { width: 1040, height: 1040 },
          actions: [
            { area: { x: 0, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/manga/en' },
            { area: { x: 520, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/music/en' },
            { area: { x: 0, y: 520, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/play/en' },
            { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
          ],
          video: {
            originalContentUrl: `${baseURL}/static/imagemap/video.mp4`,
            previewImageUrl: `${baseURL}/static/imagemap/preview.jpg`,
            area: {
              x: 280,
              y: 385,
              width: 480,
              height: 270,
            },
            externalLink: {
              linkUri: 'https://line.me',
              label: 'LINE'
            }
          },
        }
      );
    case 'bye':
      switch (source.type) {
        case 'user':
          return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
        case 'group':
          return replyText(replyToken, '✅ | กำลังออกจากกลุ่มค่ะ')
            .then(() => client.leaveGroup(source.groupId));
        case 'room':
          return replyText(replyToken, '✅ | กำลังออกจากห้องค่ะ')
            .then(() => client.leaveRoom(source.roomId));
      }
    default:
      let author = {
        id: '',
        username: '',
        picture: '',
        status: '',
      };
      console.log(`Message: ${message.text} to ${replyToken} from ${source.userId || source.groupId || source.roomId}`);
      if (!source.userId) return;
      client.getProfile(source.userId)
      .then((profile) => {
        author.id = profile.userId;
        author.username = profile.displayName;
        author.picture = profile.pictureUrl;
        author.status = profile.statusMessage;
        return handleMessage(message, replyToken, author);
      })
      
  }
}

function handleImage(message, replyToken) {
  let getContent;
  if (message.contentProvider.type === "line") {
    var downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
    var previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);
    getContent = downloadContent(message.id, downloadPath)
      .then((downloadPath) => {
        cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);
        return {
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        };
      });
  } else if (message.contentProvider.type === "external") {
    getContent = Promise.resolve(message.contentProvider);
  }
  var image_url;
  return getContent
    .then(({ originalContentUrl, previewImageUrl }) => {
      image_url = originalContentUrl.originalContentUrl;
      return client.replyMessage(
        replyToken,
        {
          type: 'image',
          originalContentUrl,
          previewImageUrl,
        }
      )
    });
}

function handleVideo(message, replyToken) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
    const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);
    getContent = downloadContent(message.id, downloadPath)
      .then((downloadPath) => {
        cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);

        return {
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
        }
      });
  } else if (message.contentProvider.type === "external") {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent
    .then(({ originalContentUrl, previewImageUrl }) => {
      return client.replyMessage(
        replyToken,
        {
          type: 'video',
          originalContentUrl,
          previewImageUrl,
        }
      );
    });
}

function handleAudio(message, replyToken) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.m4a`);
    getContent = downloadContent(message.id, downloadPath)
      .then((downloadPath) => {
        return {
            originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
        };
      });
  } else {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent
    .then(({ originalContentUrl }) => {
      return client.replyMessage(
        replyToken,
        {
          type: 'audio',
          originalContentUrl,
          duration: message.duration,
        }
      );
    });
}

function downloadContent(messageId, downloadPath) {
  return client.getMessageContent(messageId)
    .then((stream) => new Promise((resolve, reject) => {
      const writable = fs.createWriteStream(downloadPath);
      stream.pipe(writable);
      stream.on('end', () => resolve(downloadPath));
      stream.on('error', reject);
    }));
}

function handleLocation(message, replyToken) {
  return client.replyMessage(
    replyToken,
    {
      type: 'location',
      title: message.title,
      address: message.address,
      latitude: message.latitude,
      longitude: message.longitude,
    }
  );
}

function handleSticker(message, replyToken) {
  if (!message.packageId) return;
  return client.replyMessage(
    replyToken,
    {
      type: 'sticker',
      packageId: message.packageId,
      stickerId: message.stickerId,
    }
  );
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  if (baseURL) {
    console.log('listening on '+baseURL+'/callback');
  } else {
    console.log("It seems that BASE_URL is not set.");
  }
});