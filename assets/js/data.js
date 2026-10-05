/* ============================================================
   سيزر جيم — بيانات الموقع (الفرعين)
   • الفرع الأول: الأسعار والمواعيد من cezar-site/data/site.js (schedule العامة).
   • الفرع الجديد: الأسعار والمواعيد الشتوية من بوستر الجيم (أكتوبر 2026).
   • branches[].schedule = null معناها schedule العامة (الفرع الأول).
   • plans.b1 / plans.b2 = أسعار كل فرع.
   • hero.cut = صورة المبنى المفرّغة (رسم Gemini) → الهيرو بوضع «المبنى قدّام وCEZAR وراه».
   schedule.segments بالدقايق من نص الليل، و to > 1440 = بتكمّل لبكرة.
   ⚠️ محتاج تأكيد: هل مواعيد وأسعار الفرع الأول لسه زي ما هي (الصيفي)؟
   ============================================================ */
window.CZ = {
 "contact": {
  "brand": "سيزر جيم",
  "brandLatin": "CEZAR GYM",
  "tagline": "اصنع المحارب اللي جوّاك",
  "city": "بني سويف الجديدة",
  "address": "بني سويف الجديدة — شرق النيل، الحي الأول (بجوار مطعم كافيار)",
  "landline": "082-2076460",
  "mobile": "01097419761",
  "whatsapp": "201097419761",
  "maps": "https://maps.app.goo.gl/AM7efwHZEMeMRq4P7",
  "facebook": "https://www.facebook.com/Cezar.Gym.Club/",
  "instagram": "https://www.instagram.com/cezar_gym/"
 },
 "branches": [
  {
   "id": "b1",
   "n": "01",
   "name": "الفرع الأول",
   "short": "جنب كافيار",
   "latin": "BRANCH 01",
   "area": "بني سويف الجديدة · الحي الأول",
   "address": "بني سويف الجديدة — شرق النيل، الحي الأول، بجوار مطعم كافيار",
   "maps": "https://maps.app.goo.gl/AM7efwHZEMeMRq4P7",
   "mobile": "01097419761",
   "whatsapp": "201097419761",
   "landline": "082-2076460",
   "img": "b1-floor",
   "schedule": null,
   "scheduleNote": "",
   "plans": "b1"
  },
  {
   "id": "b2",
   "n": "02",
   "name": "الفرع الجديد",
   "short": "خلف بنك مصر",
   "latin": "BRANCH 02",
   "area": "بني سويف الجديدة · مركز المدينة",
   "address": "بني سويف الجديدة — شرق النيل، مركز المدينة، خلف بنك مصر، أمام مدخل زمزم",
   "maps": "https://www.google.com/maps/search/?api=1&query=Cezar+Gym+2+%D8%A8%D9%86%D9%8A+%D8%B3%D9%88%D9%8A%D9%81+%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9",
   "mobile": "01551222775",
   "whatsapp": "201551222775",
   "landline": "082-2100108",
   "img": "facade-corner",
   "schedule": {
    "0": [
     {
      "g": "men",
      "from": 420,
      "to": 960
     },
     {
      "g": "women",
      "from": 960,
      "to": 1260
     },
     {
      "g": "men",
      "from": 1260,
      "to": 1860
     }
    ],
    "1": [
     {
      "g": "men",
      "from": 420,
      "to": 540
     },
     {
      "g": "women",
      "from": 540,
      "to": 840
     },
     {
      "g": "men",
      "from": 840,
      "to": 1860
     }
    ],
    "2": [
     {
      "g": "men",
      "from": 420,
      "to": 960
     },
     {
      "g": "women",
      "from": 960,
      "to": 1260
     },
     {
      "g": "men",
      "from": 1260,
      "to": 1860
     }
    ],
    "3": [
     {
      "g": "men",
      "from": 420,
      "to": 540
     },
     {
      "g": "women",
      "from": 540,
      "to": 840
     },
     {
      "g": "men",
      "from": 840,
      "to": 1860
     }
    ],
    "4": [
     {
      "g": "men",
      "from": 420,
      "to": 960
     },
     {
      "g": "women",
      "from": 960,
      "to": 1260
     },
     {
      "g": "men",
      "from": 1260,
      "to": 1860
     }
    ],
    "5": [
     {
      "g": "women",
      "from": 720,
      "to": 960
     },
     {
      "g": "men",
      "from": 960,
      "to": 1440
     }
    ],
    "6": [
     {
      "g": "men",
      "from": 420,
      "to": 540
     },
     {
      "g": "women",
      "from": 540,
      "to": 840
     },
     {
      "g": "men",
      "from": 840,
      "to": 1860
     }
    ]
   },
   "scheduleNote": "المواعيد الشتوية",
   "isNew": true,
   "plans": "b2"
  }
 ],
 "plans": {
  "b1": {
   "monthly": [
    {
     "id": "power",
     "name": "باور",
     "sessions": 8,
     "price": 600,
     "note": "بداية مناسبة لو بتتمرن يومين في الأسبوع"
    },
    {
     "id": "bronze",
     "name": "برونز",
     "sessions": 12,
     "price": 650,
     "note": "3 أيام في الأسبوع"
    },
    {
     "id": "silver",
     "name": "سيلفر",
     "sessions": 16,
     "price": 700,
     "note": "4 أيام في الأسبوع"
    },
    {
     "id": "platinum",
     "name": "بلاتينيوم",
     "sessions": 20,
     "price": 750,
     "note": "5 أيام في الأسبوع",
     "popular": true
    },
    {
     "id": "gold",
     "name": "جولد",
     "sessions": 24,
     "price": 850,
     "note": "6 أيام في الأسبوع — أعلى عدد جلسات",
     "popular": true
    }
   ],
   "yearly": [
    {
     "id": "bronzeY",
     "name": "برونز",
     "tiers": [
      {
       "label": "ربع سنوي",
       "months": 3,
       "price": 1800,
       "perks": "3 دعوات مجانية + 3 جلسات ساونا"
      },
      {
       "label": "نصف سنوي",
       "months": 6,
       "price": 3600,
       "perks": "6 دعوات مجانية + 6 جلسات ساونا"
      },
      {
       "label": "سنوي",
       "months": 12,
       "price": 7200,
       "perks": "12 دعوة مجانية + 12 جلسة ساونا"
      }
     ]
    },
    {
     "id": "goldY",
     "name": "جولد",
     "popular": true,
     "tiers": [
      {
       "label": "ربع سنوي",
       "months": 3,
       "price": 2450,
       "perks": "3 دعوات مجانية + 3 جلسات ساونا"
      },
      {
       "label": "نصف سنوي",
       "months": 6,
       "price": 4700,
       "perks": "6 دعوات مجانية + 6 جلسات ساونا"
      },
      {
       "label": "سنوي",
       "months": 12,
       "price": 9600,
       "perks": "12 دعوة مجانية + 12 جلسة ساونا"
      }
     ]
    }
   ],
   "private": [
    {
     "name": "برايفيت فردي",
     "options": [
      {
       "sessions": 12,
       "price": 1500
      }
     ],
     "note": "12 جلسة + جلسة ساونا"
    },
    {
     "name": "برايفيت جروب",
     "options": [
      {
       "sessions": 12,
       "price": 1300
      }
     ],
     "note": "12 جلسة + ساونا — من 3 لـ 5 أفراد"
    }
   ],
   "activities": [
    {
     "id": "selfdef",
     "name": "أنشطة الدفاع عن النفس",
     "price": 350,
     "note": "8 جلسات — ملاكمة أو كيك بوكس أو كاراتيه أو كونغ فو"
    },
    {
     "id": "allact",
     "name": "جميع الأنشطة",
     "price": 450,
     "note": "12 جلسة في كل الأنشطة"
    },
    {
     "id": "military",
     "name": "التأهيل العسكري",
     "price": 1500,
     "note": "سباحة + إستاد + جيم"
    },
    {
     "id": "physio",
     "name": "التأهيل البدني والحركي",
     "price": 1500,
     "note": "12 جلسة"
    }
   ],
   "singles": [
    {
     "id": "single",
     "name": "تمرين منفصل",
     "price": 150,
     "note": "جلسة واحدة بدون اشتراك"
    },
    {
     "id": "saunaOne",
     "name": "جلسة ساونا",
     "price": 100,
     "note": "ساونا حرارية"
    }
   ]
  },
  "b2": {
   "monthly": [
    {
     "id": "power",
     "name": "باور",
     "sessions": 8,
     "price": 750,
     "note": "يومين في الأسبوع"
    },
    {
     "id": "bronze",
     "name": "برونز",
     "sessions": 12,
     "price": 800,
     "note": "3 أيام في الأسبوع"
    },
    {
     "id": "silver",
     "name": "سيلفر",
     "sessions": 16,
     "price": 850,
     "note": "4 أيام في الأسبوع"
    },
    {
     "id": "platinum",
     "name": "بلاتينيوم",
     "sessions": 20,
     "price": 900,
     "note": "5 أيام في الأسبوع"
    },
    {
     "id": "gold",
     "name": "جولد",
     "sessions": 24,
     "price": 950,
     "note": "6 أيام في الأسبوع"
    },
    {
     "id": "top",
     "name": "توب",
     "sessions": 30,
     "price": 1000,
     "note": "أعلى عدد حصص"
    }
   ],
   "yearly": [
    {
     "id": "bronzeY",
     "name": "فئة البرونز",
     "tiers": [
      {
       "label": "ربع سنوي",
       "months": 3,
       "price": 2250,
       "perks": ""
      },
      {
       "label": "نصف سنوي",
       "months": 6,
       "price": 4500,
       "perks": ""
      },
      {
       "label": "سنوي",
       "months": 12,
       "price": 9000,
       "perks": ""
      }
     ]
    },
    {
     "id": "silverY",
     "name": "فئة السيلفر",
     "tiers": [
      {
       "label": "ربع سنوي",
       "months": 3,
       "price": 2400,
       "perks": ""
      },
      {
       "label": "نصف سنوي",
       "months": 6,
       "price": 4800,
       "perks": ""
      },
      {
       "label": "سنوي",
       "months": 12,
       "price": 9600,
       "perks": ""
      }
     ]
    },
    {
     "id": "goldY",
     "name": "فئة الجولد",
     "tiers": [
      {
       "label": "ربع سنوي",
       "months": 3,
       "price": 2700,
       "perks": ""
      },
      {
       "label": "نصف سنوي",
       "months": 6,
       "price": 5400,
       "perks": ""
      },
      {
       "label": "سنوي",
       "months": 12,
       "price": 10800,
       "perks": ""
      }
     ]
    }
   ],
   "private": [
    {
     "name": "برايفيت فردي",
     "options": [
      {
       "sessions": 8,
       "price": 1500
      },
      {
       "sessions": 12,
       "price": 1800
      },
      {
       "sessions": 16,
       "price": 2100
      },
      {
       "sessions": 20,
       "price": 2400
      }
     ],
     "note": ""
    },
    {
     "name": "برايفيت مجموعة",
     "options": [
      {
       "sessions": 8,
       "price": 1400
      },
      {
       "sessions": 12,
       "price": 1700
      }
     ],
     "note": ""
    }
   ],
   "activities": [
    {
     "id": "selfdef8",
     "name": "أنشطة الدفاع عن النفس",
     "price": 500,
     "note": "8 حصص — ملاكمة · كيك بوكس · كاراتيه · كونغ فو · MMA"
    },
    {
     "id": "selfdef12",
     "name": "أنشطة الدفاع عن النفس",
     "price": 600,
     "note": "12 حصة — ملاكمة · كيك بوكس · كاراتيه · كونغ فو · MMA"
    },
    {
     "id": "military",
     "name": "التأهيل العسكري",
     "price": 2000,
     "note": "برنامج تأهيل"
    },
    {
     "id": "physio",
     "name": "التأهيل البدني والحركي",
     "price": 2000,
     "note": "برنامج تأهيل"
    }
   ],
   "singles": [
    {
     "id": "single",
     "name": "تمرين منفصل",
     "price": 200,
     "note": ""
    },
    {
     "id": "singlePt",
     "name": "تمرين منفصل برايفت",
     "price": 250,
     "note": ""
    }
   ]
  }
 },
 "schedule": {
  "days": [
   "الأحد",
   "الإثنين",
   "الثلاثاء",
   "الأربعاء",
   "الخميس",
   "الجمعة",
   "السبت"
  ],
  "segments": {
   "0": [
    {
     "g": "men",
     "from": 420,
     "to": 600
    },
    {
     "g": "women",
     "from": 600,
     "to": 900
    },
    {
     "g": "men",
     "from": 900,
     "to": 1860
    }
   ],
   "1": [
    {
     "g": "men",
     "from": 420,
     "to": 1020
    },
    {
     "g": "women",
     "from": 1020,
     "to": 1320
    },
    {
     "g": "men",
     "from": 1320,
     "to": 1860
    }
   ],
   "2": [
    {
     "g": "men",
     "from": 420,
     "to": 600
    },
    {
     "g": "women",
     "from": 600,
     "to": 900
    },
    {
     "g": "men",
     "from": 900,
     "to": 1860
    }
   ],
   "3": [
    {
     "g": "men",
     "from": 420,
     "to": 1020
    },
    {
     "g": "women",
     "from": 1020,
     "to": 1320
    },
    {
     "g": "men",
     "from": 1320,
     "to": 1860
    }
   ],
   "4": [
    {
     "g": "men",
     "from": 420,
     "to": 600
    },
    {
     "g": "women",
     "from": 600,
     "to": 900
    },
    {
     "g": "men",
     "from": 900,
     "to": 1860
    }
   ],
   "5": [
    {
     "g": "women",
     "from": 720,
     "to": 900
    },
    {
     "g": "men",
     "from": 900,
     "to": 1320
    }
   ],
   "6": [
    {
     "g": "men",
     "from": 420,
     "to": 1020
    },
    {
     "g": "women",
     "from": 1020,
     "to": 1320
    },
    {
     "g": "men",
     "from": 1320,
     "to": 1860
    }
   ]
  }
 },
 "vip": {
  "name": "VIP",
  "from": "b2",
  "to": [
   "b1",
   "b2"
  ],
  "line": "اشتراك VIP في الفرع الجديد بيدخّلك الفرع الأول كمان — تتمرن في أي فرع فاتح.",
  "options": [
   {
    "sessions": 16,
    "price": 1000
   },
   {
    "sessions": 30,
    "price": 1200
   }
  ]
 },
 "hero": {
  "cut": "assets/img/hero-cut.webp",
  "cutSmall": "assets/img/hero-cut@s.webp",
  "alt": "رسم لمبنى فرع سيزر جيم الجديد بلافتتين CEZAR GYM"
 }
};
