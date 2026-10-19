import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp, Clapperboard, Download, FileVideo2, Film, ImagePlus, LoaderCircle, LockKeyhole, Menu, Play, RefreshCw, ShieldCheck, Sparkles, Upload, Video, WandSparkles, X } from 'lucide-react'
import './style.css'

const API = '/api'
const fmt = n => n < 1024*1024 ? `${Math.max(1, Math.round(n/1024))} KB` : `${(n/1024/1024).toFixed(1)} MB`
function App() {
  const [video, setVideo] = useState(null), [face, setFace] = useState(null)
  const [videoUrl, setVideoUrl] = useState(''), [faceUrl, setFaceUrl] = useState('')
  const [consent, setConsent] = useState(false), [status, setStatus] = useState('idle'), [job, setJob] = useState(null), [error, setError] = useState(''), [menu, setMenu] = useState(false)
  const [health, setHealth] = useState(null)
  const videoInput = useRef(null), faceInput = useRef(null)
  useEffect(() => { fetch(`${API}/health`).then(r=>r.json()).then(setHealth).catch(()=>setHealth({status:'offline', ai_configured:false})); }, [])
  useEffect(() => () => { if(videoUrl) URL.revokeObjectURL(videoUrl); if(faceUrl) URL.revokeObjectURL(faceUrl) }, [videoUrl, faceUrl])
  useEffect(() => {
    if (!job?.id || ['succeeded','failed','canceled'].includes(status)) return
    const timer = setInterval(async () => {
      try { const r = await fetch(`${API}/jobs/${job.id}`); const d = await r.json(); if (!r.ok) throw new Error(d.detail || 'មិនអាចពិនិត្យស្ថានភាពបានទេ'); setJob(d); setStatus(d.status); if (d.status === 'failed') setError(typeof d.error === 'string' ? d.error : 'AI មិនអាចបម្លែងវីដេអូនេះបានទេ។ សូមពិនិត្យ model input settings។') }
      catch(e) { setError(e.message) }
    }, 2500)
    return () => clearInterval(timer)
  }, [job?.id, status])
  const pick = (kind, file) => {
    if (!file) return
    setError(''); setStatus('idle'); setJob(null)
    if (kind === 'video') { if(videoUrl) URL.revokeObjectURL(videoUrl); setVideo(file); setVideoUrl(URL.createObjectURL(file)) }
    else { if(faceUrl) URL.revokeObjectURL(faceUrl); setFace(file); setFaceUrl(URL.createObjectURL(file)) }
  }
  const run = async () => {
    if (!video || !face) { setError('សូមបញ្ចូលទាំងវីដេអូ និងរូបថតមុខជាមុនសិន។'); return }
    if (!consent) { setError('សូមធីកការបញ្ជាក់អំពីសិទ្ធិប្រើប្រាស់ឯកសារ។'); return }
    setError(''); setStatus('starting'); setJob(null)
    const data = new FormData(); data.append('video', video); data.append('face_image', face); data.append('consent_confirmed', 'true')
    try { const r = await fetch(`${API}/jobs`, {method:'POST', body:data}); const d = await r.json(); if (!r.ok) throw new Error(d.detail || 'មានបញ្ហាក្នុងការចាប់ផ្តើម AI'); setJob(d); setStatus(d.status || 'starting') }
    catch(e) { setError(e.message); setStatus('idle') }
  }
  const outputUrl = typeof job?.output === 'string' ? job.output : Array.isArray(job?.output) ? job.output.find(x=>typeof x==='string') : null
  const busy = ['starting','processing','queued','running'].includes(status)
  const statusText = status === 'starting' || status === 'queued' ? 'កំពុងរៀបចំ...' : status === 'processing' || status === 'running' ? 'AI កំពុងបម្លែងមុខ...' : status === 'succeeded' ? 'បម្លែងបានជោគជ័យ' : 'រួចរាល់សម្រាប់បម្លែង'
  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar wrap">
      <a className="brand" href="#home" aria-label="FaceSwap AI Studio home"><span className="brand-icon"><WandSparkles size={22}/></span><span>FaceSwap <b>AI</b><small>STUDIO</small></span></a>
      <nav className={menu?'nav nav-open':'nav'}><a href="#how">របៀបប្រើ</a><a href="#studio">AI Studio</a><a href="#safety">សុវត្ថិភាព</a><a href="#faq">សំណួរ</a></nav>
      <div className="top-actions"><span className={'api-pill '+(health?.ai_configured?'connected':'') }><i/>{health?.ai_configured?'AI បានភ្ជាប់':'រង់ចាំការកំណត់ AI'}</span><button className="mobile-menu icon-btn" onClick={()=>setMenu(!menu)} aria-label="បើកម៉ឺនុយ">{menu?<X/>:<Menu/>}</button><a className="header-cta" href="#studio">ចាប់ផ្តើម <ArrowRight size={16}/></a></div>
    </header>
    <main id="home">
      <section className="hero wrap">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> AI VIDEO CREATION STUDIO</div><h1>មុខរបស់អ្នក។<br/><span>នៅក្នុងវីដេអូ</span><br/>បែបថ្មី។</h1><p className="hero-desc">បម្លែងវីដេអូរបស់អ្នកដោយប្រើ AI Face Swap។ បញ្ចូលវីដេអូ បន្ថែមរូបថតមុខ ហើយទុកឱ្យ AI ជួយធ្វើការងារ។</p><div className="hero-buttons"><a className="primary-btn" href="#studio"><WandSparkles size={18}/> សាកល្បង AI Studio <ArrowRight size={17}/></a><a className="secondary-btn" href="#how"><Play size={16}/> របៀបដំណើរការ</a></div><div className="trust-row"><span><ShieldCheck size={16}/> ឯកជនភាពជាចម្បង</span><span><LockKeyhole size={15}/> គ្រប់គ្រងឯកសាររបស់អ្នក</span></div></div>
        <div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="hero-glow"/><div className="art-card art-back"><div className="art-label"><span className="live-dot"/> ORIGINAL VIDEO</div><div className="portrait abstract-person"><div className="person-hair"/><div className="person-face"><div className="eye eye-l"/><div className="eye eye-r"/><div className="nose"/><div className="mouth"/></div><div className="person-neck"/><div className="person-body"/></div><div className="art-caption">វីដេអូដើម <Film size={16}/></div></div><div className="swap-arrow"><RefreshCw size={21}/></div><div className="art-card art-front"><div className="art-label"><Sparkles size={13}/> AI FACE SWAP</div><div className="portrait abstract-person portrait-two"><div className="person-hair"/><div className="person-face"><div className="eye eye-l"/><div className="eye eye-r"/><div className="nose"/><div className="mouth"/></div><div className="person-neck"/><div className="person-body"/></div><div className="art-caption">មុខថ្មី <CheckCircle2 size={16}/></div></div><div className="floating-chip chip-top"><span className="chip-icon"><Sparkles size={16}/></span><span><b>AI-powered</b><small>Face transformation</small></span></div><div className="floating-chip chip-bottom"><span className="pulse-icon"><Video size={17}/></span><span><b>Video ready</b><small>Upload & transform</small></span></div><div className="sparkle s1">✦</div><div className="sparkle s2">✧</div></div>
      </section>
      <section className="stats wrap"><div><b>01</b><span>បញ្ចូលវីដេអូ</span></div><div className="stat-line"/><div><b>02</b><span>បន្ថែមរូបថតមុខ</span></div><div className="stat-line"/><div><b>03</b><span>បម្លែងជាមួយ AI</span></div></section>
      <section className="studio-section wrap" id="studio"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR CREATIVE WORKSPACE</div><h2>AI Face Swap <span>Studio</span></h2><p>ចាប់ផ្ដើមដោយដាក់វីដេអូ និងរូបថតរបស់អ្នកនៅខាងក្រោម។</p></div><div className="secure-note"><ShieldCheck size={19}/><span><b>Private workspace</b><small>ផ្ទុកតែឯកសារដែលអ្នកជ្រើសរើស</small></span></div></div>
        <div className="studio-grid"><div className="upload-panel panel"><div className="panel-head"><div><span className="step-number">01</span><h3>បញ្ចូលឯកសារ</h3></div><span className="required">ត្រូវការ 2 ឯកសារ</span></div><p className="panel-desc">ជ្រើសរើសវីដេអូដើម និងរូបថតមុខដែលអ្នកមានសិទ្ធិប្រើប្រាស់។</p>
          <div className="upload-box video-upload" role="button" tabIndex="0" onClick={()=>videoInput.current?.click()} onKeyDown={e=>e.key==='Enter'&&videoInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();pick('video',e.dataTransfer.files?.[0])}}>{videoUrl?<><video src={videoUrl} className="video-preview" controls onClick={e=>e.stopPropagation()}/><div className="file-details"><FileVideo2 size={19}/><span><b>{video.name}</b><small>{fmt(video.size)} · វីដេអូដើម</small></span><button className="tiny-remove" onClick={e=>{e.stopPropagation();setVideo(null);setVideoUrl('')}} aria-label="លុបវីដេអូ"><X size={16}/></button></div></>:<><div className="upload-icon"><FileVideo2 size={24}/><span className="plus-badge"><Upload size={12}/></span></div><b>ទម្លាក់វីដេអូនៅទីនេះ</b><span className="upload-sub">ឬចុចដើម្បីជ្រើសរើសឯកសារ</span><span className="file-tag">MP4 · MOV · WEBM · MKV <i/> រហូតដល់ 150 MB</span></>}<input ref={videoInput} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska" hidden onChange={e=>pick('video',e.target.files?.[0])}/></div>
          <div className="upload-box face-upload" role="button" tabIndex="0" onClick={()=>faceInput.current?.click()} onKeyDown={e=>e.key==='Enter'&&faceInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();pick('face',e.dataTransfer.files?.[0])}}>{faceUrl?<><img src={faceUrl} className="face-preview" alt="រូបថតមុខដែលបានជ្រើសរើស"/><div className="file-details"><ImagePlus size={19}/><span><b>{face.name}</b><small>{fmt(face.size)} · រូបថតមុខ</small></span><button className="tiny-remove" onClick={e=>{e.stopPropagation();setFace(null);setFaceUrl('')}} aria-label="លុបរូបថត"><X size={16}/></button></div></>:<><div className="upload-icon face-icon"><ImagePlus size={23}/></div><b>បន្ថែមរូបថតមុខ</b><span className="upload-sub">ប្រើរូបថតច្បាស់ មុខមើលឃើញពេញ</span><span className="file-tag">JPG · PNG · WEBP <i/> រហូតដល់ 15 MB</span></>}<input ref={faceInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>pick('face',e.target.files?.[0])}/></div>
          <label className="consent-row"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span className="custom-check"><Check size={13}/></span><span>ខ្ញុំបញ្ជាក់ថា ខ្ញុំមានសិទ្ធិប្រើប្រាស់វីដេអូ និងរូបថតនេះ ហើយមិនប្រើវាសម្រាប់បន្លំអត្តសញ្ញាណអ្នកដទៃ។</span></label>
          {error&&<div className="error-message" role="alert"><CircleHelp size={17}/>{error}</div>}
          <button className="primary-btn process-btn" onClick={run} disabled={busy}>{busy?<><LoaderCircle className="spin" size={18}/> AI កំពុងដំណើរការ...</>:<><WandSparkles size={18}/> បម្លែងវីដេអូជាមួយ AI <ArrowRight size={17}/></>}</button><p className="processing-note"><LockKeyhole size={13}/> សូមកុំបិទទំព័រខណៈពេលដំណើរការ។</p>
        </div>
        <div className="result-panel panel"><div className="panel-head"><div><span className="step-number step-two">02</span><h3>លទ្ធផលវីដេអូ</h3></div><span className={'status-badge '+(status==='succeeded'?'done':'')}>{status==='succeeded'?<CheckCircle2 size={13}/>:<span className="status-dot"/>}{statusText}</span></div><p className="panel-desc">វីដេអូដែល AI បានបម្លែងនឹងបង្ហាញនៅទីនេះ។</p>
          <div className={'result-stage '+(outputUrl?'has-result':'')}>{outputUrl?<video className="output-video" src={outputUrl} controls playsInline/>:<div className="empty-result"><div className="result-orb"><div className="orb-ring ring-1"/><div className="orb-ring ring-2"/><WandSparkles size={35}/></div><b>{busy?'កំពុងបម្លែងវីដេអូរបស់អ្នក':'លទ្ធផលនឹងបង្ហាញនៅទីនេះ'}</b><span>{busy?'AI កំពុងដំណើរការ។ សូមរង់ចាំបន្តិច។':'បន្ទាប់ពីបញ្ចប់ដំណើរការ អ្នកអាចមើលវីដេអូថ្មីនៅទីនេះ។'}</span>{busy&&<div className="progress-track"><div className="progress-fill"/></div>}{!busy&&<div className="empty-tags"><span><Video size={14}/> Video output</span><span><Sparkles size={14}/> AI enhanced</span></div>}</div>}</div>
          {outputUrl&&<a className="download-btn" href={outputUrl} target="_blank" rel="noreferrer" download><Download size={17}/> មើល / ទាញយកវីដេអូ <ArrowDown size={15}/></a>}
          <div className="result-footer"><span><LockKeyhole size={14}/> កុំចែករំលែកលទ្ធផលដោយគ្មានការអនុញ្ញាត</span><span className="provider-label"><span/> AI output</span></div>
        </div></div>
      </section>
      <section className="how-section" id="how"><div className="wrap"><div className="section-heading centered"><div className="eyebrow">SIMPLE WORKFLOW</div><h2>បីជំហាន។ <span>លទ្ធផលថ្មី។</span></h2><p>ចាប់ផ្តើមបានងាយៗ មិនចាំបាច់មានជំនាញកាត់តវីដេអូ។</p></div><div className="steps-grid"><article className="step-card"><div className="step-visual purple-visual"><Upload size={28}/><span className="mini-file">MP4</span></div><span className="step-kicker">STEP 01</span><h3>បញ្ចូលវីដេអូ</h3><p>ជ្រើសរើសវីដេអូដែលអ្នកចង់កែប្រែពីឧបករណ៍របស់អ្នក។</p></article><article className="step-card"><div className="step-visual blue-visual"><ImagePlus size={28}/><span className="face-mini"><span/><span/></span></div><span className="step-kicker">STEP 02</span><h3>ជ្រើសរើសរូបថតមុខ</h3><p>ប្រើរូបថតច្បាស់ ដើម្បីឱ្យ AI មានប្រភពមុខសម្រាប់បម្លែង។</p></article><article className="step-card"><div className="step-visual mix-visual"><WandSparkles size={29}/><span className="mini-spark">✦</span></div><span className="step-kicker">STEP 03</span><h3>បង្កើត និងទាញយក</h3><p>AI ដំណើរការវីដេអូ ហើយអ្នកអាចមើលលទ្ធផលពេលវារួចរាល់។</p></article></div></div></section>
      <section className="safety-section wrap" id="safety"><div className="safety-card"><div className="safety-icon"><ShieldCheck size={29}/></div><div><div className="eyebrow">RESPONSIBLE AI</div><h2>ភាពច្នៃប្រឌិត គួរតែមានការទទួលខុសត្រូវ។</h2><p>សូមប្រើរូបថត និងវីដេអូដែលអ្នកជាម្ចាស់ ឬទទួលបានការអនុញ្ញាត។ កុំប្រើ Face Swap ដើម្បីបន្លំអត្តសញ្ញាណ បង្កើតព័ត៌មានបំភាន់ ឬបង្កគ្រោះថ្នាក់ដល់អ្នកដទៃ។</p></div><div className="safety-checks"><span><CheckCircle2 size={17}/> សិទ្ធិប្រើប្រាស់</span><span><CheckCircle2 size={17}/> ការគោរពឯកជនភាព</span><span><CheckCircle2 size={17}/> ការប្រើប្រាស់ប្រកបដោយទំនួលខុសត្រូវ</span></div></div></section>
      <section className="faq-section wrap" id="faq"><div className="section-heading centered"><div className="eyebrow">NEED TO KNOW</div><h2>សំណួរ <span>ដែលគេសួរញឹកញាប់</span></h2></div><div className="faq-list"><details><summary>តើវេបសាយនេះដំណើរការប្តូរមុខពិតប្រាកដទេ?<ChevronDown size={18}/></summary><p>Frontend និង backend ត្រូវបានរៀបចំសម្រាប់ការងារពិត។ អ្នកត្រូវកំណត់ API token និង model version ដែលគាំទ្រការប្តូរមុខក្នុងវីដេអូ មុនពេល AI អាចដំណើរការបាន។</p></details><details><summary>តើអាចប្រើលើទូរស័ព្ទបានទេ?<ChevronDown size={18}/></summary><p>បាន។ រចនាប័ទ្មនេះឆ្លើយតបតាមទំហំអេក្រង់ ហើយអាចជ្រើសរើសឯកសារពីទូរស័ព្ទ ឬកុំព្យូទ័រ។</p></details><details><summary>ហេតុអ្វីខ្ញុំមិនអាចចាប់ផ្តើមបម្លែងបាន?<ChevronDown size={18}/></summary><p>បើមិនទាន់កំណត់ AI provider នៅក្នុង backend នោះ API នឹងបង្ហាញសារណែនាំឱ្យកំណត់ REPLICATE_API_TOKEN និង REPLICATE_MODEL_VERSION ជាមុន។</p></details></div></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><a className="brand" href="#home"><span className="brand-icon"><WandSparkles size={20}/></span><span>FaceSwap <b>AI</b><small>STUDIO</small></span></a><span>បង្កើតដោយ AI · ប្រើប្រាស់ដោយទំនួលខុសត្រូវ</span><a href="#home" className="back-top">ត្រឡប់ទៅលើ ↑</a></div><div className="wrap footer-bottom"><span>© 2026 FaceSwap AI Studio · Starter project</span><span>មិនមែនជាសេវាដែលបានដាក់ឱ្យប្រើជាសាធារណៈទេ</span></div></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
