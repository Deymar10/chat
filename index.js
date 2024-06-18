const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.post('/webhook', (req, res) =>{
    console.log('POST: webhook');

    const body = req.body;

    if(body.object ==='page'){

        body.entry.forEach(entry =>{
            //se reciben y procesan los mensajes
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            const sender_psid = webhookEvent.sender.id;
            console.log(`Sender PSID: ${sender_psid}`);

            //validar que estamos recibiendo un mensaje 
            if (webhookEvent.message){
                handleMessage(sender_psid, webhookEvent.message);
            }else if(webhookEvent.postback){
                handlePostback(sender_psid, webhookEvent.postback);
            }
        });

        res.status(200).send('EVENTO RECIBIDO'); 
    }else{
        res.sendStatus(404);
    }
});

app.get('/webhook', (req, res) =>{
    console.log('GET: webhook');

    const VERIFY_TOKEN = 'stringUnicoParaTuAplicacion';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode == 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK VERIFICADO');
            res.status(200).send(challenge);
        }else{
            res.sendStatus(404);
        }
    }else{
        res.sendStatus(404);
    }
});

app.get('/', (req, res)=>{
    res.status(200).send('hola a mi bot deymar huanca ')
})

function handleMessage(sender_psid, received_message){
    let response;

    if(received_message.text){
        response = {
            'text': `Tu mensaje fue : ${received_message.text} :) ahora mandame mas cosas`
        };
    }else if(received_message.attachments){
        const url = received_message.attachments[0].payload.url;
        response = {
            "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"confirma tu imagen",
            "image_url":url,
            "subtitle":"Este es un ejemplo de prueba",

            "buttons":[
              {
                "type":"postback",
                "title":"Si!",
                "payload":"yes"
              },{
                "type":"postback",
                "title":"No",
                "payload":"no"
              }              
            ]      
          }
        ]
      }
    }
        }
    }

    callSendAPI(sender_psid, response);
}
function handlePostback(sender_psid, received_postback){
    let response = '';

    const payload = received_postback.payload;

    if(payload === 'yes'){
        response = {'text': 'Muchas gracias por la foto :)'};
    }else if(payload === 'no'){
        response = {'text': 'No te preocupes, manda otra foto'};
    }

    callSendAPI(sender_psid, response);
}
function callSendAPI(sender_psid, response){
    const requestBody = {
        'recipient': {
            'id': sender_psid
        },
        'message': response
    };

    request({
        'uri':'https://graph.facebook.com/v2.6/me/messages',
        'qs':{'access_token': PAGE_ACCESS_TOKEN},
        'method': 'POST',
        'json': requestBody
    },(err, res, body)=>{
        if(!err){
            console.log('mensaje enviado de vuelta');
        }else{
            console.log('Imposible enviar mensaje :(',err);
        }
    });

}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
    console.log('Servidor iniciado');
});