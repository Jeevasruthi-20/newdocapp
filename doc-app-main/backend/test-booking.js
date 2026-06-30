const fs = require('fs');

async function testBooking() {
  const BASE_URL = 'http://localhost:3000/api';
  let token = '';

  console.log('--- Starting Automated Booking Test ---');

  // 1. Register a new patient
  console.log('1. Registering as patient...');
  const randomEmail = `patient_${Date.now()}@test.com`;
  try {
    const registerRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Patient', email: randomEmail, password: 'password123', role: 'patient', dob: '1990-01-01', phone: '1234567890' })
    });
    const registerData = await registerRes.json().catch(() => ({ message: 'Could not parse JSON' }));
    if (!registerRes.ok) throw new Error(registerData.message || `Signup failed with status ${registerRes.status}`);
    token = registerData.token;
    console.log(`   ✅ Registered successfully: ${randomEmail}`);
  } catch (err) {
    console.error('   ❌ Login error:', err.message);
    return;
  }

  // 2. Fetch doctors
  console.log('2. Fetching doctors...');
  let doctorId = '';
  try {
    // Assuming there's a way to get doctors, or we can just fetch all users
    // Wait, we just added /api/admin/doctors, but that requires admin token.
    // Let's just login as admin to get the doctor list, then book as patient.
    // Admin is usually admin@example.com based on standard seeders
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'karthikfuels@gmail.com', password: '123456' })
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.token;

    // Wait, if admin login fails we can't fetch doctors via API.
    // Let's just fetch doctors by hitting a public route or we can just fetch all doctors directly via mongoose in script.
    // Let's try admin@admin.com or admin@example.com
    if (!adminToken) {
       console.log('   ⚠️ Admin login failed, skipping admin /doctors check...');
    }

    const docRes = await fetch(`${BASE_URL}/admin/doctors`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const doctors = await docRes.json();
    if (doctors.length === 0) throw new Error('No doctors found');
    doctorId = doctors[0]._id;
    console.log(`   ✅ Found doctor: ${doctors[0].name}`);
  } catch (err) {
    console.error('   ❌ Error fetching doctors:', err.message);
    return;
  }

  // 3. Check available slots for tomorrow
  console.log('3. Checking available slots for tomorrow...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  try {
    const slotsRes = await fetch(`${BASE_URL}/appointments/available-slots?doctorId=${doctorId}&date=${dateStr}`);
    const takenSlots = await slotsRes.json();
    console.log(`   ✅ Taken slots for ${dateStr}:`, takenSlots);
  } catch (err) {
    console.error('   ❌ Error checking slots:', err.message);
    return;
  }

  // 4. Book appointment
  console.log('4. Booking an appointment at 10:00 AM...');
  try {
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        doctorId,
        date: dateStr,
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Automated Test Checkup',
        type: 'in-person'
      })
    });
    const bookData = await bookRes.json();
    if (!bookRes.ok) throw new Error(bookData.message || 'Booking failed');
    console.log('   ✅ Appointment booked successfully!', bookData._id);
  } catch (err) {
    console.error('   ❌ Booking error:', err.message);
    return;
  }

  console.log('--- Test Completed Successfully ---');
}

testBooking();
