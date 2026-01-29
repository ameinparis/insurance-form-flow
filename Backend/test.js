// Test without @sendgrid/mail package
async function testSendGridDirect() {
  const SENDGRID_API_KEY = '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';
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: 'gaotlolweame@gmail.com' }]
      }],
      from: {
        email: 'online@exclusivelife.co.bw',
        name: 'Exclusive Life Test'
      },
      subject: 'SendGrid Direct API Test',
      content: [
        {
          type: 'text/plain',
          value: 'Testing SendGrid direct API call'
        }
      ]
    })
  });

  if (response.ok) {
    console.log('✅ Email sent successfully!');
  } else {
    const error = await response.json();
    console.error('❌ Error:', error);
  }
}

testSendGridDirect();