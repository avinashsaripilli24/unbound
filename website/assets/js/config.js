/* ==========================================================================
   studio Unbound — site settings
   Fill these in. Anything left empty ("") simply does not appear on the site.
   ========================================================================== */
window.SU_CONFIG = {

  contact: {
    phone: "",        // shown and dialled as typed, e.g. "+91 98765 43210"
    whatsapp: "",     // number with country code, e.g. "919876543210"
    email: "",        // e.g. "hello@studiounbound.in"
    instagram: "",    // full link, e.g. "https://instagram.com/studiounbound"
    mapUrl: ""        // Google Maps link to the studio (optional)
  },

  // Shown in the footer. These are the details people look for before they trust a firm.
  company: {
    established: "",   // e.g. "2019"
    registration: "",  // e.g. Council of Architecture number
    gstin: "",         // e.g. "37ABCDE1234F1Z5"
    address: ""        // street address of the studio or workshop
  },

  form: {
    // Where enquiries are delivered. Use ONE of these two:
    web3formsKey: "", // free access key from web3forms.com: emails each enquiry to the studio
    endpoint: ""      // or any form endpoint that accepts a JSON POST (Formspree, your own server)
    // If both are empty, the form opens WhatsApp (or email) with the enquiry already written.
  },

  // Photographs. Put files in assets/photos/ and write the path here,
  // e.g. founder: "assets/photos/uday.jpg". Each sketch stays as a small mark beside its photo.
  photos: {
    "founder": "",
    "manager": "",
    "workshop": "",           // wide photo on Our Story (hands, tools, raw material)
    "site": "",               // wide photo on How We Work, stage 4 (construction in progress)
    "craft-carpentry": "",
    "craft-fabrication": "",
    "craft-stonework": "",
    "craft-inlay": "",
    "craft-finishing": ""
  }
};
