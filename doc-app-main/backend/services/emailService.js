const nodemailer = require("nodemailer");



// SMTP CONFIGURATION

const transporter =
nodemailer.createTransport({

host:process.env.EMAIL_HOST,

port:Number(process.env.EMAIL_PORT) || 587,

secure:Number(process.env.EMAIL_PORT) === 465,


auth:{

user:process.env.EMAIL_USER,

pass:process.env.EMAIL_PASS

}

});





// SEND EMAIL FUNCTION


const sendEmail =
async(to,subject,html)=>{


try{


console.log("====================");

console.log("EMAIL DEBUG");

console.log(
"TO:",
to
);

console.log(
"USER:",
process.env.EMAIL_USER
);

console.log(
"PASSWORD EXISTS:",
process.env.EMAIL_PASS ? "YES":"NO"
);



await transporter.verify();


console.log(
"✅ SMTP Connected"
);




const info =
await transporter.sendMail({

from:
`MedConnect <${process.env.EMAIL_USER}>`,

to,

subject,

html

});



console.log(
"✅ EMAIL SENT",
info.messageId
);



return true;



}
catch(error){


console.log(
"❌ EMAIL FAILED",
error.message
);


return false;


}


};








// TEMPLATE


const template =
(title,body)=>{


return `

<html>

<body style="font-family:Arial">


<h2>
MedConnect Hospital
</h2>


<h3>
${title}
</h3>


${body}


<br>

<p>
Thank you for choosing MedConnect
</p>


</body>

</html>

`;

};








const emailService = {



// Appointment pending


sendBookingPendingEmail:

async(
email,
patient,
doctor,
date,
time,
type
)=>{


const html =
template(

"Appointment Pending",

`

<p>
Dear ${patient},
</p>


<p>
Your appointment request has been submitted.
</p>


<table>

<tr>
<td>Doctor</td>
<td>Dr. ${doctor}</td>
</tr>


<tr>
<td>Date</td>
<td>
${new Date(date).toLocaleDateString()}
</td>
</tr>


<tr>
<td>Time</td>
<td>${time}</td>
</tr>


<tr>
<td>Type</td>
<td>
${
type==="video-call"
?
"Video Consultation"
:
"In-Person"
}
</td>
</tr>


<tr>
<td>Status</td>
<td>
Pending
</td>
</tr>


</table>

`

);



return sendEmail(

email,

"Appointment Request Submitted",

html

);


},






sendBookingConfirmedEmail:

async(
email,
patient,
doctor,
date,
time,
type,
id
)=>{


const html =
template(

"Appointment Confirmed",

`

<p>
Dear ${patient}
</p>


<p>
Your appointment is confirmed.
</p>


<p>
Appointment ID:${id}
</p>


<p>
Doctor: Dr.${doctor}
</p>


<p>
Date:${new Date(date).toLocaleDateString()}
</p>


<p>
Time:${time}
</p>


`

);


return sendEmail(

email,

"Appointment Confirmed",

html

);


},



// Appointment cancelled by admin
sendBookingCancelledEmail:

async(
email,
patient,
doctor,
date,
time,
reason
)=>{

const html =
template(

"Appointment Cancelled",

`

<p>
Dear ${patient},
</p>

<p>
We regret to inform you that your appointment has been cancelled.
</p>

<table>

<tr>
<td>Doctor</td>
<td>Dr. ${doctor}</td>
</tr>

<tr>
<td>Date</td>
<td>
${new Date(date).toLocaleDateString()}
</td>
</tr>

<tr>
<td>Time</td>
<td>${time}</td>
</tr>

${reason ? `
<tr>
<td>Reason</td>
<td>${reason}</td>
</tr>
` : ''}

</table>

<p>
Please log into your account to reschedule if needed.
</p>

`

);

return sendEmail(
email,
"Appointment Cancelled",
html
);

},



// Prescription ready
sendPrescriptionReadyEmail:

async(
email,
patient,
doctor,
date,
diagnosis
)=>{

const html =
template(

"Prescription Ready",

`

<p>
Dear ${patient},
</p>

<p>
Your prescription from Dr. ${doctor} is now ready.
</p>

<table>

<tr>
<td>Date</td>
<td>
${new Date(date).toLocaleDateString()}
</td>
</tr>

<tr>
<td>Diagnosis</td>
<td>${diagnosis || 'N/A'}</td>
</tr>

</table>

<p>
Please log into your MedConnect account to view and download your prescription.
</p>

`

);

return sendEmail(
email,
"Your Prescription is Ready",
html
);

},



// Delay notification
sendDelayEmail:

async(
email,
patient,
doctor,
oldTime,
newTime
)=>{

const html =
template(

"Schedule Update",

`

<p>
Dear ${patient},
</p>

<p>
Dr. ${doctor} is running behind schedule. Your appointment time has been adjusted.
</p>

<table>

<tr>
<td><strong>Original Time</strong></td>
<td>${oldTime}</td>
</tr>

<tr>
<td><strong>New Time</strong></td>
<td style="color:#e67e22;font-weight:bold">${newTime}</td>
</tr>

</table>

<p>
We apologize for the inconvenience. If the new time does not work for you, please log into your account to reschedule.
</p>

`

);

return sendEmail(
email,
"Appointment Time Update — Dr. " + doctor + " Running Behind",
html
);

},



// Reminder email (24h / 1h)
sendReminderEmail:

async(
email,
patient,
doctor,
date,
time,
timeframe
)=>{

const html =
template(

"Appointment Reminder",

`

<p>
Dear ${patient},
</p>

<p>
This is a reminder that your appointment is coming up in ${timeframe}.
</p>

<table>

<tr>
<td>Doctor</td>
<td>Dr. ${doctor}</td>
</tr>

<tr>
<td>Date</td>
<td>
${new Date(date).toLocaleDateString()}
</td>
</tr>

<tr>
<td>Time</td>
<td>${time}</td>
</tr>

</table>

<p>
If you need to reschedule or cancel, please log into your account as soon as possible.
</p>

`

);

return sendEmail(
email,
`Appointment Reminder (${timeframe})`,
html
);

},



// Raw email (for custom HTML)
sendRawEmail:

async(to, subject, htmlContent)=>{

return sendEmail(to, subject, htmlContent);

}


};



module.exports=emailService;