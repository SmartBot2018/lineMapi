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
        rep = "ตอบกลับ User "+id+"\n"+rep
        nosql.postback.push({id:id, ask: ask, ans:'', finish: false});
        return client.pushMessage(AdminID, {type:'text',text:rep});
      }
      if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`;
      }
      console.log(`ตอบกลับ: ${data}`);
      //return replyText(event.replyToken, `ตอบกลับ: ${data}`);

    case 'beacon':
      return replyText(event.replyToken, `Beacon: ${event.beacon.hwid}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

let AdminID = 'Ua977e08485538fad4ae662635ac4636d';
client.pushMessage(AdminID, {type:'text',text: "บอทเริ่มการทำงาน"});
const nosql = {
  chat: [
    {
      ask: "ลงทะเบียน",
      ans: "ลงเรียนภาคเรียนที่ 1/2562 \nในวันที่ 1 มิ.ย.62 - 20 มิ.ย.62  \nตามลิ้งที่อยู่ด้านล่างนี้ \nhttp://reg.pkru.ac.th/"
    },
    {
      ask: "วันเปิดภาคเรียน",
      ans: "วันที่ 4 มิถุนายน 2562"
    },
    {
      ask: "ติดต่อ",
      ans: "เลขที่ 21 หมู่ที่ 6 ตำบลรัษฎา \nอำเภอเมือง จังหวัดภูเก็ต 83000  \nหมายเลขโทรศัพท์ \n076-240-474 ต่อ 4000 \n076-211-959 ต่อ 4000 \nหมายเลขโทรศัพท์/โทรสาร 076-218-806"
    },
    {
      ask: "ชำระเงิน",
      ans: "นักศึกษาสามารถชำระเงิน\nค่าลงทะเบียน ภาคเรียนที่ 1/2562 \nได้ภายในวันที่ \n4 มิ.ย.62 - 2 ก.ค.62"
    },
    {
      ask: "สัปดาห์วิทยาศาสตร์แห่งชาติ",
      ans: "วันที่ 18 ส.ค. 62 - 20 ส.ค. 62"
    },
    {
      ask: "รับรางวัล",
      ans: "ประกาศผลการแข่งขัน ณ สถานที่แข่งขัน และรับเงินทางวัลที่สำนักงานคณะฯ (ตึกเพชรภูมิภัฏ)"
    },
  ],
  teach: [
    {
      id: '',
      ask: '',
      ans: ''
    }
  ],
  postback: [],
  help: []
};

function checkPostback(to, msg, author) {
  msg = msg.replace("ตอบ ","")
  let database = nosql.postback;
  let index = Object.keys(database).length;
  var id = '';
  var has = false;
  var ask = '';
  var ans = '';
  var reply;
  database.forEach((item, i) => {
    if (!item.finish) {
      item.finish = true;
      reply = item;
      nosql.postback[i] = item;
    }
  })
  if (!reply) {
    console.log("No postback handle.");
  } else {
    console.log("Do postback habdle.");
    id = reply.id;
    ask = reply.ask;
    ans = msg;
    has = true;
    database.forEach((item, i) => {
      if (item.finish) {
        delete nosql.postback[i];
      }
    })
  }
  if (has && author.id == AdminID) {
    console.log("Push Mesaage to User Id "+id);
    client.pushMessage(id, {type:'text',text: msg}).catch((err) => console.error(err))
    nosql.chat.push({ask:ask,ans:ans});
  }
  return Boolean(has);
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
        nosql.help.push({name: item.ask, text: item.ask})
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
  if (checkPostback(to, msg, author) && author.id == AdminID && msg.includes("ตอบ ")) {
    return;
  } else if (teachBot(author.id) && author.id == AdminID) {
    return replyTeach(to, msg, author);
  } else if (msg.startsWith("สอน") && author.id == AdminID) {
    nosql.teach.push({id: author.id, ask: '', ans: ''});
    return replyText(to, 'จะให้บอทเรียนรู้คำถามอะไรครับ');
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
  else if (msg.includes('สาขาที่เปิดสอน')) {
    subject_list(to);
  }
  else if (msg.includes('ลบชุดคำสั่ง')){
    let datas = { flex:[] };
    nosql.chat.forEach(item=>{
      nosql.help.forEach(items=>{
        if (items == item) {
          datas.flex.push({ask:item.ask,ans:item.ans});
        }
      });
    });
    delete_list(to, datas);
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
  else if (msg.includes('ปฏิทินการศึกษา') || msg.includes('ปฎิทินการศึกษา')) {
    let picture_url = baseURL+'/static/picture.jpg';
    return client.replyMessage(replyToken,
    {
      type: "image",
      originalContentUrl: picture_url,
      previewImageUrl: picture_url,
    })
  }
  else if (msg.toLowerCase().startsWith('help') || msg.startsWith('คำสั่ง') || msg.startsWith('ช่วยเหลือ')) {
    help_list(to);
  }
  else if (msg.startsWith('!eval')) { //คำสั่งพิเศษ สำหรับ Debug bot แบบ Real-Time
    let cmd = msg.slice(6);
    if (author.id != AdminID) return;
    eval(cmd).catch((err)=>{console.log(err)});
  }
  else
  {
    Receiver(AdminID, msg, author);
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
  //console.log(JSON.parse(result[0].nosql));
  //nosql = JSON.parse(result[0].nosql);
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
      //console.log("บันทึกข้อมูลปัจจุบันลงฐานข้อมูล");
    });
  }, 5000);
});

function Receiver(to, msg, author) {
  client.pushMessage(to, {
    "type": "flex",
    "altText": "ส่งข้อความถึงคุณ",
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

function subject_list(to) {
  return client.replyMessage(
    to, 
    {
      "type": "flex",
      "altText": "Flex Message",
      "contents": {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาคณิตศาสตร์ประยุกต์",
                  "align": "center",
                  "gravity": "bottom",
                  "weight": "regular",
                  "color": "#000000"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/mathsci/"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาคหกรรมศาสตร์",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/th/news/news/tag/สาขาวิชาคหกรรมศาสตร์"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาวิทยาศาสตร์",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/th/component/k2/tag/สาขาวิชาวิทยาศาสตร์ทั่วไป"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาวิทยาศาสตร์สิ่งแวดล้อม",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/envisci/"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาธารณสุขศาสตรบัณฑิต",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/th/news/tag/สาขาวิชาสาธารณสุขศาสตร์"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาเทคโนโลยีดิจิทัล",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/dt/"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาเทคโนโลยีสถาปัตยกรรม",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://archtech.pkru.ac.th/th/"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          },
          {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ยินดีต้อนรับสู่เว็บไซต์",
                  "align": "center",
                  "weight": "bold"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": baseURL+'/static/logo.jpg',
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "สาขาวิชาเทคโนโลยีอุตสาหการ",
                  "align": "center"
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "เข้าสู่เว็บไซต์",
                    "uri": "http://www.pkru.ac.th/industrial/"
                  },
                  "color": "#20BF0F",
                  "style": "primary"
                }
              ]
            }
          }
        ]
      }
    });
}


function help_list(to) {
let helpObject = {
  "type": "flex",
  "altText": "HELP คำช่วยเหลือ",
  "contents": {
    "type": "bubble",
    "direction": "ltr",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "คำสั่งช่วยเหลือ",
          "align": "center",
          "weight": "bold",
          "color": "#000000"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "ลงทะเบียน",
            "text": "ลงทะเบียน",
            "data": "ลงทะเบียน"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "วันเปิดภาคเรียน",
            "text": "วันเปิดภาคเรียน",
            "data": "วันเปิดภาคเรียน"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "ปฏิทินการศึกษา",
            "text": "ปฏิทินการศึกษา",
            "data": "ปฏิทินการศึกษา"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "สาขาที่เปิดสอน",
            "text": "สาขาที่เปิดสอน",
            "data": "สาขาที่เปิดสอน"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "สัปดาห์วิทยาศาสตร์แห่งชาติ",
            "text": "สัปดาห์วิทยาศาสตร์แห่งชาติ",
            "data": "สัปดาห์วิทยาศาสตร์แห่งชาติ"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "ชำระเงิน",
            "text": "ชำระเงิน",
            "data": "ชำระเงิน"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "รับรางวัล",
            "text": "รับรางวัล",
            "data": "รับรางวัล"
          },
          "color": "#20BF0F",
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "postback",
            "label": "ติดต่อ",
            "text": "ติดต่อ",
            "data": "ติดต่อ"
          },
          "color": "#20BF0F",
          "style": "primary"
        }
      ]
    },
    "styles": {
      "header": {
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
  let help = helpObject;
  nosql.help.forEach(button=>{
    if (button) {
      help.contents.footer.contents.push({
        "type": "button",
        "action": {
          "type": "postback",
          "label": `${button.name}`,
          "text": `${button.text}`,
          "data": `${button.text}`
        },
        "color": "#20BF0F",
        "style": "primary"
      })
    }
  })
  return client.replyMessage(to, help);
}

function delete_list(to, data) {
  let del = {
    "type": "flex",
    "altText": "Flex Message",
    "contents": {
      "type": "carousel",
      "contents": [
        
      ]
    }
  }
  if (Object.keys(data).length < 1) return console.log("ไม่มีรายการสอน");
  data.flex.forEach(teached=>{
    let flex = {
      "type": "bubble",
      "direction": "ltr",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "คำถาม : "+teached.ask,
            "align": "start",
            "weight": "bold"
          },
          {
            "type": "text",
            "text": "คำตอบ : "+teached.ans,
            "align": "start",
            "weight": "bold",
            "wrap": true
          }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "button",
            "action": {
              "type": "postback",
              "label": "ลบชุดคำสั่ง",
              "text": "ลบสอน "+teached.ask,
              "data": "ลบสอน "+teached.ask
            },
            "color": "#20BF0F",
            "style": "primary"
          }
        ]
      }
    }
    del.contents.contents.push(flex);
  })
  return client.replyMessage(to, del);
}