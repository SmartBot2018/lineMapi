'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const mysql = require('mysql');
const con = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.pass,
  database: process.env.user
});
const config = {
  channelAccessToken: 'NnnCDl7B2mwV9lgeRh682Pl+MY1OggkPdVJnYcvR2zOTAO37el5r0Z1PjqIIv1n3c9GwSQ1p/oWdiFOTPPvjKlEu+BU4+ejElMlso7ZKV2eTln8+JCAgc4//8c1BMFmMegwL8gGaVdodd+9M1bjvOgdB04t89/1O/w1cDnyilFU=',
  channelSecret: '823cb74cb02d642c94d5ce764387daa7',
};
let baseURL = 'https://api-m-line.herokuapp.com';
const client = new line.Client(config);
const app = express();
app.use('/static', express.static('static'));
app.get('/', (req, res) => {
  res.send('<html><head><title>Bot</title></head><body> หน้าแรก </body><html>');
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
  if (event.source.type !== 'user') return;
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        case 'image':
          return handleImage(message, event.replyToken);
        case 'video':
          return handleVideo(message, event.replyToken);
        case 'audio':
          return handleAudio(message, event.replyToken);
        case 'location':
          return handleLocation(message, event.replyToken);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }
    
    case 'follow':
      return replyText(event.replyToken, 'ขอบคุณที่เป็นเพื่อนกัน');

    case 'unfollow':
      return console.log(`เลิกติดตามบอท: ${JSON.stringify(event)}`);
    
    case 'postback':
      let data = event.postback.data;
      let rep = 'พิมพ์ข้อความเพื่อตอบผู้ใช้และบันทึกคำถาม';
      console.log(event.postback);
      if (data.startsWith('nomsg')) {
        let id = data.split('_')[1];
        let ask = data.split('_')[2];
        nosql.postback.push({id:id, ask: ask, ans:''});
        return client.pushMessage(AdminID, {type:'text',text:rep});
      }
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
let AdminID = 'U1b1284059649875eaf3b0a66d586989f';
var nosql = {
  chat: [
    {
      ask: 'ลงทะเบียน',
      ans: "ลงเรียนภาคเรียนที่ 2/2561 \nในวันที่ 11 ธ.ค.61 - 9 ม.ค. 62  \nตามลิ้งที่อยู่ด้านล่างนี้ \nhttp://reg.pkru.ac.th/"
    },
    {
      ask: 'วันเปิดภาคเรียน',
      ans: 'วันที่ 11 ธันวาคม 2561'
    },
    {
      ask: 'ติดต่อ',
      ans: 'เลขที่ 21 หมู่ที่ 6 ตำบลรัษฎา \nอำเภอเมือง จังหวัดภูเก็ต 83000  \nหมายเลขโทรศัพท์ \n076-240-474 ต่อ 4000 \n076-211-959 ต่อ 4000 \nหมายเลขโทรศัพท์/โทรสาร 076-218-806'
    },
    {
      ask: 'ชำระเงิน',
      ans: 'นักศึกษาสามารถชำระเงิน\nค่าลงทะเบียน ภาคเรียนที่ 2/2561 \nได้ภายในวันที่ \n11 ธ.ค.61 - 9 ม.ค.62'
    },
    {
      ask: 'สอบสัมภาษณ์',
      ans: 'สอบสัมภาษณ์รับนักศึกษา  \nรอบ Portfolioและโควตาทั่วไป  \nประจําปีการศึกษา 2562 \nในวันที่ 8 ม.ค. 62'
    }
  ],
  teach: [
    {
      id: '',
      ask: '',
      ans: ''
    }
  ],
  postback: []
};

function checkPostback(to, msg, author) {
  let database = nosql.postback;
  var id = '';
  var has = false;
  var ask = '';
  var ans = '';
  var item = nosql.postback[Object.keys(database).length];
  if (!item) {
    console.log("No postback handle.");
    return has;
  } else {
    console.log("Do postback habdle.");
    id = item.id;
    ask = item.ask;
    ans = msg;
    has = true;
    delete nosql.postback[Object.keys(database).length];
  }
  if (has && author.id == AdminID) {
    console.log("Push Mesaage to User Id");
    client.pushMessage(id, {type:'text',text: msg}).catch((err) => console.error(err))
    nosql.chat.push({ask:ask,ans:ans});
  }
  return has;
}

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
        .then(item.id = '1'+(Math.floor(Math.random * 9999)));
      }
    });
  } else return true;
};

function handleMessage(message, replyToken, author) {
  let msg = message.text; //ข้อความที่ส่งมา
  let to = replyToken; //Token สำหรับตอบกลับผู้ส่งแชทมา
  if (!to) return; //หากไม่มี Token ให้ย้อนกลับกรือจบการทำงานโค๊ด
  if (checkPostback(to, msg, author)) {
    return;
  } else if (teachBot(author.id)) {
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
  if (msg.includes(reply.ask)) {
    return replyText(to, reply.ans);
  }
  else if (msg.includes('สวัสดี')) { //หาก ข้อความที่ส่งมา == สวัสดี
    return replyText(to, 'สวัสดีครับ'); //ส่งข้อความกลับไปหา Token พร้อม คำพูด
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
  else if (msg.includes('ปฎิทินการศึกษา')) {
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
      "type": "flex",
      "altText": "ข้อความใหม่",
      "contents":  {
        "type": "bubble",
        "header": {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "text",
              "text": author.username+" ส่งข้อความถึงบอท",
              "weight": "bold",
              "color": "#aaaaaa",
              "size": "sm"
            }
          ]
        },
        "hero": {
          "type": "image",
          "url": `${author.picture}`,
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "cover",
          "action": {
            "type": "uri",
            "uri": `${author.picture}`
          }
        },
        "body": {
          "type": "box",
          "layout": "horizontal",
          "spacing": "md",
          "contents": [
            {
              "type": "box",
              "layout": "vertical",
              "flex": 2,
              "contents": [
                {
                  "type": "text",
                  "text": "ID: "+author.id,
                  "gravity": "top",
                  "size": "md",
                  "flex": 1
                },
                {
                  "type": "separator"
                },
                {
                  "type": "text",
                  "text": msg,
                  "gravity": "center",
                  "wrap": true,
                  "size": "xs",
                  "flex": 2
                }
              ]
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "button",
              "style": "primary",
              "color": "#000000",
              "action": {
                "type": "postback",
                "label": "ตอบ",
                "data": 'nomsg_'+author.id+'_'+msg,
              }
            }
          ]
        }
      }
    }).catch((err) => console.error(err));
  }
}


function handleText(message, replyToken, source) {
  switch (message.text) {
    case 'web':
      return replyText(replyToken, baseURL);
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

if(!con._connectCalled) 
{
  con.connect();
  console.log("เชื่อมต่อฐานข้อมูลสำเร็จ!");
}
let sql_select = 'SELECT * FROM botline';
con.query(sql_select, (error, result) => {
  if (error) return console.error(error);
  console.log('อ่านฐานข้อมูลเสร็จแล้ว');
  console.log(result[0].nosql);
  nosql = result[0].nosql;
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  if (baseURL) {
    console.log('listening on '+baseURL+'/callback');
  } else {
    console.log("It seems that BASE_URL is not set.");
  }
  //บันทึกข้อมูลลงฐานข้อมูลทุกๆ 5 วินาที
  setInterval(function() {
    if(!con._connectCalled) 
    {
      con.connect();
    }
    let backup = JSON.stringify(nosql);
    let sql = `UPDATE botline SET nosql = '${backup}' WHERE id = '1'`;
    con.query(sql, (error, result) => {
    if (error) return console.error(error);
      console.log("บันทึกข้อมูลปัจจุบันลงฐานข้อมูล");
    });
  }, 5000);
});
