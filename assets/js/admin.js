(function () {
  window.BMK = window.BMK || {};
  BMK.views = BMK.views || {};
  var V = BMK.views.admin = {};
  var ui = BMK.ui;
  var api = BMK.api;
  var S = BMK.shared;
  var C = BMK.const;

  function call(action, data) { return api.call(action, data); }
  function firstName(name) { return String(name || 'Admin').trim().split(/\s+/)[0]; }
  function todayIso() { return ui.isoDate(new Date()); }
  function periodParam(ctx) { return (ctx.params && ctx.params.periode) || ui.periodeNow(); }

  /* =====================================================
     DASHBOARD
     ===================================================== */
  V.dashboard = async function (ctx) {
    var data = await call('dashboard.admin');
    var st = data.stats;
    var html = ui.pageHead({
      eyebrow: 'Ringkasan · ' + ui.periodeLabel(data.periode),
      title: 'Selamat datang, ' + firstName(ctx.user.nama),
      subtitle: 'Pantau perkembangan belajar, kehadiran, tagihan, dan gaji dalam satu tempat.',
      actions: '<a class="btn btn-outline" href="#/admin/biaya" data-route>' + ui.icon('wallet', 15) + ' Administrasi</a>' +
        '<a class="btn btn-primary" href="#/admin/anak" data-route>' + ui.icon('userPlus', 15) + ' Data anak</a>'
    });

    if (data.defaultPasswordWarning) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('shield', 16) + '<span><b>Kata sandi admin masih bawaan.</b> Segera ganti melalui <a href="#/admin/pengaturan" data-route class="bold">Pengaturan → Akun</a>.</span></div>';
    }
    if (!data.wa.configured) {
      html += '<div class="alert alert-info mb-16">' + ui.icon('message', 16) + '<span>WhatsApp Fonnte belum terhubung. Laporan biaya tetap bisa dikirim lewat tautan WA manual. <a href="#/admin/pengaturan" data-route class="bold">Hubungkan sekarang</a>.</span></div>';
    }

    html += '<div class="welcome-card"><div class="welcome-copy">' +
        '<div class="welcome-kicker">' + ui.esc(ui.todayLong()) + '</div>' +
        '<h2>' + st.siswa + ' anak aktif, ' + st.pengajar + ' pengajar mendampingi</h2>' +
        '<p>Kehadiran hari ini tercatat ' + (st.hadirHariIni || 0) + ' dari ' + (st.enrollmentAktif || 0) + ' siswa aktif. ' +
          (st.menungguVerifikasi ? st.menungguVerifikasi + ' bukti pembayaran menunggu verifikasi.' : 'Tidak ada bukti pembayaran yang menunggu.') + '</p>' +
        '<div class="welcome-actions">' +
          '<a class="btn btn-sun btn-sm" href="#/admin/biaya" data-route>' + ui.icon('receipt', 14) + ' Laporan biaya</a>' +
          '<a class="btn btn-sm" style="background:rgba(255,255,255,.1);color:#fff" href="#/admin/lpmb" data-route>' + ui.icon('fileCheck', 14) + ' ACC rapor (' + st.lpmbMenunggu + ')</a>' +
        '</div></div>' +
        '<div class="welcome-art">' + ui.icon('sun', 46) + '<span class="orbit"></span></div>' +
      '</div>';

    html += '<div class="stat-grid">' +
      ui.stat('child', 'Siswa aktif', ui.angka(st.siswa), { hint: (st.enrollmentAktif || 0) + ' paket berjalan', tone: 'blue' }) +
      ui.stat('graduation', 'Pengajar aktif', ui.angka(st.pengajar), { hint: st.paket + ' paket belajar' }) +
      ui.stat('wallet', 'Lunas bulan ini', ui.rupiah(st.tagihanLunas), { hint: 'dari ' + ui.rupiah(st.tagihanBulan), tone: 'amber' }) +
      ui.stat('circleDollar', 'Belum terbayar', ui.rupiah(st.outstanding), { hint: (st.tagihanCount - st.tagihanLunasCount) + ' tagihan berjalan', tone: st.outstanding ? 'red' : 'dark' }) +
    '</div>';

    var pendingBlocks = '';
    if (data.pendingBills.length) {
      pendingBlocks += '<div class="section-head-sm"><h3>Bukti pembayaran</h3><a class="link-btn" href="#/admin/biaya?status=menunggu_verifikasi" data-route>Lihat semua</a></div>';
      data.pendingBills.forEach(function (b) {
        pendingBlocks += '<div class="list-row">' + S.photo(b.anakFoto, b.anakNama, 'sm') +
          '<div class="list-main"><b>' + ui.esc(b.anakNama) + '</b><span>' + ui.esc(ui.periodeLabel(b.periode)) + ' · Dibayar ' + ui.rupiah(b.dibayar) + ' · Sisa ' + ui.rupiah(b.sisa) + '</span></div>' +
          '<div class="list-end">' + ui.statusBadge(b.status) + '</div></div>';
      });
    }
    if (data.lpmbPending.length) {
      pendingBlocks += '<div class="section-head-sm mt-16"><h3>Rapor menunggu ACC</h3><a class="link-btn" href="#/admin/lpmb" data-route>Buka</a></div>';
      data.lpmbPending.forEach(function (l) {
        pendingBlocks += '<div class="list-row">' + S.photo(l.anakFoto, l.anakNama, 'sm') +
          '<div class="list-main"><b>' + ui.esc(l.anakNama) + '</b><span>' + ui.esc(ui.periodeLabel(l.periode)) + ' · ' + ui.esc(l.pengajarNama) + '</span></div>' +
          '<div class="list-end">' + ui.statusBadge(l.status) + '</div></div>';
      });
    }
    if (!pendingBlocks) {
      pendingBlocks = ui.empty('checkCircle', 'Semua beres', 'Tidak ada tagihan atau rapor yang menunggu tindakan.');
    }

    var studentRows = data.students.slice(0, 6).map(function (s) {
      return '<div class="list-row">' + S.photo(s.fotoUrl, s.nama, 'sm') +
        '<div class="list-main"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.paketNama || '—') + ' · ' + ui.esc(s.jadwalTeks || 'Jadwal belum diatur') + '</span></div>' +
        '<div class="list-end stack"><b>' + ui.esc(s.pengajarNama || '—') + '</b><span>' + ui.esc(s.kelas || '') + '</span></div></div>';
    }).join('') || ui.empty('child', 'Belum ada siswa aktif', 'Tambahkan data anak dan pilih paket serta jadwal.');

    var reportRows = data.reports.slice(0, 4).map(function (r) {
      return '<div class="list-row"><span class="day-badge">' + ui.esc(String(ui.toDate(r.tanggal).getDate())) + '</span>' +
        '<div class="list-main"><b>' + ui.esc(r.anakNama) + '</b><span>' + ui.esc(r.materi) + '</span></div>' +
        '<div class="list-end">' + ui.esc(r.pengajarNama) + '</div></div>';
    }).join('') || ui.empty('clipboard', 'Belum ada laporan hari ini', 'Laporan pengajar akan tampil di sini.');

    var att = data.attendanceToday;
    var totalAtt = att.hadir + att.izin + att.sakit + att.alpha + att.belum;
    function attRow(label, value, tone) {
      var pct = totalAtt ? Math.round(value / totalAtt * 100) : 0;
      return '<div class="row-between" style="margin-bottom:9px"><span class="small bold">' + label + '</span><span class="small text-muted">' + value + ' anak</span></div>' +
        ui.progress(pct, tone);
    }

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
        ui.card({
          title: 'Siswa aktif', subtitle: 'Paket dan jadwal berjalan',
          actions: '<a class="btn btn-ghost btn-sm" href="#/admin/anak" data-route>Kelola ' + ui.icon('arrowRight', 13) + '</a>',
          body: studentRows
        }) +
        ui.card({
          title: 'Laporan belajar hari ini', subtitle: st.laporanHariIni + ' laporan masuk',
          actions: '<a class="btn btn-ghost btn-sm" href="#/admin/harian" data-route>Semua ' + ui.icon('arrowRight', 13) + '</a>',
          body: reportRows
        }) +
      '</div><div class="stack">' +
        ui.card({ title: 'Perlu perhatian', body: pendingBlocks }) +
        ui.card({
          title: 'Kehadiran hari ini', subtitle: (st.absenHariIni || 0) + ' dari ' + (st.enrollmentAktif || 0) + ' siswa tercatat',
          body: attRow('Hadir', att.hadir, '') + attRow('Izin', att.izin, 'amber') + attRow('Sakit', att.sakit, 'amber') + attRow('Tanpa keterangan', att.alpha, 'red') + attRow('Belum dicatat', att.belum, 'amber')
        }) +
      '</div></div>';

    return { html: html };
  };

  /* =====================================================
     DATA ANAK
     ===================================================== */
  V.anak = async function (ctx) {
    var data = await call('anak.list');
    var html = ui.pageHead({
      eyebrow: 'Manajemen data',
      title: 'Data anak',
      subtitle: 'Kelola identitas anak, orang tua, paket, dan jadwal belajarnya.',
      actions: '<button type="button" class="btn btn-primary" id="addChild">' + ui.icon('userPlus', 15) + ' Tambah anak</button>'
    });
    if (!data.parents.length) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('alert', 16) + '<span>Belum ada akun orang tua. Buat akun orang tua terlebih dahulu di <a class="bold" href="#/admin/pengaturan" data-route>Pengaturan → Akun</a>.</span></div>';
    }
    html += ui.card({
      body: '<div class="data-toolbar"><div class="search-box">' + ui.icon('search', 15) + '<input class="input" id="childSearch" placeholder="Cari nama anak, orang tua, paket…" /></div>' +
        '<span class="pill-count" id="childCount">' + data.children.length + ' anak</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
          '<th>Anak</th><th>Orang tua</th><th>Paket & jadwal</th><th>Pengajar</th><th>Tagihan</th><th>Status</th><th></th>' +
        '</tr></thead><tbody id="childRows"></tbody></table></div>'
    });

    function rows(list) {
      if (!list.length) return S.emptyRow(7, 'Belum ada data anak yang cocok.');
      return list.map(function (c) {
        return '<tr>' +
          '<td><div class="person-cell">' + ui.avatar(c.nama, c.fotoUrl, 'sm', 'sun') +
            '<div class="pc-info"><b>' + ui.esc(c.nama) + '</b><span>' + ui.esc([c.kelas, c.sekolah].filter(Boolean).join(' · ') || 'Kelas belum diisi') + '</span></div></div></td>' +
          '<td><b class="cell-strong">' + ui.esc(c.ortuNama || '—') + '</b><span class="cell-sub">' + ui.esc(c.ortuPhone || '') + '</span></td>' +
          '<td>' + (c.paketNama ? '<b>' + ui.esc(c.paketNama) + '</b><span class="cell-sub">' + ui.esc(c.jadwalTeks) + '</span>' : '<span class="text-muted">Belum memilih paket</span>') + '</td>' +
          '<td>' + ui.esc(c.pengajarNama || '—') + '</td>' +
          '<td class="num">' + (c.unpaidTotal ? '<span class="text-red bold">' + ui.rupiah(c.unpaidTotal) + '</span><span class="cell-sub">' + c.unpaidCount + ' tagihan</span>' : '<span class="text-green bold">Lunas</span>') + '</td>' +
          '<td>' + ui.statusBadge(c.status || 'aktif') + '</td>' +
          '<td><div class="cell-actions">' +
            '<button type="button" class="icon-btn" title="Edit" data-edit="' + ui.attr(c.id) + '">' + ui.icon('pencil', 15) + '</button>' +
            '<button type="button" class="icon-btn" title="Atur paket" data-enroll="' + ui.attr(c.id) + '">' + ui.icon('book', 15) + '</button>' +
            (c.ortuPhone ? '<a class="icon-btn" title="WhatsApp orang tua" href="' + ui.attr(ui.waLink(c.ortuPhone, 'Halo Bapak/Ibu ' + c.ortuNama + ', kami ingin menyampaikan informasi tentang ' + c.nama + '.')) + '" target="_blank" rel="noopener">' + ui.icon('message', 15) + '</a>' : '') +
          '</div></td></tr>';
      }).join('');
    }

    return {
      html: html,
      mount: function (root) {
        var list = data.children.slice();
        var rowsEl = root.querySelector('#childRows');
        var countEl = root.querySelector('#childCount');
        function draw() {
          rowsEl.innerHTML = rows(list);
          countEl.textContent = list.length + ' anak';
        }
        draw();
        root.querySelector('#childSearch').addEventListener('input', ui.debounce(function (e) {
          var q = String(e.target.value || '').toLowerCase();
          var filtered = data.children.filter(function (c) {
            return [c.nama, c.ortuNama, c.ortuPhone, c.paketNama, c.pengajarNama, c.kelas, c.sekolah].join(' ').toLowerCase().indexOf(q) !== -1;
          });
          list = filtered;
          draw();
        }, 180));
        root.querySelector('#addChild').onclick = function () { openChild(null); };
        root.addEventListener('click', function (e) {
          var edit = e.target.closest('[data-edit]');
          if (edit) {
            var row = data.children.filter(function (c) { return c.id === edit.getAttribute('data-edit'); })[0];
            if (row) openChild(row);
            return;
          }
          var enr = e.target.closest('[data-enroll]');
          if (enr) {
            var child = data.children.filter(function (c) { return c.id === enr.getAttribute('data-enroll'); })[0];
            if (child) openEnroll(child);
          }
        });

        function openChild(row) {
          var isEdit = !!row;
          var body = '<form id="childForm" novalidate><div class="form-grid">' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(row ? row.nama : '') + '" required /></div>' +
              '<div class="field"><label>Nama panggilan</label><input class="input" name="panggilan" value="' + ui.attr(row ? row.panggilan : '') + '" /></div>' +
            '</div>' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Jenis kelamin <span class="req">*</span></label><div class="radio-row" style="padding-top:3px">' +
                '<label class="radio-pill"><input type="radio" name="gender" value="laki" ' + (!row || row.gender === 'laki' ? 'checked' : '') + '><span>Laki-laki</span></label>' +
                '<label class="radio-pill"><input type="radio" name="gender" value="perempuan" ' + (row && row.gender === 'perempuan' ? 'checked' : '') + '><span>Perempuan</span></label>' +
              '</div></div>' +
              '<div class="field"><label>Tanggal lahir <span class="req">*</span></label><input class="input" type="date" name="tglLahir" max="' + todayIso() + '" value="' + ui.attr(row ? row.tglLahir : '') + '" required /></div>' +
            '</div>' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Sekolah</label><input class="input" name="sekolah" value="' + ui.attr(row ? row.sekolah : '') + '" /></div>' +
              '<div class="field"><label>Kelas</label><input class="input" name="kelas" value="' + ui.attr(row ? row.kelas : '') + '" /></div>' +
            '</div>' +
            (isEdit
              ? '<div class="note-box">Orang tua: <b>' + ui.esc(row.ortuNama) + '</b> · ' + ui.esc(row.ortuPhone || 'tanpa nomor') + '</div>'
              : '<div class="field"><label>Akun orang tua <span class="req">*</span></label><select class="select" name="ortuId">' + S.options(data.parents, '', 'Pilih orang tua') + '</select></div>') +
            '<div class="field"><label>Catatan kebutuhan belajar</label><textarea class="textarea" name="catatan" placeholder="Contoh: perlu penguatan membaca.">' + ui.esc(row ? row.catatan : '') + '</textarea></div>' +
            '<div class="field"><label>Foto anak</label>' + S.uploadTile('childPhoto', { existing: row ? row.fotoUrl : '', title: 'Unggah foto anak', hint: 'JPG/PNG, otomatis dikompres' }) + '</div>' +
            (isEdit ? '<label class="switch"><input type="checkbox" name="aktif" ' + (row.status !== 'nonaktif' ? 'checked' : '') + '><span class="track"></span> Status aktif</label>' : '') +
          '</div></form>';
          var m = ui.modal({
            title: isEdit ? 'Edit data anak' : 'Tambah data anak',
            subtitle: isEdit ? row.nama : 'Lengkapi identitas buah hati',
            size: 'lg',
            body: body,
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="childSave">' + ui.icon('check', 15) + ' Simpan data</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#childForm');
              el.querySelector('#childSave').onclick = async function () {
                ui.clearErrors(form);
                var d = ui.serialize(form);
                if (!d.nama || d.nama.length < 2) { ui.fieldError(form, 'nama', 'Masukkan nama lengkap anak.'); return; }
                if (!d.gender) { ui.toast('Pilih jenis kelamin anak.', 'error'); return; }
                if (!d.tglLahir) { ui.fieldError(form, 'tglLahir', 'Tanggal lahir wajib diisi.'); return; }
                if (!isEdit && !d.ortuId) { ui.fieldError(form, 'ortuId', 'Pilih akun orang tua.'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  var payload = {
                    id: isEdit ? row.id : '',
                    ortuId: isEdit ? row.ortuId : d.ortuId,
                    nama: d.nama, panggilan: d.panggilan, gender: d.gender, tglLahir: d.tglLahir,
                    sekolah: d.sekolah, kelas: d.kelas, catatan: d.catatan,
                    status: isEdit ? (d.aktif ? 'aktif' : 'nonaktif') : 'aktif',
                    foto: await S.uploadValue('childPhoto', row ? row.fotoUrl : '')
                  };
                  await call('anak.save', payload);
                  close();
                  ui.toast(isEdit ? 'Data anak diperbarui.' : 'Data anak ditambahkan.', 'success');
                  ctx.refresh();
                } catch (err) {
                  ui.busy(btn, false);
                  ui.toast(err.message, 'error', 5500);
                }
              };
            }
          });
          return m;
        }

        async function openEnroll(child) {
          if (child.enrollmentId) {
            ui.modal({
              title: 'Paket & jadwal ' + child.nama,
              size: 'sm',
              body: '<div class="info-list">' +
                S.infoItem('Paket', child.paketNama) + S.infoItem('Pengajar', child.pengajarNama) +
                S.infoItem('Jadwal', child.jadwalTeks) + S.infoItem('Tagihan belum lunas', ui.rupiah(child.unpaidTotal)) +
              '</div><div class="note-box mt-16">Untuk mengganti paket, nonaktifkan pendaftaran berjalan melalui Google Sheets lalu buat pendaftaran baru. Hubungi admin teknis bila perlu.</div>'
            });
            return;
          }
          var m = ui.modal({
            title: 'Atur paket & jadwal',
            subtitle: child.nama,
            body: '<div class="loading-block">' + ui.spinner(20) + '<span>Memuat jadwal…</span></div>',
            size: 'md'
          });
          try {
            var slotsData = await call('jadwal.list');
            var packages = (slotsData.packages || []).filter(function (p) { return p.aktif; });
            var freeSlots = (slotsData.slots || []).filter(function (s) { return s.status !== 'terisi' && s.status !== 'nonaktif'; });
            m.el.querySelector('.modal-body').innerHTML = '<form id="enrollForm"><div class="form-grid">' +
              '<div class="field"><label>Paket belajar <span class="req">*</span></label><select class="select" name="paketId">' + S.options(packages, '', 'Pilih paket') + '</select></div>' +
              '<div class="field"><label>Jadwal <span class="req">*</span></label><select class="select" name="slotId"><option value="">Pilih paket terlebih dahulu</option></select><div class="hint">Jadwal yang sudah terisi tidak ditampilkan.</div></div>' +
              '<div class="note-box">Sistem akan membuat tagihan bulan berjalan sesuai harga paket.</div>' +
            '</div></form>';
            var footer = document.createElement('div');
            footer.className = 'modal-foot';
            footer.innerHTML = '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="enrollSave">' + ui.icon('check', 15) + ' Simpan paket</button>';
            m.el.querySelector('.modal').appendChild(footer);
            m.el.querySelector('[data-close]').onclick = m.close;
            var form = m.el.querySelector('#enrollForm');
            var pkgSel = form.querySelector('[name="paketId"]');
            var slotSel = form.querySelector('[name="slotId"]');
            pkgSel.onchange = function () {
              var list = freeSlots.filter(function (s) { return s.paketId === pkgSel.value; });
              slotSel.innerHTML = '<option value="">Pilih jadwal</option>' + list.map(function (s) {
                return '<option value="' + ui.attr(s.id) + '">' + ui.esc(s.hari + ', ' + s.jamMulai + '–' + s.jamSelesai + ' · ' + s.pengajarNama) + '</option>';
              }).join('');
            };
            m.el.querySelector('#enrollSave').onclick = async function () {
              if (!pkgSel.value) { ui.toast('Pilih paket belajar.', 'error'); return; }
              if (!slotSel.value) { ui.toast('Pilih jadwal belajar.', 'error'); return; }
              var btn = this;
              ui.busy(btn, true, 'Memproses…');
              try {
                await call('anak.enroll', { anakId: child.id, paketId: pkgSel.value, slotId: slotSel.value });
                m.close();
                ui.toast('Paket dan jadwal berhasil diatur.', 'success');
                ctx.refresh();
              } catch (err) {
                ui.busy(btn, false);
                ui.toast(err.message, 'error', 6000);
              }
            };
          } catch (err) {
            m.el.querySelector('.modal-body').innerHTML = ui.empty('alert', 'Jadwal gagal dimuat', err.message);
          }
        }
      }
    };
  };

  /* =====================================================
     DATA PENGAJAR
     ===================================================== */
  V.guru = async function (ctx) {
    var data = await call('guru.list');
    var html = ui.pageHead({
      eyebrow: 'Manajemen data',
      title: 'Data pengajar',
      subtitle: 'Atur profil pengajar, akun masuk, tarif per sesi, serta tanda tangan digital.',
      actions: '<button type="button" class="btn btn-primary" id="addTeacher">' + ui.icon('userPlus', 15) + ' Tambah pengajar</button>'
    });
    html += ui.card({
      body: '<div class="table-wrap"><table class="data-table teacher-table"><thead><tr>' +
        '<th>Pengajar</th><th>Kontak</th><th>Spesialisasi</th><th>Area lokasi</th><th>Tarif/sesi</th><th>Siswa</th><th>Hadir bulan ini</th><th>Status</th><th></th>' +
      '</tr></thead><tbody>' + (data.teachers.length ? data.teachers.map(function (t) {
        return '<tr>' +
          '<td><div class="person-cell">' + ui.avatar(t.nama, t.fotoUrl, 'sm', 'sun') + '<div class="pc-info"><b>' + ui.esc(t.nama) + '</b><span>@' + ui.esc(t.username || '—') + '</span></div></div></td>' +
          '<td>' + ui.esc(t.phone || '—') + '<span class="cell-sub">' + ui.esc(t.email || '') + '</span></td>' +
          '<td>' + ui.esc(t.spesialisasi || '—') + '</td>' +
          '<td>' + ui.esc(t.area || '—') + '</td>' +
          '<td class="num">' + ui.rupiah(t.tarifPerSesi) + '</td>' +
          '<td class="num">' + t.siswa + '</td>' +
          '<td class="num">' + t.hadirBulan + ' sesi</td>' +
          '<td>' + ui.statusBadge(t.status) + '</td>' +
          '<td><div class="cell-actions">' +
            '<button type="button" class="icon-btn" title="Edit" data-edit="' + ui.attr(t.id) + '">' + ui.icon('pencil', 15) + '</button>' +
            '<button type="button" class="icon-btn" title="Reset kata sandi" data-reset="' + ui.attr(t.userId) + '">' + ui.icon('key', 15) + '</button>' +
            '<button type="button" class="icon-btn" title="' + (t.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '" data-toggle="' + ui.attr(t.userId) + '" data-status="' + ui.attr(t.status) + '">' + ui.icon('shield', 15) + '</button>' +
            (t.phone ? '<a class="icon-btn" title="WhatsApp" href="' + ui.attr(ui.waLink(t.phone, 'Halo ' + t.nama + ', salam dari Bimba Mahatari Kecil.')) + '" target="_blank" rel="noopener">' + ui.icon('message', 15) + '</a>' : '') +
          '</div></td></tr>';
      }).join('') : S.emptyRow(9, 'Belum ada pengajar.')) + '</tbody></table></div>'
    });

    return {
      html: html,
      mount: function (root) {
        root.querySelector('#addTeacher').onclick = function () { openTeacher(null); };
        root.addEventListener('click', function (e) {
          var edit = e.target.closest('[data-edit]');
          if (edit) {
            var t = data.teachers.filter(function (x) { return x.id === edit.getAttribute('data-edit'); })[0];
            if (t) openTeacher(t);
            return;
          }
          var reset = e.target.closest('[data-reset]');
          if (reset) { resetPassword(reset.getAttribute('data-reset')); return; }
          var toggle = e.target.closest('[data-toggle]');
          if (toggle) {
            var current = toggle.getAttribute('data-status');
            var next = current === 'aktif' ? 'nonaktif' : 'aktif';
            ui.confirm({
              title: next === 'nonaktif' ? 'Nonaktifkan pengajar?' : 'Aktifkan pengajar?',
              message: next === 'nonaktif' ? 'Pengajar tidak akan bisa masuk dan menerima laporan baru.' : 'Pengajar dapat kembali masuk ke aplikasi.',
              confirmText: next === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan',
              tone: next === 'nonaktif' ? 'danger' : ''
            }).then(async function (yes) {
              if (!yes) return;
              try {
                await call('users.setActive', { id: toggle.getAttribute('data-toggle'), status: next });
                ui.toast('Status akun diperbarui.', 'success');
                ctx.refresh();
              } catch (err) { ui.toast(err.message, 'error'); }
            });
          }
        });

        function openTeacher(t) {
          var isEdit = !!t;
          var body = '<form id="teacherForm" novalidate><div class="form-grid">' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(t ? t.nama : '') + '" required /></div>' +
              '<div class="field"><label>Spesialisasi</label><input class="input" name="spesialisasi" value="' + ui.attr(t ? t.spesialisasi : '') + '" placeholder="contoh: Calistung & SD" /></div>' +
            '</div>' +
            '<div class="field"><label>Area lokasi mengajar <span class="req">*</span></label><input class="input" name="area" value="' + ui.attr(t ? ((t.areas && t.areas.length ? t.areas.join('; ') : t.area) || '') : '') + '" placeholder="contoh: Sukamaju; Cibiru" /><div class="hint">Bisa lebih dari satu area — pisahkan dengan titik koma (;). Tampil pada pilihan jadwal saat pendaftaran siswa baru.</div></div>' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Nomor WhatsApp</label><input class="input" name="phone" value="' + ui.attr(t ? t.phone : '') + '" placeholder="08xxxxxxxxxx" /></div>' +
              '<div class="field"><label>Email</label><input class="input" type="email" name="email" value="' + ui.attr(t ? t.email : '') + '" /></div>' +
            '</div>' +
            (isEdit
              ? '<div class="note-box">Akun: <b>@' + ui.esc(t.username) + '</b>. Username diubah dari menu Pengaturan → Akun.</div>'
              : '<div class="form-grid two">' +
                  '<div class="field"><label>Username <span class="req">*</span></label><input class="input" name="username" placeholder="4–20 karakter" autocomplete="off" /></div>' +
                  '<div class="field"><label>Kata sandi awal <span class="req">*</span></label><input class="input" type="text" name="password" placeholder="minimal 6 karakter" autocomplete="new-password" /></div>' +
                '</div>') +
            '<div class="form-grid two">' +
              '<div class="field"><label>Tarif per sesi (Rp)</label><input class="input" type="number" min="0" step="1000" name="tarifPerSesi" value="' + ui.attr(t ? t.tarifPerSesi : 0) + '" /></div>' +
              '<div class="field"><label>Status</label><select class="select" name="status"><option value="aktif"' + (!t || t.status === 'aktif' ? ' selected' : '') + '>Aktif</option><option value="nonaktif"' + (t && t.status === 'nonaktif' ? ' selected' : '') + '>Nonaktif</option></select></div>' +
            '</div>' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Foto pengajar</label>' + S.uploadTile('teacherPhoto', { existing: t ? t.fotoUrl : '', title: 'Unggah foto', hint: 'JPG/PNG' }) + '</div>' +
              '<div class="field"><label>Tanda tangan</label>' + S.uploadTile('teacherTtd', { existing: t ? t.ttdUrl : '', icon: 'pencil', title: 'Unggah tanda tangan', hint: 'Background putih, JPG/PNG' }) + '</div>' +
            '</div>' +
          '</div></form>';
          ui.modal({
            title: isEdit ? 'Edit pengajar' : 'Tambah pengajar',
            subtitle: isEdit ? '@' + t.username : 'Buat akun pengajar baru',
            size: 'lg',
            body: body,
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="teacherSave">' + ui.icon('check', 15) + ' Simpan</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#teacherForm');
              el.querySelector('#teacherSave').onclick = async function () {
                ui.clearErrors(form);
                var d = ui.serialize(form);
                if (!d.nama) { ui.fieldError(form, 'nama', 'Nama pengajar wajib diisi.'); return; }
                if (!d.area) { ui.fieldError(form, 'area', 'Area lokasi mengajar wajib diisi.'); return; }
                if (!isEdit && (!d.username || !d.password)) { ui.toast('Username dan kata sandi awal wajib diisi.', 'error'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('guru.save', {
                    id: isEdit ? t.id : '',
                    nama: d.nama, phone: d.phone, email: d.email, spesialisasi: d.spesialisasi, area: d.area,
                    tarifPerSesi: d.tarifPerSesi, status: d.status,
                    username: d.username, password: d.password,
                    foto: await S.uploadValue('teacherPhoto', t ? t.fotoUrl : ''),
                    ttd: await S.uploadValue('teacherTtd', t ? t.ttdUrl : '')
                  });
                  close();
                  ui.toast(isEdit ? 'Data pengajar diperbarui.' : 'Pengajar baru ditambahkan.', 'success');
                  ctx.refresh();
                } catch (err) {
                  ui.busy(btn, false);
                  ui.toast(err.message, 'error', 5500);
                }
              };
            }
          });
        }

        function resetPassword(userId) {
          ui.confirm({
            title: 'Reset kata sandi',
            message: 'Sistem akan membuat kata sandi baru. Berikan kata sandi tersebut kepada pengajar.',
            confirmText: 'Buat kata sandi'
          }).then(async function (yes) {
            if (!yes) return;
            try {
              var res = await call('users.resetPassword', { id: userId });
              ui.modal({
                title: 'Kata sandi baru',
                size: 'sm',
                body: '<p class="confirm-text">Kata sandi untuk <b>' + ui.esc(res.nama) + '</b> (@' + ui.esc(res.username) + '):</p>' +
                  '<div class="note-box mt-12" style="font-size:18px;font-weight:800;letter-spacing:.08em;text-align:center">' + ui.esc(res.password) + '</div>' +
                  '<p class="small text-muted mt-12">Catat dan kirimkan melalui WhatsApp. Kata sandi tidak dapat dilihat lagi setelah jendela ini ditutup.</p>',
                footer: '<button type="button" class="btn btn-outline" id="copyPwd">' + ui.icon('copy', 14) + ' Salin</button><button type="button" class="btn btn-primary" data-close>Tutup</button>',
                onMount: function (el, close) {
                  el.querySelector('[data-close]').onclick = close;
                  el.querySelector('#copyPwd').onclick = function () { ui.copy(res.password); };
                }
              });
            } catch (err) { ui.toast(err.message, 'error'); }
          });
        }
      }
    };
  };

  /* =====================================================
     PAKET & JADWAL
     ===================================================== */
  V.paket = async function (ctx) {
    var res = await Promise.all([call('paket.list'), call('jadwal.list')]);
    var packages = res[0].packages || [];
    var slots = res[1].slots || [];
    var teachers = res[1].teachers || [];

    var html = ui.pageHead({
      eyebrow: 'Manajemen data',
      title: 'Paket & jadwal',
      subtitle: 'Atur paket belajar, tarif, pengajar, dan slot jadwal. Satu slot hanya untuk satu siswa.',
      actions: '<button type="button" class="btn btn-outline" id="addSlot">' + ui.icon('calendar', 15) + ' Tambah jadwal</button>' +
        '<button type="button" class="btn btn-primary" id="addPackage">' + ui.icon('plus', 15) + ' Tambah paket</button>'
    });

    html += '<div class="section-head-sm"><h3>Paket belajar</h3><span class="pill-count">' + packages.length + ' paket</span></div>';
    html += '<div class="grid grid-3">' + (packages.length ? packages.map(function (p) {
      return '<div class="card card-hover"><div class="card-body">' +
        '<div class="row-between"><span class="badge badge-' + (p.aktif ? 'green' : 'gray') + '">' + (p.aktif ? 'Aktif' : 'Nonaktif') + '</span><span class="small text-muted">' + p.siswaAktif + ' siswa</span></div>' +
        '<h2 style="font-family:var(--display);font-size:22px;margin-top:10px">' + ui.esc(p.nama) + '</h2>' +
        '<p class="small text-muted" style="min-height:36px;margin-top:5px">' + ui.esc(p.deskripsi || '—') + '</p>' +
        '<div class="pkg-price" style="font-size:25px;margin:12px 0 4px">' + ui.rupiah(p.harga) + ' <small>/bulan</small></div>' +
        '<div class="pkg-meta"><span>' + p.sesiPerBulan + ' sesi</span><span>' + p.durasiMenit + ' menit</span></div>' +
        '<div class="row mt-12" style="flex-wrap:wrap">' +
          '<button type="button" class="btn btn-outline btn-sm" data-pkg-edit="' + ui.attr(p.id) + '">' + ui.icon('pencil', 13) + ' Edit</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-pkg-toggle="' + ui.attr(p.id) + '">' + (p.aktif ? 'Nonaktifkan' : 'Aktifkan') + '</button>' +
        '</div></div></div>';
    }).join('') : '<div class="card" style="grid-column:1/-1"><div class="card-body">' + ui.empty('book', 'Belum ada paket', 'Tambahkan paket belajar pertama.', '<button class="btn btn-primary" id="emptyAddPackage">Tambah paket</button>') + '</div></div>') + '</div>';

    html += '<div class="mt-24 section-head-sm"><h3>Jadwal & slot</h3><span class="pill-count">' + slots.filter(function (s) { return s.status === 'terisi'; }).length + ' terisi</span></div>';
    html += ui.card({
      body: '<div class="data-toolbar"><div class="filter-row"><select class="select" id="slotFilterPackage"><option value="">Semua paket</option>' +
        packages.map(function (p) { return '<option value="' + ui.attr(p.id) + '">' + ui.esc(p.nama) + '</option>'; }).join('') +
        '</select></div><span class="small text-muted">Jadwal terisi tidak dapat dihapus.</span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Hari</th><th>Jam</th><th>Paket</th><th>Pengajar</th><th>Status</th><th>Siswa</th><th></th></tr></thead><tbody id="slotRows"></tbody></table></div>'
    });

    return {
      html: html,
      mount: function (root) {
        root.querySelector('#addPackage').onclick = function () { openPackage(null); };
        var emptyAdd = root.querySelector('#emptyAddPackage');
        if (emptyAdd) emptyAdd.onclick = function () { openPackage(null); };
        root.querySelector('#addSlot').onclick = function () { openSlot(null); };

        function drawSlots(filter) {
          var list = slots.filter(function (s) { return !filter || s.paketId === filter; });
          var body = root.querySelector('#slotRows');
          if (!list.length) { body.innerHTML = S.emptyRow(7, 'Belum ada jadwal untuk filter ini.'); return; }
          body.innerHTML = list.map(function (s) {
            return '<tr><td><b class="cell-strong">' + ui.esc(s.hari) + '</b></td>' +
              '<td class="nowrap">' + ui.esc(s.jamMulai + '–' + s.jamSelesai) + '</td>' +
              '<td>' + ui.esc(s.paketNama) + '</td>' +
              '<td>' + ui.esc(s.pengajarNama) + '</td>' +
              '<td>' + ui.statusBadge(s.status) + '</td>' +
              '<td>' + ui.esc(s.anakNama || '—') + '</td>' +
              '<td><div class="cell-actions">' +
                '<button type="button" class="icon-btn" data-slot-edit="' + ui.attr(s.id) + '" title="Edit">' + ui.icon('pencil', 15) + '</button>' +
                (s.status !== 'terisi' ? '<button type="button" class="icon-btn" data-slot-del="' + ui.attr(s.id) + '" title="Hapus">' + ui.icon('trash', 15) + '</button>' : '') +
              '</div></td></tr>';
          }).join('');
        }
        drawSlots('');
        root.querySelector('#slotFilterPackage').onchange = function () { drawSlots(this.value); };

        root.addEventListener('click', function (e) {
          var pe = e.target.closest('[data-pkg-edit]');
          if (pe) {
            var p = packages.filter(function (x) { return x.id === pe.getAttribute('data-pkg-edit'); })[0];
            if (p) openPackage(p);
            return;
          }
          var pt = e.target.closest('[data-pkg-toggle]');
          if (pt) {
            var pkg = packages.filter(function (x) { return x.id === pt.getAttribute('data-pkg-toggle'); })[0];
            if (!pkg) return;
            call('paket.save', {
              id: pkg.id, nama: pkg.nama, sesiPerBulan: pkg.sesiPerBulan, durasiMenit: pkg.durasiMenit,
              harga: pkg.harga, deskripsi: pkg.deskripsi, aktif: !pkg.aktif
            }).then(function () {
              ui.toast('Status paket diperbarui.', 'success');
              ctx.refresh();
            }).catch(function (err) { ui.toast(err.message, 'error'); });
            return;
          }
          var se = e.target.closest('[data-slot-edit]');
          if (se) {
            var slot = slots.filter(function (x) { return x.id === se.getAttribute('data-slot-edit'); })[0];
            if (slot) openSlot(slot);
            return;
          }
          var sd = e.target.closest('[data-slot-del]');
          if (sd) {
            ui.confirm({ title: 'Hapus jadwal?', message: 'Jadwal yang dihapus tidak dapat dikembalikan.', confirmText: 'Hapus', tone: 'danger' }).then(async function (yes) {
              if (!yes) return;
              try {
                await call('jadwal.remove', { id: sd.getAttribute('data-slot-del') });
                ui.toast('Jadwal dihapus.', 'success');
                ctx.refresh();
              } catch (err) { ui.toast(err.message, 'error'); }
            });
          }
        });

        function openPackage(p) {
          var isEdit = !!p;
          ui.modal({
            title: isEdit ? 'Edit paket' : 'Tambah paket',
            size: 'md',
            body: '<form id="pkgForm"><div class="form-grid">' +
              '<div class="field"><label>Nama paket <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(p ? p.nama : '') + '" placeholder="contoh: Reguler" /></div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Sesi per bulan</label><input class="input" type="number" min="1" max="60" name="sesiPerBulan" value="' + ui.attr(p ? p.sesiPerBulan : 8) + '" /></div>' +
                '<div class="field"><label>Durasi (menit)</label><input class="input" type="number" min="15" max="240" step="15" name="durasiMenit" value="' + ui.attr(p ? p.durasiMenit : 90) + '" /></div>' +
              '</div>' +
              '<div class="field"><label>Harga per bulan (Rp) <span class="req">*</span></label><input class="input" type="number" min="0" step="5000" name="harga" value="' + ui.attr(p ? p.harga : '') + '" /></div>' +
              '<div class="field"><label>Deskripsi</label><textarea class="textarea" name="deskripsi">' + ui.esc(p ? p.deskripsi : '') + '</textarea></div>' +
              '<label class="switch"><input type="checkbox" name="aktif" ' + (!p || p.aktif ? 'checked' : '') + '><span class="track"></span> Tampilkan sebagai paket aktif</label>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="pkgSave">Simpan paket</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#pkgForm');
              el.querySelector('#pkgSave').onclick = async function () {
                var d = ui.serialize(form);
                if (!d.nama) { ui.fieldError(form, 'nama', 'Nama paket wajib diisi.'); return; }
                if (!d.harga) { ui.fieldError(form, 'harga', 'Harga paket wajib diisi.'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('paket.save', {
                    id: isEdit ? p.id : '', nama: d.nama, sesiPerBulan: d.sesiPerBulan, durasiMenit: d.durasiMenit,
                    harga: d.harga, deskripsi: d.deskripsi, aktif: d.aktif
                  });
                  close();
                  ui.toast(isEdit ? 'Paket diperbarui.' : 'Paket ditambahkan.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }

        function openSlot(s) {
          var isEdit = !!s;
          var pkgOptions = packages.filter(function (p) { return p.aktif || (s && p.id === s.paketId); });
          ui.modal({
            title: isEdit ? 'Edit jadwal' : 'Tambah jadwal',
            subtitle: s && s.status === 'terisi' ? 'Jadwal sedang dipakai ' + s.anakNama + '. Waktu masih dapat diubah.' : '',
            size: 'md',
            body: '<form id="slotForm"><div class="form-grid">' +
              '<div class="field"><label>Paket <span class="req">*</span></label><select class="select" name="paketId">' + S.options(pkgOptions, s ? s.paketId : '', 'Pilih paket') + '</select></div>' +
              '<div class="field"><label>Pengajar <span class="req">*</span></label><select class="select" name="pengajarId">' + S.options(teachers, s ? s.pengajarId : '', 'Pilih pengajar') + '</select></div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Hari <span class="req">*</span></label><select class="select" name="hari">' + S.options(C.HARI.map(function (h) { return { value: h, label: h }; }), s ? s.hari : 'Senin') + '</select></div>' +
                '<div class="field"><label>Kuota</label><input class="input" type="number" min="1" max="10" name="kuota" value="' + ui.attr(s ? s.kuota : 1) + '" /></div>' +
              '</div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Jam mulai <span class="req">*</span></label><select class="select" name="jamMulai">' + S.time24Options(s ? s.jamMulai : '15:00') + '</select></div>' +
                '<div class="field"><label>Jam selesai <span class="req">*</span></label><select class="select" name="jamSelesai">' + S.time24Options(s ? s.jamSelesai : '16:30') + '</select></div>' +
              '</div>' +
              '<div class="field"><label>Status</label><select class="select" name="status"' + (s && s.status === 'terisi' ? ' disabled' : '') + '><option value="tersedia"' + (!s || s.status !== 'nonaktif' ? ' selected' : '') + '>Tersedia</option><option value="nonaktif"' + (s && s.status === 'nonaktif' ? ' selected' : '') + '>Nonaktif</option></select>' +
              (s && s.status === 'terisi' ? '<div class="hint">Status terisi mengikuti siswa yang terdaftar.</div>' : '') + '</div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="slotSave">Simpan jadwal</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#slotForm');
              el.querySelector('#slotSave').onclick = async function () {
                var d = ui.serialize(form);
                if (!d.paketId || !d.pengajarId) { ui.toast('Pilih paket dan pengajar.', 'error'); return; }
                if (!d.jamMulai || !d.jamSelesai) { ui.toast('Lengkapi jam mulai dan selesai.', 'error'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('jadwal.save', {
                    id: isEdit ? s.id : '', paketId: d.paketId, pengajarId: d.pengajarId,
                    hari: d.hari, jamMulai: d.jamMulai, jamSelesai: d.jamSelesai, kuota: d.kuota,
                    status: s && s.status === 'terisi' ? 'tersedia' : d.status
                  });
                  close();
                  ui.toast(isEdit ? 'Jadwal diperbarui.' : 'Jadwal ditambahkan.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }
      }
    };
  };

  /* =====================================================
     LAPORAN HARIAN (ADMIN)
     ===================================================== */
  V.harian = async function (ctx) {
    var data = await call('harian.list');
    var reports = data.reports || [];
    var periods = Object.keys(reports.reduce(function (acc, r) { acc[String(r.tanggal).slice(0, 7)] = 1; return acc; }, {})).sort().reverse();

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Laporan harian',
      subtitle: 'Pantau materi, capaian belajar, foto, video, dan paraf pengajar setiap sesi.',
      actions: '<a class="btn btn-outline" href="#/admin/lpmb" data-route>' + ui.icon('fileCheck', 15) + ' Rapor LPMB</a>'
    });
    html += ui.card({
      body: '<div class="data-toolbar"><div class="filter-row">' +
          '<select class="select" id="dailyPeriod"><option value="">Semua periode</option>' + periods.map(function (p) {
            return '<option value="' + ui.attr(p) + '"' + (p === ui.periodeNow() ? ' selected' : '') + '>' + ui.esc(ui.periodeLabel(p)) + '</option>';
          }).join('') + '</select>' +
          '<select class="select" id="dailyChild"><option value="">Semua anak</option>' + S.options(data.filters.children, '') + '</select>' +
        '</div><div class="search-box">' + ui.icon('search', 15) + '<input class="input" id="dailySearch" placeholder="Cari anak, pengajar, materi…" /></div></div>' +
        '<div id="dailyGrid"></div>'
    });

    return {
      html: html,
      mount: function (root) {
        var grid = root.querySelector('#dailyGrid');
        var periodSel = root.querySelector('#dailyPeriod');
        var childSel = root.querySelector('#dailyChild');
        var search = root.querySelector('#dailySearch');
        function draw() {
          var p = periodSel.value, c = childSel.value, q = String(search.value || '').toLowerCase();
          var list = reports.filter(function (r) {
            if (p && String(r.tanggal).slice(0, 7) !== p) return false;
            if (c && String(r.anakId) !== c) return false;
            if (q && [r.anakNama, r.pengajarNama, r.materi, r.capaian, r.ortuNama].join(' ').toLowerCase().indexOf(q) === -1) return false;
            return true;
          });
          if (!list.length) {
            grid.innerHTML = '<div class="card"><div class="card-body">' + ui.empty('clipboard', 'Belum ada laporan', 'Laporan akan tampil setelah pengajar mengisi aktivitas belajar.') + '</div></div>';
            return;
          }
          grid.innerHTML = '<div class="grid grid-2">' + list.map(function (r) { return S.reportCard(r, { showChild: true }); }).join('') + '</div>';
          S.bindMedia(grid);
        }
        periodSel.onchange = draw;
        childSel.onchange = draw;
        search.addEventListener('input', ui.debounce(draw, 180));
        draw();
      }
    };
  };

  /* =====================================================
     LAPORAN LPMB (ADMIN)
     ===================================================== */
  V.lpmb = async function (ctx) {
    var data = await call('lpmb.list');
    var rows = data.lpmb || [];
    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Laporan hasil LPMB',
      subtitle: 'Tinjau rapor perkembangan anak, lalu setujui dengan tanda tangan admin.',
      actions: '<a class="btn btn-outline" href="#/admin/harian" data-route>' + ui.icon('clipboard', 15) + ' Laporan harian</a>'
    });
    if (!ctx.user.ttdUrl) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('pencil', 16) + '<span>Tanda tangan admin belum diunggah. Persetujuan memakai tanda tangan pada <a class="bold" href="#/admin/pengaturan" data-route>Pengaturan</a> bila tersedia.</span></div>';
    }
    html += ui.card({
      body: '<div class="tabs" id="lpmbTabs">' +
          '<button type="button" class="tab active" data-lpmb-status="">Semua <span class="tab-count">' + rows.length + '</span></button>' +
          '<button type="button" class="tab" data-lpmb-status="menunggu_acc">Menunggu ACC <span class="tab-count">' + data.pending + '</span></button>' +
          '<button type="button" class="tab" data-lpmb-status="disetujui">Disetujui</button>' +
          '<button type="button" class="tab" data-lpmb-status="ditolak">Ditolak</button>' +
        '</div><div class="table-wrap"><table class="data-table lpmb-table"><thead><tr><th>Anak</th><th>Periode</th><th>Pengajar</th><th>Rata-rata</th><th>Status</th><th></th></tr></thead><tbody id="lpmbRows"></tbody></table></div>'
    });

    return {
      html: html,
      mount: function (root) {
        var current = '';
        var body = root.querySelector('#lpmbRows');
        function draw() {
          var list = rows.filter(function (r) { return !current || r.status === current; });
          if (!list.length) { body.innerHTML = S.emptyRow(6, 'Belum ada rapor untuk status ini.'); return; }
          body.innerHTML = list.map(function (r) {
            var avg = S.avgScore(r.nilai);
            var p = ui.predikat(avg);
            return '<tr><td><div class="person-cell">' + S.photo(r.anakFoto, r.anakNama, 'sm') + '<div class="pc-info"><b>' + ui.esc(r.anakNama) + '</b><span>' + ui.esc([r.kelas, r.sekolah].filter(Boolean).join(' · ')) + '</span>' +
              '<span class="cell-sub lpmb-mobile-meta">' + ui.esc(ui.periodeLabel(r.periode)) + ' · ' + ui.esc(ui.tanggal(r.tanggal, 'short')) + '</span>' +
              '<span class="lpmb-mobile-status">' + ui.statusBadge(r.status) + '</span></div></div></td>' +
              '<td><b class="cell-strong">' + ui.esc(ui.periodeLabel(r.periode)) + '</b><span class="cell-sub">' + ui.esc(ui.tanggal(r.tanggal, 'short')) + '</span></td>' +
              '<td>' + ui.esc(r.pengajarNama) + '</td>' +
              '<td class="num"><b>' + avg + '</b> ' + ui.badge(p.grade, p.tone) + '</td>' +
              '<td>' + ui.statusBadge(r.status) + '</td>' +
              '<td><div class="cell-actions">' +
                '<button type="button" class="btn btn-outline btn-sm" data-lpmb-view="' + ui.attr(r.id) + '">Lihat</button>' +
                (r.status === 'menunggu_acc' ? '<button type="button" class="btn btn-primary btn-sm" data-lpmb-acc="' + ui.attr(r.id) + '">ACC</button>' : '') +
              '</div></td></tr>';
          }).join('');
        }
        draw();
        root.querySelector('#lpmbTabs').addEventListener('click', function (e) {
          var b = e.target.closest('[data-lpmb-status]');
          if (!b) return;
          current = b.getAttribute('data-lpmb-status');
          Array.prototype.forEach.call(root.querySelectorAll('#lpmbTabs .tab'), function (t) { t.classList.remove('active'); });
          b.classList.add('active');
          draw();
        });
        root.addEventListener('click', function (e) {
          var v = e.target.closest('[data-lpmb-view]'), a = e.target.closest('[data-lpmb-acc]');
          var id = v ? v.getAttribute('data-lpmb-view') : (a ? a.getAttribute('data-lpmb-acc') : '');
          if (!id) return;
          var row = rows.filter(function (x) { return x.id === id; })[0];
          if (row) openDetail(row, !!a);
        });

        async function printRapor(r, btn) {
          ui.busy(btn, true, 'Menyiapkan…');
          try {
            var res = await Promise.all([
              call('harian.list', { anakId: r.anakId, periode: r.periode }),
              call('absensi.list', { anakId: r.anakId, periode: r.periode }),
              call('settings.get')
            ]);
            var reports = (res[0].reports || []).filter(function (d) {
              return String(d.anakId) === String(r.anakId) && String(d.tanggal).slice(0, 7) === r.periode;
            });
            var att = (res[1].attendance || []).filter(function (a) {
              return String(a.anakId) === String(r.anakId) && String(a.tanggal).slice(0, 7) === r.periode;
            });
            ui.printHTML(S.raporHTML(r, reports, att, res[2].bimbel || {}));
          } catch (err) { ui.toast(err.message, 'error', 6000); }
          ui.busy(btn, false);
        }

        function openDetail(r, focusApprove) {
          var avg = S.avgScore(r.nilai);
          var p = ui.predikat(avg);
          var canAcc = r.status === 'menunggu_acc';
          var bodyHtml = '<div class="grid grid-2" style="gap:16px">' +
            '<div>' + '<div class="section-head-sm"><h3>Identitas</h3>' + ui.statusBadge(r.status) + '</div>' +
              '<div class="info-list">' + S.infoItem('Anak', r.anakNama) + S.infoItem('Kelas', r.kelas || '—') +
                S.infoItem('Periode', ui.periodeLabel(r.periode)) + S.infoItem('Pengajar', r.pengajarNama) +
                S.infoItem('Rata-rata', avg + ' (' + p.label + ')') + S.infoItem('Orang tua', r.ortuNama) +
              '</div></div>' +
            '<div><div class="section-head-sm"><h3>Nilai aspek</h3></div><div class="table-wrap"><table class="data-table"><tbody>' + S.lpmbScoreRows(r.nilai) + '</tbody></table></div></div>' +
          '</div>' +
          '<div class="form-section"><div class="form-section-title">' + ui.icon('file', 14) + ' Catatan perkembangan</div><div class="report-text">' + ui.esc(r.catatan || '—') + '</div></div>' +
          (r.rekomendasi ? '<div class="form-section"><div class="form-section-title">' + ui.icon('target', 14) + ' Rekomendasi</div><div class="report-text">' + ui.esc(r.rekomendasi) + '</div></div>' : '') +
          '<div class="grid grid-2 mt-16"><div class="sig-preview">' + (r.parafGuruUrl ? '<img src="' + ui.attr(r.parafGuruUrl) + '" alt="Paraf pengajar" />' : '<span class="sig-empty">Paraf pengajar belum ada</span>') + '</div>' +
            '<div class="sig-preview">' + (r.ttdAdminUrl ? '<img src="' + ui.attr(r.ttdAdminUrl) + '" alt="Tanda tangan admin" />' : '<span class="sig-empty">Belum disetujui admin</span>') + '</div></div>' +
          (canAcc ? '<div class="field mt-16"><label>Catatan admin (wajib untuk penolakan)</label><textarea class="textarea" id="lpmbNote" placeholder="Opsional untuk persetujuan, wajib diisi saat menolak.">' + ui.esc(r.catatanAdmin || '') + '</textarea></div>' : (r.catatanAdmin ? '<div class="note-box mt-16"><b>Catatan admin:</b> ' + ui.esc(r.catatanAdmin) + '</div>' : '')) +
          (r.approvedAt && r.status === 'disetujui' ? '<div class="alert alert-success mt-16">' + ui.icon('checkCircle', 16) + '<span>Disetujui oleh ' + ui.esc(r.approvedBy || 'Admin') + ' pada ' + ui.esc(ui.tanggalWaktu(r.approvedAt)) + '.</span></div>' : '');

          ui.modal({
            title: 'Rapor ' + r.anakNama,
            subtitle: ui.periodeLabel(r.periode) + ' · ' + r.pengajarNama,
            size: 'lg',
            body: bodyHtml,
            footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button>' +
              '<button type="button" class="btn btn-outline" id="lpmbPrint">' + ui.icon('printer', 15) + ' Cetak / PDF</button>' +
              (canAcc
                ? '<button type="button" class="btn btn-danger-soft" id="lpmbReject">Tolak</button><button type="button" class="btn btn-primary" id="lpmbApprove">' + ui.icon('check', 15) + ' Setujui & Tanda Tangan</button>'
                : ''),
            onMount: function (el, close) {
              Array.prototype.forEach.call(el.querySelectorAll('[data-close]'), function (b) { b.onclick = close; });
              el.querySelector('#lpmbPrint').onclick = function () { printRapor(r, this); };
              if (!canAcc) return;
              var noteEl = el.querySelector('#lpmbNote');
              el.querySelector('#lpmbApprove').onclick = async function () {
                var btn = this;
                ui.busy(btn, true, 'Menyetujui…');
                try {
                  await call('lpmb.approve', { id: r.id, action: 'approve', catatan: noteEl.value });
                  close();
                  ui.toast('Rapor disetujui dan ditandatangani.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
              el.querySelector('#lpmbReject').onclick = async function () {
                if (!String(noteEl.value || '').trim()) { noteEl.focus(); ui.toast('Tuliskan alasan penolakan terlebih dahulu.', 'error'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menolak…');
                try {
                  await call('lpmb.approve', { id: r.id, action: 'reject', catatan: noteEl.value });
                  close();
                  ui.toast('Rapor dikembalikan ke pengajar.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }
      }
    };
  };

  /* =====================================================
     BIAYA LES
     ===================================================== */
  V.biaya = async function (ctx) {
    var periode = periodParam(ctx);
    var data = await call('biaya.list', { periode: periode });
    var state = { data: data, status: (ctx.params && ctx.params.status) || '', q: '' };

    var html = ui.pageHead({
      eyebrow: 'Keuangan',
      title: 'Laporan biaya les',
      subtitle: 'Kelola tagihan, verifikasi bukti pembayaran, dan kirim laporan ke WhatsApp orang tua.',
      actions: '<button type="button" class="btn btn-outline" id="billGenerate">' + ui.icon('refresh', 15) + ' Generate tagihan</button>' +
        '<button type="button" class="btn btn-primary" id="billCreate">' + ui.icon('plus', 15) + ' Buat tagihan</button>'
    });

    function statusOptions(selected) {
      return [
        { value: '', label: 'Semua status' }, { value: 'belum', label: 'Belum bayar' },
        { value: 'sebagian', label: 'Dibayar sebagian' },
        { value: 'menunggu_verifikasi', label: 'Menunggu verifikasi' },
        { value: 'lunas', label: 'Lunas' }, { value: 'ditolak', label: 'Ditolak' }
      ].map(function (o) { return '<option value="' + o.value + '"' + (selected === o.value ? ' selected' : '') + '>' + o.label + '</option>'; }).join('');
    }

    function areaHTML() {
      var d = state.data;
      var rows = d.bills.filter(function (b) {
        if (state.status && b.status !== state.status) return false;
        if (state.q && [b.anakNama, b.ortuNama, b.ortuPhone, b.paketNama].join(' ').toLowerCase().indexOf(state.q) === -1) return false;
        return true;
      });
      var body = rows.length ? rows.map(function (b) {
        return '<tr>' +
          '<td><input type="checkbox" name="billCheck" value="' + ui.attr(b.id) + '" aria-label="Pilih ' + ui.esc(b.anakNama) + '" style="accent-color:var(--teal)"></td>' +
          '<td><div class="person-cell">' + S.photo(b.anakFoto, b.anakNama, 'sm') + '<div class="pc-info"><b>' + ui.esc(b.anakNama) + '</b><span>' + ui.esc(b.paketNama || '') + '</span></div></div></td>' +
          '<td><b class="cell-strong">' + ui.esc(b.ortuNama) + '</b><span class="cell-sub">' + ui.esc(b.ortuPhone || 'tanpa nomor') + '</span></td>' +
          '<td>' + ui.esc(ui.periodeLabel(b.periode)) + '<span class="cell-sub">Jatuh tempo ' + ui.esc(ui.tanggal(b.jatuhTempo, 'short')) + '</span></td>' +
          '<td class="num money">' + ui.rupiah(b.jumlah) + '</td>' +
          '<td class="num money">' + ui.rupiah(b.dibayar) + (b.sesiPaket ? '<span class="cell-sub">' + ui.rupiah(b.hargaPerSesi) + '/sesi</span>' : '') + '</td>' +
          '<td class="num money">' + ui.rupiah(b.sisa) + '</td>' +
          '<td>' + ui.statusBadge(b.status) + (b.payments && b.payments.length ? '<span class="cell-sub">' + b.payments.length + ' pembayaran</span>' : '') + '</td>' +
          '<td><div class="cell-actions">' +
            '<button type="button" class="icon-btn" data-bill-detail="' + ui.attr(b.id) + '" title="Rincian pembayaran">' + ui.icon('receipt', 15) + '</button>' +
            (b.buktiUrl ? '<button type="button" class="icon-btn" data-bill-proof="' + ui.attr(b.id) + '" title="Lihat bukti terbaru">' + ui.icon('image', 15) + '</button>' : '') +
            (b.status === 'menunggu_verifikasi' ? '<button type="button" class="btn btn-primary btn-sm" data-bill-verify="' + ui.attr(b.id) + '">Verifikasi</button>' : '') +
            (Number(b.sisa || 0) > 0 && b.status !== 'menunggu_verifikasi' ? '<button type="button" class="btn btn-outline btn-sm" data-bill-paid="' + ui.attr(b.id) + '">Tandai lunas</button>' : '') +
            '<button type="button" class="icon-btn" data-bill-edit="' + ui.attr(b.id) + '" title="Edit">' + ui.icon('pencil', 15) + '</button>' +
            '<button type="button" class="icon-btn" data-bill-wa="' + ui.attr(b.id) + '" title="Kirim WA">' + ui.icon('message', 15) + '</button>' +
          '</div></td></tr>';
      }).join('') : S.emptyRow(8, 'Tidak ada tagihan untuk filter ini.');

      return '<div class="stat-grid">' +
          ui.stat('receipt', 'Total tagihan', ui.rupiah(d.summary.total), { hint: d.summary.count + ' tagihan', tone: 'blue' }) +
          ui.stat('checkCircle', 'Sudah lunas', ui.rupiah(d.summary.paid), { hint: d.summary.paidCount + ' tagihan', tone: 'dark' }) +
          ui.stat('wallet', 'Belum terbayar', ui.rupiah(d.summary.outstanding), { hint: 'perlu ditindaklanjuti', tone: 'red' }) +
          ui.stat('clock', 'Periode', d.periode === 'semua' ? 'Semua' : ui.periodeLabel(d.periode), { hint: 'pilih periode di filter' }) +
        '</div>' +
        (!d.waConfigured ? '<div class="alert alert-warning mt-16">' + ui.icon('message', 16) + '<span>Fonnte belum terhubung. Aktifkan di <a class="bold" href="#/admin/pengaturan" data-route>Pengaturan</a> agar laporan terkirim otomatis.</span></div>' : '') +
        '<div class="card mt-16"><div class="card-body">' +
          '<div class="data-toolbar"><div class="filter-row">' +
            '<select class="select" id="billPeriod">' + d.periods.map(function (p) {
              return '<option value="' + ui.attr(p) + '"' + (d.periode === p ? ' selected' : '') + '>' + ui.esc(ui.periodeLabel(p)) + '</option>';
            }).join('') + '</select>' +
            '<select class="select" id="billStatus">' + statusOptions(state.status) + '</select>' +
          '</div><div class="row" style="gap:8px;flex-wrap:wrap">' +
            '<div class="search-box">' + ui.icon('search', 15) + '<input class="input" id="billSearch" value="' + ui.attr(state.q) + '" placeholder="Cari anak / orang tua…" /></div>' +
            '<button type="button" class="btn btn-sun btn-sm" id="billSendSelected">' + ui.icon('send', 14) + ' Kirim WA terpilih</button>' +
          '</div></div>' +
          '<div class="table-wrap"><table class="data-table bill-table"><thead><tr><th style="width:30px"><input type="checkbox" id="billCheckAll" aria-label="Pilih semua" style="accent-color:var(--teal)"></th><th>Anak</th><th>Orang tua</th><th>Periode</th><th class="num">Jumlah</th><th class="num">Dibayar</th><th class="num">Sisa</th><th>Status</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>' +
          '<div class="table-foot"><span id="billSelectedCount">0 tagihan dipilih</span><span>' + (d.waConfigured ? 'WhatsApp siap digunakan' : 'WhatsApp belum terhubung') + '</span></div>' +
        '</div></div>';
    }

    var area = '<div id="billArea">' + areaHTML() + '</div>';

    return {
      html: html + area,
      mount: function (root) {
        var areaEl = root.querySelector('#billArea');
        function draw() {
          areaEl.innerHTML = areaHTML();
          bindArea();
        }
        function bindArea() {
          var periodSel = areaEl.querySelector('#billPeriod');
          var statusSel = areaEl.querySelector('#billStatus');
          var searchEl = areaEl.querySelector('#billSearch');
          var all = areaEl.querySelector('#billCheckAll');
          var sendBtn = areaEl.querySelector('#billSendSelected');
          if (periodSel) periodSel.onchange = function () {
            BMK.app.navigate('#/admin/biaya?periode=' + encodeURIComponent(this.value), true);
          };
          if (statusSel) statusSel.onchange = function () { state.status = this.value; draw(); };
          if (searchEl) searchEl.addEventListener('input', ui.debounce(function () { state.q = this.value; draw(); }, 200));
          if (all) all.onchange = function () {
            Array.prototype.forEach.call(areaEl.querySelectorAll('input[name="billCheck"]'), function (c) { c.checked = all.checked; });
            updateCount();
          };
          if (sendBtn) sendBtn.onclick = function () { sendSelected(); };
          areaEl.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'billCheck') updateCount();
          });
          areaEl.addEventListener('click', function (e) {
            var t = e.target.closest('[data-bill-verify],[data-bill-proof],[data-bill-detail],[data-bill-paid],[data-bill-edit],[data-bill-wa]');
            if (!t) return;
            var id = t.getAttribute('data-bill-verify') || t.getAttribute('data-bill-proof') || t.getAttribute('data-bill-detail') || t.getAttribute('data-bill-paid') || t.getAttribute('data-bill-edit') || t.getAttribute('data-bill-wa');
            var bill = state.data.bills.filter(function (b) { return b.id === id; })[0];
            if (!bill) return;
            if (t.hasAttribute('data-bill-proof')) { proofModal(bill); return; }
            if (t.hasAttribute('data-bill-detail')) { verifyModal(bill, false); return; }
            if (t.hasAttribute('data-bill-verify') || t.hasAttribute('data-bill-paid')) { verifyModal(bill, t.hasAttribute('data-bill-paid')); return; }
            if (t.hasAttribute('data-bill-edit')) { openBill(bill); return; }
            if (t.hasAttribute('data-bill-wa')) { sendBills([bill.id]); }
          });
        }
        function updateCount() {
          var n = areaEl.querySelectorAll('input[name="billCheck"]:checked').length;
          var el = areaEl.querySelector('#billSelectedCount');
          if (el) el.textContent = n + ' tagihan dipilih';
        }
        bindArea();

        root.querySelector('#billCreate').onclick = function () { openBill(null); };
        root.querySelector('#billGenerate').onclick = function () {
          ui.confirm({
            title: 'Generate tagihan ' + ui.periodeLabel(periode) + '?',
            message: 'Tagihan dibuat untuk semua siswa dengan paket aktif yang belum memiliki tagihan pada periode ini.',
            confirmText: 'Generate'
          }).then(async function (yes) {
            if (!yes) return;
            try {
              var res = await call('biaya.generate', { periode: periode });
              ui.toast(res.created + ' tagihan dibuat, ' + res.skipped + ' dilewati.', 'success', 5000);
              ctx.refresh();
            } catch (err) { ui.toast(err.message, 'error', 5500); }
          });
        };

        function proofModal(bill) {
          ui.modal({
            title: 'Bukti pembayaran',
            subtitle: bill.anakNama + ' · ' + ui.periodeLabel(bill.periode),
            size: 'lg',
            body: '<div style="border-radius:12px;overflow:hidden;background:#0f1614"><img src="' + ui.attr(bill.buktiUrl) + '" alt="Bukti pembayaran" style="width:100%;max-height:66vh;object-fit:contain" /></div>' +
              '<div class="info-list mt-16">' + S.infoItem('Jumlah tagihan', ui.rupiah(bill.jumlah)) + S.infoItem('Sudah dibayar', ui.rupiah(bill.dibayar)) +
                S.infoItem('Sisa', ui.rupiah(bill.sisa)) + S.infoItem('Status', ui.statusBadge(bill.status), true) +
                S.infoItem('Tanggal bukti', ui.tanggal(bill.tanggalBayar)) + S.infoItem('Metode', bill.metode || '—') + '</div>',
            footer: '<button type="button" class="btn btn-primary" data-close>Tutup</button>',
            onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; }
          });
        }

        function paymentRows(bill) {
          var list = bill.payments || [];
          if (!list.length) {
            return '<div class="note-box mt-12">Belum ada pembayaran cicilan tercatat. ' +
              (Number(bill.dibayar || 0) > 0 ? 'Total dibayar: <b>' + ui.rupiah(bill.dibayar) + '</b>.' : 'Orang tua dapat membayar bertahap sesuai sesi.') + '</div>';
          }
          return '<div class="payment-list mt-12">' + list.map(function (p) {
            var pending = p.status === 'menunggu_verifikasi';
            return '<div class="payment-row">' +
              '<button type="button" class="payment-proof" data-pay-proof="' + ui.attr(p.id) + '" title="Lihat bukti"' + (p.buktiUrl ? '' : ' disabled') + '>' +
                (p.buktiUrl ? '<img src="' + ui.attr(p.buktiUrl) + '" alt="Bukti pembayaran" />' : ui.icon('receipt', 18)) +
              '</button>' +
              '<div class="payment-info"><b>' + ui.rupiah(p.jumlah) + '</b>' +
                '<span>' + ui.esc(ui.tanggal(p.tanggalBayar || p.createdAt, 'short')) + ' · ' + ui.esc(p.metode || 'transfer') + '</span>' +
                (p.catatan ? '<span>' + ui.esc(p.catatan) + '</span>' : '') + '</div>' +
              '<div class="payment-side">' + ui.statusBadge(p.status) +
                (pending ? '<span class="row" style="gap:5px;flex-wrap:wrap">' +
                  '<button type="button" class="btn btn-primary btn-sm" data-pay-accept="' + ui.attr(p.id) + '">Terima</button>' +
                  '<button type="button" class="btn btn-danger-soft btn-sm" data-pay-reject="' + ui.attr(p.id) + '">Tolak</button></span>' : '') +
              '</div></div>';
          }).join('') + '</div>';
        }

        function paymentProofModal(p) {
          ui.modal({
            title: 'Bukti pembayaran',
            subtitle: ui.rupiah(p.jumlah) + ' · ' + ui.tanggal(p.tanggalBayar || p.createdAt),
            size: 'lg',
            body: '<div style="border-radius:12px;overflow:hidden;background:#0f1614"><img src="' + ui.attr(p.buktiUrl) + '" alt="Bukti pembayaran" style="width:100%;max-height:66vh;object-fit:contain" /></div>' +
              '<div class="info-list mt-16">' + S.infoItem('Nominal', ui.rupiah(p.jumlah)) + S.infoItem('Status', ui.statusBadge(p.status), true) +
                S.infoItem('Metode', p.metode || '—') + S.infoItem('Catatan', p.catatan || '—') + '</div>',
            footer: '<button type="button" class="btn btn-primary" data-close>Tutup</button>',
            onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; }
          });
        }

        function verifyModal(bill, markPaid) {
          var pendingList = (bill.payments || []).filter(function (p) { return p.status === 'menunggu_verifikasi'; });
          var isPending = pendingList.length > 0;
          var footer = '<button type="button" class="btn btn-ghost" data-close>Batal</button>';
          if (!markPaid) {
            if (isPending) footer += '<button type="button" class="btn btn-danger-soft" id="verifyReject">Tolak semua</button>' +
              '<button type="button" class="btn btn-primary" id="verifyAccept">Terima semua</button>';
            if (Number(bill.sisa || 0) > 0) footer += '<button type="button" class="btn btn-outline" id="verifyMarkPaid">Tandai sisa lunas</button>';
          } else {
            footer += '<button type="button" class="btn btn-primary" id="verifyAccept">Tandai sisa lunas</button>';
          }
          ui.modal({
            title: markPaid ? 'Tandai sisa lunas' : (isPending ? 'Verifikasi pembayaran' : 'Rincian pembayaran'),
            subtitle: bill.anakNama + ' · ' + ui.periodeLabel(bill.periode),
            size: 'lg',
            body: '<div class="info-list">' + S.infoItem('Jumlah tagihan', ui.rupiah(bill.jumlah)) +
                S.infoItem('Sudah dibayar', ui.rupiah(bill.dibayar)) + S.infoItem('Sisa tagihan', ui.rupiah(bill.sisa)) +
                S.infoItem('Orang tua', bill.ortuNama) + S.infoItem('Jatuh tempo', ui.tanggal(bill.jatuhTempo)) +
                S.infoItem('Status', ui.statusBadge(bill.status), true) + '</div>' +
              (bill.sesiPaket ? '<div class="note-box mt-12">Paket ' + bill.sesiPaket + ' sesi · ' + ui.rupiah(bill.hargaPerSesi) + ' per sesi. Pembayaran boleh dicicil beberapa kali hingga lunas.</div>' : '') +
              '<div class="form-section-title mt-16">' + ui.icon('receipt', 14) + ' Riwayat pembayaran</div>' + paymentRows(bill) +
              '<div class="field mt-16"><label>Catatan / alasan penolakan</label><textarea class="textarea" id="verifyNote" placeholder="Wajib diisi bila pembayaran ditolak.">' + ui.esc(bill.catatan || '') + '</textarea></div>',
            footer: footer,
            onMount: function (el, close) {
              Array.prototype.forEach.call(el.querySelectorAll('[data-close]'), function (b) { b.onclick = close; });
              var note = el.querySelector('#verifyNote');
              function paymentById(id) { return (bill.payments || []).filter(function (p) { return p.id === id; })[0]; }
              el.addEventListener('click', function (ev) {
                var proof = ev.target.closest('[data-pay-proof]');
                if (proof) { var p = paymentById(proof.getAttribute('data-pay-proof')); if (p) paymentProofModal(p); return; }
                var acc = ev.target.closest('[data-pay-accept]');
                if (acc) { verifyOne(acc.getAttribute('data-pay-accept'), 'terima', acc); return; }
                var rej = ev.target.closest('[data-pay-reject]');
                if (rej) { verifyOne(rej.getAttribute('data-pay-reject'), 'tolak', rej); return; }
              });
              async function verifyOne(paymentId, action, btn) {
                var noteText = String(note.value || '').trim();
                if (action === 'tolak' && !noteText) { note.focus(); ui.toast('Tuliskan alasan penolakan.', 'error'); return; }
                ui.busy(btn, true, action === 'terima' ? 'Menerima…' : 'Menolak…');
                try {
                  await call('biaya.verify', { id: bill.id, paymentId: paymentId, action: action, catatan: noteText });
                  close();
                  ui.toast(action === 'terima' ? 'Pembayaran diterima dan total tagihan diperbarui.' : 'Pembayaran ditolak.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              }
              var accept = el.querySelector('#verifyAccept');
              if (accept) accept.onclick = async function () {
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  if (markPaid) await call('biaya.markPaid', { id: bill.id, metode: 'manual', catatan: note.value });
                  else await call('biaya.verify', { id: bill.id, action: 'terima', catatan: note.value });
                  close();
                  ui.toast(markPaid ? 'Sisa tagihan ditandai lunas.' : 'Semua pembayaran menunggu diterima.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
              var reject = el.querySelector('#verifyReject');
              if (reject) reject.onclick = async function () {
                if (!String(note.value || '').trim()) { note.focus(); ui.toast('Tuliskan alasan penolakan.', 'error'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menolak…');
                try {
                  await call('biaya.verify', { id: bill.id, action: 'tolak', catatan: note.value });
                  close();
                  ui.toast('Pembayaran ditolak. Orang tua perlu mengunggah ulang.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
              var markBtn = el.querySelector('#verifyMarkPaid');
              if (markBtn) markBtn.onclick = async function () {
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('biaya.markPaid', { id: bill.id, metode: 'manual', catatan: note.value });
                  close();
                  ui.toast('Sisa tagihan ditandai lunas.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }

        function openBill(bill) {
          var isEdit = !!bill;
          var children = state.data.children || [];
          ui.modal({
            title: isEdit ? 'Edit tagihan' : 'Buat tagihan',
            subtitle: isEdit ? bill.anakNama : 'Tagihan manual untuk satu anak',
            size: 'md',
            body: '<form id="billForm"><div class="form-grid">' +
              '<div class="field"><label>Anak <span class="req">*</span></label>' + (isEdit
                ? '<input class="input" value="' + ui.attr(bill.anakNama + ' · ' + bill.ortuNama) + '" disabled />'
                : '<select class="select" name="anakId">' + S.options(children, '', 'Pilih anak') + '</select>') + '</div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Periode <span class="req">*</span></label>' + S.periodSelect('periode', isEdit ? bill.periode : periode) + '</div>' +
                '<div class="field"><label>Jatuh tempo</label><input class="input" type="date" name="jatuhTempo" value="' + ui.attr(isEdit ? bill.jatuhTempo : '') + '" /></div>' +
              '</div>' +
              '<div class="field"><label>Jumlah tagihan (Rp) ' + (isEdit ? '' : '<span class="text-soft">(kosongkan untuk harga paket)</span>') + '</label><input class="input" type="number" min="0" step="1000" name="jumlah" value="' + ui.attr(isEdit ? bill.jumlah : '') + '" /></div>' +
              (isEdit && bill.sesiPaket ? '<div class="note-box">Paket ' + bill.sesiPaket + ' sesi · ' + ui.rupiah(bill.hargaPerSesi) + ' per sesi. Sudah dibayar <b>' + ui.rupiah(bill.dibayar) + '</b>, sisa <b>' + ui.rupiah(bill.sisa) + '</b>.</div>' : '<div class="note-box">Tagihan dapat dibayar bertahap (cicilan) beberapa kali oleh orang tua. Admin memverifikasi setiap pembayaran.</div>') +
              '<div class="field"><label>Catatan</label><textarea class="textarea" name="catatan">' + ui.esc(isEdit ? bill.catatan : '') + '</textarea></div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="billSave">Simpan tagihan</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#billForm');
              el.querySelector('#billSave').onclick = async function () {
                var d = ui.serialize(form);
                if (!isEdit && !d.anakId) { ui.toast('Pilih anak.', 'error'); return; }
                if (!d.periode) { ui.toast('Pilih periode tagihan.', 'error'); return; }
                if (isEdit && d.jumlah !== '' && Number(d.jumlah) < Number(bill.dibayar || 0)) {
                  ui.fieldError(form, 'jumlah', 'Jumlah tagihan tidak boleh lebih kecil dari pembayaran yang sudah diterima (' + ui.rupiah(bill.dibayar) + ').');
                  return;
                }
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('biaya.save', {
                    id: isEdit ? bill.id : '', anakId: isEdit ? bill.anakId : d.anakId,
                    periode: d.periode, jumlah: d.jumlah, jatuhTempo: d.jatuhTempo, catatan: d.catatan
                  });
                  close();
                  ui.toast(isEdit ? 'Tagihan diperbarui.' : 'Tagihan dibuat.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }

        function sendSelected() {
          var ids = Array.prototype.map.call(areaEl.querySelectorAll('input[name="billCheck"]:checked'), function (c) { return c.value; });
          if (!ids.length) {
            var unpaid = state.data.bills.filter(function (b) { return Number(b.sisa || 0) > 0; });
            if (!unpaid.length) { ui.toast('Tidak ada tagihan yang bisa dikirim.', 'info'); return; }
            ui.confirm({
              title: 'Kirim ke semua tagihan belum lunas?',
              message: 'Laporan biaya untuk ' + unpaid.length + ' tagihan akan dikirim melalui WhatsApp.',
              confirmText: 'Kirim sekarang'
            }).then(function (yes) { if (yes) sendBills(unpaid.map(function (b) { return b.id; })); });
            return;
          }
          sendBills(ids);
        }

        async function sendBills(ids) {
          if (!state.data.waConfigured) {
            ui.modal({
              title: 'WhatsApp belum terhubung',
              size: 'sm',
              body: '<p class="confirm-text">Token Fonnte belum diatur. Hubungkan WhatsApp lebih dulu agar laporan terkirim otomatis.</p>',
              footer: '<a class="btn btn-primary" href="#/admin/pengaturan" data-route>Buka pengaturan</a>',
              onClose: function () { /* navigasi lewat tautan */ }
            });
            return;
          }
          ui.confirm({
            title: 'Kirim laporan biaya?',
            message: ids.length + ' laporan akan dikirim ke WhatsApp orang tua. Pastikan nomor WhatsApp sudah benar.',
            confirmText: 'Kirim'
          }).then(async function (yes) {
            if (!yes) return;
            try {
              var res = await call('biaya.sendWa', { ids: ids });
              resultModal(res);
              ctx.refresh();
            } catch (err) { ui.toast(err.message, 'error', 6000); }
          });
        }

        function resultModal(res) {
          var body = '<div class="row-between mb-12"><b>Hasil pengiriman</b><span>' + res.sent + ' terkirim · ' + res.failed + ' gagal</span></div>' +
            (res.results || []).map(function (r) {
              return '<div class="list-row"><span class="stat-ic" style="width:30px;height:30px;background:var(--' + (r.ok ? 'green' : 'red') + '-soft);color:var(--' + (r.ok ? 'green' : 'red') + ')">' + ui.icon(r.ok ? 'check' : 'alert', 14) + '</span>' +
                '<div class="list-main"><b>' + ui.esc(r.anakNama || '—') + '</b><span>' + ui.esc(r.ortuNama || '') + ' · ' + ui.esc(r.phone || '') + '</span>' +
                (!r.ok && r.error ? '<span class="text-red">' + ui.esc(r.error) + '</span>' : '') + '</div>' +
                (!r.ok && r.waLink ? '<a class="btn btn-outline btn-sm" href="' + ui.attr(r.waLink) + '" target="_blank" rel="noopener">Buka WA</a>' : '') +
              '</div>';
            }).join('');
          ui.modal({ title: 'Laporan WhatsApp', size: 'md', body: body, footer: '<button type="button" class="btn btn-primary" data-close>Tutup</button>', onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; } });
        }
      }
    };
  };

  /* =====================================================
     GAJI PENGAJAR
     ===================================================== */
  V.gaji = async function (ctx) {
    var periode = periodParam(ctx);
    var res = await Promise.all([call('gaji.list', { periode: periode }), call('settings.get')]);
    var data = res[0];
    var settings = res[1];
    var rows = data.salaries || [];
    var periods = data.periods && data.periods.length ? data.periods : [periode];

    function lpmbLabel(status) {
      if (status === 'menunggu_acc') return 'Menunggu ACC';
      if (status === 'ditolak') return 'Ditolak';
      if (!status || status === 'belum') return 'Belum ACC';
      return status;
    }
    function salaryState(s) {
      var detail = s.rincian || { approved: [], pending: [] };
      var approved = detail.approved || [];
      var pending = detail.pending || [];
      var menunggu = s.menungguAcc != null ? Number(s.menungguAcc) : pending.length;
      return {
        approved: approved,
        pending: pending,
        menunggu: menunggu,
        bisaFinal: s.status === 'dibayar' || (approved.length > 0 && s.bisaBayar !== false)
      };
    }
    function childLine(it, ok, tarif) {
      var subtotal = it.subtotal != null ? Number(it.subtotal) : Number(it.sesiHadir || 0) * Number(it.tarif || tarif || 0);
      return '<div class="rincian-row' + (ok ? '' : ' is-pending') + '">' + S.photo(it.anakFoto, it.anakNama, 'sm') +
        '<div class="rr-main"><b>' + ui.esc(it.anakNama || 'Anak') + '</b><span>' + ui.esc(it.paketNama || 'Paket belajar') + ' · ' +
          (ok ? Number(it.sesiHadir || 0) + ' sesi hadir' : 'LPMB ' + lpmbLabel(it.lpmbStatus)) + '</span></div>' +
        '<div class="rr-end">' + (ok ? '<b class="money">' + ui.rupiah(subtotal) + '</b>' : ui.badge(lpmbLabel(it.lpmbStatus), 'amber')) + '</div></div>';
    }

    var html = ui.pageHead({
      eyebrow: 'Keuangan',
      title: 'Gaji pengajar',
      subtitle: 'Honor dihitung dari sesi hadir anak yang LPMB-nya sudah di-ACC admin. Setiap anak yang sudah ACC langsung dapat dicetak dan dibayar tanpa menunggu anak lainnya.',
      actions: '<button type="button" class="btn btn-primary" id="salaryGenerate">' + ui.icon('refresh', 15) + ' Generate dari absensi</button>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('users', 'Slip periode ini', String(data.summary.count), { hint: 'pengajar dengan sesi hadir' }) +
      ui.stat('banknote', 'Total honor', ui.rupiah(data.summary.total), { tone: 'blue' }) +
      ui.stat('checkCircle', 'Sudah dibayar', ui.rupiah(data.summary.dibayar), { tone: 'dark' }) +
      ui.stat('wallet', 'Belum dibayar', ui.rupiah(data.summary.belum), { tone: data.summary.belum ? 'amber' : '' }) +
    '</div>';

    html += '<div class="card mt-16"><div class="card-body">' +
      '<div class="data-toolbar"><div class="filter-row"><select class="select" id="salaryPeriod">' +
        periods.map(function (p) { return '<option value="' + ui.attr(p) + '"' + (p === periode ? ' selected' : '') + '>' + ui.esc(ui.periodeLabel(p)) + '</option>'; }).join('') +
      '</select></div><span class="small text-muted">Sesi anak dengan LPMB disetujui langsung masuk slip. Anak lain menyusul di slip tambahan setelah ACC.</span></div>' +
      (rows.length ? '<div class="grid grid-3">' + rows.map(function (s) {
        var stt = salaryState(s);
        var statusHtml = s.status === 'dibayar' ? ui.statusBadge('dibayar')
          : (stt.approved.length ? ui.badge('Siap dibayar', 'green')
            : (stt.menunggu ? ui.badge('Menunggu ACC LPMB', 'amber') : ui.statusBadge('belum')));
        return '<div class="slip-card"><div class="slip-top"><div class="person-cell">' + S.photo(s.pengajarFoto, s.pengajarNama, 'sm') + '<div class="pc-info"><b>' + ui.esc(s.pengajarNama) + '</b><span>' + ui.esc(s.periodeLabel) + '</span></div></div>' + statusHtml + '</div>' +
          '<div class="slip-no">' + ui.esc(s.slipNo || '—') + '</div>' +
          '<div class="slip-amount">' + ui.rupiah(s.total) + '</div>' +
          '<div class="slip-lines"><div><span>Sesi hadir (ACC)</span><b>' + s.jumlahSesi + ' × ' + ui.rupiah(s.tarif) + '</b></div>' +
            '<div><span>Bonus</span><b>' + ui.rupiah(s.bonus) + '</b></div>' +
            '<div><span>Potongan</span><b>' + ui.rupiah(s.potongan) + '</b></div></div>' +
          (stt.approved.length || stt.pending.length ? '<details class="slip-rincian"><summary>' + ui.icon('child', 12) + ' Rincian ' + stt.approved.length + ' anak' + (stt.pending.length ? ' · ' + stt.pending.length + ' belum ACC' : '') + '</summary><div class="rincian-rows">' +
            stt.approved.map(function (it) { return childLine(it, true, s.tarif); }).join('') +
            stt.pending.map(function (it) { return childLine(it, false, s.tarif); }).join('') +
          '</div></details>' : '') +
          '<div class="row mt-12" style="flex-wrap:wrap;gap:6px">' +
            '<button type="button" class="btn btn-outline btn-sm" data-slip-print="' + ui.attr(s.id) + '" title="Cetak atau simpan slip sebagai PDF"' + (stt.bisaFinal ? '' : ' disabled') + '>' + ui.icon('printer', 13) + ' Slip / PDF</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-slip-edit="' + ui.attr(s.id) + '">Edit</button>' +
            (s.status === 'dibayar' ? '<span class="badge badge-green">Dibayar ' + ui.esc(ui.tanggal(s.tanggalBayar, 'short')) + '</span>' :
              (stt.bisaFinal ? '<button type="button" class="btn btn-primary btn-sm" data-slip-paid="' + ui.attr(s.id) + '">Bayar</button>' :
                '<button type="button" class="btn btn-outline btn-sm" disabled title="Belum ada anak dengan LPMB yang di-ACC">' + ui.icon('clock', 13) + ' Menunggu ACC</button>')) +
          '</div>' +
          (stt.pending.length ? '<div class="note-box" style="margin-top:9px;font-size:10.5px">' + stt.pending.length + ' anak belum di-ACC dan belum dihitung di slip ini. Setelah LPMB disetujui, klik Generate lagi untuk membuat slip tambahan.</div>' : '') +
        '</div>';
      }).join('') + '</div>' : ui.empty('banknote', 'Belum ada slip gaji', 'Klik Generate dari absensi untuk membuat slip periode ini.', '<button class="btn btn-primary" id="emptyGenerate">Generate sekarang</button>')) +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        root.querySelector('#salaryPeriod').onchange = function () {
          BMK.app.navigate('#/admin/gaji?periode=' + encodeURIComponent(this.value), true);
        };
        var empty = root.querySelector('#emptyGenerate');
        if (empty) empty.onclick = generate;
        root.querySelector('#salaryGenerate').onclick = generate;
        function generate() {
          ui.confirm({
            title: 'Generate slip ' + ui.periodeLabel(periode) + '?',
            message: 'Sistem menghitung sesi hadir dari absensi anak yang LPMB-nya sudah disetujui admin. Setiap anak yang sudah ACC langsung dapat dibayar; anak yang belum ACC akan dibuatkan slip tambahan setelah disetujui.',
            confirmText: 'Generate'
          }).then(async function (yes) {
            if (!yes) return;
            try {
              var r = await call('gaji.generate', { periode: periode });
              ui.toast(r.created + ' slip dibuat, ' + r.updated + ' diperbarui, ' + r.skipped + ' dilewati.' + (r.pending ? ' ' + r.pending + ' anak masih menunggu ACC dan belum dihitung.' : ''), 'success', 5500);
              ctx.refresh();
            } catch (err) { ui.toast(err.message, 'error', 5500); }
          });
        }
        root.addEventListener('click', function (e) {
          var print = e.target.closest('[data-slip-print]');
          if (print) {
            var ps = rows.filter(function (x) { return x.id === print.getAttribute('data-slip-print'); })[0];
            if (ps && !salaryState(ps).bisaFinal) { ui.toast('Slip belum bisa dicetak. Belum ada anak dengan LPMB yang di-ACC pada slip ini.', 'info', 4500); return; }
            printSlip(ps);
            return;
          }
          var edit = e.target.closest('[data-slip-edit]');
          if (edit) { openEdit(rows.filter(function (x) { return x.id === edit.getAttribute('data-slip-edit'); })[0]); return; }
          var paid = e.target.closest('[data-slip-paid]');
          if (paid) {
            var s = rows.filter(function (x) { return x.id === paid.getAttribute('data-slip-paid'); })[0];
            if (!s) return;
            if (!salaryState(s).bisaFinal) { ui.toast('Gaji belum dapat dibayarkan. Belum ada anak dengan LPMB yang di-ACC pada slip ini.', 'error', 5000); return; }
            ui.confirm({
              title: 'Tandai slip dibayar?',
              message: 'Honor ' + s.pengajarNama + ' sebesar ' + ui.rupiah(s.total) + ' untuk ' + ui.periodeLabel(s.periode) + '.',
              confirmText: 'Sudah dibayar'
            }).then(async function (yes) {
              if (!yes) return;
              try {
                await call('gaji.markPaid', { id: s.id });
                ui.toast('Slip ditandai dibayar.', 'success');
                ctx.refresh();
              } catch (err) { ui.toast(err.message, 'error'); }
            });
          }
        });

        function openEdit(s) {
          if (!s) return;
          ui.modal({
            title: 'Edit slip gaji',
            subtitle: s.pengajarNama + ' · ' + ui.periodeLabel(s.periode),
            size: 'md',
            body: '<form id="slipForm"><div class="form-grid">' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Jumlah sesi</label><input class="input" type="number" min="0" name="jumlahSesi" value="' + s.jumlahSesi + '" /></div>' +
                '<div class="field"><label>Tarif per sesi</label><input class="input" type="number" min="0" name="tarif" value="' + s.tarif + '" /></div>' +
              '</div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Bonus (Rp)</label><input class="input" type="number" min="0" name="bonus" value="' + s.bonus + '" /></div>' +
                '<div class="field"><label>Potongan (Rp)</label><input class="input" type="number" min="0" name="potongan" value="' + s.potongan + '" /></div>' +
              '</div>' +
              '<div class="field"><label>Catatan</label><textarea class="textarea" name="catatan">' + ui.esc(s.catatan || '') + '</textarea></div>' +
              '<div class="note-box">Total dihitung otomatis: (sesi × tarif) + bonus − potongan. Klik Generate ulang agar sesi mengikuti LPMB yang sudah di-ACC.</div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="slipSave">Simpan</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#slipForm');
              el.querySelector('#slipSave').onclick = async function () {
                var d = ui.serialize(form);
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('gaji.update', { id: s.id, jumlahSesi: d.jumlahSesi, tarif: d.tarif, bonus: d.bonus, potongan: d.potongan, catatan: d.catatan });
                  close();
                  ui.toast('Slip gaji diperbarui.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }

        function printSlip(s) {
          if (!s) return;
          var b = settings.bimbel || {};
          var adminTtd = settings.settings && settings.settings.ttdAdminUrl || '';
          var stt = salaryState(s);
          var rincianHtml = (stt.approved.length || stt.pending.length)
            ? '<div class="slip-subhead">Rincian anak yang diajar</div>' +
              '<table class="slip-table"><thead><tr><th>Anak</th><th>Paket</th><th style="width:70px;text-align:center">Sesi hadir</th><th style="width:110px;text-align:right">Subtotal</th></tr></thead><tbody>' +
                stt.approved.map(function (it) {
                  var subtotal = it.subtotal != null ? Number(it.subtotal) : Number(it.sesiHadir || 0) * Number(it.tarif || s.tarif || 0);
                  return '<tr><td>' + ui.esc(it.anakNama || 'Anak') + '</td><td>' + ui.esc(it.paketNama || 'Paket belajar') + '</td>' +
                    '<td class="num" style="text-align:center">' + Number(it.sesiHadir || 0) + '</td><td class="num">' + ui.rupiah(subtotal) + '</td></tr>';
                }).join('') +
              '</tbody></table>' +
              (stt.pending.length ? '<div class="slip-note">Belum dihitung (LPMB belum di-ACC): ' + ui.esc(stt.pending.map(function (it) { return it.anakNama || 'Anak'; }).join(', ')) + '.</div>' : '')
            : '';
          var html = '<div class="slip-doc">' +
            '<div class="slip-head"><div class="slip-brand">' +
              '<div class="rapor-logo">' + (b.logoUrl ? '<img src="' + ui.attr(b.logoUrl) + '" alt="Logo" />' : '<img src="' + CONFIG.LOGO_URL + '" alt="Logo Bimba" />') + '</div>' +
              '<div><h1>' + ui.esc(b.nama || 'Bimba Mahatari Kecil') + '</h1><p>' + ui.esc(b.alamat || '') + '</p><p>' + ui.esc(b.phone || '') + '</p></div>' +
            '</div><div class="slip-title"><h2>Slip Gaji</h2><p>No. ' + ui.esc(s.slipNo || '—') + '</p><p>Periode ' + ui.esc(ui.periodeLabel(s.periode)) + '</p></div></div>' +
            '<div class="slip-meta">' +
              '<div><span>Nama pengajar</span><b>' + ui.esc(s.pengajarNama) + '</b></div>' +
              '<div><span>Spesialisasi</span><b>' + ui.esc(s.spesialisasi || '—') + '</b></div>' +
              '<div><span>Jumlah sesi hadir</span><b>' + s.jumlahSesi + ' sesi</b></div>' +
              '<div><span>Tarif per sesi</span><b>' + ui.rupiah(s.tarif) + '</b></div>' +
            '</div>' +
            '<table class="slip-table"><thead><tr><th>Komponen</th><th>Keterangan</th><th style="text-align:right">Jumlah</th></tr></thead><tbody>' +
              '<tr><td>Honor mengajar</td><td>' + s.jumlahSesi + ' sesi × ' + ui.rupiah(s.tarif) + '</td><td class="num">' + ui.rupiah(s.jumlahSesi * s.tarif) + '</td></tr>' +
              '<tr><td>Bonus</td><td>' + ui.esc(s.catatan || '—') + '</td><td class="num">' + ui.rupiah(s.bonus) + '</td></tr>' +
              '<tr><td>Potongan</td><td>—</td><td class="num">-' + ui.rupiah(s.potongan) + '</td></tr>' +
            '</tbody></table>' +
            rincianHtml +
            '<div class="slip-total"><div class="slip-total-inner"><span>Total diterima</span><b>' + ui.rupiah(s.total) + '</b></div></div>' +
            '<div class="slip-sign">' +
              '<div><div class="sign-space">' + (adminTtd ? '<img src="' + ui.attr(adminTtd) + '" alt="Admin" />' : '') + '</div><div class="sign-name">Admin Bimba</div></div>' +
              '<div><div class="sign-space">' + (s.status === 'dibayar' ? '<span style="font-size:8pt">Dibayar ' + ui.esc(ui.tanggal(s.tanggalBayar)) + '</span>' : '') + '</div><div class="sign-name">' + ui.esc(s.pengajarNama) + '</div></div>' +
            '</div>' +
            '<div class="slip-note">Slip ini dibuat otomatis oleh sistem Bimba Mahatari Kecil. Status: ' + (s.status === 'dibayar' ? 'Sudah dibayar' : 'Belum dibayar') + '.</div>' +
          '</div>';
          ui.printHTML(html);
        }
      }
    };
  };

  /* =====================================================
     PENGATURAN
     ===================================================== */
  V.pengaturan = async function (ctx) {
    var res = await Promise.all([call('settings.get'), call('users.list')]);
    var data = res[0];
    var usersData = res[1];
    var st = data.settings;
    var wa = data.wa;

    var html = ui.pageHead({
      eyebrow: 'Sistem',
      title: 'Pengaturan',
      subtitle: 'Profil Bimba, WhatsApp Fonnte, tagihan, dan seluruh akun pengguna.',
      actions: '<a class="btn btn-outline" href="' + ui.attr(data.spreadsheetUrl) + '" target="_blank" rel="noopener">' + ui.icon('external', 15) + ' Buka Spreadsheet</a>'
    });
    if (data.defaultPasswordWarning) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('shield', 16) + '<span>Kata sandi admin masih <b>admin123</b>. Ganti melalui tombol edit pada akun admin di tabel bawah.</span></div>';
    }

    html += '<div class="grid grid-main-aside"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Profil Bimba</h2><p>Informasi ini tampil di halaman publik, rapor, dan slip gaji.</p></div></div><div class="card-body">' +
        '<form id="bimbelForm"><div class="form-grid">' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Nama Bimba <span class="req">*</span></label><input class="input" name="bimbelNama" value="' + ui.attr(st.bimbelNama) + '" /></div>' +
            '<div class="field"><label>Tagline</label><input class="input" name="bimbelTagline" value="' + ui.attr(st.bimbelTagline) + '" /></div>' +
          '</div>' +
          '<div class="field"><label>Alamat</label><input class="input" name="bimbelAlamat" value="' + ui.attr(st.bimbelAlamat) + '" placeholder="Alamat lengkap Bimba" /></div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Telepon / WhatsApp Bimba</label><input class="input" name="bimbelPhone" value="' + ui.attr(st.bimbelPhone) + '" /></div>' +
            '<div class="field"><label>Email</label><input class="input" type="email" name="bimbelEmail" value="' + ui.attr(st.bimbelEmail) + '" /></div>' +
          '</div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Jam operasional</label><input class="input" name="jamOperasional" value="' + ui.attr(st.jamOperasional) + '" /></div>' +
            '<div class="field"><label>Tahun ajaran</label><input class="input" name="tahunAjaran" value="' + ui.attr(st.tahunAjaran) + '" placeholder="2026/2027" /></div>' +
          '</div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Rekening pembayaran</label><textarea class="textarea" name="rekening" placeholder="BCA 1234567890 a.n. ...">' + ui.esc(st.rekening) + '</textarea></div>' +
            '<div class="field"><label>WhatsApp admin (publik)</label><input class="input" name="waAdmin" value="' + ui.attr(st.waAdmin) + '" placeholder="08xxxxxxxxxx" /></div>' +
          '</div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Jatuh tempo tagihan (tanggal)</label><input class="input" type="number" min="1" max="28" name="jatuhTempoHari" value="' + ui.attr(st.jatuhTempoHari) + '" /><div class="hint">Tanggal jatuh tempo tiap bulan (1–28).</div></div>' +
            '<div class="field"><label>URL aplikasi (untuk pesan WhatsApp)</label><input class="input" name="appUrl" value="' + ui.attr(st.appUrl) + '" placeholder="https://username.github.io/bimba-mahatari/" /></div>' +
          '</div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Logo Bimba</label>' + S.uploadTile('bimbelLogo', { existing: st.logoUrl, icon: 'image', title: 'Unggah logo', hint: 'PNG/JPG, disarankan persegi' }) + '</div>' +
            '<div class="field"><label>Tanda tangan admin</label>' + S.uploadTile('bimbelTtd', { existing: st.ttdAdminUrl, icon: 'pencil', title: 'Unggah tanda tangan', hint: 'Latar putih, JPG/PNG' }) + '</div>' +
          '</div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary" id="bimbelSave">' + ui.icon('check', 15) + ' Simpan pengaturan</button></div>' +
        '</div></form>' +
      '</div></section>' +

      '<section class="card"><div class="card-head"><div><h2>Akun pengguna</h2><p>Admin, pengajar, dan orang tua terhubung ke Google Sheets.</p></div><button type="button" class="btn btn-outline btn-sm" id="addUser">' + ui.icon('userPlus', 14) + ' Tambah akun</button></div><div class="card-body">' +
        '<div class="table-wrap"><table class="data-table users-table"><thead><tr><th>Akun</th><th>Peran</th><th>Kontak</th><th>Status</th><th>Terakhir masuk</th><th></th></tr></thead><tbody id="userRows"></tbody></table></div>' +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>WhatsApp Fonnte</h2><p>Pengiriman laporan biaya dan notifikasi.</p></div>' + (wa.configured ? '<span class="badge badge-green">Terhubung</span>' : '<span class="badge badge-gray">Belum</span>') + '</div><div class="card-body">' +
        '<form id="waForm"><div class="form-grid">' +
          '<div class="field"><label>Token Fonnte</label><input class="input" type="password" name="token" placeholder="' + (wa.configured ? 'Token tersimpan: ' + ui.attr(wa.masked) : 'Masukkan token perangkat Fonnte') + '" autocomplete="off" /><div class="hint">Token disimpan di Script Properties, bukan di spreadsheet.</div></div>' +
          '<label class="switch"><input type="checkbox" name="enabled" ' + (wa.enabled ? 'checked' : '') + '><span class="track"></span> Aktifkan pengiriman WhatsApp</label>' +
          '<div class="field"><label>Nomor uji</label><input class="input" name="testPhone" value="' + ui.attr(ctx.user.phone) + '" placeholder="08xxxxxxxxxx" /></div>' +
          '<div class="row" style="flex-wrap:wrap"><button type="submit" class="btn btn-primary" id="waSave">Simpan</button><button type="button" class="btn btn-outline" id="waTest">' + ui.icon('send', 14) + ' Kirim uji</button></div>' +
          '<div class="note-box">Belum punya token? Daftar di <a href="https://fonnte.com" target="_blank" rel="noopener" class="bold">fonnte.com</a>, hubungkan perangkat WhatsApp, lalu salin token ke kolom di atas.</div>' +
        '</div></form>' +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Informasi sistem</h2></div></div><div class="card-body">' +
        '<div class="info-list"><div class="info-item"><div class="ii-label">Database</div><div class="ii-value"><a href="' + ui.attr(data.spreadsheetUrl) + '" target="_blank" rel="noopener">Google Sheets</a></div></div>' +
        '<div class="info-item"><div class="ii-label">Frontend</div><div class="ii-value">GitHub Pages</div></div>' +
        '<div class="info-item"><div class="ii-label">Total akun</div><div class="ii-value">' + usersData.users.length + ' akun</div></div></div>' +
        '<div class="alert alert-info mt-16">' + ui.icon('shield', 16) + '<span>Gunakan kata sandi kuat dan unik. Sesi aktif berlaku 7 hari. Menonaktifkan akun langsung mengakhiri sesinya.</span></div>' +
      '</div></section>' +
    '</div></div>';

    return {
      html: html,
      mount: async function (root) {
        /* ---- profil bimbel ---- */
        var bimbelForm = root.querySelector('#bimbelForm');
        bimbelForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          var d = ui.serialize(bimbelForm);
          if (!d.bimbelNama) { ui.fieldError(bimbelForm, 'bimbelNama', 'Nama Bimba wajib diisi.'); return; }
          var btn = root.querySelector('#bimbelSave');
          ui.busy(btn, true, 'Menyimpan…');
          try {
            await call('settings.saveBimbel', {
              bimbelNama: d.bimbelNama, bimbelTagline: d.bimbelTagline, bimbelAlamat: d.bimbelAlamat,
              bimbelPhone: d.bimbelPhone, bimbelEmail: d.bimbelEmail, jamOperasional: d.jamOperasional,
              rekening: d.rekening, waAdmin: d.waAdmin, tahunAjaran: d.tahunAjaran, appUrl: d.appUrl,
              jatuhTempoHari: d.jatuhTempoHari,
              logo: await S.uploadValue('bimbelLogo', st.logoUrl),
              ttdAdmin: await S.uploadValue('bimbelTtd', st.ttdAdminUrl)
            });
            ui.toast('Pengaturan Bimba disimpan.', 'success');
            ctx.refresh();
          } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
        });

        /* ---- WhatsApp ---- */
        var waForm = root.querySelector('#waForm');
        waForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          var d = ui.serialize(waForm);
          var btn = root.querySelector('#waSave');
          ui.busy(btn, true, 'Menyimpan…');
          try {
            await call('settings.saveWa', { token: d.token, enabled: d.enabled });
            ui.toast('Pengaturan WhatsApp disimpan.', 'success');
            ctx.refresh();
          } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5000); }
        });
        root.querySelector('#waTest').onclick = async function () {
          var phone = waForm.querySelector('[name="testPhone"]').value;
          if (!phone) { ui.toast('Isi nomor WhatsApp tujuan uji.', 'error'); return; }
          var btn = this;
          ui.busy(btn, true, 'Mengirim…');
          try {
            await call('settings.testWa', { phone: phone });
            ui.toast('Pesan uji berhasil dikirim.', 'success', 5000);
          } catch (err) { ui.toast(err.message, 'error', 6000); }
          ui.busy(btn, false);
        };

        /* ---- akun ---- */
        var users = usersData.users;
        var userRows = root.querySelector('#userRows');
        function drawUsers() {
          userRows.innerHTML = users.map(function (u) {
            var self = u.id === ctx.user.id;
            return '<tr><td><div class="person-cell">' + ui.avatar(u.nama, u.fotoUrl, 'sm', 'sun') +
              '<div class="pc-info"><b>' + ui.esc(u.nama) + (self ? ' <span class="badge badge-teal">Anda</span>' : '') + '</b><span>@' + ui.esc(u.username) + (u.childNames ? ' · ' + ui.esc(u.childNames) : '') + '</span>' +
              '<span class="user-mobile-meta">' + ui.roleLabel(u.role) + ' · ' + ui.statusBadge(u.status) + '</span></div></div></td>' +
              '<td>' + ui.roleLabel(u.role) + '</td>' +
              '<td>' + ui.esc(u.phone || '—') + '<span class="cell-sub">' + ui.esc(u.email || '') + '</span></td>' +
              '<td>' + ui.statusBadge(u.status) + '</td>' +
              '<td>' + ui.esc(u.lastLogin ? ui.tanggalWaktu(u.lastLogin) : 'Belum pernah') + '</td>' +
              '<td><div class="cell-actions">' +
                '<button type="button" class="icon-btn" data-user-edit="' + ui.attr(u.id) + '" title="Edit">' + ui.icon('pencil', 15) + '</button>' +
                '<button type="button" class="icon-btn" data-user-reset="' + ui.attr(u.id) + '" title="Reset kata sandi">' + ui.icon('key', 15) + '</button>' +
                (!self ? '<button type="button" class="icon-btn" data-user-toggle="' + ui.attr(u.id) + '" data-status="' + ui.attr(u.status) + '" title="' + (u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '">' + ui.icon('shield', 15) + '</button>' : '') +
              '</div></td></tr>';
          }).join('');
        }
        drawUsers();
        root.querySelector('#addUser').onclick = function () { openUser(null); };
        root.addEventListener('click', function (e) {
          var edit = e.target.closest('[data-user-edit]');
          if (edit) { openUser(users.filter(function (x) { return x.id === edit.getAttribute('data-user-edit'); })[0]); return; }
          var reset = e.target.closest('[data-user-reset]');
          if (reset) { resetPassword(reset.getAttribute('data-user-reset')); return; }
          var toggle = e.target.closest('[data-user-toggle]');
          if (toggle) {
            var next = toggle.getAttribute('data-status') === 'aktif' ? 'nonaktif' : 'aktif';
            ui.confirm({
              title: (next === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan') + ' akun?',
              message: next === 'nonaktif' ? 'Pengguna tidak bisa masuk sampai diaktifkan kembali.' : 'Pengguna dapat kembali masuk ke aplikasi.',
              confirmText: next === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan',
              tone: next === 'nonaktif' ? 'danger' : ''
            }).then(async function (yes) {
              if (!yes) return;
              try {
                await call('users.setActive', { id: toggle.getAttribute('data-user-toggle'), status: next });
                ui.toast('Status akun diperbarui.', 'success');
                ctx.refresh();
              } catch (err) { ui.toast(err.message, 'error'); }
            });
          }
        });

        function openUser(u) {
          var isEdit = !!u;
          ui.modal({
            title: isEdit ? 'Edit akun' : 'Tambah akun',
            subtitle: isEdit ? '@' + u.username : 'Akun baru untuk admin, pengajar, atau orang tua',
            size: 'lg',
            body: '<form id="userForm"><div class="form-grid">' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Peran <span class="req">*</span></label>' + (isEdit
                  ? '<input class="input" value="' + ui.attr(ui.roleLabel(u.role)) + '" disabled />'
                  : '<select class="select" name="role"><option value="ortu">Orang Tua</option><option value="guru">Pengajar</option><option value="admin">Admin</option></select>') + '</div>' +
                '<div class="field"><label>Status</label><select class="select" name="status"><option value="aktif"' + (!u || u.status === 'aktif' ? ' selected' : '') + '>Aktif</option><option value="nonaktif"' + (u && u.status === 'nonaktif' ? ' selected' : '') + '>Nonaktif</option></select></div>' +
              '</div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(u ? u.nama : '') + '" /></div>' +
                '<div class="field"><label>Username <span class="req">*</span></label><input class="input" name="username" value="' + ui.attr(u ? u.username : '') + '" placeholder="4–20 karakter" autocomplete="off" /></div>' +
              '</div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>WhatsApp</label><input class="input" name="phone" value="' + ui.attr(u ? u.phone : '') + '" placeholder="08xxxxxxxxxx" /></div>' +
                '<div class="field"><label>Email</label><input class="input" type="email" name="email" value="' + ui.attr(u ? u.email : '') + '" /></div>' +
              '</div>' +
              '<div class="field"><label>Kata sandi ' + (isEdit ? '<span class="text-soft">(kosongkan bila tidak diubah)</span>' : '<span class="req">*</span>') + '</label><input class="input" type="text" name="password" placeholder="minimal 6 karakter" autocomplete="new-password" /></div>' +
              '<div class="field"><label>Alamat</label><textarea class="textarea" name="alamat">' + ui.esc(u ? u.alamat : '') + '</textarea></div>' +
              '<div class="field"><label>Foto profil</label>' + S.uploadTile('userPhoto', { existing: u ? u.fotoUrl : '', title: 'Unggah foto', hint: 'JPG/PNG' }) + '</div>' +
              (!isEdit && true ? '<div class="note-box">Akun pengajar otomatis mendapat data pengajar. Lengkapi tarif per sesi di menu Data Pengajar.</div>' : '') +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="userSave">Simpan akun</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#userForm');
              el.querySelector('#userSave').onclick = async function () {
                ui.clearErrors(form);
                var d = ui.serialize(form);
                if (!d.nama) { ui.fieldError(form, 'nama', 'Nama wajib diisi.'); return; }
                if (!d.username) { ui.fieldError(form, 'username', 'Username wajib diisi.'); return; }
                if (!isEdit && (!d.password || d.password.length < 6)) { ui.fieldError(form, 'password', 'Kata sandi minimal 6 karakter.'); return; }
                var btn = this;
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  await call('users.save', {
                    id: isEdit ? u.id : '',
                    role: isEdit ? u.role : d.role,
                    nama: d.nama, username: d.username, phone: d.phone, email: d.email,
                    password: d.password, status: d.status, alamat: d.alamat,
                    foto: await S.uploadValue('userPhoto', u ? u.fotoUrl : '')
                  });
                  close();
                  ui.toast(isEdit ? 'Akun diperbarui.' : 'Akun baru dibuat.', 'success');
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
              };
            }
          });
        }

        function resetPassword(userId) {
          var u = users.filter(function (x) { return x.id === userId; })[0];
          ui.confirm({
            title: 'Reset kata sandi',
            message: 'Buat kata sandi baru untuk ' + (u ? u.nama : 'akun ini') + '?',
            confirmText: 'Buat kata sandi'
          }).then(async function (yes) {
            if (!yes) return;
            try {
              var r = await call('users.resetPassword', { id: userId });
              ui.modal({
                title: 'Kata sandi baru',
                size: 'sm',
                body: '<p class="confirm-text">Kata sandi untuk <b>' + ui.esc(r.nama) + '</b> (@' + ui.esc(r.username) + '):</p>' +
                  '<div class="note-box mt-12" style="font-size:18px;font-weight:800;letter-spacing:.08em;text-align:center">' + ui.esc(r.password) + '</div>' +
                  '<p class="small text-muted mt-12">Salin dan kirimkan sekarang. Kata sandi tidak dapat dilihat lagi.</p>',
                footer: '<button type="button" class="btn btn-outline" id="copyPwd">' + ui.icon('file', 14) + ' Salin</button><button type="button" class="btn btn-primary" data-close>Tutup</button>',
                onMount: function (el, close) {
                  el.querySelector('[data-close]').onclick = close;
                  el.querySelector('#copyPwd').onclick = function () { ui.copy(r.password); };
                }
              });
            } catch (err) { ui.toast(err.message, 'error'); }
          });
        }
      }
    };
  };

  BMK.adminExtras = {
    avgScore: avgScore,
    firstName: firstName
  };
})();
