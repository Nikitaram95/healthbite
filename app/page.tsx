'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  useEffect(() => {
    const N = 5;
    let cur = 0, lastT = 0;
    const phones = Array.from(document.querySelectorAll<HTMLElement>('.stack-phone'));
    const chips  = Array.from(document.querySelectorAll<HTMLElement>('#navChips .screen-chip'));
    const dots   = Array.from(document.querySelectorAll<HTMLElement>('#navDots .cdot'));

    function cls(i: number, active: number) {
      const d = ((i - active) % N + N) % N;
      return d===0 ? 'pos-main' : d===1 ? 'pos-right' : d===N-1 ? 'pos-left' : 'pos-back';
    }
    function syncUi(idx: number) {
      chips.forEach((c,i) => c.classList.toggle('active', i===idx));
      dots.forEach((d,i) => d.classList.toggle('active', i===idx));
    }

    phones.forEach(p => p.classList.add('instant'));
    phones.forEach((p,i) => p.classList.add(cls(i,0)));
    requestAnimationFrame(() => requestAnimationFrame(() =>
      phones.forEach(p => p.classList.remove('instant'))
    ));
    syncUi(0);

    function goTo(next: number, fwd: boolean) {
      const now = Date.now();
      if (next===cur || now-lastT < 600) return;
      lastT = now;
      const prev = cur; cur = next;
      const ep = phones[prev];
      ep.classList.remove('pos-main','pos-left','pos-right','pos-back');
      ep.classList.add(fwd ? 'out-left' : 'out-right');
      phones.forEach((p,i) => {
        if (i===prev) return;
        p.classList.remove('pos-main','pos-left','pos-right','pos-back','out-left','out-right');
        p.classList.add(cls(i, next));
      });
      syncUi(next);
      setTimeout(() => {
        ep.classList.add('instant');
        ep.classList.remove('out-left','out-right');
        ep.classList.add(cls(prev, next));
        requestAnimationFrame(() => requestAnimationFrame(() => ep.classList.remove('instant')));
      }, 700);
    }

    chips.forEach((c,i) => c.addEventListener('click', () => goTo(i, i>cur)));
    dots.forEach((d,i) => d.addEventListener('click', () => goTo(i, i>cur)));

    let timer = setInterval(() => goTo((cur+1)%N, true), 3800);
    const stage = document.getElementById('phoneStage');
    if (stage) {
      stage.addEventListener('mouseenter', () => clearInterval(timer));
      stage.addEventListener('mouseleave', () => {
        clearInterval(timer);
        timer = setInterval(() => goTo((cur+1)%N, true), 3800);
      });
      let sx = 0;
      stage.addEventListener('touchstart', (e: any) => sx = e.touches[0].clientX, {passive:true});
      stage.addEventListener('touchend', (e: any) => {
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx)>40) goTo(((cur+(dx<0?1:-1))%N+N)%N, dx<0);
      });
    }

    // FAQ аккордеон
    document.querySelectorAll<HTMLElement>('.faq-item').forEach(item => {
      item.querySelector('.faq-q')?.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

    const obs = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && e.target.classList.add('show')),
      {threshold:0.12}
    );
    document.querySelectorAll('.fade').forEach(el => obs.observe(el));

    return () => {
      clearInterval(timer);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{
          --bg:#0D1623;--bg2:#09111d;--card:#10213B;
          --neon:#00A2FF;--neon2:#00E5FF;--green:#10B981;--yellow:#FFCC00;
          --orange:#FFB347;--red:#EF4444;--muted:#8aa3bf;--text:#f4f8ff;
          --shadow:0 20px 60px rgba(0,0,0,.35);
        }
        html{scroll-behavior:smooth}
        body{
          font-family:'Exo 2',sans-serif;
          background:radial-gradient(circle at 20% 0%,rgba(0,162,255,.12),transparent 35%),
            radial-gradient(circle at 80% 20%,rgba(0,229,255,.08),transparent 30%),
            linear-gradient(180deg,#0a1220 0%,var(--bg) 35%,#09111a 100%);
          color:var(--text);overflow-x:hidden;
        }
        a{text-decoration:none;color:inherit}
        .container{width:min(1200px,calc(100% - 40px));margin:0 auto}
        .section{padding:55px 0;position:relative}
        .grid-bg{position:fixed;inset:0;background-image:linear-gradient(rgba(0,162,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,162,255,.04) 1px,transparent 1px);background-size:56px 56px;mask-image:linear-gradient(180deg,transparent,black 15%,black 80%,transparent);pointer-events:none;z-index:0}

        .label{
          display:inline-flex;align-items:center;gap:10px;padding:8px 16px;
          border-radius:999px;border:1px solid rgba(0,162,255,.24);
          background:rgba(0,162,255,.08);color:var(--neon2);
          font-size:11px;font-weight:700;letter-spacing:1.8px;
          text-transform:uppercase;font-family:'Orbitron',sans-serif
        }
        .label:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--neon);box-shadow:0 0 14px var(--neon)}

        .title{font-family:'Orbitron',sans-serif;font-size:clamp(32px,5vw,66px);line-height:1.02;font-weight:800;letter-spacing:-1px;margin:20px 0 18px}
        .title .grad{background:linear-gradient(90deg,#fff,var(--neon),var(--neon2));-webkit-background-clip:text;background-clip:text;color:transparent}
        .desc{font-size:18px;line-height:1.75;color:var(--muted);max-width:760px}

        nav{position:fixed;top:0;left:0;right:0;z-index:1000;backdrop-filter:blur(18px);background:rgba(9,17,29,.74);border-bottom:1px solid rgba(0,162,255,.12)}
        .nav-wrap{height:76px;display:flex;align-items:center;justify-content:space-between}
        .brand{font-family:'Orbitron',sans-serif;font-size:22px;font-weight:800;background:linear-gradient(90deg,var(--neon),#fff);-webkit-background-clip:text;background-clip:text;color:transparent}
        .nav-links{display:flex;gap:28px;color:var(--muted);font-size:14px;font-weight:600}
        .nav-links a:hover{color:var(--text)}
        .nav-cta{padding:12px 18px;border-radius:12px;border:1px solid rgba(0,162,255,.3);background:linear-gradient(180deg,rgba(0,162,255,.18),rgba(0,162,255,.08));color:#fff;font-weight:700;font-size:14px;cursor:pointer;transition:.2s ease}
        .nav-cta:hover{background:linear-gradient(180deg,rgba(0,162,255,.28),rgba(0,162,255,.15))}

        .hero{padding:140px 0 90px;position:relative}
        .hero-wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;position:relative;z-index:2}
        .hero p strong{color:#fff}
        .hero-actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:34px}

        .glow-btn,.ghost-btn{min-height:58px;padding:0 28px;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;gap:12px;font-weight:800;font-size:15px;transition:.25s ease;position:relative;overflow:hidden}
        .glow-btn{color:#03111d;border:1px solid rgba(255,255,255,.3);background:linear-gradient(135deg,var(--neon2),var(--neon) 50%,#7ee6ff);box-shadow:0 0 18px rgba(0,162,255,.45),0 0 40px rgba(0,162,255,.22),inset 0 1px 0 rgba(255,255,255,.5)}
        .glow-btn:before{content:"";position:absolute;inset:-2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);transform:translateX(-130%);animation:shine 3.2s linear infinite}
        .glow-btn:hover{transform:translateY(-2px) scale(1.01)}
        .ghost-btn{color:#d9e9ff;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)}
        .ghost-btn:hover{border-color:rgba(0,162,255,.3);background:rgba(0,162,255,.07)}
        @keyframes shine{100%{transform:translateX(130%)}}

        .hero-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:34px}
        .stat{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:18px 18px 16px}
        .stat-num{font-family:'Orbitron',sans-serif;font-size:22px;font-weight:800;color:var(--neon2)}
        .stat-text{margin-top:8px;color:var(--muted);font-size:13px;line-height:1.45}

        .showcase{position:relative;display:flex;flex-direction:column;align-items:center}
        .orb{position:absolute;border-radius:50%;filter:blur(18px);opacity:.55;pointer-events:none}
        .orb.one{width:220px;height:220px;background:rgba(0,162,255,.22);top:40px;left:-30px}
        .orb.two{width:160px;height:160px;background:rgba(16,185,129,.15);right:-20px;bottom:80px}
        .orb.three{width:140px;height:140px;background:rgba(255,179,71,.16);top:200px;right:10px}
        .phone-stage{position:relative;width:100%;height:640px;perspective:1400px}
        .phone{width:290px;height:610px;border-radius:44px;padding:10px;background:linear-gradient(180deg,#1c2d45,#0c1626);border:1px solid rgba(255,255,255,.13);box-shadow:0 30px 90px rgba(0,0,0,.5),0 0 80px rgba(0,162,255,.1);position:relative}
        .stack-phone{position:absolute;top:30px;left:50%;transition:transform .65s cubic-bezier(.4,0,.2,1),opacity .65s ease;pointer-events:none;will-change:transform,opacity}
        .stack-phone.pos-main{transform:translateX(-50%) rotateY(0deg) scale(1.03);z-index:10;opacity:1;pointer-events:auto;box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 90px rgba(0,162,255,.2)}
        .stack-phone.pos-right{transform:translateX(calc(-50% + 230px)) rotateY(-26deg) rotateZ(7deg) scale(.87);z-index:5;opacity:.68}
        .stack-phone.pos-left{transform:translateX(calc(-50% - 230px)) rotateY(26deg) rotateZ(-7deg) scale(.87);z-index:5;opacity:.68}
        .stack-phone.pos-back{transform:translateX(-50%) scale(.76);z-index:1;opacity:.28}
        .stack-phone.out-left{transform:translateX(calc(-50% - 520px)) rotateY(45deg) rotateZ(-14deg) scale(.68);opacity:0;z-index:3;transition:transform .55s cubic-bezier(.4,0,.2,1),opacity .4s ease}
        .stack-phone.out-right{transform:translateX(calc(-50% + 520px)) rotateY(-45deg) rotateZ(14deg) scale(.68);opacity:0;z-index:3;transition:transform .55s cubic-bezier(.4,0,.2,1),opacity .4s ease}
        .stack-phone.instant{transition:none!important}
        .img-phone{width:290px;border-radius:44px;overflow:hidden;padding:0;background:#0c1626;border:1px solid rgba(255,255,255,.13);height:auto}
        .phone-img-screen{width:100%;height:auto;display:block;border-radius:44px}
        .screen-labels{display:flex;justify-content:center;gap:10px;margin-top:20px;flex-wrap:wrap}
        .screen-chip{padding:10px 18px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:13px;color:var(--muted);font-weight:700;cursor:pointer;transition:.2s ease}
        .screen-chip:hover{color:#fff;border-color:rgba(0,162,255,.2)}
        .screen-chip.active{color:#fff;border-color:rgba(0,162,255,.3);background:rgba(0,162,255,.12);box-shadow:0 0 18px rgba(0,162,255,.14) inset}

        .cards-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:48px}
        .info-card{padding:28px;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.07);box-shadow:var(--shadow)}
        .info-card .ic{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-size:28px;margin-bottom:20px}
        .info-card h3{font-family:'Orbitron',sans-serif;font-size:19px;margin-bottom:12px}
        .info-card p{font-size:15px;line-height:1.75;color:var(--muted)}
        .ic.blue{background:rgba(0,162,255,.12);border:1px solid rgba(0,162,255,.24)}
        .ic.cyan{background:rgba(0,229,255,.12);border:1px solid rgba(0,229,255,.24)}
        .ic.green{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.24)}
        .ic.orange{background:rgba(255,179,71,.12);border:1px solid rgba(255,179,71,.24)}

        .timeline{display:grid;grid-template-columns:1.05fr .95fr;gap:30px;align-items:start;margin-top:56px}
        .steps{display:flex;flex-direction:column;gap:16px}
        .step{display:flex;gap:16px;padding:18px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
        .step-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;font-size:24px;flex:0 0 auto;background:rgba(0,162,255,.1);border:1px solid rgba(0,162,255,.18)}
        .step h4{font-size:16px;margin-bottom:8px}
        .step p{font-size:14px;line-height:1.65;color:var(--muted)}
        .side-panel{padding:26px;border-radius:24px;background:linear-gradient(180deg,rgba(16,33,59,.96),rgba(13,24,43,.98));border:1px solid rgba(0,162,255,.16);box-shadow:var(--shadow)}
        .side-panel h3{font-family:'Orbitron',sans-serif;font-size:24px;margin-bottom:18px}
        .metric{display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;margin:16px 0}
        .metric .m-ico{font-size:22px;min-width:36px;text-align:center}
        .metric .m-name{font-size:13px;color:#dce9fb;margin-bottom:6px}
        .metric .m-val{font-family:'Orbitron',sans-serif;font-size:12px;color:#fff;white-space:nowrap}
        .metric .mbar{height:8px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
        .metric .mbar span{display:block;height:100%;border-radius:999px}
        .side-note{margin-top:18px;padding:16px;border-radius:16px;background:rgba(0,162,255,.06);border:1px solid rgba(0,162,255,.12);color:var(--muted);font-size:13px;line-height:1.6}

        .feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:48px}
        .feature{padding:22px;border-radius:20px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
        .feature h4{font-size:18px;margin-bottom:10px}
        .feature p{font-size:15px;line-height:1.7;color:var(--muted)}
        .feature-tag{display:inline-block;margin-bottom:14px;padding:7px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
        .t-blue{background:rgba(0,162,255,.1);color:#7fd4ff;border:1px solid rgba(0,162,255,.18)}
        .t-green{background:rgba(16,185,129,.1);color:#7be7c5;border:1px solid rgba(16,185,129,.18)}
        .t-cyan{background:rgba(0,229,255,.1);color:#7beeff;border:1px solid rgba(0,229,255,.18)}
        .t-orange{background:rgba(255,179,71,.1);color:#ffd08f;border:1px solid rgba(255,179,71,.18)}

        /* ── PRICING ── */
        .pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:52px;align-items:start}
        .plan{
          padding:28px;border-radius:24px;
          background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));
          border:1px solid rgba(255,255,255,.07);box-shadow:var(--shadow);
          position:relative;display:flex;flex-direction:column
        }
        .plan.pop{border-color:rgba(16,185,129,.28);box-shadow:0 20px 60px rgba(0,0,0,.35),0 0 50px rgba(16,185,129,.12)}
        .plan.best{border-color:rgba(255,204,0,.28);box-shadow:0 20px 60px rgba(0,0,0,.35),0 0 50px rgba(255,204,0,.1)}
        .badge{
          position:absolute;top:18px;right:18px;padding:7px 11px;
          border-radius:999px;font-size:10px;font-weight:800;
          font-family:'Orbitron',sans-serif;letter-spacing:.4px
        }
        .badge.blue{background:rgba(0,162,255,.14);border:1px solid rgba(0,162,255,.28);color:#7fd4ff}
        .badge.green{background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.22);color:#75ebc7}
        .badge.yellow{background:rgba(255,204,0,.14);border:1px solid rgba(255,204,0,.22);color:#ffdc70}
        .plan h3{font-family:'Orbitron',sans-serif;font-size:20px;margin-bottom:8px}
        .plan .sub{color:var(--muted);font-size:14px;line-height:1.6;margin-bottom:18px}
        .price{font-family:'Orbitron',sans-serif;font-size:42px;line-height:1;font-weight:800;margin-bottom:8px}
        .price small{font-size:18px;color:#bfd4eb}
        .plan .per{font-size:13px;color:var(--muted);margin-bottom:18px}
        .plan-features{
          list-style:none;display:flex;flex-direction:column;
          gap:10px;flex:1;margin-bottom:0
        }
        .plan-features li{
          font-size:14px;color:#dbe8fa;
          display:flex;gap:10px;align-items:flex-start;line-height:1.55
        }
        .plan-features li::before{content:"✓";color:var(--neon2);font-weight:800;flex:0 0 auto}
        .plan-features li.spacer{visibility:hidden;pointer-events:none}
        .plan-features li.spacer::before{content:"✓"}
        .plan-cta{margin-top:24px}
        .plan-btn{width:100%;justify-content:center}
        .plan-note{text-align:center;font-size:12px;color:rgba(255,255,255,.38);margin-top:10px}
        .fill-neon{background:linear-gradient(90deg,#00a2ff,#36d5ff);box-shadow:0 0 12px rgba(0,162,255,.45)}
        .fill-cyan{background:linear-gradient(90deg,#00e5ff,#00a2ff)}
        .fill-green{background:linear-gradient(90deg,#10b981,#38e2b0)}

        /* ── FAQ ── */
        .faq-list{display:flex;flex-direction:column;gap:12px;margin-top:48px;max-width:860px}
        .faq-item{border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.07);overflow:hidden;transition:.25s ease}
        .faq-item.open{border-color:rgba(0,162,255,.22);background:linear-gradient(180deg,rgba(0,162,255,.06),rgba(0,162,255,.02))}
        .faq-q{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;cursor:pointer;font-size:16px;font-weight:700;color:var(--text);user-select:none}
        .faq-q:hover{color:#fff}
        .faq-arrow{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:grid;place-items:center;flex:0 0 auto;transition:.3s ease;font-size:14px}
        .faq-item.open .faq-arrow{background:rgba(0,162,255,.12);border-color:rgba(0,162,255,.24);transform:rotate(180deg)}
        .faq-a{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .3s ease;padding:0 24px;font-size:15px;line-height:1.75;color:var(--muted)}
        .faq-item.open .faq-a{max-height:400px;padding-bottom:22px}
        .faq-a strong{color:#fff}

        /* ── FOOTER ── */
        .footer{padding:34px 0 46px;border-top:1px solid rgba(255,255,255,.06);color:var(--muted)}
        .footer-wrap{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
        .footer-links{display:flex;gap:18px;flex-wrap:wrap;font-size:13px}

        .fade{opacity:0;transform:translateY(24px);transition:.7s ease}
        .fade.show{opacity:1;transform:none}

        @media(max-width:1100px){.hero-wrap,.timeline{grid-template-columns:1fr}}
        @media(max-width:980px){.cards-3,.pricing{grid-template-columns:1fr}.feature-grid{grid-template-columns:1fr}.hero-stats{grid-template-columns:1fr}.nav-links{display:none}}
        @media(max-width:640px){
          .container{width:min(100% - 20px,1200px)}.hero{padding-top:100px}
          .title{font-size:clamp(24px,9vw,42px)}.desc{font-size:15px}.section{padding:32px 0}
          .glow-btn,.ghost-btn{width:100%}.screen-chip{font-size:10px;padding:5px 9px}
          .nav-wrap{height:60px}.brand{font-size:16px}
          .nav-cta{font-size:10px;padding:6px 10px;white-space:nowrap;border-radius:8px;margin-left:6px}
          .hero-wrap{gap:24px}.cards-3{grid-template-columns:1fr 1fr;gap:14px;margin-top:24px}
          .info-card{padding:18px 14px}.info-card h3{font-size:14px}.info-card p{font-size:13px}
          .ic{width:36px;height:36px;font-size:18px;margin-bottom:10px}
          .feature-grid{grid-template-columns:1fr 1fr;gap:14px}.feature{padding:16px}.feature h4{font-size:14px}.feature p{font-size:13px}
          .timeline{gap:20px}.side-panel{padding:20px}.step{gap:12px}
          .showcase{width:100%;overflow:hidden}
          .phone-stage{height:460px}
          .stack-phone.pos-main{transform:translateX(-50%) scale(0.82)}
          .stack-phone.pos-left{transform:translateX(calc(-50% - 115px)) rotateY(18deg) rotateZ(-4deg) scale(.58);opacity:.28}
          .stack-phone.pos-right{transform:translateX(calc(-50% + 115px)) rotateY(-18deg) rotateZ(4deg) scale(.58);opacity:.28}
          .stack-phone.pos-back{opacity:0}
          .img-phone{width:210px}
          .screen-labels{margin-top:82px;gap:6px;padding:0 10px}
          .pricing{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;gap:16px;padding:0 calc(50vw - 39vw) 20px;grid-template-columns:none;margin:0 -20px}
          .pricing::-webkit-scrollbar{display:none}
          .plan{min-width:78vw;max-width:78vw;scroll-snap-align:center;flex-shrink:0}
          .faq-q{font-size:14px;padding:16px 18px}
          .faq-a{font-size:14px;padding:0 18px}
          .faq-item.open .faq-a{padding-bottom:18px}
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="grid-bg" />

      {/* NAV */}
      <nav>
        <div className="container nav-wrap">
          <div className="brand">HealthBite</div>
          <div className="nav-links">
            <a href="#about">О продукте</a>
            <a href="#ai">Как работает HealthBite</a>
            <a href="#progress">Прогресс</a>
            <a href="#pricing">Тарифы</a>
            <a href="#faq">Вопросы</a>
          </div>
          <Link href="/login" className="nav-cta">Войти в личный кабинет</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-wrap">
          <div className="fade">
            <div className="label">Высокотехнологичный контроль здоровья</div>
            <h1 className="title">Питание, вода и активность — <span className="grad">в одном приложении</span></h1>
            <p className="desc">HealthBite помогает видеть реальную картину дня: что ты ешь, сколько пьёшь воды, как двигаешься и как меняется твой <strong>прогресс</strong>. Без сложных таблиц, без ручной рутины, без перегруза лишними деталями.</p>
            <div className="hero-actions">
              <Link href="/login" className="glow-btn">Начать бесплатно</Link>
              <a href="#about" className="ghost-btn">Смотреть возможности</a>
            </div>
            <div className="hero-stats">
              <div className="stat"><div className="stat-num">Быстро</div><div className="stat-text">Распознавание еды и добавление в дневник без лишних шагов.</div></div>
              <div className="stat"><div className="stat-num">Удобно</div><div className="stat-text">Все ключевые метрики на одном экране: калории, вода, шаги, рекомендации.</div></div>
              <div className="stat"><div className="stat-num">Наглядно</div><div className="stat-text">Вместо сложных отчётов — визуальный прогресс, понятный с первого взгляда.</div></div>
            </div>
          </div>

          <div className="showcase fade">
            <div className="orb one" /><div className="orb two" /><div className="orb three" />
            <div className="phone-stage" id="phoneStage">
              <div className="phone stack-phone img-phone" data-idx="0">
                <img src="https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/nutrition%20(2).png" alt="Питание" className="phone-img-screen" />
              </div>
              <div className="phone stack-phone img-phone" data-idx="1">
                <img src="https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/water%20(1).png" alt="Водный баланс" className="phone-img-screen" />
              </div>
              <div className="phone stack-phone img-phone" data-idx="2">
                <img src="https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/activity%20(1).png" alt="Активность" className="phone-img-screen" />
              </div>
              <div className="phone stack-phone img-phone" data-idx="3">
                <img src="https://raw.githubusercontent.com/Nikitaram95/healthB/ee792898f7677cf96b74fc50bf6324ac0523c4be/menu%20(1).png" alt="Меню" className="phone-img-screen" />
              </div>
              <div className="phone stack-phone img-phone" data-idx="4">
                <img src="https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/addnutri%20(1).png" alt="Добавление блюд" className="phone-img-screen" />
              </div>
            </div>
            <div className="screen-labels" id="navChips">
              <div className="screen-chip active" data-slide="0">Питание</div>
              <div className="screen-chip" data-slide="1">Водный баланс</div>
              <div className="screen-chip" data-slide="2">Активность</div>
              <div className="screen-chip" data-slide="3">Меню</div>
              <div className="screen-chip" data-slide="4">Добавление блюд</div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <div className="container fade">
          <div className="label">Что умеет продукт</div>
          <h2 className="title">Не просто счётчик калорий, а <span className="grad">умная система ежедневного контроля</span></h2>
          <p className="desc">HealthBite строится вокруг главного экрана приложения: ты сразу видишь калории, КБЖУ, рекомендации, воду, шаги и динамику дня.</p>
          <div className="cards-3">
            <div className="info-card"><div className="ic blue">🥗</div><h3>Дневник питания без рутины</h3><p>Добавляй блюда через распознавание фото, штрихкод или вручную.</p></div>
            <div className="info-card"><div className="ic cyan">💧</div><h3>Вода под контролем</h3><p>Водный баланс ведётся наглядно и без лишних действий.</p></div>
            <div className="info-card"><div className="ic green">👟</div><h3>Активность в общей картине дня</h3><p>Шаги, тренировки и активность становятся частью одного экрана.</p></div>
            <div className="info-card"><div className="ic orange">🤖</div><h3>Рекомендации на каждый день</h3><p>HealthBite мягко подсказывает, что можно сделать прямо сегодня.</p></div>
          </div>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="section">
        <div className="container fade">
          <div className="label">Как работает HealthBite</div>
          <h2 className="title">Помогает, а не контролирует</h2>
          <p className="desc">HealthBite анализирует питание, воду и активность, чтобы давать мягкие, понятные рекомендации.</p>
          <div className="feature-grid">
            <div className="feature"><div className="feature-tag t-blue">Контекст дня</div><h4>Учитывает весь день, а не один приём пищи</h4><p>Советует не «есть меньше», а, например, добавить белка на завтрак.</p></div>
            <div className="feature"><div className="feature-tag t-cyan">Паттерны</div><h4>Замечает повторяющиеся сценарии</h4><p>Если часто не добирается вода — мягко подталкивает менять привычки.</p></div>
            <div className="feature"><div className="feature-tag t-green">Реальные действия</div><h4>Предлагает конкретные маленькие шаги</h4><p>Добавить салат к ужину, сделать 10‑минутную прогулку, долить 300 мл воды.</p></div>
            <div className="feature"><div className="feature-tag t-orange">Без давления</div><h4>Поддерживает, даже если бывают паузы</h4><p>Данные не обнуляются. HealthBite помогает мягко вернуться в ритм.</p></div>
          </div>
        </div>
      </section>

      {/* PROGRESS */}
      <section id="progress" className="section">
        <div className="container fade">
          <div className="label">Прогресс и привычки</div>
          <h2 className="title">Не только сегодня — <span className="grad">твоя динамика за недели и месяцы</span></h2>
          <p className="desc">HealthBite собирает питание, воду, шаги и вес в одну визуальную историю.</p>
          <div className="timeline">
            <div className="steps">
              <div className="step"><div className="step-icon">📊</div><div><h4>Шкала прогресса вместо таблиц</h4><p>Баланс за неделю — в одном экране. Один взгляд — и понятен вектор.</p></div></div>
              <div className="step"><div className="step-icon">📆</div><div><h4>Фокус на тенденциях</h4><p>Отдельные «срывы» не ломают общую картину. Важна дистанция.</p></div></div>
              <div className="step"><div className="step-icon">⚖️</div><div><h4>Вес как часть системы</h4><p>В связке с питанием, водой и шагами — уменьшает тревожность.</p></div></div>
            </div>
            <div className="side-panel">
              <h3>Твой день</h3>
              <div className="metric">
                <div className="m-ico">🔥</div>
                <div><div className="m-name">Калории</div><div className="mbar"><span className="fill-neon" style={{width:'72%'}} /></div></div>
                <div className="m-val">1 440 / 2 000</div>
              </div>
              <div className="metric">
                <div className="m-ico">💧</div>
                <div><div className="m-name">Вода</div><div className="mbar"><span className="fill-cyan" style={{width:'55%'}} /></div></div>
                <div className="m-val">1.1 / 2.0 л</div>
              </div>
              <div className="metric">
                <div className="m-ico">👟</div>
                <div><div className="m-name">Шаги</div><div className="mbar"><span className="fill-green" style={{width:'63%'}} /></div></div>
                <div className="m-val">6 300 / 10 000</div>
              </div>
              <div className="side-note">💡 Добавь стакан воды и выйди на короткую прогулку — и день будет в балансе.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container fade">
          <div className="label">Тарифы</div>
          <h2 className="title">Начни бесплатно — <span className="grad">расширяй по мере роста</span></h2>
          <p className="desc">Без обязательств. Без автопродления. Отмена в любой момент.</p>

          <div className="pricing">

            {/* СТАРТ */}
            <div className="plan">
              <div className="badge blue">7 ДНЕЙ БЕСПЛАТНО</div>
              <h3>Старт</h3>
              <div className="sub">Попробуй без карты и без ограничений</div>
              <div className="price">0 <small>₽</small></div>
              <div className="per">бесплатно · 7 дней</div>
              <ul className="plan-features">
                <li>Дневник питания (ручной ввод, 4 блюда/день)</li>
                <li>Водный баланс</li>
                <li>Добавление активности (до 2/день)</li>
                <li>Отслеживание веса</li>
                <li>Список покупок</li>
                <li>Рекомендации HealthBite каждый день</li>
                {/* spacers до 8 — выравнивание с Месяцем */}
                <li className="spacer">—</li>
              </ul>
              <div className="plan-cta">
                <Link href="/login" className="glow-btn plan-btn">Начать бесплатно</Link>
                <div className="plan-note">Без карты. Без автопродления.</div>
              </div>
            </div>

            {/* МЕСЯЦ */}
            <div className="plan pop">
              <div className="badge green">ПОПУЛЯРНЫЙ</div>
              <h3>Месяц</h3>
              <div className="sub">Полный доступ ко всем функциям</div>
              <div className="price">399 <small>₽/мес</small></div>
              <div className="per">≈ 13 ₽/день</div>
              <ul className="plan-features">
                <li>Всё из тарифа Старт — без ограничений</li>
                <li>Сканирование штрихкодов</li>
                <li>Генерация рецептов HealthBite</li>
                <li>Рацион питания на неделю</li>
                <li>Распознавание блюд по фото 📸</li>
                <li>Аналитика за 30 дней</li>
                {/* spacers до 8 */}
                <li className="spacer">—</li>
                <li className="spacer">—</li>
              </ul>
              <div className="plan-cta">
                <Link href="/login" className="glow-btn plan-btn">Получить доступ — 399 ₽</Link>
                <div className="plan-note">Отмена в любой момент. Без автопродления.</div>
              </div>
            </div>

            {/* ГОД */}
            <div className="plan best">
              <div className="badge yellow">ВЫГОДНО · −27%</div>
              <h3>Год</h3>
              <div className="sub">Максимальная выгода</div>
              <div className="price">3 490 <small>₽/год</small></div>
              <div className="per">всего 10 ₽/день · вместо 4 788 ₽</div>
              <ul className="plan-features">
                <li>Всё из тарифа Месяц</li>
                <li>Аналитика за весь год</li>
                <li>История без ограничений</li>
                <li>Приоритетная поддержка</li>
                <li>Ранний доступ к новым функциям</li>
                <li>Закрытая группа в Telegram и на сайте</li>
                {/* spacers до 8 */}
                <li className="spacer">—</li>
                <li className="spacer">—</li>
              </ul>
              <div className="plan-cta">
                <Link href="/login" className="glow-btn plan-btn">Получить доступ — 3 490 ₽/год</Link>
                <div className="plan-note">Отмена в любой момент. Без автопродления.</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <div className="container fade">
          <div className="label">Поддержка</div>
          <h2 className="title">Всё, что хотелось уточнить</h2>
          <p className="desc">Если остались вопросы — мы рядом.</p>

          <div className="faq-list">

            <div className="faq-item">
              <div className="faq-q">Нужна ли карта для бесплатного периода?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Нет. Тариф «Старт» на 7 дней полностью бесплатный — карта не нужна,
                автоматического списания нет. По окончании 7 дней приложение предложит
                выбрать платный тариф, но без принудительных ограничений.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Что доступно в дневнике питания на пробном периоде?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                В пробном периоде доступен базовый дневник питания: можно{' '}
                <strong>добавлять блюда вручную</strong> (до 4 в день) и видеть суммарное КБЖУ —
                белки, жиры, углеводы и калории. Также работают: водный баланс, добавление
                активности, отслеживание веса, список покупок, контроль аллергенов и ежедневные
                рекомендации HealthBite. Сканирование штрихкодов, распознавание по фото,
                генерация рецептов и рацион на неделю доступны в тарифах «Месяц» и «Год».
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Как работает распознавание блюд по фото?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Ты фотографируешь блюдо — HealthBite определяет состав и автоматически добавляет
                КБЖУ в дневник. Функция доступна на тарифах «Месяц» и «Год».
                На пробном периоде блюдо можно добавить вручную.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Что такое рацион питания на неделю?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Это персональный план блюд на каждый день, который HealthBite составляет
                с учётом твоих целей, аллергенов и предпочтений. Его можно редактировать
                вручную — или дополнить уже готовыми рекомендациями по питанию, которые
                у тебя есть. Доступен на тарифах «Месяц» и «Год».
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Мои данные сохранятся, если я отменю подписку?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Да. Все записи в дневнике, история веса и прогресс остаются в твоём аккаунте.
                При истечении подписки пользоваться приложением в полном объёме не получится,
                но при восстановлении — все предыдущие данные будут на месте.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Можно ли отменить подписку в любой момент?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Да, без штрафов и объяснений. Деньги за неиспользованный остаток периода
                не возвращаются — подписка работает ровно до конца оплаченного срока.{' '}
                <strong>Автопродления нет.</strong>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Считает ли приложение только калории или КБЖУ полностью?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Полностью КБЖУ: белки, жиры, углеводы и калории. На главном экране всё сразу —
                с прогресс-барами и твоей дневной нормой.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Как HealthBite считает норму воды?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Норма рассчитывается на основе данных профиля: веса, роста и уровня активности.
                При желании ты можешь установить свою цель вручную.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Где можно скачать приложение?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                HealthBite доступен в <strong>App Store</strong> и <strong>Google Play</strong>.
                Найди приложение по названию «HealthBite» или перейди по ссылке на этой странице.
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-q">Синхронизируются ли данные между устройствами?<div className="faq-arrow">▾</div></div>
              <div className="faq-a">
                Да. Данные хранятся в облаке и автоматически синхронизируются между всеми
                твоими устройствами.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-wrap">
          <div className="brand">HealthBite</div>
          <div className="footer-links">
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Условия использования</a>
            <a href="#">Поддержка</a>
          </div>
          <div style={{fontSize:13}}>© 2026 HealthBite</div>
        </div>
      </footer>
    </>
  );
}
