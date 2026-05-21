const https = require('https');
https.get("https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;700;900&family=Josefin+Sans:wght@400;700&family=Lato:wght@400;700;900&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;500;700&family=Manrope:wght@400;500;700;800&family=Montserrat:wght@400;500;700;900&family=Neuton:wght@400;700&family=Nunito:wght@400;500;700;900&family=Open+Sans:wght@400;500;700&family=Playfair+Display:wght@400;500;700;900&family=Poppins:wght@400;500;700;900&family=Raleway:wght@400;500;700;900&family=Roboto:wght@400;500;700;900&family=Rubik:wght@400;500;700;900&family=Source+Sans+Pro:wght@400;600;700;900&family=Sreda:wght@400&family=Ubuntu:wght@400;500;700&family=Work+Sans:wght@400;500;700;900&display=swap", (res) => {
  console.log("Status:", res.statusCode);
  res.on('data', d => process.stdout.write(d));
});
