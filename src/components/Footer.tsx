import { ANDRADE, SCRIPT, SILVA } from '../logoPaths';
import { BRANDS, LEGAL, OFFICES, SOCIAL } from '../content';

/** Stacked footer mark: script "Nini" over "ANDRADE" over "SILVA". */
function StackedMark() {
  return (
    <svg className="footer__mark" viewBox="0 0 727 500" role="img" aria-label="Nini Andrade Silva">
      <path d={SCRIPT} fill="currentColor" />
      <g transform="translate(0 211) translate(-525.6 -50.9)">
        {ANDRADE.map((d, i) => <path key={i} d={d} fill="currentColor" />)}
      </g>
      <g transform="translate(0 394) translate(-1302.9 -50.9)">
        {SILVA.map((d, i) => <path key={i} d={d} fill="currentColor" />)}
      </g>
    </svg>
  );
}

export function Brands() {
  return (
    <section className="brands" aria-label="Clients">
      <p className="brands__title">Trusted by the world’s leading hospitality brands</p>
      <ul className="brands__list">
        {BRANDS.map((b) => (
          <li key={b.name}>
            <img src={b.src} alt={b.name} width={b.w} height={b.h} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <ul className="footer__social">
        {SOCIAL.map((s) => (
          <li key={s.label}><a href={s.href}>{s.label}</a></li>
        ))}
      </ul>

      {OFFICES.map((o) => (
        <address key={o.city} className="footer__office">
          <span>{o.city}</span>
          {o.lines.map((l) => <span key={l}>{l}</span>)}
          <a href={`mailto:${o.email}`}>{o.email}</a>
        </address>
      ))}

      <StackedMark />

      <ul className="footer__legal">
        {LEGAL.map((l) => (
          <li key={l.label}><a href={l.href}>{l.label}</a></li>
        ))}
      </ul>
      <p className="footer__copy">© {new Date().getFullYear()} Nini Andrade Silva all rights reserved</p>
    </footer>
  );
}
