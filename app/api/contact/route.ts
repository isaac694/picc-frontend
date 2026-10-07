import { NextResponse } from "next/server";
import nodemailer from "nodemailer";


export async function POST(request: Request) {

try {

const {
name,
email,
subject,
message
} = await request.json();


if(!name || !email || !message){

return NextResponse.json(
{
error:"Please complete all required fields."
},
{
status:400
}
);

}


const transporter = nodemailer.createTransport({

host:
"smtp.office365.com",

port:
587,

secure:
false,

auth:{

user:
process.env.SMTP_USER,

pass:
process.env.SMTP_PASSWORD

},

tls:{
ciphers:"SSLv3"
}

});



await transporter.sendMail({

from:
`PICC Website <${process.env.SMTP_USER}>`,


to:
process.env.CONTACT_EMAIL,


replyTo:
email,


subject:
subject || "New Message From PICC Website",


html:`

<h2>New Website Contact Message</h2>

<p>
<strong>Name:</strong> ${name}
</p>

<p>
<strong>Email:</strong> ${email}
</p>

<p>
<strong>Message:</strong>
</p>

<p>
${message}
</p>

`

});


return NextResponse.json({

success:true,

message:
"Message sent successfully."

});


}

catch(error){

console.error(
"EMAIL ERROR:",
error
);


return NextResponse.json(
{
error:"Failed to send email."
},
{
status:500
}
);

}

}