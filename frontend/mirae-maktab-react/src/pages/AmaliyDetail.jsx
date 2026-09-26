import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { getPracticalById, SUBJECT_BY_ID } from '../data/mock.js';

const STATUS = {
  not_started: { label: 'Boshlanmagan', fg: 'var(--sub)', bg: 'var(--chip)' },
  in_progress: { label: 'Jarayonda', fg: '#DB8A17', bg: 'rgba(245,165,36,.16)' },
  submitted: { label: 'Topshirilgan', fg: '#2F6FED', bg: 'rgba(47,111,237,.12)' },
  checked: { label: 'Baholangan', fg: '#17A673', bg: 'rgba(23,166,115,.12)' },
};

export default function AmaliyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const task = useMemo(() => getPracticalById(id), [id]);
  const fileRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [preview, setPreview] = useState(null);
  const [sent, setSent] = useState(false);

  if (!task) {
    return (
      <div style={sx('padding:26px 30px')}>
        <PageHeader title="Amaliy mashg'ulot" subtitle="Topshiriq topilmadi" />
        <Link to="/vazifalar" style={sx('color:#3D7DF6;font-weight:700')}>← Vazifalarga qaytish</Link>
      </div>
    );
  }

  const sub = SUBJECT_BY_ID[task.subjectId];
  const st = STATUS[task.status] || STATUS.not_started;
  const canUpload = task.status !== 'checked';

  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    const next = files.map((f, i) => ({
      id: `u-${Date.now()}-${i}`,
      name: f.name,
      size: f.size < 1024 * 1024 ? `${Math.round(f.size / 1024)} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      type: f.type.startsWith('image/') ? 'image' : 'file',
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      file: f,
    }));
    setUploads((prev) => [...prev, ...next].slice(0, 10));
    e.target.value = '';
  };

  const removeUp = (uid) => setUploads((prev) => prev.filter((u) => u.id !== uid));

  const submit = () => {
    if (!uploads.length) {
      alert('Kamida bitta fayl yuklang');
      return;
    }
    try {
      const key = 'mirae-feedback-history';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = {
        id: `fb-am-${Date.now()}`,
        type: 'amaliy',
        title: task.title || task.topic || 'Amaliy mashg‘ulot',
        pct: null,
        note: 'Fayllar yuborildi — o‘qituvchi baholashi kutilmoqda',
        at: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 40)));
    } catch { /* ignore */ }
    setSent(true);
    setTimeout(() => navigate('/vazifalar'), 900);
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <button type="button" onClick={() => navigate('/vazifalar')} style={sx('display:inline-flex;align-items:center;gap:6px;margin-bottom:14px;border:none;background:none;cursor:pointer;color:#3D7DF6;font-weight:700;font-size:13px;padding:0')}>
        <Icon name="chevronLeft" size={16} color="#3D7DF6" /> Vazifalar
      </button>

      <PageHeader
        title={task.title}
        subtitle={`${sub?.name || ''} · ${task.topic} · ${task.xp} XP`}
        right={
          <span style={sx(`font-size:12px;font-weight:800;padding:6px 12px;border-radius:99px;color:${st.fg};background:${st.bg}`)}>{st.label}</span>
        }
      />

      {sent && (
        <div style={sx('margin-bottom:16px;padding:14px 16px;border-radius:14px;background:rgba(23,166,115,.1);border:1px solid rgba(23,166,115,.25);color:#17A673;font-size:13.5px;font-weight:700;line-height:1.45')}>
          Amaliy topshirildi. O‘qituvchi tekshirgach baho va XP keladi.
          <button type="button" onClick={() => navigate('/feedback-tarix')} style={sx('display:block;margin-top:8px;background:none;border:none;color:#3D7DF6;font-weight:800;cursor:pointer;padding:0')}>Feedback tarixi →</button>
        </div>
      )}
      <div style={sx('display:grid;grid-template-columns:1.2fr .9fr;gap:18px')} className="hero-row">
        {/* Statement */}
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px')}>
          <div style={sx('font-weight:800;font-size:15px;color:var(--tx);margin-bottom:12px')}>Topshiriq sharti</div>
          <div
            style={sx('font-size:14px;line-height:1.65;color:var(--tx)')}
            dangerouslySetInnerHTML={{ __html: task.statementHtml || '<p>Shart mavjud emas.</p>' }}
          />
          {task.keywords?.length > 0 && (
            <div style={sx('display:flex;gap:8px;flex-wrap:wrap;margin-top:16px')}>
              {task.keywords.map((k) => (
                <span key={k} style={sx('font-size:11.5px;font-weight:700;padding:5px 10px;border-radius:99px;background:var(--soft);color:var(--sub);border:1px solid var(--bd)')}>{k}</span>
              ))}
            </div>
          )}
          <div style={sx('margin-top:16px;font-size:12.5px;color:var(--sub)')}>
            Muddat: {new Date(task.deadline).toLocaleString('uz-UZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            {task.score != null && <> · Bahosi: <b style={sx('color:#17A673')}>{task.score}%</b></>}
          </div>
        </div>

        {/* Teacher files */}
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px')}>
          <div style={sx('font-weight:800;font-size:15px;color:var(--tx);margin-bottom:12px')}>O&apos;qituvchi materiallari</div>
          {(!task.teacherFiles || task.teacherFiles.length === 0) && (
            <div style={sx('font-size:13px;color:var(--sub);padding:12px 0')}>Biriktirilgan fayl yo&apos;q.</div>
          )}
          <div style={sx('display:flex;flex-direction:column;gap:10px')}>
            {(task.teacherFiles || []).map((f) => (
              <div key={f.id} style={sx('display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--bd);border-radius:14px;background:var(--soft)')}>
                <div style={sx('width:40px;height:40px;border-radius:11px;background:rgba(61,125,246,.12);display:flex;align-items:center;justify-content:center;flex:none')}>
                  <Icon name={f.type === 'image' ? 'image' : 'file'} size={18} color="#3D7DF6" />
                </div>
                <div style={sx('flex:1;min-width:0')}>
                  <div style={sx('font-size:13.5px;font-weight:700;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{f.name}</div>
                  <div style={sx('font-size:11.5px;color:var(--sub)')}>{f.size}</div>
                </div>
                {f.type === 'image' && f.url && f.url !== '#' && (
                  <button type="button" onClick={() => setPreview(f)} style={sx('padding:8px 10px;border-radius:10px;border:1px solid var(--bd);background:var(--card);cursor:pointer;font-size:12px;font-weight:700;color:var(--tx)')}>
                    Ko&apos;rish
                  </button>
                )}
                <a href={f.url || '#'} download={f.name} style={sx('padding:8px 10px;border-radius:10px;border:none;background:#3D7DF6;color:#fff;font-size:12px;font-weight:700;text-decoration:none')}>
                  Yuklab olish
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px;margin-top:18px')}>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap')}>
          <div style={sx('font-weight:800;font-size:15px;color:var(--tx)')}>Javobingizni yuklang</div>
          <span style={sx('font-size:12px;color:var(--sub)')}>Rasm, PDF · max 10 fayl</span>
        </div>

        {!canUpload ? (
          <div style={sx('padding:16px;border-radius:14px;background:rgba(23,166,115,.1);color:#17A673;font-weight:700;font-size:13.5px')}>
            Bu topshiriq baholangan — qayta yuklash yopiq.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={sx('width:100%;padding:28px 16px;border-radius:16px;border:1.5px dashed rgba(61,125,246,.45);background:rgba(61,125,246,.06);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px')}
            >
              <Icon name="upload" size={28} color="#3D7DF6" />
              <span style={sx('font-weight:800;font-size:14px;color:var(--tx)')}>Fayl tanlash yoki kamera</span>
              <span style={sx('font-size:12.5px;color:var(--sub)')}>PNG, JPG, PDF</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={onPick} />

            {uploads.length > 0 && (
              <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:16px')}>
                {uploads.map((u) => (
                  <div key={u.id} style={sx('position:relative;border:1px solid var(--bd);border-radius:14px;overflow:hidden;background:var(--soft)')}>
                    {u.type === 'image' && u.url ? (
                      <img src={u.url} alt={u.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={sx('height:100px;display:flex;align-items:center;justify-content:center')}>
                        <Icon name="file" size={28} color="var(--sub)" />
                      </div>
                    )}
                    <div style={sx('padding:8px 10px')}>
                      <div style={sx('font-size:11.5px;font-weight:700;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{u.name}</div>
                      <div style={sx('font-size:10.5px;color:var(--sub)')}>{u.size}</div>
                    </div>
                    <button type="button" onClick={() => removeUp(u.id)} style={sx('position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:8px;border:none;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;font-weight:800')}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={sent}
              style={sx(`margin-top:18px;width:100%;padding:14px;border-radius:14px;border:none;font-weight:800;font-size:14.5px;cursor:pointer;background:${sent ? '#17A673' : '#3D7DF6'};color:#fff`)}
            >
              {sent ? 'Yuborildi ✓' : 'Yuborish'}
            </button>
          </>
        )}
      </div>

      {preview && (
        <div
          role="dialog"
          onClick={() => setPreview(null)}
          style={sx('position:fixed;inset:0;z-index:80;background:rgba(10,15,30,.72);display:flex;align-items:center;justify-content:center;padding:20px')}
        >
          <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border-radius:16px;padding:12px;max-width:min(720px,96vw);max-height:90vh;overflow:auto')}>
            <div style={sx('display:flex;justify-content:space-between;align-items:center;margin-bottom:10px')}>
              <b style={sx('color:var(--tx)')}>{preview.name}</b>
              <button type="button" onClick={() => setPreview(null)} style={sx('border:none;background:var(--soft);border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700')}>Yopish</button>
            </div>
            <img src={preview.url} alt={preview.name} style={{ width: '100%', borderRadius: 12 }} />
          </div>
        </div>
      )}
    </div>
  );
}
