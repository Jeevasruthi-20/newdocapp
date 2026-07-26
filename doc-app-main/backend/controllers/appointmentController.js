const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');


// ===============================
// CREATE APPOINTMENT
// POST /api/appointments
// ===============================

exports.createAppointment = async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success:false,
        errors:errors.array()
      });
    }


    const {
      doctor,
      date,
      startTime,
      endTime,
      reason,
      type="in-person"
    } = req.body;



    // Check slot availability

    const isAvailable =
      await Appointment.isSlotAvailable(
        doctor,
        date,
        startTime
      );


    if(!isAvailable){

      return res.status(400).json({

        success:false,

        message:"Time slot already booked"

      });

    }



    // Prevent past appointment

    const appointmentDateTime =
      new Date(date + "T" + startTime);


    if(appointmentDateTime <= new Date()){

      return res.status(400).json({

        success:false,

        message:"Cannot book past appointment"

      });

    }



    // Create appointment


    const appointment =
      new Appointment({

        doctor,

        patient:req.user.id,

        date:new Date(date),

        startTime,

        endTime,

        reason,

        type,

        status:"pending"

      });



    await appointment.save();



    console.log(
      "Appointment saved:",
      appointment._id
    );




    // ===============================
    // SEND EMAIL
    // ===============================


    try{


      const patient =
        await User.findById(req.user.id);



      const doctorData =
        await User.findById(doctor);



      if(patient && doctorData){


        await emailService.sendBookingPendingEmail(

          patient.email,

          patient.name,

          doctorData.name,

          appointment.date,

          appointment.startTime,

          appointment.type

        );


        console.log(
          "✅ Pending email sent"
        );


      }
      else{

        console.log(
          "Patient or doctor not found"
        );

      }



    }
    catch(emailError){

      console.log(
        "❌ Email error:",
        emailError.message
      );

    }




    return res.status(201).json({

      success:true,

      message:"Appointment booked successfully",

      data:appointment

    });



  }
  catch(error){


    console.log(
      "Create appointment error:",
      error
    );


    res.status(500).json({

      success:false,

      message:"Server error",

      error:error.message

    });


  }

};






// ===============================
// GET USER APPOINTMENTS
// ===============================

exports.getUserAppointments = async(req,res)=>{


try{


const appointments =
await Appointment.find({

$or:[

{
patient:req.user.id
},

{
doctor:req.user.id
}

]

})

.populate(
'doctor',
'name email specialization'
)

.populate(
'patient',
'name email'
)

.sort({
date:1,
startTime:1
});



res.json({

success:true,

data:appointments

});


}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


};






// ===============================
// AVAILABLE SLOTS
// ===============================

exports.getAvailableSlots = async(req,res)=>{


try{


const {
doctorId,
date
}=req.params;



const slots=[

"09:00",
"10:00",
"11:00",
"12:00",
"13:00",
"14:00",
"15:00",
"16:00",
"17:00"

];



const booked =
await Appointment.find({

doctor:doctorId,

date:new Date(date),

status:{
$in:[
"pending",
"confirmed"
]
}

});



const bookedSlots =
booked.map(
a=>a.startTime
);



res.json({

success:true,

data:
slots.filter(
s=>!bookedSlots.includes(s)
)

});


}
catch(error){

res.status(500).json({

success:false,

message:error.message

});

}


};






// ===============================
// UPDATE STATUS
// ===============================


exports.updateAppointmentStatus =
async(req,res)=>{


try{


const appointment =
await Appointment.findById(
req.params.id
);



if(!appointment){

return res.status(404).json({

success:false,

message:"Appointment not found"

});

}



appointment.status =
req.body.status;



await appointment.save();



res.json({

success:true,

data:appointment

});


}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


};