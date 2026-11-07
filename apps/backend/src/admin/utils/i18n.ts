import { useSyncExternalStore } from "react";

/*
  Two-language layer for this project's custom admin pages. Chinese strings
  are the keys (so the source stays readable for 李总); Indonesian comes from
  the dictionary below. Language = explicit toggle (localStorage) or, by
  default, Chinese when the Medusa admin UI language is zh-*, else Indonesian.
*/
export type Lang = "zh" | "id";
const STORAGE_KEY = "b2b_admin_lang";

const detect = (): Lang => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "zh" || stored === "id") return stored;
    const ui = localStorage.getItem("i18nextLng") || navigator.language || "";
    return ui.toLowerCase().startsWith("zh") ? "zh" : "id";
  } catch {
    return "zh";
  }
};

let current: Lang = detect();
const listeners = new Set<() => void>();

export const getLang = () => current;
export const setLang = (lang: Lang) => {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  listeners.forEach((l) => l());
};

export const useLang = (): Lang =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current
  );

export const t = (zh: string): string => (current === "id" ? ID[zh] ?? zh : zh);

const ID: Record<string, string> = {
  // common
  "加载中…": "Memuat…",
  "暂无": "Tidak ada",
  "取消": "Batal",
  "删除": "Hapus",
  "订单": "Pesanan",
  "客户": "Pelanggan",
  "期数": "Tahap",
  "金额": "Jumlah",
  "状态": "Status",
  "凭证": "Bukti",
  "操作": "Aksi",
  "货物": "Barang",
  "收货地": "Tujuan",
  "放行时间": "Dirilis",
  "发货进度": "Progres kirim",
  "邮箱": "Email",
  "姓名": "Nama",
  "角色": "Peran",
  "权限说明": "Keterangan hak akses",
  "我": "Saya",
  "当前角色：": "Peran saat ini: ",
  // statuses
  "未付款": "Belum dibayar",
  "待财务确认": "Menunggu konfirmasi keuangan",
  "已到账": "Dana diterima",
  "已退款": "Dikembalikan",
  "已取消": "Dibatalkan",
  "待审核": "Menunggu diperiksa",
  "已通过": "Diterima",
  "已拒绝": "Ditolak",
  "Midtrans 在线支付": "Pembayaran online Midtrans",
  "银行转账": "Transfer bank",
  "其他": "Lainnya",
  "定金到账即可发货": "Kirim setelah uang muka diterima",
  "全款到账才可发货": "Kirim setelah lunas",
  "全部付清": "Lunas semua",
  "进行中": "Berjalan",
  // widget
  "付款计划与到款确认": "Rencana Pembayaran & Konfirmasi Dana",
  "尚未创建付款计划，请联系销售或财务。": "Rencana pembayaran belum dibuat, hubungi sales atau keuangan.",
  "发货条件": "Syarat pengiriman",
  "备注（客户可见）": "Catatan (terlihat pelanggan)",
  "例如：银行账户 BCA 123456 a.n. PT ...": "Contoh: rekening BCA 123456 a.n. PT ...",
  "名称，如 定金 30%": "Nama, mis. Uang muka 30%",
  "+ 加一期": "+ Tambah tahap",
  "全款": "Lunas",
  "创建付款计划": "Buat rencana pembayaran",
  "付款计划已创建": "Rencana pembayaran dibuat",
  "合计": "Total",
  "订单总额": "Total pesanan",
  "。把总额拆成几期，客户在 App 里按期付款。": ". Bagi total menjadi beberapa tahap; pelanggan membayar per tahap lewat aplikasi.",
  "最多": "maks.",
  "，与订单总额相差": ", selisih dengan total pesanan",
  "查看转账凭证": "Lihat bukti transfer",
  "金额未填": "Jumlah tidak diisi",
  "客户备注：": "Catatan pelanggan: ",
  "审核意见：": "Catatan pemeriksaan: ",
  "核对无误，确认到账": "Sudah dicek, konfirmasi dana diterima",
  "拒绝凭证": "Tolak bukti",
  "拒绝原因（客户可见）": "Alasan penolakan (terlihat pelanggan)",
  "确认拒绝": "Konfirmasi tolak",
  "已确认到账": "Dana dikonfirmasi",
  "凭证已拒绝": "Bukti ditolak",
  "退款": "Pengembalian dana",
  "通过 Midtrans 原路退回": "dikembalikan lewat Midtrans",
  "财务线下转回后登记": "dicatat setelah keuangan transfer balik",
  "原因（客户可见）": "Alasan (terlihat pelanggan)",
  "退回账户 / 流水号": "Rekening tujuan / no. referensi",
  "确认退款": "Konfirmasi pengembalian",
  "退款已记录": "Pengembalian dicatat",
  "已退款 ": "Dikembalikan ",
  "已放行发货 · ": "Dirilis untuk dikirim · ",
  "未放行，仓库不能发货": "Belum dirilis, gudang belum boleh kirim",
  "已收 ": "Diterima ",
  "备注：": "Catatan: ",
  "到期：": "Jatuh tempo: ",
  "未设定": "belum diatur",
  "到账：": "Diterima: ",
  "确认人：": "Dikonfirmasi oleh: ",
  "Midtrans 自动": "Otomatis Midtrans",
  "Midtrans 单号：": "No. Midtrans: ",
  "无凭证直接确认：填写收款说明（如 银行流水号）": "Konfirmasi tanpa bukti: isi keterangan (mis. no. mutasi bank)",
  "手动确认到账": "Konfirmasi manual",
  "仅取消计划（改单用）": "Batalkan rencana saja (untuk ubah pesanan)",
  "取消付款计划与订单": "Batalkan rencana & pesanan",
  "负责人强制放行发货": "Pemilik: rilis paksa pengiriman",
  "已放行，仓库可以发货": "Dirilis, gudang boleh kirim",
  "付款计划与订单已取消": "Rencana pembayaran & pesanan dibatalkan",
  "付款计划已取消，现在可以改单，改完请重新创建付款计划": "Rencana dibatalkan. Ubah pesanan lalu buat rencana baru.",
  "取消原因（客户可见）。未付款的期数会取消，订单一并取消；已到账的款项需另行退款。": "Alasan (terlihat pelanggan). Tahap yang belum dibayar dibatalkan, pesanan ikut dibatalkan; dana yang sudah masuk perlu dikembalikan terpisah.",
  "仅取消付款计划、保留订单（用于改单加运费后重新建计划）。原因：": "Batalkan rencana saja, pesanan tetap (untuk tambah ongkir lalu buat rencana baru). Alasan:",
  "操作失败": "Gagal",
  // finance page
  "财务：待确认到款": "Keuangan: menunggu konfirmasi dana",
  "客户已上传转账凭证或 Midtrans 支付处理中。核对银行流水后确认，仓库才会看到发货任务。": "Pelanggan sudah mengunggah bukti transfer atau pembayaran Midtrans sedang diproses. Cek mutasi bank lalu konfirmasi; gudang baru melihat tugas kirim setelah itu.",
  "尚未付款的款项": "Tahap yang belum dibayar",
  "已创建付款计划但客户还没付的期数。": "Rencana sudah dibuat tetapi pelanggan belum membayar.",
  "确认到账": "Konfirmasi dana",
  "拒绝": "Tolak",
  "查看凭证": "Lihat bukti",
  "无凭证": "Tanpa bukti",
  "财务到款": "Keuangan",
  "导出到款与退款明细（CSV，给会计）": "Ekspor penerimaan & pengembalian dana (CSV untuk akuntan)",
  "按到账日期筛选，含订单号、客户、金额、方式、确认人。": "Difilter berdasarkan tanggal dana masuk; berisi no. pesanan, pelanggan, jumlah, metode, yang mengonfirmasi.",
  "下载 CSV": "Unduh CSV",
  "待确认到款": "Menunggu konfirmasi",
  "逾期未付": "Terlambat bayar",
  "待发货": "Siap kirim",
  "已放行订单": "pesanan dirilis",
  "待报价": "Perlu penawaran",
  "客户询价": "permintaan pelanggan",
  "本月已收": "Diterima bulan ini",
  "按到账日期": "berdasarkan tanggal masuk",
  "WhatsApp 客户": "WhatsApp pelanggan",
  "导出失败": "Ekspor gagal",
  // warehouse page
  "仓库：待发货订单": "Gudang: pesanan siap kirim",
  "只显示财务已确认到款并放行的订单。点开订单后用「Create Fulfillment」备货，再用「Mark as shipped」填写货运公司与单号。": "Hanya pesanan yang dananya sudah dikonfirmasi keuangan. Buka pesanan, pakai \"Create Fulfillment\" untuk menyiapkan, lalu \"Mark as shipped\" untuk isi ekspedisi dan no. resi.",
  "暂时没有可以发货的订单。": "Belum ada pesanan yang bisa dikirim.",
  "已备货，待发运": "Sudah disiapkan, menunggu kirim",
  "待备货 ": "Perlu disiapkan ",
  "仓库发货": "Gudang",
  // team page
  "团队角色 / Peran Tim": "Peran Tim / 团队角色",
  "在 Settings → Users 邀请同事后，在这里分配角色。只有负责人可以修改。": "Undang rekan di Settings → Users, lalu atur perannya di sini. Hanya pemilik yang bisa mengubah.",
  "尚未分配任何角色：当前所有管理员都按负责人处理。请先给自己设为负责人。": "Belum ada peran yang diatur: semua admin dianggap pemilik. Atur diri Anda sebagai pemilik dulu.",
  "（未显式分配）": "(belum diatur eksplisit)",
  "角色已更新": "Peran diperbarui",
  "全部权限，可分配角色、强制放行": "Semua hak akses, atur peran, rilis paksa",
  "报价、创建/取消付款计划": "Penawaran, buat/batalkan rencana pembayaran",
  "确认到款、拒绝凭证、退款、取消": "Konfirmasi dana, tolak bukti, pengembalian, pembatalan",
  "备货与发货（仅已放行订单）": "Siapkan & kirim (hanya pesanan yang dirilis)",
  "只能查看，不能操作付款与发货": "Hanya lihat, tidak bisa proses pembayaran & pengiriman",
  "团队角色": "Peran Tim",
  // warranty page
  "防伪与保修 / Garansi": "Garansi & Keaslian / 防伪与保修",
  "每台增氧机一个序列号 + 二维码。客户在 App 里扫码：显示正品、登记保修、看保修到期；仿品或作废标签扫出来是“无法验证”。": "Setiap kincir punya nomor seri + QR. Pelanggan scan di aplikasi: tampil asli, daftar garansi, lihat masa garansi; produk palsu atau label dibatalkan tampil \"tidak terverifikasi\".",
  "在库": "Di gudang",
  "已发出": "Terkirim",
  "已登记保修": "Garansi terdaftar",
  "已作废": "Dibatalkan",
  "共": "Total",
  "搜索序列号 / 二维码 / 电话 / 订单": "Cari no. seri / kode QR / HP / pesanan",
  "全部状态": "Semua status",
  "下载批次": "Unduh batch",
  "还没有序列号，先在下方生成一批。": "Belum ada nomor seri, buat batch di bawah.",
  "序列号": "No. seri",
  "产品": "Produk",
  "批次号": "Batch",
  "登记客户": "Pelanggan terdaftar",
  "保修到期": "Garansi s/d",
  "扫码次数": "Jumlah scan",
  "个月": "bulan",
  "关联订单": "Tautkan pesanan",
  "作废": "Batalkan",
  "作废序列号": "Batalkan nomor seri",
  "作废后扫码会显示“非正品/标签已失效”，不可恢复。": "Setelah dibatalkan, scan akan menampilkan \"tidak terverifikasi\". Tidak bisa dikembalikan.",
  "关联订单 ID（在订单页地址栏 order_… ），留空清除": "ID pesanan (order_… dari alamat halaman pesanan), kosongkan untuk hapus",
  "已更新": "Diperbarui",
  "上一页": "Sebelumnya",
  "下一页": "Berikutnya",
  "生成序列号与二维码标签": "Buat nomor seri & label QR",
  "出厂前按批次生成，下载 CSV 交给标签打印（每行一台：序列号、二维码内容）。二维码贴在机身铭牌旁，客户扫码即可验真并登记保修。": "Buat per batch sebelum keluar pabrik, unduh CSV untuk cetak label (satu baris per unit: no. seri, isi QR). Tempel QR di dekat pelat nama; pelanggan scan untuk cek keaslian & daftar garansi.",
  "选择产品": "Pilih produk",
  "规格（可选）": "Varian (opsional)",
  "全部规格": "Semua varian",
  "数量": "Jumlah",
  "保修月数": "Bulan garansi",
  "生成并下载 CSV": "Buat & unduh CSV",
  "已生成": "Dibuat",
  "个序列号": "nomor seri",
  "防伪保修": "Garansi",
  "地图定位（客户已打点）": "Buka peta (titik dari pelanggan)",
  "未打点": "Belum ada titik peta",
  "单号请写成「承运商代码:单号」，如 jne:JP0123456789、sicepat:000123456789、lion:1234567890，App 才能显示物流轨迹。发货时顺便在「防伪保修」页把机身序列号关联到订单。": "Tulis resi sebagai \"kode-ekspedisi:nomor\", mis. jne:JP0123456789, sicepat:000123456789, lion:1234567890, agar aplikasi bisa menampilkan lacak kiriman. Saat kirim, tautkan nomor seri mesin ke pesanan di halaman Garansi.",
};
