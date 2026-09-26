import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'ซิงค์เอกสาร',
  'docsync.noProviders': 'ไม่มีผู้ให้บริการเอกสารที่พร้อมใช้งาน',
  'docsync.noProvidersHint': 'ผู้ดูแลอินสแตนซ์เปิดใช้งานได้ที่ ผู้ดูแลระบบ, ส่วนเสริม, เอกสาร',
  'docsync.addProvider': 'เชื่อมต่อผู้ให้บริการ',
  'docsync.test': 'ทดสอบการเชื่อมต่อ',
  'docsync.connect.optional': 'ไม่บังคับ',
  'docsync.connected': 'เชื่อมต่อแล้ว',
  'docsync.chooseFolder': 'เลือกโฟลเดอร์',
  'docsync.noFolders': 'ยังไม่พบอะไรในอินสแตนซ์นี้',
  'docsync.newFolderPlaceholder': 'ชื่อโฟลเดอร์ใหม่',
  'docsync.syncNow': 'ซิงค์เลย',
  'docsync.unlink': 'ตัดการเชื่อมต่อ',
  'docsync.confirmUnlink': 'เอกสารจะยังคงอยู่ใน TREK และในที่จัดเก็บ มีเพียงการจับคู่ระหว่างกันเท่านั้นที่ถูกยกเลิก',
  'docsync.syncEnabled': 'ซิงค์อัตโนมัติ',
  'docsync.deletePolicy': 'เมื่อเอกสารถูกลบ',
  'docsync.deleteUnlink': 'เก็บทั้งสองสำเนา',
  'docsync.deleteTrash': 'ย้ายไปถังรีไซเคิล',
  'docsync.conflictPolicy': 'เมื่อทั้งสองฝั่งมีการเปลี่ยนแปลง',
  'docsync.onConflict.manual': 'ถามฉัน',
  'docsync.onConflict.trek_wins': 'เก็บสำเนาของ TREK',
  'docsync.onConflict.provider_wins': 'เก็บสำเนาของที่จัดเก็บ',
  'docsync.webhookHint': 'วาง URL นี้ในผู้ให้บริการของคุณเพื่อให้การเปลี่ยนแปลงมาถึงทันที หากไม่มี TREK จะตรวจสอบตามรอบเวลา',

  // Connection form fields. The keys mirror the `label` column in
  // document_provider_fields, which stores a key suffix rather than text.
  'docsync.providerUrl': 'ที่อยู่',
  'docsync.providerApiToken': 'โทเค็น API',
  'docsync.providerApiKey': 'คีย์ API',
  'docsync.providerAppPassword': 'รหัสผ่านแอป',
  'docsync.providerAppToken': 'โทเค็นแอป',
  'docsync.providerUsername': 'ชื่อผู้ใช้',
  'docsync.providerPassword': 'รหัสผ่าน',
  'docsync.providerOrganization': 'ID องค์กร',
  'docsync.providerBasePath': 'โฟลเดอร์หลัก',
  'docsync.providerOTP': 'รหัสยืนยันสองขั้นตอน',
  'docsync.allowInsecureTls': 'ยอมรับใบรับรองที่ลงนามด้วยตนเอง',

  'docsync.hintPaperlessToken': 'สร้างได้ที่ My Profile ใน Paperless โทเค็นนี้มีสิทธิ์เต็มของบัญชีนั้น',
  'docsync.hintPapraKey': 'สร้างได้ที่ API keys ใน Papra คีย์ของ Papra เข้าถึงทุกองค์กรที่คุณเป็นสมาชิกเสมอ',
  'docsync.hintPapraOrg': 'ID org_… จากแถบที่อยู่ของ Papra',
  'docsync.hintNextcloudLogin': 'ชื่อเข้าสู่ระบบ Nextcloud ของคุณ ไม่ใช่ที่อยู่อีเมล',
  'docsync.hintNextcloudAppPassword': 'Settings, Security, Create new app password ห้ามใช้รหัสผ่านบัญชีของคุณ',
  'docsync.hintOpenCloudToken': 'สร้างได้ที่ app tokens ใน OpenCloud',
  'docsync.hintBasePath': 'ตำแหน่งที่ TREK ใช้ค้นหาโฟลเดอร์การเดินทาง ค่าเริ่มต้นคือ /TREK',
  'docsync.hintSynologyUrl': 'ใส่พอร์ตด้วย เช่น https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'ควรใช้บัญชี DSM เฉพาะที่เข้าถึงได้เพียงโฟลเดอร์แชร์นี้',
  'docsync.hintSynologyOtp': 'ต้องใช้เพียงครั้งเดียว หากบัญชีเปิดใช้การยืนยันตัวตนสองขั้นตอน',

  'docsync.linkState.never': 'ยังไม่ได้ซิงค์',
  'docsync.linkState.ok': 'ซิงค์ตรงกันแล้ว',
  'docsync.linkState.partial': 'ซิงค์บางส่วน',
  'docsync.linkState.failed': 'ล้มเหลว',
  'docsync.linkState.needs_reauth': 'เข้าสู่ระบบอีกครั้ง',
  'docsync.linkState.scope_lost': 'ไม่พบโฟลเดอร์แล้ว',
  'docsync.linkState.orphaned': 'เจ้าของออกจากการเดินทางแล้ว',

  'docsync.state.pending': 'รอดำเนินการ',
  'docsync.state.synced': 'ซิงค์แล้ว',
  'docsync.state.conflict': 'ขัดแย้ง',
  'docsync.state.rejected_type': 'ไม่อนุญาตประเภทนี้',
  'docsync.state.too_large': 'ใหญ่เกินไป',
  'docsync.state.error': 'เกิดข้อผิดพลาด',
  'docsync.state.remote_missing': 'ไม่พบที่ผู้ให้บริการ',
  'docsync.state.local_deleted': 'ลบใน TREK แล้ว',
  'docsync.state.scope_drift': 'ถูกย้ายออกจากโฟลเดอร์',

  'docsync.conflict.resolve': 'แก้ไข {count} รายการ',

  'docsync.conflict.title': 'ทั้งสองสำเนามีการเปลี่ยนแปลง',
  'docsync.conflict.keepTrek': 'เก็บเวอร์ชันของ TREK',
  'docsync.conflict.keepProvider': 'เก็บเวอร์ชันของผู้ให้บริการ',
  'docsync.conflict.keepBoth': 'เก็บทั้งสอง',

  // Failure reasons travel as codes, never as upstream text: a provider answers
  // in English, or with a proxy's HTML login page, and neither belongs here.
  'docsync.error.unreachable': 'ไม่สามารถติดต่อผู้ให้บริการได้',
  'docsync.error.tls_untrusted': 'ใบรับรองถูกปฏิเสธ อนุญาตใบรับรองที่ลงนามด้วยตนเองหากคุณเชื่อถืออินสแตนซ์นี้',
  'docsync.error.unauthorized': 'ข้อมูลเข้าสู่ระบบถูกปฏิเสธ',
  'docsync.error.forbidden': 'บัญชีนี้ไม่ได้รับอนุญาตให้ทำสิ่งนั้น',
  'docsync.error.not_found': 'ไม่พบที่ผู้ให้บริการ',
  'docsync.error.scope_missing': 'โฟลเดอร์ที่เชื่อมต่อไม่มีอยู่แล้ว',
  'docsync.error.rate_limited': 'ผู้ให้บริการกำลังจำกัดจำนวนคำขอ TREK จะลองอีกครั้งในภายหลัง',
  'docsync.error.too_large': 'ไฟล์มีขนาดใหญ่เกินกว่าที่ผู้ให้บริการรับได้',
  'docsync.error.unsupported_type': 'ผู้ให้บริการไม่รับไฟล์ประเภทนี้',
  'docsync.error.quota_exceeded': 'พื้นที่ของผู้ให้บริการเต็มแล้ว',
  'docsync.error.conflict': 'เอกสารมีการเปลี่ยนแปลงทั้งสองฝั่ง',
  'docsync.error.checksum_mismatch': 'ข้อมูลที่ถ่ายโอนมาไม่สมบูรณ์',
  'docsync.error.provider_error': 'ผู้ให้บริการรายงานข้อผิดพลาด',
  'docsync.error.timeout': 'ผู้ให้บริการใช้เวลาตอบนานเกินไป',
  'docsync.error.ssrf_blocked': 'ไม่อนุญาตที่อยู่นี้',
  'docsync.error.mass_delete_guard': 'เอกสารส่วนใหญ่หายไปพร้อมกัน จึงไม่มีการเปลี่ยนแปลงใดๆ โปรดตรวจสอบว่าโฟลเดอร์ยังเมานต์อยู่',
  'docsync.error.unknown': 'มีบางอย่างผิดพลาด',

  // ── The dialog ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'ทริปนี้',
  'docsync.addAnother': 'เพิ่มอีกอัน',
  'docsync.syncing': 'กำลังซิงค์',
  'docsync.card.pickFolder': 'เชื่อมต่อแล้ว โปรดเลือกโฟลเดอร์',

  'docsync.empty.title': 'ยังไม่ได้เชื่อมต่อ',
  'docsync.empty.hintOwner': 'เลือกที่จัดเก็บทางซ้าย TREK เก็บสำเนาของทุกอย่างไว้เอง จึงไม่มีอะไรสูญหายหากที่จัดเก็บนั้นหายไป',
  'docsync.empty.hintMember': 'เจ้าของการเดินทางเป็นผู้ตั้งค่านี้ ไม่ว่าอย่างไรเอกสารก็ยังคงอยู่ใน TREK',

  // How each product files things. Shown before anyone connects, because it is
  // what the next screen will ask for.
  'docsync.model.paperless': 'ไฟล์ตามแท็ก',
  'docsync.model.papra': 'ไฟล์ตามแท็ก ภายในองค์กร',
  'docsync.model.nextcloud': 'ไฟล์ในโฟลเดอร์',
  'docsync.model.opencloud': 'ไฟล์ในสเปซ',
  'docsync.model.synologydrive': 'ไฟล์ในโฟลเดอร์บน NAS',

  // ── The flow bar ───────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'ส่งออกไปยังที่จัดเก็บ',
  'docsync.flow.toTrek': 'รับเข้าจากที่จัดเก็บ',
  'docsync.flow.documents': 'เอกสาร',
  'docsync.flow.summary.both': 'เอกสารเคลื่อนย้ายทั้งสองทาง',
  'docsync.flow.summary.pull': 'เอกสารรับเข้าเท่านั้น',
  'docsync.flow.summary.push': 'เอกสารส่งออกเท่านั้น',
  'docsync.flow.summaryEditable.both': 'เคลื่อนย้ายทั้งสองทาง แตะช่องทางเพื่อหยุด',
  'docsync.flow.summaryEditable.pull': 'รับเข้าเท่านั้น แตะอีกช่องทางเพื่อส่งออกด้วย',
  'docsync.flow.summaryEditable.push': 'ส่งออกเท่านั้น แตะอีกช่องทางเพื่อรับเข้าด้วย',

  // ── One binding ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'การตั้งค่า',
  'docsync.binding.folder': 'โฟลเดอร์',
  'docsync.binding.lastRun': 'ทำงานล่าสุด',
  'docsync.binding.autoOff': 'หยุดชั่วคราว',
  'docsync.binding.neverRun': 'ยังไม่เคยทำงาน',
  'docsync.binding.deleteHint': 'สิ่งที่จะเกิดกับสำเนาอีกฝั่ง',
  'docsync.binding.conflictHint': 'สำเนาใดจะถูกเก็บไว้เมื่อเอกสารถูกแก้ไขทั้งสองที่',
  'docsync.binding.autoHint': 'ตรวจสอบการเปลี่ยนแปลงในเบื้องหลัง',
  'docsync.binding.webhookTitle': 'อัปเดตทันที',
  'docsync.binding.copy': 'คัดลอก',
  'docsync.binding.copied': 'คัดลอกแล้ว',

  // ── Connecting ─────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'เชื่อมต่อ',
  'docsync.connect.testing': 'กำลังพยายามติดต่อ',
  'docsync.connect.okAs': 'ติดต่อได้แล้ว เข้าสู่ระบบในชื่อ {account}',
  'docsync.connect.insecureHint': 'สำหรับอินสแตนซ์บนเครือข่ายของคุณเองที่ใช้ใบรับรองที่ลงนามด้วยตนเอง',
  'docsync.connect.about.paperless': 'TREK จัดเก็บการเดินทางนี้ภายใต้แท็กของตัวเอง และไม่แตะส่วนอื่นในคลังเอกสารของคุณ',
  'docsync.connect.about.papra': 'เลือกองค์กรที่การเดินทางนี้สังกัด TREK จะจัดเก็บไว้ภายใต้แท็กของตัวเองในองค์กรนั้น',
  'docsync.connect.about.nextcloud': 'ใช้รหัสผ่านแอป ไม่ใช่รหัสผ่านบัญชี: ใช้งานได้แม้เปิดการยืนยันสองขั้นตอน และเพิกถอนแยกได้',
  'docsync.connect.about.opencloud': 'TREK จะได้สเปซของตัวเองสำหรับการเดินทางนี้ แยกจากทุกอย่าง',
  'docsync.connect.about.synologydrive': 'ควรใช้บัญชี DSM ที่เข้าถึงได้เพียงโฟลเดอร์แชร์ที่การเดินทางนี้ใช้',

  // ── Picking the container ──────────────────────────────────────────────────
  'docsync.scope.title': 'ควรเก็บการเดินทางนี้ไว้ที่ใดใน {provider}',
  'docsync.scope.intro': 'จะซิงค์เฉพาะสิ่งที่อยู่ในนี้ สิ่งอื่นในที่จัดเก็บของคุณจะไม่เข้ามาใน TREK',
  'docsync.scope.createTitle': 'สร้างใหม่',
  'docsync.scope.createAction': 'สร้าง',
  'docsync.scope.pickTitle': 'หรือใช้ที่คุณมีอยู่แล้ว',
  'docsync.scope.search': 'ค้นหา',
  'docsync.scope.noMatch': 'ไม่มีอะไรตรงกับสิ่งนั้น',

  // ── Things a person has to decide ──────────────────────────────────────────
  'docsync.issues.title': 'ต้องตรวจสอบ',
  'docsync.issues.conflict': 'มีการเปลี่ยนแปลงทั้งสองที่ เลือกว่าจะเก็บอันไหน',
  'docsync.issues.remote_missing': 'หายไปจากที่จัดเก็บ สำเนาใน TREK ยังอยู่',
  'docsync.issues.rejected_type': 'ไม่อนุญาตไฟล์ประเภทนี้ที่นี่',
  'docsync.issues.too_large': 'ใหญ่เกินขีดจำกัด',
  'docsync.issues.error': 'การถ่ายโอนไม่สำเร็จ',

  'docsync.error.unknown_provider': 'ผู้ให้บริการนี้ไม่พร้อมใช้งานในอินสแตนซ์นี้',
  'docsync.error.provider_disabled': 'หยุดชั่วคราว: ผู้ดูแลระบบปิดผู้ให้บริการนี้ การซิงค์จะกลับมาทำงานเมื่อเปิดอีกครั้ง',
  'docsync.binding.reconnect': 'เชื่อมต่อใหม่',
};

export default docsync;
