export function CaseMap() {
  return (
    <svg
      viewBox="0 0 620 560"
      role="img"
      aria-labelledby="case-map-title case-map-description"
      className="h-auto w-full drop-shadow-[0_38px_55px_rgba(0,0,0,.32)]"
    >
      <title id="case-map-title">Правовой анализ финансового спора</title>
      <desc id="case-map-description">
        Документы, движение средств и юрисдикция объединяются в единую правовую позицию.
      </desc>
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#173754" />
          <stop offset="1" stopColor="#07111f" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ead8b5" />
          <stop offset=".52" stopColor="#c8a467" />
          <stop offset="1" stopColor="#8a6530" />
        </linearGradient>
        <linearGradient id="chart" x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#c8a467" stopOpacity="0" />
          <stop offset="1" stopColor="#c8a467" stopOpacity=".22" />
        </linearGradient>
      </defs>

      <g opacity=".18" fill="none" stroke="#ead8b5">
        <circle cx="310" cy="280" r="248" />
        <circle cx="310" cy="280" r="205" strokeDasharray="3 12" />
      </g>

      <rect x="70" y="58" width="480" height="444" rx="34" fill="url(#panel)" stroke="#fff" strokeOpacity=".13" />
      <path d="M70 138h480" stroke="#fff" strokeOpacity=".09" />
      <circle cx="105" cy="99" r="5" fill="#c8a467" />
      <circle cx="124" cy="99" r="5" fill="#fff" fillOpacity=".18" />
      <circle cx="143" cy="99" r="5" fill="#fff" fillOpacity=".18" />
      <text
        x="177"
        y="104"
        fill="#fff"
        fillOpacity=".66"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        fontWeight="650"
      >
        МАТЕРИАЛЫ СПОРА
      </text>
      <rect
        x="454"
        y="83"
        width="64"
        height="30"
        rx="15"
        fill="#c8a467"
        fillOpacity=".12"
        stroke="#c8a467"
        strokeOpacity=".28"
      />
      <text x="472" y="103" fill="#ead8b5" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700">
        REVIEW
      </text>

      <g transform="translate(102 170)">
        <rect width="246" height="282" rx="24" fill="#fff" fillOpacity=".055" stroke="#fff" strokeOpacity=".1" />
        <rect x="26" y="25" width="54" height="54" rx="16" fill="url(#gold)" />
        <path
          d="M44 41h18l8 8v17H44V41Zm18 1v8h7"
          fill="none"
          stroke="#07111f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text x="26" y="112" fill="#fff" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="700">
          Документальная база
        </text>
        <text x="26" y="137" fill="#fff" fillOpacity=".42" fontFamily="system-ui, sans-serif" fontSize="11">
          Договоры · выписки · переписка
        </text>
        <g fill="#fff" fillOpacity=".09">
          <rect x="26" y="170" width="194" height="8" rx="4" />
          <rect x="26" y="190" width="157" height="8" rx="4" />
          <rect x="26" y="210" width="178" height="8" rx="4" />
        </g>
        <path d="M26 258h194" stroke="#fff" strokeOpacity=".09" />
        <circle cx="38" cy="249" r="5" fill="#c8a467" />
        <text x="52" y="253" fill="#fff" fillOpacity=".6" fontFamily="system-ui, sans-serif" fontSize="10">
          Факты подтверждены материалами
        </text>
      </g>

      <g transform="translate(372 170)">
        <rect width="146" height="126" rx="22" fill="#fff" fillOpacity=".055" stroke="#fff" strokeOpacity=".1" />
        <text
          x="20"
          y="30"
          fill="#fff"
          fillOpacity=".42"
          fontFamily="system-ui, sans-serif"
          fontSize="10"
          fontWeight="650"
        >
          ДВИЖЕНИЕ СРЕДСТВ
        </text>
        <path d="M20 91C43 78 54 85 69 66c14-17 29 5 57-29v54H20Z" fill="url(#chart)" />
        <path
          d="M20 91C43 78 54 85 69 66c14-17 29 5 57-29"
          fill="none"
          stroke="#dcc18e"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="126" cy="37" r="4" fill="#ead8b5" />
      </g>

      <g transform="translate(372 316)">
        <rect width="146" height="136" rx="22" fill="#c8a467" fillOpacity=".1" stroke="#c8a467" strokeOpacity=".25" />
        <circle cx="31" cy="31" r="12" fill="#c8a467" fillOpacity=".25" />
        <path
          d="M25 31l4 4 8-9"
          fill="none"
          stroke="#ead8b5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="20" y="72" fill="#ead8b5" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700">
          ПРАВОВАЯ ПОЗИЦИЯ
        </text>
        <text x="20" y="96" fill="#fff" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="700">
          Сформирована
        </text>
        <text x="20" y="117" fill="#fff" fillOpacity=".42" fontFamily="system-ui, sans-serif" fontSize="10">
          с учётом рисков
        </text>
      </g>

      <g transform="translate(485 456)">
        <rect width="105" height="52" rx="16" fill="#0d2239" stroke="#fff" strokeOpacity=".14" />
        <circle cx="24" cy="26" r="8" fill="#c8a467" fillOpacity=".3" />
        <text
          x="41"
          y="30"
          fill="#fff"
          fillOpacity=".72"
          fontFamily="system-ui, sans-serif"
          fontSize="10"
          fontWeight="650"
        >
          Стратегия
        </text>
      </g>
    </svg>
  );
}
