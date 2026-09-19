import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  // Field labels/help — these keys are pinned by STORAGE_BACKEND_TYPES in
  // @trek/shared (labelKey/helpKey); renaming one breaks the admin form.
  'storage.field.root': "ไดเรกทอรีราก",
  'storage.help.root': "เส้นทางสัมบูรณ์บนเซิร์ฟเวอร์ที่แบ็กเอนด์นี้จัดเก็บออบเจ็กต์",
  'storage.field.endpoint': "URL ปลายทาง",
  'storage.help.endpoint':
    "URL พื้นฐานของบริการที่เข้ากันได้กับ S3 เช่น https://s3.example.com หรือ http://127.0.0.1:9000.",
  'storage.field.bucket': "ถัง",
  'storage.field.accessKeyId': "รหัสคีย์การเข้าถึง",
  'storage.field.secretAccessKey': "รหัสการเข้าถึงความลับ",
  'storage.field.region': "ภูมิภาค",
  'storage.help.region': "คงค่าเริ่มต้นไว้ เว้นแต่ผู้ให้บริการของคุณต้องการภูมิภาคเฉพาะ",
  'storage.field.keyPrefix': "คำนำหน้าที่สำคัญ",
  'storage.help.keyPrefix': "คำนำหน้าเพิ่มเติมที่จะเพิ่มให้กับคีย์ของออบเจ็กต์ทุกตัว เช่น trek/prod",
  'storage.field.retries': "ลองอีกครั้ง",
  'storage.field.timeoutMs': "หมดเวลา (มิลลิวินาที)",
  'storage.field.primary': "แบ็กเอนด์หลัก",
  'storage.field.replicas': "แบบจำลอง",

  // Panel chrome
  'storage.title': "ที่เก็บของ",
  'storage.description': "TREK จะจัดเก็บไฟล์ รูปภาพ และข้อมูลสำรองที่อัปโหลดไว้ การเปลี่ยนแปลงจะยังไม่มีผลจนกว่าคุณจะบันทึก",
  'storage.loading': "กำลังโหลด...",
  'storage.saved': "บันทึกการกำหนดค่าพื้นที่เก็บข้อมูลแล้ว",
  'storage.save': "บันทึกการเปลี่ยนแปลง",
  'storage.unsaved': "การเปลี่ยนแปลงที่ไม่ได้บันทึก",

  'storage.saveConflict':
    "การตั้งค่าพื้นที่เก็บข้อมูลมีการเปลี่ยนแปลงตั้งแต่คุณโหลด ดังนั้นการเปลี่ยนแปลงของคุณจึงไม่ได้รับการบันทึก ละทิ้งและโหลดการตั้งค่าที่บันทึกไว้อีกครั้งเพื่อเริ่มต้นใหม่",
  'storage.discardAndReload': "ยกเลิกการเปลี่ยนแปลงของฉันและโหลดซ้ำ",
  'storage.configError.banner': "โหลดการตั้งค่าที่เก็บข้อมูลที่เก็บไว้ไม่สำเร็จ — การบันทึกจะแทนที่: {error}",
  // Backends list
  'storage.backends.title': "แบ็กเอนด์",
  'storage.backends.add': "เพิ่มแบ็กเอนด์",
  'storage.backends.usedBy': "ใช้โดย: {categories}",
  'storage.backends.unused': "ไม่ได้รับมอบหมายให้อยู่ในหมวดหมู่ใด ๆ",
  'storage.backends.envReadOnly': "กำหนดโดยตัวแปรสภาพแวดล้อม — อ่านอย่างเดียว",
  'storage.source.built-in': "บิวท์อิน",
  'storage.source.env': "สิ่งแวดล้อม",
  'storage.source.settings': "การตั้งค่า",
  'storage.type.local': "ท้องถิ่น",
  'storage.type.s3': "S3",
  'storage.type.mirror': "กระจกเงา",
  'storage.actions.test': "ทดสอบ",
  'storage.actions.edit': "แก้ไข",
  'storage.actions.remove': "ลบ",

  // Test-connection results
  'storage.test.running': "กำลังทดสอบ...",
  'storage.test.ok': "การเชื่อมต่อตกลง",
  'storage.test.failed': "การทดสอบล้มเหลว",

  // Remove pre-check (friendly message; the server stays authoritative)
  'storage.remove.title': "ลบแบ็กเอนด์",
  'storage.remove.body':
    "ลบ {name} ออกจากการกำหนดค่าหรือไม่ เซิร์ฟเวอร์ปฏิเสธการบันทึกหากมีสิ่งใดยังคงขึ้นอยู่กับข้อมูลดังกล่าว",
  'storage.remove.stillAssigned': "ยังคงมอบหมายให้: {categories}",

  // Backend form
  'storage.form.addTitle': "เพิ่มแบ็กเอนด์",
  'storage.form.editTitle': "แก้ไขแบ็กเอนด์",
  'storage.form.name': "ชื่อ",
  'storage.form.type': "ประเภท",
  'storage.form.apply': "สมัคร",
  'storage.form.cancel': "ยกเลิก",
  'storage.form.duplicateName': "มีแบ็กเอนด์ชื่อ {name} อยู่แล้ว",

  // Category map
  'storage.categories.title': "หมวดหมู่",
  'storage.categories.default': "ค่าเริ่มต้น",
  'storage.categories.reassignWarning':
    "ออบเจ็กต์ที่มีอยู่จะไม่ย้าย: ออบเจ็กต์ใหม่จะไปที่แบ็กเอนด์ที่เพิ่งกำหนด ส่วนออบเจ็กต์เก่าจะยังคงอยู่ในตำแหน่งเดิม",
  'storage.category.files': "เอกสารการเดินทาง",
  'storage.category.journey': "ภาพถ่ายการเดินทาง",
  'storage.category.covers': "ภาพปก",
  'storage.category.avatars': "รูปโปรไฟล์",
  'storage.category.places': "วางภาพ",
  'storage.category.photos-google': "แคชรูปภาพของ Google",
  'storage.category.photos-trek': "แคชภาพถ่าย TREK",
  'storage.category.backups': "การสำรองข้อมูล",

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    "ไฟล์แนบที่อัปโหลดไปยังการเดินทาง - ตั๋ว, PDF, การยืนยันการจอง และไฟล์ที่แชร์ในแชทการเดินทาง",
  'storage.categoryDesc.journey': "ภาพถ่ายและภาพขนาดย่อที่แนบมากับรายการการเดินทาง",
  'storage.categoryDesc.covers': "ภาพหน้าปกการเดินทางและคอลเลกชัน รวมถึงหน้าปกที่ดึงมาจาก Unsplash",
  'storage.categoryDesc.avatars': "รูปโปรไฟล์บัญชีผู้ใช้",
  'storage.categoryDesc.places': "รูปภาพที่แนบมากับสถานที่และคอลเลกชันสถานที่ — อัปโหลดหรือนำเข้า",
  'storage.categoryDesc.photos-google': "สำเนารูปภาพสถานที่จาก Google ที่แคชไว้ — สร้างใหม่ได้และสามารถลบได้อย่างปลอดภัย",
  'storage.categoryDesc.photos-trek':
    "รูปภาพที่แคชไว้จากบริการภาพถ่าย TREK ที่ใช้โดย Memories — สามารถดึงข้อมูลใหม่ได้ ปลอดภัยที่จะสูญหาย",
  'storage.categoryDesc.backups': "คลังสำรองข้อมูลเซิร์ฟเวอร์ที่สร้างโดยแผงสำรองข้อมูลหรือกำหนดการ",

  // Health strip
  'storage.health.title': "สุขภาพ",
  'storage.health.allClear': "ไม่มีการบันทึกความล้มเหลวของการจำลอง",
  'storage.health.seedFile':
    "มีไฟล์ seed ของ storage-config.json แต่ถูกละเว้น — มีแถวการกำหนดค่าอยู่แล้ว จัดการพื้นที่เก็บข้อมูลที่นี่",
  'storage.health.failureLine': "{op} จาก {key} บน {backend} ล้มเหลว: {error}",

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': "เป้าหมายการจำลอง",
  'storage.mirror.targetsHelp': "ทุกการเขียนไปยังแบ็กเอนด์นี้จะถูกคัดลอกไปยังแต่ละเป้าหมายที่เลือกด้วย",
  'storage.mirror.latencyNote':
    "การจำลองจะถูกเขียนทีละรายการในระหว่างการอัปโหลดแต่ละครั้ง - เป้าหมายที่ช้าหรือไม่สามารถเข้าถึงได้จะทำให้การอัปโหลดทุกหมวดหมู่ในแบ็กเอนด์นี้ช้าลง",
  'storage.mirror.mirroredTo': "มิเรอร์ไปที่: {targets}",
  'storage.mirror.replicaOf': "แบบจำลองของ: {primaries}",
  'storage.mirror.cacheWarning':
    "ไม่แนะนำ: หมวดหมู่นี้มีเนื้อหาที่สามารถดึงซ้ำได้ — การจำลองเนื้อหามักจะสิ้นเปลือง",
  'storage.mirror.degenerate.duplicate-mirror':
    "กระจกบานที่สองล้อมรอบ {primary} - แผงควบคุมจะจัดการเฉพาะกระจกบานแรกเท่านั้น ลบอันนี้เพื่อจัดการการมิเรอร์จาก {primary}",
  'storage.mirror.degenerate.env-primary': "ล้อมแบ็คเอนด์ที่กำหนดโดยสภาพแวดล้อม — ไม่สามารถแก้ไขได้ที่นี่",
  'storage.mirror.degenerate.missing-primary': "อ้างอิงถึงแบ็กเอนด์ที่ไม่มีอยู่อีกต่อไป",
  'storage.remove.usedAsReplicaBy': "ใช้เป็นแบบจำลองโดย: {primaries}",

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': "ซิงค์เลย",
  'storage.sync.running': "กำลังซิงค์… {done}/{total}",
  'storage.sync.counts': "{copied} คัดลอกแล้ว · {skipped} ข้าม · {failed} ล้มเหลว",
  'storage.sync.cancel': "ยกเลิกการซิงค์",
  'storage.sync.done': "การซิงค์เสร็จสิ้น: คัดลอก {copied}, {deleted} ลบแล้ว, {failed} ล้มเหลว",
  'storage.sync.cancelled': "การซิงค์ถูกยกเลิก",
  'storage.sync.error': "การซิงค์ล้มเหลว: {error}",
  'storage.sync.prompt': "ออบเจ็กต์ที่มีอยู่ยังไม่ถูกจำลองแบบ — ซิงค์ตอนนี้เลยใช่ไหม",
  'storage.sync.dismiss': "ยกเลิก",
  'storage.usage.line': "{objects} วัตถุ · {size}",
  'storage.usage.computed': "คำนวณการใช้งาน {age}",
  'storage.usage.never': "ยังไม่ได้คำนวณการใช้งาน",
  'storage.usage.refresh': "รีเฟรช",
  'storage.usage.compute': "คำนวณตอนนี้",
  'storage.usage.legacyNote': "รวมถึงคลังภาพดั้งเดิม",

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': "ย้ายวัตถุที่มีอยู่ไปยังแบ็กเอนด์ใหม่หรือไม่",
  'storage.migrate.promptLine': "{category}: {objects} วัตถุ ({size}) จาก {from} ถึง {to}",
  'storage.migrate.promptLineUnknown': "{category}: ไม่ทราบขนาด (ยังไม่มีการสแกนการใช้งาน) จาก {from} ถึง {to}",
  'storage.migrate.move': "ย้ายวัตถุที่มีอยู่",
  'storage.migrate.routeOnly': "เพียงกำหนดเส้นทางการเขียนใหม่",
  'storage.migrate.running': "ย้าย {category}… {done}/{total}",
  'storage.migrate.done': "ย้ายเสร็จแล้ว: {copied} คัดลอก, {skipped} ข้าม",
  'storage.migrate.doneFailures': "{failed} ล้มเหลว — ออบเจ็กต์เหล่านั้นไม่ได้ถูกคัดลอกไปยังแบ็กเอนด์ใหม่",
  'storage.migrate.failed': "การย้ายล้มเหลว: {error} — หมวดหมู่ไม่ได้ถูกเปลี่ยน",
  'storage.migrate.cancelled': "การย้ายถูกยกเลิก — ไม่มีอะไรถูกเปลี่ยน",
  'storage.migrate.reclaimable': "วัตถุ {objects} ({size}) ยังคงอยู่บน {from} — เรียกคืนด้วยตนเอง",
  'storage.migrate.cancel': "ยกเลิกการย้าย",
  'storage.migrate.promptCancel': "ยกเลิก",
  'storage.migrate.queued': "อยู่ในคิว: {categories}",
  'storage.migrate.queueDropped': "ไม่สามารถเริ่มการย้ายข้อมูลครั้งถัดไปได้ - ล้างคิวที่เหลือแล้ว: {categories}",
};
export default storage;
