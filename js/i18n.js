/* Arabic (default) and English strings. Egyptian Arabic for the team. */
(function () {
  'use strict';
  var D = {
    ar: {
      'f.client': 'Client', 'cl.members': 'الفريق على العميل', 'cl.manage': 'اختار الفريق', 'cl.tasks': 'Tasks', 'cl.addtask': 'ضيف Task', 'cl.nomem': 'لسه محدش متعيّن.', 'cl.notask': 'مفيش Tasks لسه.', 'team.of': 'التيم', 'team.production': 'الإنتاج', 'team.editing': 'المونتاج', 'team.design': 'التصميم', 'team.social': 'السوشيال ميديا', 'team.none': 'من غير تيم', 'prof.clients': 'Clients', 'cal.h': 'مين في إجازة', 'cal.none': 'محدش في إجازة اليوم ده.', 'cal.pending': 'مستني', 'cl.people': 'أفراد', 'cl.open': 'مفتوحة', 'cl.done': 'خلصت', 'none.client': 'من غير عميل',
      app: 'Shadows', tag: 'WE MOVE IN SILENCE.', loading: 'ثانية واحدة…',
      'auth.in': 'دخول', 'auth.up': 'حساب جديد', 'auth.email': 'الإيميل', 'auth.pw': 'كلمة السر', 'auth.name': 'اسمك',
      'auth.go.in': 'ادخل', 'auth.go.up': 'اعمل حساب', 'auth.demo': 'جرّب النسخة التجريبية', 'auth.hint.up': 'أول حساب بيبقى أدمن.',
      'auth.bad': 'الإيميل أو كلمة السر غلط.', 'auth.exists': 'الإيميل ده مسجّل قبل كده.', 'auth.confirm': 'اتبعتلك إيميل تأكيد. افتحه واضغط على الرابط، وبعدها ادخل.', 'auth.notinvited': 'الإيميل ده مش مدعو. اطلب الدعوة من الإدارة.',
      'auth.short': 'كلمة السر لازم تكون 6 حروف على الأقل.', 'auth.fill': 'اكتب الإيميل وكلمة السر.', 'auth.err': 'حصلت مشكلة. جرّب تاني.',
      'demo.bar': 'نسخة تجريبية: البيانات على جهازك بس', 'demo.reset': 'امسح وابدأ من جديد',
      expenses: 'المصروفات', assets: 'الملفات', 'new.expense': 'طلب مصروف', 'new.asset': 'ملف جديد', 'e.kind': 'النوع', 'e.expense': 'مصروف', 'e.advance': 'سلفة', 'e.amount': 'المبلغ (جنيه)', 'e.note': 'التفاصيل', 'e.intro': 'مصروفات وسلف الفريق. الطلب بيوصل للإدارة.', 'e.cur': 'ج.م', 'ls.settled': 'اتسوّت', 'e.settle': 'تمت التسوية', 'n.expense_req': 'طلب مصروف', 'n.expense_decided': 'قرار على طلب المصروف', 'd.expense': 'مصروف', 'e.badamt': 'اكتب مبلغ صحيح',
      'a.scope': 'الفئة', 'a.company': 'ملفات الشركة', 'a.client': 'ملفات العملاء', 'a.name': 'الاسم', 'a.url': 'الرابط', 'a.client.pick': 'العميل', 'a.adminonly': 'ملفات الشركة للإدارة فقط.', 'a.open': 'فتح', 'a.intro': 'روابط الملفات المهمة. ملفات الشركة للإدارة بس.', 'a.badurl': 'اكتب الاسم والرابط (https://)',
      home: 'Dashboard', tasks: 'Tasks', attend: 'الحضور والانصراف', leaves: 'الإجازات', clients: 'Clients', resign: 'الاستقالات', me: 'حسابي',
      'att.checkin': 'سجّل حضور', 'att.checkout': 'سجّل انصراف', 'att.out': 'مش مسجّل حضور دلوقتي', 'att.since': 'حاضر من', 'att.now': 'الموجودين دلوقتي', 'att.hist': 'السجل', 'att.in': 'موجود', 'att.hi': 'اتسجل حضورك', 'att.bye': 'اتسجل انصرافك', 'hrs': 'س',
      'bell': 'الإشعارات', 'n.task_assigned': 'اتعيّنت لك Task', 'n.task_done': 'خلّص Task', 'n.task_comment': 'علّق على Task', 'n.leave_req': 'طلب إجازة', 'n.resign_req': 'قدّم استقالة', 'n.leave_decided': 'قرار على طلب إجازتك', 'n.resign_decided': 'قرار على استقالتك', 'n.markread': 'علّم الكل كمقروء',
      'overdue': 'متأخرة', 'soon': 'قربت', 'attn': 'محتاجة انتباه', 'prof.open': 'الملف الشخصي', 'prof.done': 'اتنجزت', 'prof.open2': 'مفتوحة', 'prof.late': 'متأخرة', 'prof.att': 'حضور آخر 30 يوم', 'prof.hours': 'ساعات', 'prof.days': 'يوم حضور', 'prof.tasks': 'آخر Tasks خلصت', 'prof.leave': 'رصيد الإجازات',
      'log': 'سجل القرارات', 'd.approved': 'وافق على', 'd.rejected': 'رفض', 'd.accepted': 'قبل', 'd.leave': 'إجازة', 'd.resignation': 'استقالة', 'report': 'التقرير الأسبوعي', 'rep.period': 'آخر 7 أيام', 'rep.copy': 'انسخ التقرير', 'rep.copied': 'اتنسخ', 'rep.done': 'اتنجزت', 'rep.hours': 'ساعات حضور', 'rep.lv': 'إجازات منتظرة', 'rep.tot': 'الإجمالي', 'rep.line': 'تقرير الأسبوع جاهز', 'by.admin': 'من',
      'n.broadcast': 'بعت نداء عام', 'n.star': 'اختارك نجم الأسبوع', 'n.task_ack': 'خلّص Task من ناحيته', 'whole': 'الفريق كله', 'voice.rec': 'سجّل فويس', 'voice.stop': 'وقّف', 'voice.ok': 'الفويس جاهز', 'voice.rm': 'امسح', 'voice.deny': 'مقدرتش أفتح المايك. اسمح بالمايك من إعدادات المتصفح.', 'voice.none': 'المتصفح ده مش بيسجّل صوت.', 'voice.h': 'فويس نوت', 'team.done': 'خلّصوا', 'ack.mine': 'خلصت من ناحيتي', 'ack.ok': 'تمام، اتسجّلت',
      'bc.h': 'نداء عام', 'bc.new': 'ابعت نداء للفريق', 'bc.ph': 'اكتب الرسالة…', 'bc.urgent': 'مستعجل', 'bc.sent': 'وصل للفريق', 'star.h': 'نجم الأسبوع', 'star.pick': 'اختار نجم الأسبوع', 'star.badge': 'نجم الأسبوع', 'star.set': 'اتسجّل نجم الأسبوع', 'tag.full': 'SILENT WORK. LOUD RESULTS.',
      'lens': 'العدسة', 'intro.tap': 'اضغط للاقتراب', 'hi': 'أهلًا', 'hi.sub': 'ده ملخص يومك.', 'k.tasks': 'Tasks مفتوحة', 'k.leaves': 'إجازات منتظرة', 'k.clients': 'Clients شغّالين', 'k.pending': 'محتاجة قرارك',
      'k.balance': 'رصيد الإجازات السنوية', 'days': 'يوم', 'recent': 'آخر الحركات', 'none': 'مفيش حاجة هنا لسه.',
      'new': 'جديد', 'new.task': 'Task جديدة', 'new.leave': 'طلب إجازة', 'new.client': 'Client جديد', 'new.resign': 'تقديم استقالة',
      'f.title': 'العنوان', 'f.cat': 'النوع', 'f.prio': 'الأولوية', 'f.desc': 'التفاصيل', 'f.type': 'نوع الإجازة', 'f.from': 'من', 'f.to': 'إلى', 'f.reason': 'السبب (اختياري)',
      'f.lastday': 'آخر يوم شغل', 'f.notes': 'ملاحظات (اختياري)', 'f.name': 'اسم الـ Client', 'f.contact': 'الشخص المسؤول', 'f.phone': 'الموبايل', 'f.email': 'الإيميل', 'f.status': 'الحالة',
      'save': 'حفظ', 'send': 'إرسال', 'cancel': 'إلغاء', 'close': 'قفل', 'back': 'رجوع', 'edit': 'تعديل', 'delete': 'مسح', 'saved': 'تم الحفظ', 'sent': 'اتبعت', 'fail': 'معرفتش أحفظ. جرّب تاني.',
      'mine': 'بتاعتي', 'all': 'الكل', 'team': 'الفريق كله', 'search': 'دوّر…', 'comments': 'التعليقات', 'comment.ph': 'اكتب تعليق…', 'by': 'من',
      'st.todo': 'لسه', 'st.in_progress': 'شغّالين عليها', 'st.done': 'خلصت',
      'f.assignee': 'اديها لـ', 'f.due': 'الموعد', 'to': 'إلى', 'from.admin': 'من',
      'pr.low': 'عادية', 'pr.normal': 'متوسطة', 'pr.high': 'عالية', 'pr.urgent': 'مستعجلة',
      'cat.it': 'تقنية', 'cat.hr': 'موارد بشرية', 'cat.finance': 'حسابات', 'cat.workspace': 'مكان الشغل', 'cat.other': 'حاجة تانية',
      'lt.annual': 'إجازة سنوية', 'lt.sick': 'إجازة مرضية', 'lt.unpaid': 'إجازة بدون مرتب', 'lt.emergency': 'إجازة عارضة',
      'ls.pending': 'قيد الانتظار', 'ls.approved': 'تمت الموافقة', 'ls.rejected': 'مرفوضة', 'ls.cancelled': 'ملغية',
      'rs.pending': 'منتظرة', 'rs.accepted': 'اتقبلت', 'rs.rejected': 'اترفضت', 'rs.withdrawn': 'اتسحبت',
      'cs.lead': 'محتمل', 'cs.active': 'شغّال', 'cs.paused': 'واقف', 'cs.closed': 'اتقفل',
      'approve': 'وافق', 'reject': 'ارفض', 'accept': 'اقبل', 'withdraw': 'اسحب الطلب', 'cancelreq': 'ألغي الطلب', 'note': 'ملاحظة القرار (اختياري)',
      'resign.warn': 'الطلب ده بيوصل للإدارة بس. تقدر تسحبه طول ما هو منتظر.', 'resign.confirm': 'متأكد إنك عايز تقدّم استقالة؟', 'resign.yes': 'أيوه، قدّم الطلب',
      'resign.intro': 'هنا تقدر تقدّم استقالتك بشكل رسمي ومحترم.', 'resign.last': 'آخر يوم', 'from.whom': 'صاحب الطلب',
      'dayn': 'يوم', 'profile': 'الملف الشخصي', 'lang': 'English', 'logout': 'خروج', 'role': 'الدور', 'role.admin': 'أدمن', 'role.manager': 'مدير', 'role.employee': 'موظف',
      'team.h': 'الفريق', 'install': 'ضيف التطبيق على شاشتك: من المتصفح اختار "إضافة إلى الشاشة الرئيسية".',
      'dial.hint': 'المس العدسة ولفّها وسيبها تفتح', 'dial.tap': 'المس ولفّ', 'overlap': 'التواريخ دي متداخلة مع إجازة تانية ليك.', 'baddates': 'تاريخ النهاية لازم يكون بعد البداية.',
      'balance.of': 'متبقي من', 'used': 'تم استخدامها', 'offline': 'مفيش إنترنت'
    },
    en: {
      'f.client': 'Client', 'cl.members': 'Team on this client', 'cl.manage': 'Choose team', 'cl.tasks': 'Tasks', 'cl.addtask': 'Add Task', 'cl.nomem': 'Nobody assigned yet.', 'cl.notask': 'No Tasks yet.', 'team.of': 'Team', 'team.production': 'Production', 'team.editing': 'Editing', 'team.design': 'Design', 'team.social': 'Social media', 'team.none': 'No team', 'prof.clients': 'Clients', 'cal.h': 'Who is off', 'cal.none': 'Nobody is off this day.', 'cal.pending': 'pending', 'cl.people': 'people', 'cl.open': 'open', 'cl.done': 'Done', 'none.client': 'No client',
      app: 'Shadows', tag: 'WE MOVE IN SILENCE.', loading: 'One moment…',
      'auth.in': 'Sign in', 'auth.up': 'New account', 'auth.email': 'Email', 'auth.pw': 'Password', 'auth.name': 'Your name',
      'auth.go.in': 'Sign in', 'auth.go.up': 'Create account', 'auth.demo': 'Try the demo', 'auth.hint.up': 'The first account becomes admin.',
      'auth.bad': 'Wrong email or password.', 'auth.exists': 'That email is already registered.', 'auth.confirm': 'We sent you a confirmation email. Open it, tap the link, then sign in.', 'auth.notinvited': 'This email is not invited. Ask management for an invite.',
      'auth.short': 'Password needs at least 6 characters.', 'auth.fill': 'Enter your email and password.', 'auth.err': 'Something went wrong. Try again.',
      'demo.bar': 'Demo mode: data stays on this device', 'demo.reset': 'Reset and start over',
      expenses: 'Expenses', assets: 'Assets', 'new.expense': 'Request expense', 'new.asset': 'New asset', 'e.kind': 'Type', 'e.expense': 'Expense', 'e.advance': 'Advance', 'e.amount': 'Amount (EGP)', 'e.note': 'Details', 'e.intro': 'Team expenses and advances. Requests go to management.', 'e.cur': 'EGP', 'ls.settled': 'Settled', 'e.settle': 'Mark settled', 'n.expense_req': 'requested an expense', 'n.expense_decided': 'decided your expense request', 'd.expense': 'expense', 'e.badamt': 'Enter a valid amount',
      'a.scope': 'Group', 'a.company': 'Company assets', 'a.client': 'Client assets', 'a.name': 'Name', 'a.url': 'Link', 'a.client.pick': 'Client', 'a.adminonly': 'Company assets are admin only.', 'a.open': 'Open', 'a.intro': 'Links to the files that matter. Company assets are for admins only.', 'a.badurl': 'Enter a name and a link (https://)',
      home: 'Dashboard', tasks: 'Tasks', attend: 'Attendance', leaves: 'Leaves', clients: 'Clients', resign: 'Resignations', me: 'Me',
      'att.checkin': 'Check in', 'att.checkout': 'Check out', 'att.out': 'You are not checked in', 'att.since': 'In since', 'att.now': 'Here now', 'att.hist': 'History', 'att.in': 'Present', 'att.hi': 'Checked in', 'att.bye': 'Checked out', 'hrs': 'h',
      'bell': 'Notifications', 'n.task_assigned': 'assigned you a Task', 'n.task_done': 'finished a Task', 'n.task_comment': 'commented on a Task', 'n.leave_req': 'requested leave', 'n.resign_req': 'submitted a resignation', 'n.leave_decided': 'decided your leave request', 'n.resign_decided': 'decided your resignation', 'n.markread': 'Mark all as read',
      'overdue': 'Overdue', 'soon': 'Due soon', 'attn': 'Needs attention', 'prof.open': 'Profile', 'prof.done': 'Done', 'prof.open2': 'Open', 'prof.late': 'Overdue', 'prof.att': 'Attendance, last 30 days', 'prof.hours': 'hours', 'prof.days': 'days present', 'prof.tasks': 'Recently finished tasks', 'prof.leave': 'Leave balance',
      'log': 'Decision log', 'd.approved': 'approved', 'd.rejected': 'rejected', 'd.accepted': 'accepted', 'd.leave': 'leave', 'd.resignation': 'resignation', 'report': 'Weekly report', 'rep.period': 'Last 7 days', 'rep.copy': 'Copy report', 'rep.copied': 'Copied', 'rep.done': 'Tasks done', 'rep.hours': 'Attendance hours', 'rep.lv': 'Pending leaves', 'rep.tot': 'Total', 'rep.line': 'This week\'s report is ready', 'by.admin': 'By',
      'n.broadcast': 'sent a broadcast', 'n.star': 'picked you as star of the week', 'n.task_ack': 'finished a Task on their side', 'whole': 'Whole team', 'voice.rec': 'Record voice', 'voice.stop': 'Stop', 'voice.ok': 'Voice note ready', 'voice.rm': 'Remove', 'voice.deny': 'Could not open the microphone. Allow it in browser settings.', 'voice.none': 'This browser cannot record audio.', 'voice.h': 'Voice notes', 'team.done': 'done', 'ack.mine': 'I finished my part', 'ack.ok': 'Done, recorded',
      'bc.h': 'Broadcast', 'bc.new': 'Send a broadcast to the team', 'bc.ph': 'Write the message…', 'bc.urgent': 'Urgent', 'bc.sent': 'Sent to the team', 'star.h': 'Star of the week', 'star.pick': 'Pick the star of the week', 'star.badge': 'Star of the week', 'star.set': 'Star of the week saved', 'tag.full': 'SILENT WORK. LOUD RESULTS.',
      'lens': 'The lens', 'intro.tap': 'TAP TO MOVE IN', 'hi': 'Hello', 'hi.sub': 'Here is your day.', 'k.tasks': 'Open tasks', 'k.leaves': 'Pending leaves', 'k.clients': 'Active clients', 'k.pending': 'Waiting for you',
      'k.balance': 'Annual leave balance', 'days': 'days', 'recent': 'Recent activity', 'none': 'Nothing here yet.',
      'new': 'New', 'new.task': 'New task', 'new.leave': 'Request leave', 'new.client': 'New client', 'new.resign': 'Submit resignation',
      'f.title': 'Title', 'f.cat': 'Category', 'f.prio': 'Priority', 'f.desc': 'Details', 'f.type': 'Leave type', 'f.from': 'From', 'f.to': 'To', 'f.reason': 'Reason (optional)',
      'f.lastday': 'Last working day', 'f.notes': 'Notes (optional)', 'f.name': 'Client name', 'f.contact': 'Contact person', 'f.phone': 'Phone', 'f.email': 'Email', 'f.status': 'Status',
      'save': 'Save', 'send': 'Send', 'cancel': 'Cancel', 'close': 'Close', 'back': 'Back', 'edit': 'Edit', 'delete': 'Delete', 'saved': 'Saved', 'sent': 'Sent', 'fail': 'Could not save. Try again.',
      'mine': 'Mine', 'all': 'All', 'team': 'Everyone', 'search': 'Search…', 'comments': 'Comments', 'comment.ph': 'Write a comment…', 'by': 'by',
      'st.todo': 'To do', 'st.in_progress': 'In progress', 'st.done': 'Done',
      'f.assignee': 'Assign to', 'f.due': 'Due date', 'to': 'to', 'from.admin': 'From',
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
      'dial.hint': 'Touch the lens, turn it, let go to open', 'dial.tap': 'Touch and turn', 'overlap': 'These dates overlap another leave of yours.', 'baddates': 'The end date must be after the start.',
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
