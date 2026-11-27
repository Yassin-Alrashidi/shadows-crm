/* Arabic (default) and English strings. Egyptian Arabic for the team. */
(function () {
  'use strict';
  var D = {
    ar: {
      app: 'Shadows', tag: 'بنتحرك في صمت', loading: 'ثانية واحدة…',
      'auth.in': 'Login', 'auth.up': 'حساب جديد', 'auth.email': 'الإيميل', 'auth.pw': 'كلمة السر', 'auth.name': 'اسمك',
      'auth.go.in': 'ادخل', 'auth.go.up': 'اعمل حساب', 'auth.demo': 'جرّب الـ Demo', 'auth.hint.up': 'أول حساب بيبقى أدمن.',
      'auth.bad': 'الإيميل أو كلمة السر غلط.', 'auth.exists': 'الإيميل ده مسجّل قبل كده.', 'auth.confirm': 'المشروع لسه طالب تأكيد الإيميل. اقفل خيار "Confirm email" في إعدادات الدخول.',
      'auth.short': 'كلمة السر لازم تكون 6 حروف على الأقل.', 'auth.fill': 'اكتب الإيميل وكلمة السر.', 'auth.err': 'حصلت مشكلة. جرّب تاني.',
      'demo.bar': 'نسخة تجريبية: البيانات على جهازك بس', 'demo.reset': 'امسح وابدأ من جديد',
      home: 'Dashboard', tickets: 'Tickets', leaves: 'الإجازات', clients: 'Clients', resign: 'الاستقالات', me: 'حسابي',
      'hi': 'أهلًا', 'hi.sub': 'ده ملخص يومك.', 'k.tickets': 'Tickets مفتوحة', 'k.leaves': 'إجازات منتظرة', 'k.clients': 'Clients شغّالين', 'k.pending': 'محتاجة قرارك',
      'k.balance': 'رصيد الإجازات السنوية', 'days': 'يوم', 'recent': 'آخر الحركات', 'none': 'مفيش حاجة هنا لسه.',
      'new': 'جديد', 'new.ticket': 'Ticket جديدة', 'new.leave': 'طلب إجازة', 'new.client': 'Client جديد', 'new.resign': 'تقديم استقالة',
      'f.title': 'العنوان', 'f.cat': 'النوع', 'f.prio': 'الأولوية', 'f.desc': 'التفاصيل', 'f.type': 'نوع الإجازة', 'f.from': 'من', 'f.to': 'إلى', 'f.reason': 'السبب (اختياري)',
      'f.lastday': 'آخر يوم شغل', 'f.notes': 'ملاحظات (اختياري)', 'f.name': 'اسم الـ Client', 'f.contact': 'الشخص المسؤول', 'f.phone': 'الموبايل', 'f.email': 'الإيميل', 'f.status': 'الحالة',
      'save': 'حفظ', 'send': 'إرسال', 'cancel': 'إلغاء', 'close': 'قفل', 'back': 'رجوع', 'edit': 'تعديل', 'delete': 'مسح', 'saved': 'تم الحفظ', 'sent': 'اتبعت', 'fail': 'معرفتش أحفظ. جرّب تاني.',
      'mine': 'بتاعتي', 'all': 'الكل', 'team': 'الفريق كله', 'search': 'دوّر…', 'comments': 'Comments', 'comment.ph': 'اكتب تعليق…', 'by': 'من',
      'st.open': 'مفتوحة', 'st.in_progress': 'شغّالين عليها', 'st.resolved': 'اتحلّت', 'st.closed': 'مقفولة',
      'pr.low': 'عادية', 'pr.normal': 'متوسطة', 'pr.high': 'عالية', 'pr.urgent': 'مستعجلة',
      'cat.it': 'تقنية', 'cat.hr': 'موارد بشرية', 'cat.finance': 'حسابات', 'cat.workspace': 'مكان الشغل', 'cat.other': 'حاجة تانية',
      'lt.annual': 'سنوية', 'lt.sick': 'مرضية', 'lt.unpaid': 'بدون مرتب', 'lt.emergency': 'عارضة',
      'ls.pending': 'منتظرة', 'ls.approved': 'موافق عليها', 'ls.rejected': 'مرفوضة', 'ls.cancelled': 'ملغية',
      'rs.pending': 'منتظرة', 'rs.accepted': 'اتقبلت', 'rs.rejected': 'اترفضت', 'rs.withdrawn': 'اتسحبت',
      'cs.lead': 'محتمل', 'cs.active': 'شغّال', 'cs.paused': 'واقف', 'cs.closed': 'اتقفل',
      'approve': 'وافق', 'reject': 'ارفض', 'accept': 'اقبل', 'withdraw': 'اسحب الطلب', 'cancelreq': 'ألغي الطلب', 'note': 'ملاحظة القرار (اختياري)',
      'resign.warn': 'الطلب ده بيوصل للإدارة بس. تقدر تسحبه طول ما هو منتظر.', 'resign.confirm': 'متأكد إنك عايز تقدّم استقالة؟', 'resign.yes': 'أيوه، قدّم الطلب',
      'resign.intro': 'هنا تقدر تقدّم استقالتك بشكل رسمي ومحترم.', 'resign.last': 'آخر يوم', 'from.whom': 'صاحب الطلب',
      'dayn': 'أيام', 'profile': 'الملف الشخصي', 'lang': 'English', 'logout': 'خروج', 'role': 'الدور', 'role.admin': 'Admin', 'role.manager': 'Manager', 'role.employee': 'Team',
      'team.h': 'الـ Team', 'install': 'ضيف التطبيق على شاشتك: من المتصفح اختار "إضافة إلى الشاشة الرئيسية".',
      'dial.hint': 'اسحب العين يمين وشمال', 'dial.tap': 'اضغط للإضافة', 'overlap': 'التواريخ دي متداخلة مع إجازة تانية ليك.', 'baddates': 'تاريخ النهاية لازم يكون بعد البداية.',
      'balance.of': 'من', 'used': 'اتاخد', 'offline': 'مفيش إنترنت'
    },
    en: {
      app: 'Shadows', tag: 'We move in silence', loading: 'One moment…',
      'auth.in': 'Sign in', 'auth.up': 'New account', 'auth.email': 'Email', 'auth.pw': 'Password', 'auth.name': 'Your name',
      'auth.go.in': 'Sign in', 'auth.go.up': 'Create account', 'auth.demo': 'Try the demo', 'auth.hint.up': 'The first account becomes admin.',
      'auth.bad': 'Wrong email or password.', 'auth.exists': 'That email is already registered.', 'auth.confirm': 'The project still asks for email confirmation. Turn off "Confirm email" in the sign-in settings.',
      'auth.short': 'Password needs at least 6 characters.', 'auth.fill': 'Enter your email and password.', 'auth.err': 'Something went wrong. Try again.',
      'demo.bar': 'Demo mode: data stays on this device', 'demo.reset': 'Reset and start over',
      home: 'Home', tickets: 'Tickets', leaves: 'Leaves', clients: 'Clients', resign: 'Resignations', me: 'Me',
      'hi': 'Hello', 'hi.sub': 'Here is your day.', 'k.tickets': 'Open tickets', 'k.leaves': 'Pending leaves', 'k.clients': 'Active clients', 'k.pending': 'Waiting for you',
      'k.balance': 'Annual leave balance', 'days': 'days', 'recent': 'Recent activity', 'none': 'Nothing here yet.',
      'new': 'New', 'new.ticket': 'New ticket', 'new.leave': 'Request leave', 'new.client': 'New client', 'new.resign': 'Submit resignation',
      'f.title': 'Title', 'f.cat': 'Category', 'f.prio': 'Priority', 'f.desc': 'Details', 'f.type': 'Leave type', 'f.from': 'From', 'f.to': 'To', 'f.reason': 'Reason (optional)',
      'f.lastday': 'Last working day', 'f.notes': 'Notes (optional)', 'f.name': 'Client name', 'f.contact': 'Contact person', 'f.phone': 'Phone', 'f.email': 'Email', 'f.status': 'Status',
      'save': 'Save', 'send': 'Send', 'cancel': 'Cancel', 'close': 'Close', 'back': 'Back', 'edit': 'Edit', 'delete': 'Delete', 'saved': 'Saved', 'sent': 'Sent', 'fail': 'Could not save. Try again.',
      'mine': 'Mine', 'all': 'All', 'team': 'Everyone', 'search': 'Search…', 'comments': 'Comments', 'comment.ph': 'Write a comment…', 'by': 'by',
      'st.open': 'Open', 'st.in_progress': 'In progress', 'st.resolved': 'Resolved', 'st.closed': 'Closed',
      'pr.low': 'Low', 'pr.normal': 'Normal', 'pr.high': 'High', 'pr.urgent': 'Urgent',
      'cat.it': 'IT', 'cat.hr': 'HR', 'cat.finance': 'Finance', 'cat.workspace': 'Workspace', 'cat.other': 'Other',
      'lt.annual': 'Annual', 'lt.sick': 'Sick', 'lt.unpaid': 'Unpaid', 'lt.emergency': 'Emergency',
      'ls.pending': 'Pending', 'ls.approved': 'Approved', 'ls.rejected': 'Rejected', 'ls.cancelled': 'Cancelled',
      'rs.pending': 'Pending', 'rs.accepted': 'Accepted', 'rs.rejected': 'Rejected', 'rs.withdrawn': 'Withdrawn',
      'cs.lead': 'Lead', 'cs.active': 'Active', 'cs.paused': 'Paused', 'cs.closed': 'Closed',
      'approve': 'Approve', 'reject': 'Reject', 'accept': 'Accept', 'withdraw': 'Withdraw request', 'cancelreq': 'Cancel request', 'note': 'Decision note (optional)',
      'resign.warn': 'This goes to management only. You can withdraw it while it is pending.', 'resign.confirm': 'Are you sure you want to resign?', 'resign.yes': 'Yes, submit',
      'resign.intro': 'Submit your resignation formally and respectfully.', 'resign.last': 'Last day', 'from.whom': 'Requested by',
      'dayn': 'days', 'profile': 'Profile', 'lang': 'العربية', 'logout': 'Sign out', 'role': 'Role', 'role.admin': 'Admin', 'role.manager': 'Manager', 'role.employee': 'Employee',
      'team.h': 'Team members', 'install': 'Add the app to your home screen: use "Add to Home Screen" in the browser menu.',
      'dial.hint': 'Drag the eye left or right', 'dial.tap': 'Tap to add', 'overlap': 'These dates overlap another leave of yours.', 'baddates': 'The end date must be after the start.',
      'balance.of': 'of', 'used': 'used', 'offline': 'Offline'
    }
  };
  var lang = 'ar';
  try { lang = localStorage.getItem('crm.lang') || ((navigator.language || '').slice(0, 2) === 'en' ? 'en' : 'ar'); } catch (e) {}
  var I = {
    get lang() { return lang; },
    set: function (l) { lang = l; try { localStorage.setItem('crm.lang', l); } catch (e) {} document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; },
    t: function (k) { return (D[lang] && D[lang][k]) || D.en[k] || k; },
    date: function (s) { if (!s) return ''; var d = new Date(s.length === 10 ? s + 'T12:00:00' : s); return d.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); },
    ago: function (s) {
      var m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
      if (m < 1) return lang === 'ar' ? 'دلوقتي' : 'now';
      if (m < 60) return lang === 'ar' ? 'من ' + m + ' دقيقة' : m + 'm ago';
      var h = Math.round(m / 60); if (h < 24) return lang === 'ar' ? 'من ' + h + ' ساعة' : h + 'h ago';
      var d = Math.round(h / 24); return lang === 'ar' ? 'من ' + d + ' يوم' : d + 'd ago';
    }
  };
  window.I18N = I; I.set(lang);
})();
