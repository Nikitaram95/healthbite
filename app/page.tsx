'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  { label: 'Питание',    img: 'https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/nutrition%202.png' },
  { label: 'Вода',       img: 'https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/water%201.png' },
  { label: 'Активность', img: 'https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/activity%201.png' },
  { label: 'Меню',       img: 'https://raw.githubusercontent.com/Nikitaram95/healthB/e792898f7677cf96b74fc50bf6324ac0523c4be/menu%202%201.png' },
  { label: 'Добавить',   img: 'https://raw.githubusercontent.com/Nikitaram95/healthB/refs/heads/main/addnutri%202%201.png' },
];

export default function LandingPage() {
  const [cur, setCur]       = useState(0);
  const [busy, setBusy]     = useState(false);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const N = SLIDES.length;

  const goTo = (next: number) => {
    if (busy || next === cur) return;
    setBusy(true);
    setCur(next);
    setTimeout(() => setBusy(false), 650);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCur(c => (c + 1) % N);
    }, 3800);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('show');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const pos = (i: number) => {
    const d = ((i - cur) % N + N) % N;
    if (d === 0)     return 'pos-main';
    if (d === 1)     return 'pos-right';
    if (d === N - 1) return 'pos-left';
    return 'pos-back';
  };

  return (
    <>
      <style>{CSS}</style>

      <div className="grid-bg" />

      {/* NAV */}
      <nav>
        <div className="container nav-wrap">
          <div className="brand">HealthBite</div>
          <div className="nav-links">
            <a href="#about">О нас</a>
            <a href="#ai">AI</a>
            <a href="#progress">Прогресс</a>
            <a href="#pricing">Цены</a>
            <a href="#faq">FAQ</a>
          </div>
          <Link href="/login" className="nav-cta">Войти</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-wrap">
          <div className="fade">
            <div className="label">🚀 HealthBite 2.0</div>
            <h1 className="title">
              Питайся умно,<br /><span className="grad">живи лучше</span>
            </h1>
            <p className="desc">
              HealthBite — твой персональный ИИ-нутрициолог. Считай калории,
              следи за водой и активностью, получай рекомендации от GPT-4.
              <strong> Без диет, без сложностей.</strong>
            </p>
            <div className="hero-actions">
              <Link href="/login" className="glow-btn">Начать бесплатно</Link>
              <a href="#about" className="ghost-btn">Узнать больше</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-num">12 000+</div>
                <div className="stat-text">активных пользователей</div>
              </div>
              <div className="stat">
                <div className="stat-num">4.9 ★</div>
                <div className="stat-text">средний рейтинг</div>
              </div>
              <div className="stat">
                <div className="stat-num">-6 кг</div>
                <div className="stat-text">средний результат за месяц</div>
              </div>
            </div>
          </div>

          {/* PHONE CAROUSEL */}
          <div className="showcase fade">
            <div className="phone-stage"
              onMouseEnter={stopTimer}
              onMouseLeave={startTimer}
            >
              {SLIDES.map((s, i) => (
                <div key={i} className={`stack-phone ${pos(i)}`}>
                  <div className="phone">
                    <img src={s.img} alt={s.label} className="phone-img-screen" width={290} height={580} loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
            <div className="screen-labels">
              {SLIDES.map((s, i) => (
                <button key={i} className={`screen-chip ${cur === i ? 'active' : ''}`} onClick={() => goTo(i)}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="carousel-dots">
              {SLIDES.map((_, i) => (
                <button key={i} className={`cdot ${cur === i ? 'active' : ''}`} onClick={() => goTo(i)} aria-label={`Слайд ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <div className="container fade">
          <div className="label">💡 О приложении</div>
          <h2 className="title">Всё что нужно для <span className="grad">здорового питания</span></h2>
          <p className="desc">HealthBite объединяет трекинг питания, воды и активности в одном приложении с умным ИИ-помощником.</p>
          <div className="cards-3">
            {[
              { ic: '🎯', cls: 'blue', title: 'Точный трекинг', text: 'База из 2 млн продуктов. Сканируй штрихкоды, добавляй блюда — HealthBite сам считает КБЖУ.' },
              { ic: '🤖', cls: 'cyan', title: 'ИИ-рекомендации', text: 'GPT-4 анализирует твой рацион и предлагает персональные улучшения каждый день.' },
              { ic: '📊', cls: 'green', title: 'Аналитика прогресса', text: 'Графики веса, калорий, воды и активности. Видишь результат — остаёшься мотивирован.' },
              { ic: '🔔', cls: 'orange', title: 'Умные напоминания', text: 'Пить воду, принять витамины, добавить приём пищи — в нужное время, без раздражения.' },
            ].map((c, i) => (
              <div key={i} className="info-card">
                <div className={`ic ${c.cls}`}>{c.ic}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="section">
        <div className="container fade">
          <div className="label">🧠 Искусственный интеллект</div>
          <h2 className="title">ИИ, который <span className="grad">понимает тебя</span></h2>
          <p className="desc">HealthBite использует GPT-4 для анализа питания, предсказания результатов и персональных советов.</p>
          <div className="feature-grid">
            {[
              { tag: 't-blue',   title: 'Анализ рациона',        text: 'ИИ оценивает баланс БЖУ, выявляет дефициты витаминов и минералов, даёт конкретные советы по улучшению питания.' },
              { tag: 't-cyan',   title: 'Распознавание блюд',    text: 'Сфотографируй тарелку — HealthBite сам определит состав и калорийность с точностью до 90%.' },
              { tag: 't-green',  title: 'Прогноз результата',    text: 'Введи цель — приложение рассчитает план питания на 10, 30 и 90 дней с реалистичными ожиданиями.' },
              { tag: 't-orange', title: 'Персональный ассистент', text: 'Задавай любые вопросы о питании прямо в чате. HealthBite отвечает как профессиональный нутрициолог.' },
            ].map((f, i) => (
              <div key={i} className="feature">
                <div className={`feature-tag ${f.tag}`}>{f.title}</div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container fade">
          <div className="label">💎 Тарифы</div>
          <h2 className="title">Простые <span className="grad">и честные цены</span></h2>
          <p className="desc">Начни бесплатно, переходи на Premium когда будешь готов.</p>
          <div className="pricing">
            {[
              {
                name: 'Базовый', sub: 'Всё необходимое для старта.', price: '0', per: 'навсегда бесплатно',
                badge: null, cls: '', btnCls: 'ghost-btn',
                features: ['Трекинг питания', 'База 500 продуктов', 'Трекинг воды', 'Базовая статистика'],
              },
              {
                name: 'Premium', sub: 'Полный доступ ко всем функциям.', price: '499', per: 'в месяц',
                badge: { cls: 'green', text: '🔥 Популярный' }, cls: 'pop', btnCls: 'glow-btn',
                features: ['Всё из Базового', 'ИИ-рекомендации', 'Сканер штрихкодов', 'Распознавание фото', 'Безлимит продуктов', 'Синхронизация устройств'],
              },
              {
                name: 'Годовой', sub: 'Premium на год со скидкой 40%.', price: '2 990', per: 'в год',
                badge: { cls: 'yellow', text: '⚡ Выгодно' }, cls: 'best', btnCls: 'glow-btn',
                features: ['Всё из Premium', 'Приоритетная поддержка', 'Ранний доступ к новинкам', 'Персональный план питания'],
              },
            ].map((plan, i) => (
              <div key={i} className={`plan ${plan.cls}`}>
                {plan.badge && <div className={`badge ${plan.badge.cls}`}>{plan.badge.text}</div>}
                <h3>{plan.name}</h3>
                <div className="sub">{plan.sub}</div>
                <div className="price">{plan.price} <small>₽</small></div>
                <div className="per">{plan.per}</div>
                <ul>{plan.features.map((f, j) => <li key={j}>{f}</li>)}</ul>
                <Link href="/login" className={`${plan.btnCls} plan-btn`}>Начать</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container fade" style={{ textAlign: 'center' }}>
          <div className="label">🎉 Присоединяйся</div>
          <h2 className="title">Начни путь к <span className="grad">здоровью сегодня</span></h2>
          <p className="desc" style={{ margin: '0 auto 32px' }}>HealthBite уже помогает тысячам людей питаться лучше. Твоя очередь.</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link href="/login" className="glow-btn">Начать бесплатно</Link>
            <Link href="/feed" className="ghost-btn">Смотреть ленту</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-wrap">
          <div className="brand">HealthBite</div>
          <div className="footer-links">
            <a href="#about">О нас</a>
            <a href="#ai">AI</a>
            <a href="#pricing">Цены</a>
            <Link href="/feed">Лента</Link>
            <Link href="/login">Войти</Link>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>© 2026 HealthBite</div>
        </div>
      </footer>
    </>
  );
}

const CSS = `
  :root {
    --bg: #0D1623; --bg2: #09111d; --card: #10213B;
    --neon: #00A2FF; --neon2: #00E5FF; --green: #10B981;
    --yellow: #FFCC00; --orange: #FFB347; --red: #EF4444;
    --muted: #8aa3bf; --text: #f4f8ff;
    --shadow: 0 20px 60px rgba(0,0,0,.35);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Exo 2', sans-serif; background: radial-gradient(circle at 20% 0%, rgba(0,162,255,.12), transparent 35%), radial-gradient(circle at 80% 20%, rgba(0,229,255,.08), transparent 30%), linear-gradient(180deg, #0a1220 0%, var(--bg) 35%, #09111a 100%); color: var(--text); overflow-x: hidden; min-height: 100dvh; }
  a { text-decoration: none; color: inherit; }
  button { cursor: pointer; background: none; border: none; font: inherit; color: inherit; }
  .container { width: min(1200px, calc(100% - 40px)); margin: 0 auto; }
  .section { padding: 80px 0; position: relative; }
  .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0,162,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,162,255,.04) 1px, transparent 1px); background-size: 56px 56px; mask-image: linear-gradient(180deg, transparent, black 15%, black 80%, transparent); pointer-events: none; z-index: 0; }

  /* NAV */
  nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; backdrop-filter: blur(18px); background: rgba(9,17,29,.74); border-bottom: 1px solid rgba(0,162,255,.12); }
  .nav-wrap { height: 76px; display: flex; align-items: center; justify-content: space-between; }
  .brand { font-family: Orbitron, sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(90deg, var(--neon), #fff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .nav-links { display: flex; gap: 28px; color: var(--muted); font-size: 14px; font-weight: 600; }
  .nav-links a:hover { color: var(--text); }
  .nav-cta { padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(0,162,255,.3); background: linear-gradient(180deg, rgba(0,162,255,.18), rgba(0,162,255,.08)); color: #fff; font-weight: 700; font-size: 14px; transition: .25s ease; }
  .nav-cta:hover { background: rgba(0,162,255,.25); }

  /* HERO */
  .hero { padding: 140px 0 90px; position: relative; }
  .hero-wrap { display: grid; grid-template-columns: 1.05fr .95fr; gap: 48px; align-items: center; position: relative; z-index: 2; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 34px; }
  .glow-btn, .ghost-btn { min-height: 58px; padding: 0 28px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; gap: 12px; font-weight: 800; font-size: 15px; transition: .25s ease; position: relative; overflow: hidden; }
  .glow-btn { color: #03111d; border: 1px solid rgba(255,255,255,.3); background: linear-gradient(135deg, var(--neon2), var(--neon) 50%, #7ee6ff); box-shadow: 0 0 18px rgba(0,162,255,.45), 0 0 40px rgba(0,162,255,.22), inset 0 1px 0 rgba(255,255,255,.5); }
  .glow-btn::before { content: ''; position: absolute; inset: -2px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent); transform: translateX(-130%); animation: shine 3.2s linear infinite; }
  .glow-btn:hover { transform: translateY(-2px) scale(1.01); }
  .ghost-btn { color: #d9e9ff; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); }
  .ghost-btn:hover { border-color: rgba(0,162,255,.3); background: rgba(0,162,255,.07); }
  @keyframes shine { 100% { transform: translateX(130%); } }
  .hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; margin-top: 34px; }
  .stat { background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.07); border-radius: 18px; padding: 18px; }
  .stat-num { font-family: Orbitron, sans-serif; font-size: 22px; font-weight: 800; color: var(--neon2); }
  .stat-text { margin-top: 8px; color: var(--muted); font-size: 13px; line-height: 1.45; }

  /* PHONE CAROUSEL */
  .showcase { position: relative; display: flex; flex-direction: column; align-items: center; }
  .phone-stage { position: relative; width: 100%; height: 640px; perspective: 1400px; }
  .stack-phone { position: absolute; top: 30px; left: 50%; transition: transform .65s cubic-bezier(.4,0,.2,1), opacity .65s ease; pointer-events: none; will-change: transform, opacity; }
  .phone { width: 290px; height: 610px; border-radius: 44px; padding: 10px; background: linear-gradient(180deg, #1c2d45, #0c1626); border: 1px solid rgba(255,255,255,.13); box-shadow: 0 30px 90px rgba(0,0,0,.5), 0 0 80px rgba(0,162,255,.1); overflow: hidden; }
  .phone-img-screen { width: 100%; height: 100%; object-fit: cover; border-radius: 34px; display: block; }
  .pos-main { transform: translateX(-50%) rotateY(0deg) scale(1.03); z-index: 10; opacity: 1; pointer-events: auto; box-shadow: 0 30px 90px rgba(0,0,0,.55), 0 0 90px rgba(0,162,255,.2); }
  .pos-right { transform: translateX(calc(-50% + 230px)) rotateY(-26deg) rotateZ(7deg) scale(.87); z-index: 5; opacity: .68; }
  .pos-left  { transform: translateX(calc(-50% - 230px)) rotateY(26deg) rotateZ(-7deg) scale(.87); z-index: 5; opacity: .68; }
  .pos-back  { transform: translateX(-50%) scale(.76); z-index: 1; opacity: .28; }
  .screen-labels { display: flex; justify-content: center; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
  .screen-chip { padding: 10px 18px; border-radius: 999px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); font-size: 13px; color: var(--muted); font-weight: 700; transition: .2s ease; }
  .screen-chip:hover { color: #fff; border-color: rgba(0,162,255,.2); }
  .screen-chip.active { color: #fff; border-color: rgba(0,162,255,.3); background: rgba(0,162,255,.12); box-shadow: 0 0 18px rgba(0,162,255,.14) inset; }
  .carousel-dots { display: flex; justify-content: center; gap: 8px; margin-top: 14px; }
  .cdot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.15); transition: .3s ease; }
  .cdot.active { background: var(--neon); box-shadow: 0 0 8px var(--neon); width: 24px; border-radius: 4px; }

  /* CARDS */
  .cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 48px; }
  .info-card { padding: 28px; border-radius: 22px; background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.07); box-shadow: var(--shadow); }
  .ic { width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; font-size: 28px; margin-bottom: 20px; }
  .info-card h3 { font-family: Orbitron, sans-serif; font-size: 19px; margin-bottom: 12px; }
  .info-card p { font-size: 15px; line-height: 1.75; color: var(--muted); }
  .ic.blue   { background: rgba(0,162,255,.12); border: 1px solid rgba(0,162,255,.24); }
  .ic.cyan   { background: rgba(0,229,255,.12); border: 1px solid rgba(0,229,255,.24); }
  .ic.green  { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.24); }
  .ic.orange { background: rgba(255,179,71,.12); border: 1px solid rgba(255,179,71,.24); }

  /* FEATURES */
  .feature-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 18px; margin-top: 48px; }
  .feature { padding: 22px; border-radius: 20px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); }
  .feature h4 { font-size: 18px; margin-bottom: 10px; }
  .feature p { font-size: 15px; line-height: 1.7; color: var(--muted); }
  .feature-tag { display: inline-block; margin-bottom: 14px; padding: 7px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .t-blue   { background: rgba(0,162,255,.1); color: #7fd4ff; border: 1px solid rgba(0,162,255,.18); }
  .t-cyan   { background: rgba(0,229,255,.1); color: #7beeff; border: 1px solid rgba(0,229,255,.18); }
  .t-green  { background: rgba(16,185,129,.1); color: #7be7c5; border: 1px solid rgba(16,185,129,.18); }
  .t-orange { background: rgba(255,179,71,.1); color: #ffd08f; border: 1px solid rgba(255,179,71,.18); }

  /* PRICING */
  .pricing { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; margin-top: 52px; }
  .plan { padding: 28px; border-radius: 24px; background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.07); box-shadow: var(--shadow); position: relative; display: flex; flex-direction: column; }
  .plan.pop  { border-color: rgba(16,185,129,.28); box-shadow: 0 20px 60px rgba(0,0,0,.35), 0 0 50px rgba(16,185,129,.12); }
  .plan.best { border-color: rgba(255,204,0,.28); box-shadow: 0 20px 60px rgba(0,0,0,.35), 0 0 50px rgba(255,204,0,.1); }
  .badge { position: absolute; top: 18px; right: 18px; padding: 8px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; }
  .badge.green  { background: rgba(16,185,129,.14); border: 1px solid rgba(16,185,129,.22); color: #75ebc7; }
  .badge.yellow { background: rgba(255,204,0,.14); border: 1px solid rgba(255,204,0,.22); color: #ffdc70; }
  .plan h3 { font-family: Orbitron, sans-serif; font-size: 20px; margin-bottom: 8px; }
  .plan .sub { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 18px; }
  .price { font-family: Orbitron, sans-serif; font-size: 42px; line-height: 1; font-weight: 800; margin-bottom: 8px; }
  .price small { font-size: 18px; color: #bfd4eb; }
  .plan .per { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .plan ul { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; flex: 1; }
  .plan li { font-size: 14px; color: #dbe8fa; display: flex; gap: 10px; align-items: flex-start; line-height: 1.55; }
  .plan li::before { content: '✓'; color: var(--neon2); font-weight: 800; }
  .plan-btn { width: 100%; justify-content: center; }

  /* FOOTER */
  .footer { padding: 34px 0 46px; border-top: 1px solid rgba(255,255,255,.06); color: var(--muted); }
  .footer-wrap { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .footer-links { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; }
  .footer-links a:hover { color: #fff; }

  /* SECTIONS */
  .label { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(0,162,255,.24); background: rgba(0,162,255,.08); color: var(--neon2); font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 16px; }
  .title { font-family: Orbitron, sans-serif; font-size: clamp(32px,5vw,66px); line-height: 1.02; font-weight: 800; letter-spacing: -1px; margin: 20px 0 18px; }
  .grad { background: linear-gradient(90deg, #fff, var(--neon), var(--neon2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .desc { font-size: 18px; line-height: 1.75; color: var(--muted); max-width: 760px; }

  /* FADE ANIMATION */
  .fade { opacity: 0; transform: translateY(24px); transition: .7s ease; }
  .fade.show { opacity: 1; transform: none; }

  /* RESPONSIVE */
  @media (max-width: 1100px) { .hero-wrap { grid-template-columns: 1fr; } }
  @media (max-width: 980px) {
    .cards-3 { grid-template-columns: 1fr 1fr; }
    .pricing { grid-template-columns: 1fr; }
    .feature-grid { grid-template-columns: 1fr; }
    .hero-stats { grid-template-columns: 1fr 1fr; }
    .nav-links { display: none; }
  }
  @media (max-width: 640px) {
    .hero { padding-top: 100px; }
    .title { font-size: clamp(24px,9vw,42px); }
    .desc { font-size: 15px; }
    .section { padding: 48px 0; }
    .glow-btn, .ghost-btn { width: 100%; }
    .cards-3 { grid-template-columns: 1fr; }
    .phone-stage { height: 460px; }
    .pos-main { transform: translateX(-50%) scale(0.82); }
    .pos-left  { transform: translateX(calc(-50% - 115px)) rotateY(18deg) rotateZ(-4deg) scale(.58); opacity: .28; }
    .pos-right { transform: translateX(calc(-50% + 115px)) rotateY(-18deg) rotateZ(4deg) scale(.58); opacity: .28; }
    .screen-labels { margin-top: 82px; }
  }
`;