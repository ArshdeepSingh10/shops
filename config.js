// Shared Cloudinary settings (same account for both shops is fine).
window.CLOUD={NAME:'dh1bbfjn1',PRESET:'catalog'};

// One entry per business. Each shop has its OWN Apps Script web app URL (its own Google Sheet).
// whatsapp: country code + number, digits only (e.g. 919876543210). Orders stay blocked until a real number is set.
window.SHOPS={
  boutique:{name:'Model Town Boutique',tagline:"Women's clothing · Model Town Extension, Ludhiana",emoji:'👗',
    api:'PASTE_BOUTIQUE_WEB_APP_URL',whatsapp:'918284840646',
    intro:'Hello! I would like to order:',outro:'Please confirm availability and delivery details.',
    modes:['Delivery','Pickup'],delivery:{fee:60,freeAbove:2000}},   
 
};
