const DEFAULT_DATA = {
  attendance: { total: 250, authors: 25, admin: 4 },

  // type: 'fixed'    — one total dollar amount
  // type: 'perunit'  — unitPrice × qty = total
  // type: 'subtable' — total pulled from a named subtable
  // tipType: 'pct' | 'fixed'  (for lines that have a tip sub-field)
  expenses: [
    {
      id: 'lunch', label: 'Lunch', type: 'perunit',
      unitPrice: 15.00, qty: 250, unitLabel: 'per person',
      tip: { enabled: true, type: 'fixed', pct: 15, fixedAmt: 562.50 },
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'venue', label: 'Venue', type: 'fixed',
      fixedAmt: 1615.00,
      spent: 0, notes: 'Contact venue re: setup time', expanded: false
    },
    {
      id: 'author_gifts', label: 'Gifts for authors', type: 'perunit',
      unitPrice: 1.40, qty: 25, unitLabel: 'per author',
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'photographer', label: 'Photographer', type: 'fixed',
      fixedAmt: 450.00,
      tip: { enabled: true, type: 'fixed', pct: 15, fixedAmt: 50.00 },
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'hats', label: 'Hats', type: 'subtable', subtable: 'hats',
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'totes', label: 'Tote bags', type: 'subtable', subtable: 'totes',
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'tshirts', label: 'T-shirts', type: 'subtable', subtable: 'tshirts',
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'prizes', label: 'Prizes (BINGO)', type: 'subtable', subtable: 'prizes',
      spent: 328.73, notes: 'See prize manager app for full breakdown', expanded: false
    },
    {
      id: 'raffle', label: 'Raffle prizes', type: 'fixed',
      fixedAmt: 600.00,
      spent: 371.29, notes: '', expanded: false
    },
    {
      id: 'swag', label: 'Swag bag stuff', type: 'subtable', subtable: 'swag',
      spent: 58.43, notes: '', expanded: false
    },
    {
      id: 'decorations', label: 'Decorations', type: 'subtable', subtable: 'decorations',
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'misc', label: 'Misc', type: 'subtable', subtable: 'misc',
      spent: 495.20, notes: '', expanded: false
    },
    {
      id: 'dinner', label: 'Dinner with authors', type: 'perunit',
      unitPrice: 40.00, qty: 25, unitLabel: 'per author',
      spent: 0, notes: '', expanded: false
    },
    {
      id: 'cc_fee', label: 'CC processing fee', type: 'perunit',
      unitPrice: 2.24, qty: 221, unitLabel: 'per ticket',
      spent: 0, notes: '~3.2% per ticket sold', expanded: false
    },
    {
      id: 'pay_selves', label: 'Pay ourselves', type: 'fixed',
      fixedAmt: 500.00,
      spent: 0, notes: '', expanded: false
    },
  ],

  tshirts: [
    { label: 'S',    price: 8.00,  qty: 10 },
    { label: 'M',    price: 8.00,  qty: 79 },
    { label: 'L',    price: 8.00,  qty: 71 },
    { label: 'XL',   price: 8.00,  qty: 48 },
    { label: 'XXL',  price: 9.50,  qty: 28 },
    { label: 'XXXL', price: 11.00, qty: 15 },
  ],
  hats: [
    { label: 'One color',           price: 4.80, qty: 250, notes: '' },
    { label: 'Two color (2.25×4")', price: 5.55, qty: 250, notes: 'Current choice' },
  ],
  totes: [
    { label: 'Standard (one color)', price: 4.52, qty: 250, notes: '' },
  ],
  prizes: [
    { label: 'BINGO prizes budget',  est: 2000.00, spent: 328.73,  notes: 'See prize manager', url: '' },
  ],
  swag: [
    { label: 'Gracie Ruth Mitchell swag (×25)',  est: 50.00,  spent: 0,     notes: 'Stuffed', url: '' },
    { label: 'Kasey Stockton — 160 bookmarks',   est: 32.00,  spent: 0,     notes: 'Stuffed', url: '' },
    { label: 'Sian Bessy — 160 magnets',         est: 160.00, spent: 0,     notes: 'Stuffed', url: '' },
    { label: 'Stickers (300, 2 per person)',      est: 10.43,  spent: 10.43, notes: 'Stuffed', url: '' },
    { label: 'Soirée stickers (191)',             est: 48.00,  spent: 48.00, notes: 'Stuffed', url: '' },
  ],
  decorations: [
    { label: 'Table runners',        est: 40.00,  spent: 0,    notes: 'Need to make new ones', url: '' },
    { label: 'Centerpieces (Lesli)', est: 0.00,   spent: 0,    notes: 'Pick up from Lesli',    url: '' },
    { label: 'Candles',              est: 30.00,  spent: 0,    notes: '',                       url: '' },
    { label: 'Paper flowers + pins', est: 0.00,   spent: 0,    notes: 'Already have',           url: '' },
    { label: 'Book starbursts',      est: 0.00,   spent: 0,    notes: 'Already have',           url: '' },
    { label: 'Linens (ALSCO)',       est: 60.00,  spent: 0,    notes: 'vbohrer@alsco.com · 40 @ $1.50', url: '' },
    { label: 'Sticker labels',       est: 10.00,  spent: 0,    notes: 'Water bottle labels etc', url: '' },
  ],
  misc: [
    { label: 'Stickers (300)',               est: 75,  spent: 30.83,  notes: '',                      url: 'https://a.co/d/03Pljsa' },
    { label: 'Soirée stickers',              est: 65,  spent: 20.40,  notes: 'Sticker Mule',           url: '' },
    { label: 'Raffle boxes',                 est: 15,  spent: 10.66,  notes: '',                      url: 'https://a.co/d/2rTdUDV' },
    { label: 'Chapstick labels',             est: 25,  spent: 20.94,  notes: '2.125"×1.6875" OL421',  url: '' },
    { label: 'BINGO cards',                  est: 25,  spent: 20.00,  notes: '',                      url: 'https://myfreebingocards.com' },
    { label: 'Print BINGO at Staples (260)', est: 100, spent: 93.60,  notes: '$.72/sheet own paper',   url: '' },
    { label: 'Cardstock for BINGO',          est: 20,  spent: 15.00,  notes: '',                      url: '' },
    { label: 'Chapstick supplies',           est: 120, spent: 120.00, notes: '',                      url: '' },
    { label: 'Costco water bottles',         est: 15,  spent: 10.00,  notes: '40 × $3.99',            url: '' },
    { label: 'Water bottle labels',          est: 10,  spent: 0,      notes: 'OL435LP',               url: 'https://www.onlinelabels.com/products/ol435lp' },
    { label: 'Pencils (leftover 2026)',       est: 0,   spent: 0,      notes: 'Already have',          url: 'https://a.co/d/26xAzOa' },
    { label: 'Name tags',                    est: 205, spent: 205,    notes: 'Avery 74459',           url: '' },
  ],

  todos: [
    { id: 1,  who: 'Nicole',     task: 'Authors: Collect multi-author story',                            done: true  },
    { id: 2,  who: 'Heather',    task: 'Authors: Get QR barcode for all their SM stuff',                 done: false },
    { id: 3,  who: 'Heather',    task: 'Authors: Make QR barcode sheet for all authors',                 done: false },
    { id: 4,  who: 'Nicole',     task: 'Authors: Name plates for Q&A sessions',                          done: false },
    { id: 5,  who: 'Nik & Lyss', task: 'Authors: Pick Q&A questions',                                    done: false },
    { id: 6,  who: 'Alyssa',     task: 'Authors: Thank You notes',                                       done: false },
    { id: 7,  who: '',           task: 'Decor: Make new runners',                                         done: false },
    { id: 8,  who: 'Nicole',     task: 'Decor: Stain new centerpieces',                                   done: false },
    { id: 9,  who: 'Nicole',     task: 'Donations: Make THANK YOU tags and bookmarks',                    done: false },
    { id: 10, who: '',           task: 'Get a tote big enough for table runners',                          done: false },
    { id: 11, who: '',           task: 'Get enough prizes',                                               done: false },
    { id: 12, who: '',           task: 'Hats: Design them',                                               done: true  },
    { id: 13, who: 'Nicole',     task: 'Hats: Order them',                                                done: true  },
    { id: 14, who: 'Alyssa',     task: 'Inventory everything at Alyssa\'s house',                         done: false },
    { id: 15, who: 'Nicole',     task: 'Inventory everything at Nicole\'s house',                         done: true  },
    { id: 16, who: 'Nicole',     task: 'Linens: Call and arrange (40 @ $1.50)',                           done: true  },
    { id: 17, who: '',           task: 'Name tags: Design them',                                          done: false },
    { id: 18, who: 'Nicole',     task: 'Name tags: Order them',                                           done: true  },
    { id: 19, who: 'Jordan',     task: 'Name tags: QR code & profile from Insta account',                 done: false },
    { id: 20, who: '',           task: 'Package prizes',                                                  done: false },
    { id: 21, who: 'Nicole',     task: 'Pick up centerpieces from Lesli',                                 done: false },
    { id: 22, who: 'Nicole',     task: 'Print multi-author story and get in binder',                      done: false },
    { id: 23, who: '',           task: 'Print: Chapstick labels',                                         done: false },
    { id: 24, who: '',           task: 'Print: Name tags',                                                done: false },
    { id: 25, who: '',           task: 'Print: Tote games',                                               done: false },
    { id: 26, who: 'Nicole',     task: 'Print: Water bottle labels',                                      done: false },
    { id: 27, who: 'Nicole',     task: 'Prizes: Call Covenant — Shara Meredith',                          done: true  },
    { id: 28, who: 'Lynette',    task: 'Prizes: Make sure we have enough',                                done: false },
    { id: 29, who: 'Nicole',     task: 'Put together PowerPoint presentation',                            done: false },
    { id: 30, who: 'Nicole',     task: 'Raffle: Boxes for drawings',                                      done: true  },
    { id: 31, who: 'Nicole',     task: 'Raffle: Signs on raffle drawing boxes',                           done: true  },
    { id: 32, who: '',           task: 'Stuff totes',                                                     done: false },
    { id: 33, who: 'Nicole',     task: 'SWAG: Inventory at Nicole\'s house',                              done: true  },
    { id: 34, who: 'Alyssa',     task: 'SWAG: Inventory from Alyssa\'s house',                            done: false },
    { id: 35, who: '',           task: 'Tote: Bracelets for everyone / special bracelets?',                done: false },
    { id: 36, who: '',           task: 'Tote: Make bookish games',                                        done: true  },
    { id: 37, who: 'Lynette',    task: 'Tote: Make flyer with book businesses',                           done: false },
    { id: 38, who: 'Lynette',    task: 'Tote: Thanks to businesses who donated',                          done: false },
    { id: 39, who: 'Jess',       task: 'Totes: Design them',                                              done: true  },
    { id: 40, who: 'Nicole',     task: 'Totes: Order them',                                               done: true  },
    { id: 41, who: 'Nicole',     task: 'Venue: Schedule ballroom',                                        done: true  },
    { id: 42, who: '',           task: 'Water bottles: Buy them',                                          done: false },
    { id: 43, who: 'Nicole',     task: 'Water bottles: Order labels',                                     done: true  },
    { id: 44, who: '',           task: 'Water bottles: Put on labels',                                    done: false },
  ],

  inventory: [
    { id: 1,  loc:"Alyssa's", item:'Backdrops: Curtain backdrop',           note:'',                    packed:false },
    { id: 2,  loc:"Alyssa's", item:'Backdrops: Curtain backdrop curtains',  note:'',                    packed:false },
    { id: 3,  loc:"Alyssa's", item:'Backdrops: Curtain backdrop supports',  note:'',                    packed:false },
    { id: 4,  loc:"Alyssa's", item:'Backdrops: Tri-fold book page backdrop',note:'',                    packed:false },
    { id: 5,  loc:"Alyssa's", item:'Bible',                                 note:'',                    packed:false },
    { id: 6,  loc:"Alyssa's", item:'Decor: Vases (2 boxes)',                note:'',                    packed:false },
    { id: 7,  loc:"Alyssa's", item:"Misc: Alyssa's book exchange book",      note:'',                    packed:false },
    { id: 8,  loc:"Alyssa's", item:'Prizes: Platforms/shelves for prizes',  note:'',                    packed:false },
    { id: 9,  loc:"Nicole's", item:'Backdrops: Book exchange bookshelf',     note:'',                    packed:false },
    { id: 10, loc:"Nicole's", item:'Backdrops: Bookshelf pins and brackets', note:'',                    packed:false },
    { id: 11, loc:"Nicole's", item:'Backdrops: Bookshelf shelves (4)',       note:'',                    packed:false },
    { id: 12, loc:"Nicole's", item:'Check-in bag with polls',               note:'Garage — bag',        packed:false },
    { id: 13, loc:"Nicole's", item:'Check-in bins (4)',                      note:'Garage — black tote', packed:false },
    { id: 14, loc:"Nicole's", item:'Decor: Bin with paper flowers + pins',   note:'Garage — silver tote',packed:false },
    { id: 15, loc:"Nicole's", item:'Decor: Book page banners',               note:'',                    packed:false },
    { id: 16, loc:"Nicole's", item:'Decor: Book starbursts',                 note:'',                    packed:false },
    { id: 17, loc:"Nicole's", item:'Decor: Face cutout stands + screws (8)', note:'Garage — cubby',      packed:false },
    { id: 18, loc:"Nicole's", item:'Decor: Face cutouts (4)',                note:'Garage — cubby',      packed:false },
    { id: 19, loc:"Nicole's", item:'Decor: Welcome easel',                  note:'Garage — cubby',      packed:false },
    { id: 20, loc:"Nicole's", item:'Extra canvas totes from last year (4)',  note:'Garage — black tote', packed:false },
    { id: 21, loc:"Nicole's", item:'Extra totes (1)',                        note:'Garage — black tote', packed:false },
    { id: 22, loc:"Nicole's", item:'Extra white frames from last year (4)',  note:'Garage — black tote', packed:false },
    { id: 23, loc:"Nicole's", item:'Misc: My laptop',                       note:'',                    packed:false },
    { id: 24, loc:"Nicole's", item:"Misc: Nicole's book exchange book",      note:'',                    packed:false },
    { id: 25, loc:"Nicole's", item:'Name tags',                             note:'Design Center',       packed:false },
    { id: 26, loc:"Nicole's", item:'Raffle tickets',                        note:'Garage — black tote', packed:false },
    { id: 27, loc:"Nicole's", item:'Water bottle labels',                   note:'Design center',       packed:false },
    { id: 28, loc:'Other',    item:'Decor: Candles',                        note:'',                    packed:false },
    { id: 29, loc:'Other',    item:'Decor: Centerpiece stuff from Lesli',   note:'',                    packed:false },
    { id: 30, loc:'Other',    item:'Friendship bracelet stuff',             note:'',                    packed:false },
    { id: 31, loc:'Other',    item:'Misc: Device for playing music',        note:'',                    packed:false },
    { id: 32, loc:'Other',    item:'Misc: Drill with bits',                 note:'',                    packed:false },
    { id: 33, loc:'Other',    item:'Sign to purchase bead boards (1)',      note:'',                    packed:false },
    { id: 34, loc:'Other',    item:'Sign with bead board instructions (12)',note:'',                    packed:false },
  ],

  authors: [
    { id:1, name:'Jessica Scarlett',  status:'confirmed', role:'Book Signing', note:'' },
    { id:2, name:'Aspen Hadley',      status:'confirmed', role:'Book Signing', note:'' },
    { id:3, name:'Jentry Flint',      status:'confirmed', role:'Book Signing', note:'' },
    { id:4, name:'Amanda P Jones',    status:'confirmed', role:'Book Signing', note:'' },
    { id:5, name:'Sarah M Eden',      status:'asked',     role:'Book Signing', note:'' },
    { id:6, name:'Shannon Castelton', status:'maybe',     role:'Q&A',          note:'If health is good' },
  ],
  wishlist: [
    { name:'Traci Abramson',    note:'' }, { name:'Courtney Walsh', note:'Popular in her genre' },
    { name:'Nancy Allan Campbell', note:'Love her' }, { name:'Deborah Hathaway', note:'' },
    { name:'Anneka Walker', note:'' }, { name:'Kelly Orem', note:'' },
    { name:'Alyse Haines', note:'' }, { name:'Kate Watson', note:'' },
    { name:'Anne-Marie Meyer', note:'' }, { name:'Sariah Wilson', note:'' },
    { name:'Jennifer Peel', note:'' }, { name:'Becky Momson', note:'' },
    { name:'Heather Frost', note:'Fantasy. Friends w Hill and Dana' },
    { name:'Mellisa Lark', note:'' }, { name:'Elaina Johnson', note:'' },
    { name:'Kelly Davidson', note:'' }, { name:'Logan Piercy', note:'' },
    { name:'Erica Penfold', note:'' },
    { name:'Bridget E Baker', note:'10k followers. Horse romantasy' },
    { name:'Tiffany Odekirk', note:'Want to ask her' },
    { name:'Shannon Castleton', note:'2027 goal!' }, { name:'Mimi Mathews', note:'' },
    { name:'Marion de Ray', note:'Contacted us on Insta' },
    { name:'Samantha Hastings', note:'Contacted us on Insta. Romcom fall 2026' },
  ],
  admin: [
    { name:'Nicole', note:'' }, { name:'Alyssa', note:'' }, { name:'Lynette', note:'' },
    { name:'Kyle Kimzey', note:'' }, { name:'Jess', note:'Free — for design' },
  ],
  helpers: [
    { name:'Emma Hadfield (Home Bound Bindery)', note:'Donating raffle and BINGO prizes' },
    { name:'Gentri',                             note:'Bedazzle class, transporting stuff' },
    { name:'Heather Nichols (Jammers)',          note:'Helping with QR codes' },
    { name:'Jordan',                             note:'Setup, Insta profile photos & QR codes' },
    { name:'Krista Ruff',                        note:'Setup / take down' },
    { name:'Lexi',                               note:'Bedazzle class, transporting stuff' },
    { name:'Lindsay Ferguson',                   note:'Setup / take down' },
    { name:'Madison M Timothy',                  note:'Setup / take down' },
    { name:'Mallory M',                          note:'Setup / take down' },
    { name:'Melissa Parent (clean reads)',        note:'Setup / take down' },
    { name:'Nikki Crown',                        note:'Setup / take down' },
    { name:'Shayla Riley',                       note:'Setup / take down' },
  ],
  agenda: [
    { time:'12:30–1:45', items:['Lunch'] },
    { time:'1:00',       items:['Welcome','Mingle and follow each other with QR barcodes','Vote for your favorite Mr. Darcy','Make bracelets'] },
    { time:'1:15',       items:['Extra totes and bookmarks','Explain raffle','Go look at prizes'] },
    { time:'1:30–1:55',  items:['Call up authors','Book exchange announced — open now or later, swap if needed','Fill out post-event survey','Small prizes: farthest traveled, lives closest, youngest, read a book from every author','Getting to know you game with authors','Thank helpers','Our meet cute'] },
    { time:'1:55–2:30',  items:['BINGO / Prizes'] },
    { time:'2:30–2:45',  items:['Photographer photos announcement','Post photos, tag us, upload to Google Drive (QR code)','Post-event survey','Multi-author story'] },
    { time:'2:45–4:00',  items:['Q&A panel'] },
    { time:'4:00–4:15',  items:["Date of next year's Soirée announced",'Number under seats','Draw winners of bigger prizes','Made by Mary Bookmark'] },
    { time:'4:15–6:00',  items:['Book signing'] },
  ],
  qAndA: [
    'I have written under a pen name',
    'I have written in more than one genre',
    "I've read a book from one of the other authors here today",
    "I'm an author, but also a fan, and have fangirled over meeting another author here today",
    'I have books published in a foreign language',
    'I enjoy researching stuff for my books',
    'I work on more than one manuscript at the same time',
    'I have finished writing a book and chosen not to publish it',
    'I have liked a side character more than one of my main characters',
    'I have based a character off of myself',
    'I have practiced the kissing scenes in a book I\'ve written',
    'I have suffered from imposter syndrome',
  ],
  seating: [
    {seat:1,name:'Melanie Jacobson'},{seat:2,name:'Karen Thornall'},
    {seat:3,name:'Julianne Donaldson'},{seat:4,name:'Nichole Van'},
    {seat:5,name:'Sian Ann Bessy'},{seat:6,name:'Heidi Kimball'},
    {seat:7,name:'Joanna Barker'},{seat:8,name:'Amy Harmon'},
    {seat:9,name:'Kasey Stockton'},{seat:10,name:'Dana Lecheminant'},
    {seat:11,name:'Hillary Slaughter'},{seat:12,name:'Jenny Proctor'},
    {seat:13,name:'Julie Christianson'},{seat:14,name:'Jen Atkinson'},
    {seat:15,name:'Gracie Ruth Mitchell'},{seat:16,name:'Savannah Scott'},
  ],
  nextId: 200,
};
