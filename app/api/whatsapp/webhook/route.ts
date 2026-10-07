import { NextResponse } from "next/server";
import { getPICCContext } from "@/lib/picc-assistant";
import Groq from "groq-sdk";


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


const SYSTEM_PROMPT = `
You are PICC Assistant.

You answer questions about Pentecost International Christian Centre.

Rules:

1. Use PICC website information first.
2. If information is missing use general knowledge.
3. Never invent facts.
4. Be friendly and professional.
`;



// VERIFY WEBHOOK FROM META

export async function GET(request: Request) {

const { searchParams } =
new URL(request.url);


const mode =
searchParams.get("hub.mode");


const token =
searchParams.get("hub.verify_token");


const challenge =
searchParams.get("hub.challenge");



if(
mode === "subscribe" &&
token === process.env.WHATSAPP_VERIFY_TOKEN
){

return new Response(
challenge,
{
status:200
}
);

}


return new Response(
"Forbidden",
{
status:403
}
);

}




// RECEIVE WHATSAPP MESSAGE

export async function POST(request:Request){

try{


const body =
await request.json();



const message =
body.entry?.[0]
?.changes?.[0]
?.value
?.messages?.[0];



if(!message){

return NextResponse.json({
status:"no message"
});

}



const userText =
message.text?.body;



if(!userText){

return NextResponse.json({
status:"empty"
});

}




// GET PICC WEBSITE DATA

const context =
await getPICCContext(userText);





// ASK AI

const completion =
await groq.chat.completions.create({

model:
"openai/gpt-oss-20b",


messages:[

{
role:"system",
content:SYSTEM_PROMPT
},

{
role:"user",
content:`

QUESTION:

${userText}


PICC INFORMATION:

${context}

`
}

],

temperature:0.3

});



const answer =
completion
.choices[0]
.message
.content;



// SEND RESPONSE TO WHATSAPP


await fetch(
`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
{

method:"POST",

headers:{

Authorization:
`Bearer ${process.env.WHATSAPP_TOKEN}`,

"Content-Type":
"application/json"

},


body:JSON.stringify({

messaging_product:
"whatsapp",

to:
message.from,


type:
"text",


text:{
body:
answer ||
"Sorry, I could not answer."
}

})

}

);



return NextResponse.json({
success:true
});


}

catch(error){

console.error(
"WhatsApp webhook error",
error
);


return NextResponse.json(
{
error:"Webhook failed"
},
{
status:500
}
);

}

}